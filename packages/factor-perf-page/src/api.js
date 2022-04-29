import ky from "ky";

const api = ky.create({ prefixUrl: "/api/factor-perf/" });

function getFactorsList(type) {
  return api.get("factors", { searchParams: { type } }).json();
}

async function getFactorPerf(id, type, startDate) {
  return api
    .get(`factors/${id}`, { searchParams: { type, start_date: startDate } })
    .json();
}

function getTradingDates() {
  return api.get("trading-dates").json();
}

export { getFactorsList, getFactorPerf, getTradingDates };
