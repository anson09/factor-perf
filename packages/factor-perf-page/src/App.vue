<template>
  <el-select-v2
    class="factor-selector"
    v-model="value"
    :options="options"
    placeholder="Input Factor ID to Filter Results"
    size="large"
    filterable
    :height="700"
    @change="factorChange"
  />
  <div class="chart-group">
    <div id="chart-ic"></div>
    <div id="chart-layer-annual"></div>
    <div id="chart-layer-accumulated"></div>
    <div id="chart-long"></div>
  </div>
</template>

<script>
import { ref } from "vue";
import * as api from "./api";
import Chart from "./components/charts";

export default {
  setup() {
    const chartPromise = Chart.init();
    const value = ref("");
    const options = ref([]);

    api.getFactorsList().then((rsp) => {
      options.value = rsp.map((item) => ({
        value: item,
        label: item,
      }));
    });

    async function factorChange(id) {
      const factorPerfData = await api.getFactorPerf(id);
      const chart = await chartPromise;

      chart.setChartDate(factorPerfData);

      chart.drawIC("chart-ic");
      chart.drawLayerAnnual("chart-layer-annual");
      chart.drawLayerAccumulated("chart-layer-accumulated");
      chart.drawLong("chart-long");
    }

    return {
      value,
      options,
      factorChange,
    };
  },
};
</script>

<style lang="scss" scoped>
.factor-selector {
  width: 700px;
}
.chart-group {
  display: grid;
}
</style>
