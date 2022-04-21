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

function isPositiveCorrelation(ICList) {
  return ICList.reduce((acc, curr) => acc + curr) > 0;
}

function getAccumulated(list) {
  const accumulation = [];
  list.reduce((acc, curr) => {
    acc = (1 + acc) * (1 + curr) - 1;
    accumulation.push(acc);
    return acc;
  }, 0);
  return accumulation;
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

function drawLayerAccumulated(container, factorPerf) {
  const categories = ["q1", "q2", "q3", "q4", "q5"];

  const dateRange = sliceDates(
    tradingDates,
    factorPerf.start_date,
    factorPerf.end_date
  ).map((date) => new Date(date).getTime());

  function composeDateRange(accumulation) {
    return dateRange.map((date, i) => [date, accumulation[i]]);
  }

  const layerAccumulated = categories.map((category) => ({
    name: category + "累积收益率",
    data: composeDateRange(getAccumulated(factorPerf[category])),
  }));

  Highcharts.stockChart(container, {
    rangeSelector: {
      selected: -1,
    },
    title: {
      text: "分层累积收益率对比",
    },
    yAxis: {
      labels: {
        formatter: function () {
          return (this.value > 0 ? " + " : "") + this.value + "%";
        },
      },
      plotLines: [
        {
          value: 0,
          width: 2,
          color: "silver",
        },
      ],
    },

    // plotOptions: {
    //   series: {
    //     compare: "value",
    //     showInNavigator: true,
    //   },
    // },

    // tooltip: {
    //   pointFormat:
    //     '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.change}%)<br/>',
    //   valueDecimals: 2,
    //   split: true,
    // },

    series: layerAccumulated,
  });
}

function drawLong(container, factorPerf) {
  const dateRange = sliceDates(
    tradingDates,
    factorPerf.start_date,
    factorPerf.end_date
  ).map((date) => new Date(date).getTime());

  const long = isPositiveCorrelation(factorPerf.ic) ? "q5" : "q1";

  const columnData = dateRange.map((date, i) => [
    date,
    Number(factorPerf[long][i].toFixed(4)),
  ]);

  const accumulation = getAccumulated(factorPerf[long]);

  const lineData = dateRange.map((date, i) => [
    date,
    Number(accumulation[i].toFixed(2)),
  ]);

  Highcharts.stockChart(container, {
    rangeSelector: {
      selected: -1,
    },

    title: {
      text: "多头组合收益率",
    },

    yAxis: [
      {
        title: {
          text: "日收益率",
        },
        opposite: false,
      },
      {
        title: {
          text: "累积收益率",
        },
        gridLineWidth: 0,
      },
    ],
    series: [
      {
        type: "column",
        name: "日收益率",
        data: columnData,
      },
      {
        type: "line",
        name: "累积收益率",
        data: lineData,
        yAxis: 1,
      },
    ],
  });
}

function drawLongShortCompose(container, factorPerf) {
  const dateRange = sliceDates(
    tradingDates,
    factorPerf.start_date,
    factorPerf.end_date
  ).map((date) => new Date(date).getTime());

  const [long, short] = isPositiveCorrelation(factorPerf.ic)
    ? ["q5", "q1"]
    : ["q1", "q5"];

  const longShortYield = factorPerf[long].map(
    (longYield, idx) => longYield - factorPerf[short][idx]
  );

  const columnData = dateRange.map((date, i) => [
    date,
    Number(longShortYield[i].toFixed(4)),
  ]);

  const accumulation = getAccumulated(longShortYield);

  const lineData = dateRange.map((date, i) => [
    date,
    Number(accumulation[i].toFixed(2)),
  ]);

  Highcharts.stockChart(container, {
    rangeSelector: {
      selected: -1,
    },

    title: {
      text: "多空组合收益率",
    },

    yAxis: [
      {
        title: {
          text: "日收益率",
        },
        opposite: false,
      },
      {
        title: {
          text: "累积收益率",
        },
        gridLineWidth: 0,
      },
    ],
    series: [
      {
        type: "column",
        name: "日收益率",
        data: columnData,
      },
      {
        type: "line",
        name: "累积收益率",
        data: lineData,
        yAxis: 1,
      },
    ],
  });
}

export {
  drawIC,
  drawLayerAnnual,
  drawLayerAccumulated,
  drawLong,
  drawLongShortCompose,
};
