import Highcharts from "highcharts/highstock";
import darkUnica from "highcharts/themes/dark-unica";
import gridLight from "highcharts/themes/grid-light";

gridLight(Highcharts);
Highcharts.setOptions({
  chart: {
    height: 500,
  },
  credits: {
    enabled: false,
  },
});

export default Highcharts;
