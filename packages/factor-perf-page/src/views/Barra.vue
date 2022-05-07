<template>
  <el-select-v2
    class="benchmark-selector"
    v-model="value"
    :options="options"
    placeholder="Select Benchmark"
    size="large"
    @change="benchmarkChange"
  />
  <div id="chart-barra"></div>
</template>

<script>
import { ref } from "vue";
import * as api from "../api";
import Chart from "../components/BarraChart";

export default {
  name: "Barra",
  setup() {
    const value = ref("whole_market");
    const options = Chart.benchmarkList;
    let chart;

    async function fetchData(startTime = "2017-01-01") {
      const styleFactorPerfByName = {};

      const factorList = await api.getFactorsList("barra");
      const styleFactorList = factorList.filter((factor) => /\w/.test(factor));

      const styleFactorPerfList = await Promise.all(
        styleFactorList.map((factor) =>
          api.getFactorPerf(factor, "barra", startTime)
        )
      );

      styleFactorPerfList.forEach((factorPerf, index) => {
        styleFactorPerfByName[styleFactorList[index]] = factorPerf;
      });

      return styleFactorPerfByName;
    }

    fetchData().then((chartData) => {
      chart = new Chart(chartData, value.value);
      console.log("chart data:", chart);
      chart.draw("chart-barra");
    });

    function benchmarkChange(benchmark) {
      chart.setBenchmark(benchmark);
      chart.draw("chart-barra");
    }

    return {
      value,
      options,
      benchmarkChange,
    };
  },
};
</script>

<style lang="scss" scoped></style>
