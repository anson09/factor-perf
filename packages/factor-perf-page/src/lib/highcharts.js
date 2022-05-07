import Highcharts from "highcharts/highstock";
import gridLight from "highcharts/themes/grid-light";
import darkUnica from "highcharts/themes/dark-unica";
import accessibility from "highcharts/modules/accessibility";

gridLight(Highcharts);
accessibility(Highcharts);
Highcharts.setOptions({
  chart: {
    height: 500,
  },
  credits: {
    enabled: false,
  },
});

export default Highcharts;
