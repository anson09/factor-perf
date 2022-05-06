import { createRouter, createWebHistory } from "vue-router";

export default createRouter({
  history: createWebHistory(process.env.PUBLIC_PATH),
  routes: [
    { path: "/", component: () => import("./views/Home.vue") },
    { path: "/rice", component: () => import("./views/Rice.vue") },
    { path: "/barra", component: () => import("./views/Barra.vue") },
    { path: "/:pathMatch(.*)", component: () => import("./views/404.vue") },
  ],
  strict: true,
});
