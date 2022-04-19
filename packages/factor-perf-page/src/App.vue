<template>
  <el-select-v2
    v-model="value"
    :options="options"
    placeholder="输入过滤 ID"
    size="large"
    filterable
  />
</template>

<script>
import { ref } from "vue";
import * as api from "./api";
api.getTradingDates().then(console.log);
export default {
  setup() {
    const initials = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];

    const value = ref("");
    const options = Array.from({ length: 1000 }).map((_, idx) => ({
      value: `Option ${idx + 1}`,
      label: `${initials[idx % 10]}${idx}`,
    }));
    return {
      value,
      options,
    };
  },
};
</script>

<style lang="scss" scoped>
.example-showcase .el-select-v2 {
  margin-right: 20px;
}
</style>
