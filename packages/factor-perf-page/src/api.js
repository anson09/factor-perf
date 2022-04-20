import ky from "ky";

const api = ky.create({ prefixUrl: "/api/factor-perf/" });

function getFactorsList() {
  return api.get("factors").json();
}

async function getFactorPerf(id) {
  return (await api.get(`factors/${id}`).json())[0];
}

function getTradingDates() {
  return api.get("trading-dates").json();
}

export { getFactorsList, getFactorPerf, getTradingDates };
