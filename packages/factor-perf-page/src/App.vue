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
  <div id="chart-long-short-compose"></div>
  <div id="chart-layer-annual"></div>
  <div id="chart-ic"></div>
  <div id="chart-long"></div>
  <div id="chart-layer-accumulated"></div>
</template>

<script>
import { ref } from "vue";
import * as api from "./api";
import * as chart from "./charts";

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

      chart.drawIC("chart-ic", factorPerf);
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
  margin-bottom: 20px;
}
</style>
