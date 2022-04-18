console.log("Hello world!");
fetch("api/factor-perf/trading-dates")
  .then((rsp) => rsp.json())
  .then(console.log);
