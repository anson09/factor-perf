import Highcharts from "highcharts/highstock";
import { getTradingDates } from "./api";

let tradingDates;
getTradingDates().then((res) => {
  tradingDates = res;
});

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
    console.error("date range and ic length mismatch");
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
      },
      {
        title: {
          text: "累积 IC",
        },
        gridLineWidth: 0,
        opposite: false,
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

export { drawIC };
