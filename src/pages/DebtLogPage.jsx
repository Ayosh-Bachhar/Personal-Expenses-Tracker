import { useMemo, useState } from 'react';
import PageTitleBar from '../components/PageTitleBar.jsx';
import TextInputField from '../components/TextInputField.jsx';
import SelectDropdownField from '../components/SelectDropdownField.jsx';
import SubmitButton from '../components/SubmitButton.jsx';
import SecurityWarningBox from '../components/SecurityWarningBox.jsx';
import { useGoogleAuth } from '../authentication/GoogleAuthProvider.jsx';
import { useGoogleSheetsApi } from '../googleSheets/useGoogleSheetsApi.js';
import {
  DEBT_STATUS_OPTIONS,
  ENTRY_TYPES,
} from '../googleSheets/spreadsheetSchema.js';
import { loadAppConfig } from '../utilities/appConfigStorage.js';
import {
  getCurrentMonthSheetName,
  getTodayDisplayDate,
} from '../utilities/dateFormatter.js';
import { generateUniqueId } from '../utilities/uniqueIdGenerator.js';
import {
  sanitizeAmount,
  sanitizeTextForGoogleSheets,
} from '../utilities/safeTextSanitizer.js';

const DEFAULT_FORM_DATA = {
  amount: '',
  name: '',
  status: '',
  reason: '',
  description: '',
};

function DebtLogPage() {
  const { accessToken } = useGoogleAuth();
  const appConfig = loadAppConfig();

  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { addMonthlyRow, loadAllSpreadsheetData } = useGoogleSheetsApi({
    accessToken,
    spreadsheetId: appConfig?.spreadsheetId || '',
  });

  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    setMessage('');
    setErrorMessage('');
  }

  const transactionInfo = useMemo(() => {
    switch (formData.status) {
      case 'Given':
        return {
          personLabel: 'Person You Lent Money To',
          personPlaceholder: 'Example: Rahim',
          reasonPlaceholder: 'Example: Emergency help',
          buttonText: 'Save Debt Given',
          helpTitle: 'Giving Money',
          helpText:
            'You are lending money. This amount will reduce your available wallet.',
        };

      case 'Collected':
        return {
          personLabel: 'Person Who Returned Money',
          personPlaceholder: 'Example: Rahim',
          reasonPlaceholder: 'Example: Partial repayment',
          buttonText: 'Save Collection',
          helpTitle: 'Money Collected',
          helpText:
            'Record money that someone returned to you. This will reduce their remaining debt.',
        };

      case 'Taken':
        return {
          personLabel: 'Person You Borrowed From',
          personPlaceholder: 'Example: Karim',
          reasonPlaceholder: 'Example: Tuition fee',
          buttonText: 'Save Borrowed Money',
          helpTitle: 'Borrowing Money',
          helpText:
            'Borrowed money increases your available balance.',
        };

      case 'Repaid':
        return {
          personLabel: 'Person You Paid Back',
          personPlaceholder: 'Example: Karim',
          reasonPlaceholder: 'Example: Monthly repayment',
          buttonText: 'Save Repayment',
          helpTitle: 'Repayment',
          helpText:
            'Record money you paid back to reduce your remaining debt.',
        };

      default:
        return {
          personLabel: 'Person Name',
          personPlaceholder: 'Example: Rahim',
          reasonPlaceholder: 'Reason',
          buttonText: 'Save Debt Record',
          helpTitle: 'Debt Transaction',
          helpText:
            'Choose a transaction type to continue.',
        };
    }
  }, [formData.status]);

  function calculateCurrentAvailableWallet(data) {
    const totalInput = data.balanceRows.reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0
    );

    const totalExpenses = data.expenseRows.reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0
    );

    let activeDebtGiven = 0;
    let activeDebtTaken = 0;

    data.debtRows.forEach((row) => {
      const amount = Number(row.amount || 0);

      switch (row.status) {
        case 'Given':
          activeDebtGiven += amount;
          break;

        case 'Collected':
          activeDebtGiven -= amount;
          break;

        case 'Taken':
          activeDebtTaken += amount;
          break;

        case 'Repaid':
          activeDebtTaken -= amount;
          break;

        default:
          break;
      }
    });

    return (
      totalInput -
      totalExpenses -
      Math.max(activeDebtGiven, 0) +
      Math.max(activeDebtTaken, 0)
    );
  }

  function validateForm() {
    const amount = sanitizeAmount(formData.amount);

    if (!appConfig?.spreadsheetId) {
      return 'Spreadsheet setup is missing.';
    }

    if (amount <= 0) {
      return 'Amount must be greater than zero.';
    }

    if (!formData.name.trim()) {
      return 'Person name is required.';
    }

    if (!formData.status.trim()) {
      return 'Transaction type is required.';
    }

    if (!formData.reason.trim()) {
      return 'Reason is required.';
    }

    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage('');
    setErrorMessage('');

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const amount = sanitizeAmount(formData.amount);

    try {
      setIsSaving(true);

      // Wallet protection ONLY for lending money
      if (formData.status === 'Given') {
        const data = await loadAllSpreadsheetData();
        const wallet = calculateCurrentAvailableWallet(data);

        if (amount > wallet) {
          setErrorMessage(
            `You cannot lend ${amount}. Current available wallet is ${wallet}.`
          );
          return;
        }
      }

      const rowValues = [
        generateUniqueId('DEBT'),
        getTodayDisplayDate(),
        ENTRY_TYPES.DEBT,
        amount,
        '',
        '',
        sanitizeTextForGoogleSheets(formData.description),
        '',
        '',
        sanitizeTextForGoogleSheets(formData.name),
        sanitizeTextForGoogleSheets(formData.status),
        sanitizeTextForGoogleSheets(formData.reason),
        'false',
      ];

      await addMonthlyRow({
        sheetName: getCurrentMonthSheetName(),
        rowValues,
      });

      setMessage('Transaction saved successfully.');

      setFormData(DEFAULT_FORM_DATA);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to save transaction.');
    } finally {
      setIsSaving(false);
    }
  }
  return (
    <section className="pb-24">
      <PageTitleBar
        title="Debt Ledger"
        subtitle="Record every debt transaction. Never edit old records—always add a new transaction."
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl"
        >
          <div className="grid gap-5">
            <TextInputField
              label="Amount"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="Example: 1000"
              required
            />

            <TextInputField
              label={transactionInfo.personLabel}
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder={transactionInfo.personPlaceholder}
              required
              maxLength={60}
            />

            <SelectDropdownField
              label="Transaction Type"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              options={DEBT_STATUS_OPTIONS}
              placeholder="Select transaction type"
              required
            />

            <TextInputField
              label="Reason"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              placeholder={transactionInfo.reasonPlaceholder}
              required
              maxLength={80}
            />

            <TextInputField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Optional note"
              textarea
              maxLength={200}
            />

            <SubmitButton
              loading={isSaving}
              loadingText="Saving..."
            >
              {transactionInfo.buttonText}
            </SubmitButton>
          </div>

          {message ? (
            <p className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {message}
            </p>
          ) : null}

          {errorMessage ? (
            <p className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {errorMessage}
            </p>
          ) : null}
        </form>

        <div className="space-y-5">
          <SecurityWarningBox
            title={transactionInfo.helpTitle}
            message={transactionInfo.helpText}
          />

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-xl font-black text-slate-100">
              Transaction Guide
            </h2>

            <div className="mt-5 space-y-5 text-sm leading-6">

              <div className="rounded-xl border border-emerald-600/30 bg-emerald-500/10 p-4">
                <p className="font-bold text-emerald-300">
                  🟢 Given
                </p>

                <p className="mt-2 text-slate-300">
                  You lend money to someone.
                </p>

                <p className="text-slate-400">
                  Example:
                  <br />
                  Rahim borrowed 1000 from you.
                </p>
              </div>

              <div className="rounded-xl border border-cyan-600/30 bg-cyan-500/10 p-4">
                <p className="font-bold text-cyan-300">
                  💰 Collected
                </p>

                <p className="mt-2 text-slate-300">
                  Someone returned money to you.
                </p>

                <p className="text-slate-400">
                  Example:
                  <br />
                  Rahim returned 300.
                </p>
              </div>

              <div className="rounded-xl border border-amber-600/30 bg-amber-500/10 p-4">
                <p className="font-bold text-amber-300">
                  🟡 Taken
                </p>

                <p className="mt-2 text-slate-300">
                  You borrowed money from someone.
                </p>

                <p className="text-slate-400">
                  Example:
                  <br />
                  You borrowed 2000 from Karim.
                </p>
              </div>

              <div className="rounded-xl border border-violet-600/30 bg-violet-500/10 p-4">
                <p className="font-bold text-violet-300">
                  💸 Repaid
                </p>

                <p className="mt-2 text-slate-300">
                  You paid back borrowed money.
                </p>

                <p className="text-slate-400">
                  Example:
                  <br />
                  You paid Karim 500.
                </p>
              </div>

            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-xl font-black text-slate-100">
              Ledger Rule
            </h2>

            <div className="mt-4 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
              <p className="font-semibold text-blue-300">
                Never edit old debt records.
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Every movement of money should be saved as a new transaction.
                This allows partial repayments, complete history, automatic
                remaining balance calculation and better financial reporting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DebtLogPage;