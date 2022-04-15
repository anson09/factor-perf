module.exports = {
  apps: [
    {
      name: "factor-perf",
      script: "./src/index.js",
      instances: "max",
      max_memory_restart: "300M",
      exp_backoff_restart_delay: 100,
      merge_logs: true,
      time: true,
      error_file: "./log/pm2-error.log",
      out_file: "./log/pm2-out.log",
    },
  ],
};
