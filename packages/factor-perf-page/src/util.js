const Storage = {
  get(key) {
    return JSON.parse(localStorage.getItem(`factor_perf_${key}`));
  },
  set(key, data) {
    localStorage.setItem(`factor_perf_${key}`, JSON.stringify(data));
  },
  delete(key) {
    localStorage.removeItem(`factor_perf_${key}`);
  },
};

export { Storage };
