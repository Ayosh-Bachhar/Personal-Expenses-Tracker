import { getYearKey, getYearMonthKey } from './dateFormatter.js';

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

function normalizeTag(value) {
  return String(value || '').trim() || 'Other';
}

function getTimestampValue(timestamp) {
  const date = new Date(timestamp);
  const time = date.getTime();

  return Number.isNaN(time) ? 0 : time;
}

function buildExpenseTagList(filteredExpenseRows) {
  const tagMap = new Map();

  filteredExpenseRows.forEach((row, index) => {
    const tagName = normalizeTag(row.tag);
    const key = tagName.toLowerCase();
    const amount = toNumber(row.amount);
    const timestampValue = getTimestampValue(row.timestamp);

    if (!tagMap.has(key)) {
      tagMap.set(key, {
        name: tagName,
        total: 0,
        firstIndex: index,
        latestTimestamp: timestampValue,
        latestIndex: index,
        latestAmount: amount,
      });
    }

    const entry = tagMap.get(key);
    entry.total += amount;

    if (
      timestampValue > entry.latestTimestamp ||
      (timestampValue === entry.latestTimestamp && index > entry.latestIndex)
    ) {
      entry.latestTimestamp = timestampValue;
      entry.latestIndex = index;
      entry.latestAmount = amount;
    }
  });

  return Array.from(tagMap.values())
    .sort((a, b) => a.firstIndex - b.firstIndex)
    .map((entry) => {
      const previousTotal = entry.total - entry.latestAmount;

      return {
        name: entry.name,
        total: entry.total,
        note:
          previousTotal > 0
            ? `UPDATED (Net total increased by ${entry.latestAmount} from ${previousTotal})`
            : '',
        isUpdated: previousTotal > 0,
      };
    });
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

  const expenseTagList = buildExpenseTagList(filteredExpenseRows);

  const expensesByTag = {};

  expenseTagList.forEach((item) => {
    expensesByTag[item.name] = item.total;
  });

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