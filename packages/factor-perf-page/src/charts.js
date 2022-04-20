import Highcharts from "highcharts/highstock";
import darkUnica from "highcharts/themes/dark-unica";
import gridLight from "highcharts/themes/grid-light";

import { getTradingDates } from "./api";

let tradingDates;
getTradingDates().then((res) => {
  tradingDates = res;
});

gridLight(Highcharts);
Highcharts.setOptions({
  chart: {
    height: 500,
  },
  credits: {
    enabled: false,
  },
});

function sliceDates(dates, startDate, endDate) {
  const left = dates.findIndex((date) => date >= startDate);
  const right = dates.findLastIndex((date) => date <= endDate);
  return dates.slice(left, right + 1);
}

function drawIC(container, factorPerf) {
  const dateRange = sliceDates(
    tradingDates,
    factorPerf.start_date,
    factorPerf.end_date
  ).map((date) => new Date(date).getTime());

  if (dateRange.length !== factorPerf.ic.length) {
    console.error("drawIC: date range and ic length mismatch");
    return;
  }

  const columnData = dateRange.map((date, i) => [
    date,
    Number(factorPerf.ic[i].toFixed(4)),
  ]);

  const accumulation = [];
  factorPerf.ic.reduce((acc, curr) => {
    acc += curr;
    accumulation.push(acc);
    return acc;
  }, 0);

  const lineData = dateRange.map((date, i) => [
    date,
    Number(accumulation[i].toFixed(2)),
  ]);

  Highcharts.stockChart(container, {
    rangeSelector: {
      selected: -1,
    },

    title: {
      text: "日 IC 及 累积 IC 曲线",
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
          text: "累积 IC",
        },
        gridLineWidth: 0,
      },
    ],
    series: [
      {
        type: "column",
        name: "日 IC",
        data: columnData,
      },
      {
        type: "line",
        name: "累积 IC",
        data: lineData,
        yAxis: 1,
      },
    ],
  });
}

function drawLayerAnnual(container, factorPerf) {
  const categories = ["q1", "q2", "q3", "q4", "q5"];

  const layerAnnual = categories
    .map(
      (category) =>
        factorPerf[category].reduce((acc, curr) => (1 + acc) * (1 + curr) - 1) // 累积收益率
    )
    .map(
      (accumulation) => (accumulation / factorPerf[categories[0]].length) * 365 // 年化
    )
    .map((annual) => Number(annual.toFixed(4)));

  Highcharts.chart(container, {
    chart: {
      type: "column",
    },
    title: {
      text: "分层年化收益",
    },
    xAxis: {
      categories,
    },
    yAxis: [
      {
        title: {
          text: "收益率",
        },
      },
    ],
    series: [
      {
        name: "年化",
        data: layerAnnual,
      },
    ],
  });
}

export { drawIC, drawLayerAnnual };
