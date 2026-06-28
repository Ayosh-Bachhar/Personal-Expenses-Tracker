import { useState } from 'react';
import PageTitleBar from '../components/PageTitleBar.jsx';
import TextInputField from '../components/TextInputField.jsx';
import SelectDropdownField from '../components/SelectDropdownField.jsx';
import SubmitButton from '../components/SubmitButton.jsx';
import SecurityWarningBox from '../components/SecurityWarningBox.jsx';
import { useGoogleAuth } from '../authentication/GoogleAuthProvider.jsx';
import { useGoogleSheetsApi } from '../googleSheets/useGoogleSheetsApi.js';
import { DEBT_STATUS_OPTIONS, ENTRY_TYPES } from '../googleSheets/spreadsheetSchema.js';
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

  function calculateCurrentAvailableWallet(data) {
    const totalInput = data.balanceRows.reduce((sum, row) => {
      return sum + Number(row.amount || 0);
    }, 0);

    const totalExpenses = data.expenseRows.reduce((sum, row) => {
      return sum + Number(row.amount || 0);
    }, 0);

    const activeDebtGiven = data.debtRows.reduce((sum, row) => {
      if (row.status === 'Given' && row.isSettled !== true) {
        return sum + Number(row.amount || 0);
      }

      return sum;
    }, 0);

    const activeDebtTaken = data.debtRows.reduce((sum, row) => {
      if (row.status === 'Taken' && row.isSettled !== true) {
        return sum + Number(row.amount || 0);
      }

      return sum;
    }, 0);

    return totalInput - totalExpenses - activeDebtGiven + activeDebtTaken;
  }

  function validateForm() {
    const amount = sanitizeAmount(formData.amount);

    if (!appConfig?.spreadsheetId) {
      return 'Spreadsheet setup is missing. Please complete setup first.';
    }

    if (amount <= 0) {
      return 'Amount must be greater than 0.';
    }

    if (formData.name.trim() === '') {
      return 'Name is required.';
    }

    if (formData.status.trim() === '') {
      return 'Debt status is required.';
    }

    if (formData.reason.trim() === '') {
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
    const currentMonthSheetName = getCurrentMonthSheetName();

    try {
      setIsSaving(true);

      if (formData.status === 'Given') {
        const data = await loadAllSpreadsheetData();
        const currentAvailableWallet = calculateCurrentAvailableWallet(data);

        if (amount > currentAvailableWallet) {
          setErrorMessage(
            `You cannot give ${amount}. Current available wallet is ${currentAvailableWallet}.`
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
        sheetName: currentMonthSheetName,
        rowValues,
      });

      setMessage(`Debt record saved successfully into ${currentMonthSheetName}.`);
      setFormData(DEFAULT_FORM_DATA);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to save debt record.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="pb-24">
      <PageTitleBar
        title="Debt Log"
        subtitle="Track the money you gave to others and the money you took from someone."
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
              label="Person Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Example: Rahim"
              required
              maxLength={60}
            />

            <SelectDropdownField
              label="Debt Status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              options={DEBT_STATUS_OPTIONS}
              placeholder="Select debt status"
              required
            />

            <TextInputField
              label="Reason"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              placeholder="Example: Emergency help, borrowed for books"
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

            <SubmitButton loading={isSaving} loadingText="Saving...">
              Save Debt Record
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
            title="Debt Balance Protection"
            message="Debt given is restricted if your wallet balance is too low. Debt taken is permitted, as borrowed funds increase your current balance."
          />

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-xl font-black text-slate-100">
              Status meaning
            </h2>

            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-400">
              <p>
                <span className="font-bold text-emerald-300">Given:</span>{' '}
                someone owes you money.
              </p>

              <p>
                <span className="font-bold text-amber-300">Taken:</span>{' '}
                you owe someone money.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DebtLogPage;