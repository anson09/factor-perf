import Highcharts from "../lib/highcharts";

class BaseChart {
  get HighchartsCommonHelper() {
    return {
      labelFormatter: function () {
        return `${this.value > 0 ? " + " : ""}${Highcharts.numberFormat(
          this.value * 100,
          0
        )}%`;
      },
      tooltipPointFormatter: function () {
        return `<span style="color: ${this.color};">\u25CF</span> ${
          this.series.name
        }: <b>${Highcharts.numberFormat(this.y * 100, 2)}%</b>`;
      },
    };
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

  reAccumulateAndDraw(lineData, netValueList, instance) {
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

    instance.redraw();
  }
}

export default BaseChart;
