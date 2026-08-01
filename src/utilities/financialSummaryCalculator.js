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

// Debt records use 4 statuses instead of a single true/false "IsSettled" flag:
//   Given      -> increases what a person owes you
//   Collected  -> decreases what a person owes you
//   Taken      -> increases what you owe a person
//   Repaid     -> decreases what you owe a person
//
// A "family" pairs a status with the status that offsets it, so history is
// never edited — settlement is derived by netting per person instead.
const DEBT_FAMILIES = {
  given: { increaseStatus: 'Given', decreaseStatus: 'Collected' },
  taken: { increaseStatus: 'Taken', decreaseStatus: 'Repaid' },
};

function buildDebtPersonSummary(debtRows = [], family) {
  const { increaseStatus, decreaseStatus } = DEBT_FAMILIES[family];
  const personBuckets = new Map();

  debtRows.forEach((row, index) => {
    if (row.status !== increaseStatus && row.status !== decreaseStatus) {
      return;
    }

    const personName = normalizeText(row.name, 'Unknown');
    const key = personName.toLowerCase();
    const amount = toNumber(row.amount);

    if (!personBuckets.has(key)) {
      personBuckets.set(key, {
        name: personName,
        increaseTotal: 0,
        decreaseTotal: 0,
        firstIndex: index,
      });
    }

    const personBucket = personBuckets.get(key);

    if (row.status === increaseStatus) {
      personBucket.increaseTotal += amount;
    } else {
      personBucket.decreaseTotal += amount;
    }

    if (index < personBucket.firstIndex) {
      personBucket.firstIndex = index;
      personBucket.name = personName;
    }
  });

  return Array.from(personBuckets.values())
    .map((item) => {
      const remaining = item.increaseTotal - item.decreaseTotal;

      return {
        name: item.name,
        increaseTotal: item.increaseTotal,
        decreaseTotal: item.decreaseTotal,
        remaining,
        isSettled: remaining <= 0,
      };
    })
    .sort((firstItem, secondItem) => {
      if (secondItem.remaining !== firstItem.remaining) {
        return secondItem.remaining - firstItem.remaining;
      }

      return firstItem.name.localeCompare(secondItem.name);
    });
}

function sumPositiveRemaining(personSummaries = []) {
  return personSummaries.reduce((sum, item) => {
    return sum + Math.max(item.remaining, 0);
  }, 0);
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

  const debtGivenDetails = buildDebtPersonSummary(filteredDebtRows, 'given');
  const debtTakenDetails = buildDebtPersonSummary(filteredDebtRows, 'taken');

  const debtGiven = sumPositiveRemaining(debtGivenDetails);
  const debtTaken = sumPositiveRemaining(debtTakenDetails);

  const rawWallet = totalInput - totalExpenses;
  const availableWallet = totalInput - totalExpenses - debtGiven + debtTaken;
  const netDebtPosition = debtGiven - debtTaken;
  const financialPosition = availableWallet + netDebtPosition;

  const { expensesByTag, expenseTagList } = buildExpenseTagSummary(
    filteredExpenseRows
  );

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