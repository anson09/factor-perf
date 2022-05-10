import Highcharts from "highcharts/highstock";
import gridLight from "highcharts/themes/grid-light";
import darkUnica from "highcharts/themes/dark-unica";

gridLight(Highcharts);
Highcharts.setOptions({
  chart: {
    height: 500,
  },
  accessibility: {
    enabled: false,
  },
  credits: {
    enabled: false,
  },
});

export default Highcharts;
