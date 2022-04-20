<template>
  <el-select-v2
    v-model="value"
    :options="options"
    placeholder="Filter by factor ID"
    size="large"
    filterable
    :height="700"
    @change="factorChange"
  />
  <p>{{ value }}</p>
  <div id="long-short-compose"></div>
  <div id="layer-annual"></div>
  <div id="ic"></div>
  <div id="long"></div>
  <div id="layer-accumulated"></div>
</template>

<script>
import { ref } from "vue";
import * as api from "./api";
import Highcharts from "highcharts/highstock";

let tradingDates;
api.getTradingDates().then((res) => {
  tradingDates = res;
});

export default {
  setup() {
    const value = ref("");
    const options = ref([]);

    api.getFactorsList().then((rsp) => {
      options.value = rsp.map((item) => ({
        value: item,
        label: item,
      }));
    });

    async function factorChange(id) {
      const factorPerf = await api.getFactorPerf(id);
      console.log(factorPerf);
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
.el-select-v2 {
  width: 700px;
}
</style>
