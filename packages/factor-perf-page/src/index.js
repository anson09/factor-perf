import { createApp } from "vue";
import Select from "element-plus/es/components/select-v2/index.mjs";
import "element-plus/theme-chalk/base.css";
import "element-plus/theme-chalk/el-select-v2.css";

import App from "./App.vue";

__VUE_OPTIONS_API__ = false;
__VUE_PROD_DEVTOOLS__ = false;

const app = createApp(App);
app.use(Select);
app.mount("#app");
