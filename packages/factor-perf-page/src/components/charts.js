import Highcharts from "../lib/highcharts";
import { getTradingDates } from "../api";

class Chart {
  static tradingDates;
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
    if (!this.tradingDates) this.tradingDates = await getTradingDates();
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
    return dates.slice(left, right + 1);
  }

  static calcAccumulatedReturnList(list) {
    const accumulatedList = [];
    list.reduce((acc, curr) => {
      acc = (1 + acc) * (1 + curr) - 1;
      accumulatedList.push(acc);
      return acc;
    }, 0);
    return accumulatedList;
  }

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
    Highcharts.stockChart(container, {
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
    Highcharts.chart(container, {
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
    Highcharts.stockChart(container, {
      title: {
        text: "分层超额累计收益率",
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
          }: <b>${Highcharts.numberFormat(this.change * 100, 2)}%</b>`;
        },
      },
      legend: {
        enabled: true,
      },
      plotOptions: {
        series: {
          compare: "value",
        },
      },
      series: Object.keys(this.accumulatedReturnByName).map((name) => ({
        name: name + " 超额累计收益率",
        data: Chart.composeDateSeries(
          this.dateRangeTimeStamp,
          this.accumulatedReturnByName[name].excessList
        ),
      })),
    });
  }

  drawLong(container) {
    Highcharts.stockChart(container, {
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
          }: <b>${Highcharts.numberFormat(
            (this.change || this.y) * 100,
            2
          )}%</b>`;
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
          compare: "value",
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
