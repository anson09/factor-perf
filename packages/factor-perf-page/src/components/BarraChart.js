import Highcharts from "../lib/highcharts";
import BaseChart from "./BaseChart";

class BarraChart extends BaseChart {
  chartData;
  benchmark;
  static benchmarkList = [
    { value: "whole_market", label: "全市场" },
    { value: "csi_300", label: "中证300" },
    { value: "csi_500", label: "中证500" },
  ];
  seriesByBenchmark = {};

  constructor(chartData, benchmark) {
    super();
    if (!BarraChart.checkChartData(chartData, benchmark)) return;
    this.chartData = chartData;
    this.benchmark = benchmark;
    console.time("calculating chart data time");
    this.calculateChartData();
    console.timeEnd("calculating chart data time");
  }

  static checkChartData(chartData, benchmark) {
    if (
      !Object.values(chartData).every(
        (item, idx, arr) => item.length === arr[0].length
      )
    ) {
      console.error("Each Barra Factor Data Length Mismatch");
      return false;
    }
    if (!BarraChart.benchmarkList.some((item) => item.value === benchmark)) {
      console.error("Benchmark Not Found");
      return false;
    }
    return true;
  }

  static transferToSeries(chartData) {
    const series = {};
    BarraChart.benchmarkList.forEach((benchmark) => {
      series[benchmark.value] = Object.keys(chartData).map((key) => ({
        name: key,
        data: chartData[key].map((dailyReturn) => [
          dailyReturn.date,
          dailyReturn[benchmark.value],
        ]),
      }));
    });
    return series;
  }

  static accumulatorHelper(seriesData) {
    const accumulatedList = BarraChart.calcAccumulatedReturnList(
      seriesData.map((point) => point[1])
    );
    return seriesData.map((point, idx) => [
      new Date(point[0]).getTime(),
      accumulatedList[idx],
    ]);
  }

  setBenchmark(benchmark) {
    if (!BarraChart.checkChartData(this.chartData, benchmark)) return;
    this.benchmark = benchmark;
  }

  calculateChartData() {
    this.seriesByBenchmark = BarraChart.transferToSeries(this.chartData);

    Object.values(this.seriesByBenchmark).forEach((seriesList) =>
      seriesList.forEach((series) => {
        series.data = BarraChart.accumulatorHelper(series.data);
      })
    );
  }

  draw(container) {
    const lineData = this.seriesByBenchmark[this.benchmark];

    function recaculate(event) {
      console.time("recaculating time");

      const newStartIndex = lineData[0].data.findIndex(
        (point) => point[0] >= event.min
      );

      const netValueList = lineData.map(
        (series) => series.data[newStartIndex][1] + 1
      );

      const newLineData = JSON.parse(JSON.stringify(lineData));

      newLineData.forEach((series, idx) => {
        series.data.forEach((point) => {
          // 整个序列的原始净值除以新起点净值后得到新净值序列, 新起点净值为1,收益率为0
          point[1] = (point[1] + 1) / netValueList[idx] - 1;
        });
      });

      instance.series.slice(0, newLineData.length).forEach((oldSeries, idx) => {
        oldSeries.setData(newLineData[idx].data, false);
      });

      console.timeEnd("recaculating time");

      instance.redraw();
    }

    const instance = Highcharts.stockChart(container, {
      title: {
        text: "Barra 因子累计收益率",
      },
      xAxis: {
        events: {
          afterSetExtremes: recaculate.bind(this),
        },
      },
      yAxis: {
        title: {
          text: "累计收益率",
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

    return instance;
  }
}

export default BarraChart;
