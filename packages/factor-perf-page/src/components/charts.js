import Highcharts from "../lib/highcharts";
import { getTradingDates } from "../api";
import { Storage } from "../util";
class Chart {
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
    return new Chart();
  }

  static checkChartData(data) {
    if (
      !this.factorReturnSeriesNames.every(
        (curr, idx, arr) => data[curr].length === data["ic"].length
      )
    ) {
      console.error("Factor Performance Data Length Mismatch");
      return false;
    }

    if (
      this.sliceDates(this.tradingDates, data.start_date, data.end_date)
        .length !== data.ic.length
    ) {
      console.error("date range and ic length mismatch");
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

  // 累计收益率是第 0 天 0, 第 1 天累计收益率=第 1 天收益率, 第 2 天累计收益率=(1 + 第 1 天累计收益率) * (1 + 第 2 天收益率) - 1, 以此类推
  static calcAccumulatedReturnList(list) {
    const accumulatedList = [];
    list.reduce((acc, curr) => {
      acc = (1 + acc) * (1 + curr) - 1;
      accumulatedList.push(acc);
      return acc;
    }, 0);
    return accumulatedList;
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

  static composeDateSeries(dateRange, series) {
    return dateRange.map((date, idx) => [date, series[idx]]);
  }

  setChartDate(data) {
    if (!Chart.checkChartData(data)) return;
    this.chartData = data;
    console.time("calculating chart data time");
    this.calculateChartData();
    console.timeEnd("calculating chart data time");
  }

  calculateChartData() {
    this.dateRange = Chart.sliceDates(
      Chart.tradingDates,
      this.chartData.start_date,
      this.chartData.end_date
    );

    this.dateRangeTimeStamp = this.dateRange.map((date) =>
      new Date(date).getTime()
    );

    // IC 一个点表示这一天里, 每个股票组成的收益率序列和每个股票组成的 Xi 值序列的相关性
    // IC 累计值是每个点相加
    this.ICSumList = Chart.calcSumList(this.chartData.ic);

    this.benchmarkReturnList = Chart.calcBenchmarkList(
      ...Chart.factorReturnSeriesNames.map((name) => this.chartData[name])
    );

    this.excessEarningListByName = Chart.factorReturnSeriesNames.reduce(
      (acc, curr) => {
        acc[curr] = Chart.calcexcessEarningList(
          this.chartData[curr],
          this.benchmarkReturnList
        );
        return acc;
      },
      {}
    );

    this.accumulatedReturnByName = Chart.factorReturnSeriesNames.reduce(
      (acc, curr) => {
        acc[curr] = {};

        acc[curr].list = Chart.calcAccumulatedReturnList(this.chartData[curr]);

        acc[curr].annual = Chart.calcAnnualReturn(
          acc[curr].list.at(-1),
          acc[curr].list.length
        );

        acc[curr].excessList = Chart.calcAccumulatedReturnList(
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
          data: Chart.composeDateSeries(
            this.dateRangeTimeStamp,
            this.chartData.ic
          ),
        },
        {
          type: "line",
          name: "累计 IC",
          compare: "value",
          data: Chart.composeDateSeries(
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
        categories: Chart.factorReturnSeriesNames,
      },
      yAxis: [
        {
          title: {
            text: "年化收益率",
          },
          labels: {
            formatter() {
              return `${Highcharts.numberFormat(this.value * 100, 0)}%`;
            },
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
      data: Chart.composeDateSeries(
        this.dateRangeTimeStamp,
        this.accumulatedReturnByName[name].excessList
      ),
    }));

    function recaculate(event) {
      console.time("recaculating time");

      const newStartIndex = this.dateRangeTimeStamp.findIndex(
        (date) => date >= event.min
      );

      const netValueList = Chart.factorReturnSeriesNames.map(
        (name) =>
          this.accumulatedReturnByName[name].excessList[newStartIndex] + 1
      );

      const newLineData = JSON.parse(JSON.stringify(lineData));

      newLineData.forEach((series, idx) => {
        series.data.forEach((point) => {
          // 整个序列的原始净值除以新起点净值后得到新净值序列, 新起点净值为1,收益率为0
          point[1] = (point[1] + 1) / netValueList[idx] - 1;
        });
      });

      chart.series.slice(0, newLineData.length).forEach((oldSeries, idx) => {
        oldSeries.setData(newLineData[idx].data, false);
      });

      console.timeEnd("recaculating time");

      chart.redraw();
    }

    const chart = Highcharts.stockChart(container, {
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
          formatter: function () {
            return `${this.value > 0 ? " + " : ""}${Highcharts.numberFormat(
              this.value * 100,
              0
            )}%`;
          },
        },
      },
      tooltip: {
        pointFormatter() {
          return `<span style="color: ${this.color};">\u25CF</span> ${
            this.series.name
          }: <b>${Highcharts.numberFormat(this.y * 100, 2)}%</b>`;
        },
      },
      legend: {
        enabled: true,
      },
      series: lineData,
    });

    return chart;
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
            formatter() {
              return `${this.value > 0 ? " + " : ""}${Highcharts.numberFormat(
                this.value * 100,
                0
              )}%`;
            },
          },
          opposite: false,
        },
        {
          title: {
            text: "累计收益率",
          },
          labels: {
            formatter() {
              return `${this.value > 0 ? " + " : ""}${Highcharts.numberFormat(
                this.value * 100,
                0
              )}%`;
            },
          },
        },
      ],
      tooltip: {
        pointFormatter() {
          return `<span style="color: ${this.color};">\u25CF</span> ${
            this.series.name
          }: <b>${Highcharts.numberFormat(this.y * 100, 2)}%</b>`;
        },
      },
      legend: {
        enabled: true,
      },
      series: [
        {
          type: "column",
          name: "日收益率",
          data: Chart.composeDateSeries(
            this.dateRangeTimeStamp,
            this.chartData[this.long]
          ),
        },
        {
          type: "line",
          name: "累计收益率",
          data: Chart.composeDateSeries(
            this.dateRangeTimeStamp,
            this.accumulatedReturnByName[this.long]["list"]
          ),
          yAxis: 1,
        },
      ],
    });
  }
}

export default Chart;
