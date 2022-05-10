import Highcharts from "../lib/highcharts";
import { getTradingDates } from "../api";
import { Storage } from "../util";
import BaseChart from "./BaseChart";

class RiceChart extends BaseChart {
  static tradingDates;
  // 每个因子对 A 股全市场每只股票每天计算出一个值称作 Xi, 全部股票根据这个值 Xi 从低到高排序后等分为五组, 分别命名为 q1-q5,
  // 分组内的股票每天根据以上逻辑更新, q1-q5 各自的序列中储存的值是该分组内的全部股票从 startDate 到 endDate 的时间序列上每个交易日的一篮子平均收益率
  static factorReturnSeriesNames = ["q1", "q2", "q3", "q4", "q5"];
  chartData;
  dateRange;
  dateRangeTimeStamp;
  short;
  long;
  benchmarkReturnList;
  excessEarningListByName;
  accumulatedReturnByName;
  ICSumList;

  static async init() {
    this.tradingDates = Storage.get("trading_dates");
    if (!this.tradingDates) {
      this.tradingDates = await getTradingDates();
      Storage.set("trading_dates", this.tradingDates);
    }
    return new RiceChart();
  }

  static checkChartData(data) {
    if (
      !this.factorReturnSeriesNames.every(
        (curr, idx, arr) => data[curr].length === data["ic"].length
      )
    ) {
      console.error("Factor Return Series Length and IC Length Mismatch");
      return false;
    }

    if (
      this.sliceDates(this.tradingDates, data.start_date, data.end_date)
        .length !== data.ic.length
    ) {
      console.error("Date Range And IC Length Mismatch");
      return false;
    }

    return true;
  }

  static sliceDates(dates, startDate, endDate) {
    const left = dates.findIndex((date) => date >= startDate);
    const right = dates.findLastIndex((date) => date <= endDate);
    if (left === -1 || right === -1) {
      Storage.delete("trading_dates");
      return [];
    }
    return dates.slice(left, right + 1);
  }

  // 年化收益率是先用累计计算到最后一天的收益率 / 累计天数 * 365
  static calcAnnualReturn(total, length) {
    return (total / length) * 365;
  }

  static calcSumList(list) {
    const sumList = [];
    list.reduce((acc, curr) => {
      acc += curr;
      sumList.push(acc);
      return acc;
    }, 0);
    return sumList;
  }

  static composeDateSeries(dateRange, series) {
    return dateRange.map((date, idx) => [date, series[idx]]);
  }

  // q1 加到 q5 取均值组成一个 benchmark 序列(全市场)
  static calcBenchmarkList(...lists) {
    const averageList = [];
    const kinds = lists.length;
    for (let idx = 0; idx < lists[0].length; idx++) {
      let sum = 0;
      for (let kind = 0; kind < kinds; kind++) {
        sum += lists[kind][idx];
      }
      averageList.push(sum / kinds);
    }
    return averageList;
  }

  // q1 至 q5 分别减去 benchmark 得到各自的超额收益率序列
  static calcexcessEarningList(sourceList, benchmarkList) {
    const excessEarningList = [];
    for (let i = 0; i < sourceList.length; i++) {
      excessEarningList.push(sourceList[i] - benchmarkList[i]);
    }
    return excessEarningList;
  }

  setChartDate(data) {
    if (!RiceChart.checkChartData(data)) return;
    this.chartData = data;
    console.time("calculating chart data time");
    this.calculateChartData();
    console.timeEnd("calculating chart data time");
  }

  calculateChartData() {
    this.dateRange = RiceChart.sliceDates(
      RiceChart.tradingDates,
      this.chartData.start_date,
      this.chartData.end_date
    );

    this.dateRangeTimeStamp = this.dateRange.map((date) =>
      new Date(date).getTime()
    );

    // IC 一个点表示这一天里, 每个股票组成的收益率序列和每个股票组成的 Xi 值序列的相关性
    // IC 累计值是每个点相加
    this.ICSumList = RiceChart.calcSumList(this.chartData.ic);

    this.benchmarkReturnList = RiceChart.calcBenchmarkList(
      ...RiceChart.factorReturnSeriesNames.map((name) => this.chartData[name])
    );

    this.excessEarningListByName = RiceChart.factorReturnSeriesNames.reduce(
      (acc, curr) => {
        acc[curr] = RiceChart.calcexcessEarningList(
          this.chartData[curr],
          this.benchmarkReturnList
        );
        return acc;
      },
      {}
    );

    this.accumulatedReturnByName = RiceChart.factorReturnSeriesNames.reduce(
      (acc, curr) => {
        acc[curr] = {};

        acc[curr].list = RiceChart.calcAccumulatedReturnList(
          this.chartData[curr]
        );

        acc[curr].annual = RiceChart.calcAnnualReturn(
          acc[curr].list.at(-1),
          acc[curr].list.length
        );

        acc[curr].excessList = RiceChart.calcAccumulatedReturnList(
          this.excessEarningListByName[curr]
        );

        return acc;
      },
      {}
    );

    [this.short, this.long] = Object.entries(this.accumulatedReturnByName)
      .sort((a, b) => a[1].annual - b[1].annual)
      .map((item) => item[0])
      .filter((item, idx, arr) => idx === 0 || idx === arr.length - 1);
  }

  drawIC(container) {
    return Highcharts.stockChart(container, {
      title: {
        text: "日 IC 及 累计 IC 曲线",
      },
      yAxis: [
        {
          title: {
            text: "日 IC",
          },
          opposite: false,
        },
        {
          title: {
            text: "累计 IC",
          },
        },
      ],
      legend: {
        enabled: true,
      },
      tooltip: {
        pointFormatter() {
          return `<span style="color: ${this.color};">\u25CF</span> ${
            this.series.name
          }: <b>${Highcharts.numberFormat(this.change || this.y, 2)}</b>`;
        },
      },
      series: [
        {
          type: "column",
          name: "日 IC",
          data: RiceChart.composeDateSeries(
            this.dateRangeTimeStamp,
            this.chartData.ic
          ),
        },
        {
          type: "line",
          name: "累计 IC",
          compare: "value",
          data: RiceChart.composeDateSeries(
            this.dateRangeTimeStamp,
            this.ICSumList
          ),
          yAxis: 1,
        },
      ],
    });
  }

  drawLayerAnnual(container) {
    return Highcharts.chart(container, {
      chart: {
        type: "column",
      },
      title: {
        text: "分层年化收益率",
      },
      legend: {
        enabled: false,
      },
      tooltip: {
        formatter: function () {
          return `${this.x}: <b>${Highcharts.numberFormat(
            this.y * 100,
            2
          )}%</b>`;
        },
      },
      xAxis: {
        categories: RiceChart.factorReturnSeriesNames,
      },
      yAxis: [
        {
          title: {
            text: "年化收益率",
          },
          labels: {
            formatter: this.HighchartsCommonHelper.labelFormatter,
          },
        },
      ],
      series: [
        {
          data: Object.values(this.accumulatedReturnByName).map(
            (accumulatedReturn) => accumulatedReturn.annual
          ),
        },
      ],
    });
  }

  drawLayerAccumulated(container) {
    const lineData = Object.keys(this.accumulatedReturnByName).map((name) => ({
      name: name + " 超额累计收益率",
      data: RiceChart.composeDateSeries(
        this.dateRangeTimeStamp,
        this.accumulatedReturnByName[name].excessList
      ),
    }));

    function recaculate(event) {
      const newStartIndex = this.dateRangeTimeStamp.findIndex(
        (date) => date >= event.min
      );

      const netValueList = RiceChart.factorReturnSeriesNames.map(
        (name) =>
          this.accumulatedReturnByName[name].excessList[newStartIndex] + 1
      );

      this.reAccumulateAndDraw(lineData, netValueList, instance);
    }

    const instance = Highcharts.stockChart(container, {
      title: {
        text: "分层超额累计收益率",
      },
      xAxis: {
        events: {
          afterSetExtremes: recaculate.bind(this),
        },
      },
      yAxis: {
        title: {
          text: "超额累计收益率",
        },
        labels: {
          formatter: this.HighchartsCommonHelper.labelFormatter,
        },
      },
      tooltip: {
        pointFormatter: this.HighchartsCommonHelper.tooltipPointFormatter,
      },
      legend: {
        enabled: true,
      },
      series: lineData,
    });

    return instance;
  }

  drawLong(container) {
    return Highcharts.stockChart(container, {
      title: {
        text: `${this.long} 组合收益率`,
      },
      yAxis: [
        {
          title: {
            text: "日收益率",
          },
          labels: {
            formatter: this.HighchartsCommonHelper.labelFormatter,
          },
          opposite: false,
        },
        {
          title: {
            text: "累计收益率",
          },
          labels: {
            formatter: this.HighchartsCommonHelper.labelFormatter,
          },
        },
      ],
      tooltip: {
        pointFormatter: this.HighchartsCommonHelper.tooltipPointFormatter,
      },
      legend: {
        enabled: true,
      },
      series: [
        {
          type: "column",
          name: "日收益率",
          data: RiceChart.composeDateSeries(
            this.dateRangeTimeStamp,
            this.chartData[this.long]
          ),
        },
        {
          type: "line",
          name: "累计收益率",
          data: RiceChart.composeDateSeries(
            this.dateRangeTimeStamp,
            this.accumulatedReturnByName[this.long]["list"]
          ),
          yAxis: 1,
        },
      ],
    });
  }
}

export default RiceChart;
