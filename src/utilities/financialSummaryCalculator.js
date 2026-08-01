import { getYearKey, getYearMonthKey, parseDisplayDate } from './dateFormatter.js';

function toNumber(value) {
  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return 0;
  }

  return numberValue;
}

function isWithinSelectedPeriod(timestamp, summaryType, selectedValue) {
  if (summaryType === 'monthly') {
    return getYearMonthKey(timestamp) === selectedValue;
  }

  if (summaryType === 'yearly') {
    return getYearKey(timestamp) === selectedValue;
  }

  return true;
}

function normalizeText(value, fallback = 'Unknown') {
  const text = String(value || '').trim();
  return text || fallback;
}

function getTimestampSortValue(timestamp) {
  const parsedDate = parseDisplayDate(timestamp);

  if (!parsedDate) {
    return Number.NEGATIVE_INFINITY;
  }

  return parsedDate.getTime();
}

function isLaterExpenseRow(firstRow, firstIndex, secondRow, secondIndex) {
  const firstSortValue = getTimestampSortValue(firstRow.timestamp);
  const secondSortValue = getTimestampSortValue(secondRow.timestamp);

  if (firstSortValue !== secondSortValue) {
    return firstSortValue > secondSortValue;
  }

  return firstIndex > secondIndex;
}

function buildExpenseTagSummary(expenseRows = []) {
  const tagBuckets = new Map();

  expenseRows.forEach((row, index) => {
    const tag = normalizeText(row.tag, 'Other');
    const amount = toNumber(row.amount);

    if (!tagBuckets.has(tag)) {
      tagBuckets.set(tag, {
        rows: [],
        total: 0,
      });
    }

    const tagBucket = tagBuckets.get(tag);
    tagBucket.rows.push({
      row,
      index,
    });
    tagBucket.total += amount;
  });

  let latestExpenseRow = null;

  expenseRows.forEach((row, index) => {
    if (!latestExpenseRow) {
      latestExpenseRow = {
        row,
        index,
      };
      return;
    }

    if (isLaterExpenseRow(row, index, latestExpenseRow.row, latestExpenseRow.index)) {
      latestExpenseRow = {
        row,
        index,
      };
    }
  });

  const expenseTagList = [];

  tagBuckets.forEach((tagBucket, tag) => {
    let latestTagRow = null;

    tagBucket.rows.forEach((entry) => {
      if (!latestTagRow) {
        latestTagRow = entry;
        return;
      }

      if (
        isLaterExpenseRow(
          entry.row,
          entry.index,
          latestTagRow.row,
          latestTagRow.index
        )
      ) {
        latestTagRow = entry;
      }
    });

    const latestAmount = latestTagRow ? toNumber(latestTagRow.row.amount) : 0;
    const previousTotal = tagBucket.total - latestAmount;
    const isUpdatedTag =
      latestExpenseRow !== null &&
      latestTagRow !== null &&
      latestTagRow.index === latestExpenseRow.index &&
      latestTagRow.row === latestExpenseRow.row;

    expenseTagList.push({
      name: tag,
      total: tagBucket.total,
      latestAmount,
      previousTotal,
      isUpdated: isUpdatedTag,
      updateNote: isUpdatedTag
        ? `UPDATED (Net total increased by ${latestAmount} from ${previousTotal})`
        : '',
    });
  });

  return {
    expensesByTag: expenseTagList.reduce((accumulator, item) => {
      accumulator[item.name] = item.total;
      return accumulator;
    }, {}),
    expenseTagList,
  };
}

function buildDebtPersonSummary(debtRows = [], targetStatus) {
  const personBuckets = new Map();

  debtRows.forEach((row, index) => {
    if (row.status !== targetStatus || row.isSettled === true) {
      return;
    }

    const personName = normalizeText(row.name, 'Unknown');
    const key = personName.toLowerCase();
    const amount = toNumber(row.amount);

    if (!personBuckets.has(key)) {
      personBuckets.set(key, {
        name: personName,
        total: 0,
        firstIndex: index,
      });
    }

    const personBucket = personBuckets.get(key);
    personBucket.total += amount;

    if (index < personBucket.firstIndex) {
      personBucket.firstIndex = index;
      personBucket.name = personName;
    }
  });

  return Array.from(personBuckets.values())
    .sort((firstItem, secondItem) => {
      if (secondItem.total !== firstItem.total) {
        return secondItem.total - firstItem.total;
      }

      return firstItem.name.localeCompare(secondItem.name);
    })
    .map((item) => ({
      name: item.name,
      total: item.total,
    }));
}

export function calculateFinancialSummary({
  balanceRows = [],
  expenseRows = [],
  debtRows = [],
  summaryType,
  selectedValue,
}) {
  const filteredBalanceRows = balanceRows.filter((row) =>
    isWithinSelectedPeriod(row.timestamp, summaryType, selectedValue)
  );

  const filteredExpenseRows = expenseRows.filter((row) =>
    isWithinSelectedPeriod(row.timestamp, summaryType, selectedValue)
  );

  const filteredDebtRows = debtRows.filter((row) =>
    isWithinSelectedPeriod(row.timestamp, summaryType, selectedValue)
  );

  const totalInput = filteredBalanceRows.reduce((sum, row) => {
    return sum + toNumber(row.amount);
  }, 0);

  const totalExpenses = filteredExpenseRows.reduce((sum, row) => {
    return sum + toNumber(row.amount);
  }, 0);

  const debtGiven = filteredDebtRows.reduce((sum, row) => {
    if (row.status === 'Given' && row.isSettled !== true) {
      return sum + toNumber(row.amount);
    }

    return sum;
  }, 0);

  const debtTaken = filteredDebtRows.reduce((sum, row) => {
    if (row.status === 'Taken' && row.isSettled !== true) {
      return sum + toNumber(row.amount);
    }

    return sum;
  }, 0);

  const rawWallet = totalInput - totalExpenses;
  const availableWallet = totalInput - totalExpenses - debtGiven + debtTaken;
  const netDebtPosition = debtGiven - debtTaken;
  const financialPosition = availableWallet + netDebtPosition;

  const { expensesByTag, expenseTagList } = buildExpenseTagSummary(
    filteredExpenseRows
  );

  const debtGivenDetails = buildDebtPersonSummary(filteredDebtRows, 'Given');
  const debtTakenDetails = buildDebtPersonSummary(filteredDebtRows, 'Taken');

  const expensesByMedium = {};

  filteredExpenseRows.forEach((row) => {
    const medium = row.medium || 'Unknown';

    if (!expensesByMedium[medium]) {
      expensesByMedium[medium] = 0;
    }

    expensesByMedium[medium] += toNumber(row.amount);
  });

  const expensesByFlag = {};

  filteredExpenseRows.forEach((row) => {
    const flag = row.flag || 'Unknown';

    if (!expensesByFlag[flag]) {
      expensesByFlag[flag] = 0;
    }

    expensesByFlag[flag] += toNumber(row.amount);
  });

  const adviceList = generateRuleBasedAdvice({
    totalInput,
    totalExpenses,
    rawWallet,
    availableWallet,
    debtGiven,
    debtTaken,
    expensesByTag,
    expensesByFlag,
  });

  return {
    totalInput,
    totalExpenses,
    rawWallet,
    availableWallet,
    debtGiven,
    debtTaken,
    netDebtPosition,
    financialPosition,
    expensesByTag,
    expenseTagList,
    debtGivenDetails,
    debtTakenDetails,
    expensesByMedium,
    expensesByFlag,
    adviceList,
  };
}

function generateRuleBasedAdvice({
  totalInput,
  totalExpenses,
  rawWallet,
  availableWallet,
  debtGiven,
  debtTaken,
  expensesByTag,
  expensesByFlag,
}) {
  const adviceList = [];

  if (totalExpenses > totalInput && totalInput > 0) {
    adviceList.push('Your expenses are higher than your input money. Reduce spending immediately.');
  }

  if (rawWallet > 0) {
    adviceList.push('Your raw wallet is positive before debt adjustment.');
  }

  if (rawWallet < 0) {
    adviceList.push('Your raw wallet is negative before debt adjustment. You may be depending on debt or previous savings.');
  }

  if (availableWallet > 0) {
    adviceList.push('Your available wallet is positive after debt adjustment. Good control.');
  }

  if (availableWallet < 0) {
    adviceList.push('Your available wallet is negative after debt adjustment. Be careful before giving money or spending more.');
  }

  if (debtTaken > debtGiven) {
    adviceList.push('You currently owe more money than others owe you. Be careful with new debts.');
  }

  if (debtGiven > debtTaken) {
    adviceList.push('Others currently owe you more than you owe others. Track collection carefully.');
  }

  const optionalExpense = expensesByFlag.Optional || 0;

  if (totalExpenses > 0 && optionalExpense / totalExpenses > 0.3) {
    adviceList.push('Your optional expenses are above 30%. Try reducing non-essential spending.');
  }

  const highestTag = findHighestCategory(expensesByTag);

  if (highestTag) {
    adviceList.push(`${highestTag.name} is your highest spending category.`);
  }

  if (adviceList.length === 0) {
    adviceList.push('Not enough financial activity yet. Add more entries to receive useful advice.');
  }

  return adviceList;
}

function findHighestCategory(categoryMap) {
  let highestCategory = null;

  Object.entries(categoryMap).forEach(([name, amount]) => {
    if (!highestCategory || amount > highestCategory.amount) {
      highestCategory = { name, amount };
    }
  });

  return highestCategory;
}