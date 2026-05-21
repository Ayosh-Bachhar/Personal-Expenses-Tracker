import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Banknote,
  ChartPie,
  HandCoins,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import PageTitleBar from '../components/PageTitleBar.jsx';
import SummaryCard from '../components/SummaryCard.jsx';
import EmptyStateMessage from '../components/EmptyStateMessage.jsx';
import SubmitButton from '../components/SubmitButton.jsx';
import { useGoogleAuth } from '../authentication/GoogleAuthProvider.jsx';
import { useGoogleSheetsApi } from '../googleSheets/useGoogleSheetsApi.js';
import { loadAppConfig } from '../utilities/appConfigStorage.js';
import { formatCurrency } from '../utilities/currencyFormatter.js';
import { getYearKey, getYearMonthKey } from '../utilities/dateFormatter.js';
import { calculateFinancialSummary } from '../utilities/financialSummaryCalculator.js';

const DEFAULT_SUMMARY_TYPE = 'monthly';

function FinancialSummaryPage() {
  const { accessToken } = useGoogleAuth();
  const appConfig = loadAppConfig();

  const [spreadsheetData, setSpreadsheetData] = useState({
    balanceRows: [],
    expenseRows: [],
    debtRows: [],
    tagRows: [],
    settings: {},
  });

  const [summaryType, setSummaryType] = useState(DEFAULT_SUMMARY_TYPE);
  const [selectedValue, setSelectedValue] = useState(getCurrentMonthKey());
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { loadAllSpreadsheetData } = useGoogleSheetsApi({
    accessToken,
    spreadsheetId: appConfig?.spreadsheetId || '',
  });

  const currency = appConfig?.currency || spreadsheetData.settings.Currency || 'BDT';

  async function loadSummaryData() {
    setErrorMessage('');

    if (!appConfig?.spreadsheetId) {
      setErrorMessage('Spreadsheet setup is missing. Please complete setup first.');
      return;
    }

    try {
      setIsLoading(true);

      const data = await loadAllSpreadsheetData();

      setSpreadsheetData(data);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load summary data.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSummaryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availablePeriods = useMemo(() => {
    return buildAvailablePeriods({
      balanceRows: spreadsheetData.balanceRows,
      expenseRows: spreadsheetData.expenseRows,
      debtRows: spreadsheetData.debtRows,
    });
  }, [spreadsheetData]);

  const summary = useMemo(() => {
    return calculateFinancialSummary({
      balanceRows: spreadsheetData.balanceRows,
      expenseRows: spreadsheetData.expenseRows,
      debtRows: spreadsheetData.debtRows,
      summaryType,
      selectedValue,
    });
  }, [spreadsheetData, summaryType, selectedValue]);

  const tagChartData = convertMapToChartData(summary.expensesByTag);
  const mediumChartData = convertMapToChartData(summary.expensesByMedium);
  const flagChartData = convertMapToChartData(summary.expensesByFlag);
  const trendChartData = buildTrendChartData({
    balanceRows: spreadsheetData.balanceRows,
    expenseRows: spreadsheetData.expenseRows,
  });

  function handleSummaryTypeChange(event) {
    const nextType = event.target.value;

    setSummaryType(nextType);

    if (nextType === 'monthly') {
      setSelectedValue(availablePeriods.months[0] || getCurrentMonthKey());
    } else {
      setSelectedValue(availablePeriods.years[0] || getCurrentYearKey());
    }
  }

  return (
    <section className="pb-24">
      <PageTitleBar
        title="Financial Summary"
        subtitle="Analyze your balance, expenses, debts, category spending, and rule-based financial advice."
      />

      <div className="mb-6 grid gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl lg:grid-cols-[1fr_1fr_auto]">
        <label className="block">
          <span className="text-sm font-bold text-slate-300">Summary Type</span>
          <select
            value={summaryType}
            onChange={handleSummaryTypeChange}
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="all">All Time</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-bold text-slate-300">Period</span>
          <select
            value={selectedValue}
            onChange={(event) => setSelectedValue(event.target.value)}
            disabled={summaryType === 'all'}
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none disabled:cursor-not-allowed disabled:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          >
            {summaryType === 'monthly'
              ? availablePeriods.months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))
              : null}

            {summaryType === 'yearly'
              ? availablePeriods.years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))
              : null}

            {summaryType === 'all' ? <option value="all">All Time</option> : null}
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={loadSummaryData}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 font-black text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:text-slate-500 lg:w-auto"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {errorMessage ? (
        <p className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {errorMessage}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Input"
          value={formatCurrency(summary.totalInput, currency)}
          subtitle="Money entered into your wallet"
          icon={<TrendingUp size={28} />}
          accent="text-emerald-400"
        />

        <SummaryCard
          title="Total Expenses"
          value={formatCurrency(summary.totalExpenses, currency)}
          subtitle="Money spent from your wallet"
          icon={<TrendingDown size={28} />}
          accent="text-rose-400"
        />

        <SummaryCard
          title="Available Wallet"
          value={formatCurrency(summary.availableWallet, currency)}
          subtitle="Input minus expenses, adjusted by active debts"
          icon={<Wallet size={28} />}
          accent="text-cyan-400"
        />

        <SummaryCard
          title="Financial Position"
          value={formatCurrency(summary.financialPosition, currency)}
          subtitle="Wallet plus net debt position"
          icon={<Banknote size={28} />}
          accent="text-violet-400"
        />

        <SummaryCard
          title="Debt Given"
          value={formatCurrency(summary.debtGiven, currency)}
          subtitle="Money others currently owe you"
          icon={<HandCoins size={28} />}
          accent="text-emerald-400"
        />

        <SummaryCard
          title="Debt Taken"
          value={formatCurrency(summary.debtTaken, currency)}
          subtitle="Money you currently owe others"
          icon={<HandCoins size={28} />}
          accent="text-amber-400"
        />

        <SummaryCard
          title="Net Debt Position"
          value={formatCurrency(summary.netDebtPosition, currency)}
          subtitle="Debt given minus debt taken"
          icon={<ChartPie size={28} />}
          accent="text-blue-400"
        />

        <SummaryCard
          title="Records Loaded"
          value={
            spreadsheetData.balanceRows.length +
            spreadsheetData.expenseRows.length +
            spreadsheetData.debtRows.length
          }
          subtitle="Balance + expense + debt records"
          icon={<RefreshCw size={28} />}
          accent="text-slate-300"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartBox title="Expense by Tag">
          {tagChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tagChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="amount" fill="#10b981" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyStateMessage
              title="No expense data"
              message="Add expense entries to see category analysis."
            />
          )}
        </ChartBox>

        <ChartBox title="Balance vs Expenses Trend">
          {trendChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="period" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="input"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.25}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#f43f5e"
                  fill="#f43f5e"
                  fillOpacity={0.25}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyStateMessage
              title="No trend data"
              message="Add balance and expense entries to see trends."
            />
          )}
        </ChartBox>

        <ChartBox title="Expense by Payment Medium">
          {mediumChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mediumChartData}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {mediumChartData.map((entry, index) => (
                    <Cell key={entry.name} fill={getChartColor(index)} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyStateMessage
              title="No medium data"
              message="Expense medium data will appear here."
            />
          )}
        </ChartBox>

        <ChartBox title="Expense by Priority Flag">
          {flagChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={flagChartData}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={100}
                  label
                >
                  {flagChartData.map((entry, index) => (
                    <Cell key={entry.name} fill={getChartColor(index)} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyStateMessage
              title="No flag data"
              message="Expense priority data will appear here."
            />
          )}
        </ChartBox>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <h2 className="text-2xl font-black text-slate-100">
          Rule-Based Financial Advice
        </h2>

        <div className="mt-5 grid gap-3">
          {summary.adviceList.map((advice) => (
            <p
              key={advice}
              className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-100"
            >
              {advice}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <SubmitButton
          disabled={!appConfig?.spreadsheetId}
          loading={false}
        >
          Summary loaded from Google Sheets
        </SubmitButton>
      </div>
    </section>
  );
}

function ChartBox({ title, children }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
      <h2 className="mb-5 text-xl font-black text-slate-100">{title}</h2>
      {children}
    </div>
  );
}

function convertMapToChartData(mapObject) {
  return Object.entries(mapObject)
    .map(([name, amount]) => ({
      name,
      amount,
    }))
    .sort((firstItem, secondItem) => secondItem.amount - firstItem.amount);
}

function buildAvailablePeriods({ balanceRows, expenseRows, debtRows }) {
  const monthSet = new Set();
  const yearSet = new Set();

  [...balanceRows, ...expenseRows, ...debtRows].forEach((row) => {
    const monthKey = getYearMonthKey(row.timestamp);
    const yearKey = getYearKey(row.timestamp);

    if (monthKey) {
      monthSet.add(monthKey);
    }

    if (yearKey) {
      yearSet.add(yearKey);
    }
  });

  const months = Array.from(monthSet).sort().reverse();
  const years = Array.from(yearSet).sort().reverse();

  if (months.length === 0) {
    months.push(getCurrentMonthKey());
  }

  if (years.length === 0) {
    years.push(getCurrentYearKey());
  }

  return {
    months,
    years,
  };
}

function buildTrendChartData({ balanceRows, expenseRows }) {
  const periodMap = {};

  balanceRows.forEach((row) => {
    const period = getYearMonthKey(row.timestamp);

    if (!period) {
      return;
    }

    if (!periodMap[period]) {
      periodMap[period] = {
        period,
        input: 0,
        expenses: 0,
      };
    }

    periodMap[period].input += Number(row.amount || 0);
  });

  expenseRows.forEach((row) => {
    const period = getYearMonthKey(row.timestamp);

    if (!period) {
      return;
    }

    if (!periodMap[period]) {
      periodMap[period] = {
        period,
        input: 0,
        expenses: 0,
      };
    }

    periodMap[period].expenses += Number(row.amount || 0);
  });

  return Object.values(periodMap).sort((a, b) => {
    return a.period.localeCompare(b.period);
  });
}

function getCurrentMonthKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${year}-${month}`;
}

function getCurrentYearKey() {
  return String(new Date().getFullYear());
}

function getChartColor(index) {
  const colors = [
    '#10b981',
    '#06b6d4',
    '#8b5cf6',
    '#f59e0b',
    '#f43f5e',
    '#22c55e',
    '#3b82f6',
    '#eab308',
  ];

  return colors[index % colors.length];
}

export default FinancialSummaryPage;