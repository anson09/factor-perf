import ky from "ky";

const api = ky.create({ prefixUrl: "/api/factor-perf/" });

function getFactorList() {
  return api.get("factors").json();
}

function getFactor(id) {
  return api.get(`factors/${id}`).json();
}

function getTradingDates() {
  return api.get("trading-dates").json();
}

export { getFactorList, getFactor, getTradingDates };
