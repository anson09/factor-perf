class BaseChart {
  // 累计收益率是第 0 天 0, 第 1 天累计收益率=第 1 天收益率, 第 2 天累计收益率=(1 + 第 1 天累计收益率) * (1 + 第 2 天收益率) - 1, 以此类推
  static calcAccumulatedReturnList(list) {
    const accumulatedList = [];
    list.reduce((acc, curr) => {
      acc = (1 + acc) * (1 + curr) - 1;
      accumulatedList.push(acc);
      return acc;
    }, 0);
    return accumulatedList;
  }
}

export default BaseChart;
