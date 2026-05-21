import { useState } from 'react';
import PageTitleBar from '../components/PageTitleBar.jsx';
import TextInputField from '../components/TextInputField.jsx';
import SubmitButton from '../components/SubmitButton.jsx';
import SecurityWarningBox from '../components/SecurityWarningBox.jsx';
import { useGoogleAuth } from '../authentication/GoogleAuthProvider.jsx';
import { useGoogleSheetsApi } from '../googleSheets/useGoogleSheetsApi.js';
import { ENTRY_TYPES } from '../googleSheets/spreadsheetSchema.js';
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
  source: '',
  description: '',
};

function BalanceEntryPage() {
  const { accessToken } = useGoogleAuth();
  const appConfig = loadAppConfig();

  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { addMonthlyRow } = useGoogleSheetsApi({
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

  function validateForm() {
    const amount = sanitizeAmount(formData.amount);
    const source = formData.source.trim();

    if (!appConfig?.spreadsheetId) {
      return 'Spreadsheet setup is missing. Please complete setup first.';
    }

    if (amount <= 0) {
      return 'Amount must be greater than 0.';
    }

    if (source === '') {
      return 'Source is required.';
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

    const currentMonthSheetName = getCurrentMonthSheetName();

    const rowValues = [
      generateUniqueId('BAL'),
      getTodayDisplayDate(),
      ENTRY_TYPES.BALANCE,
      sanitizeAmount(formData.amount),
      sanitizeTextForGoogleSheets(formData.source),
      '',
      sanitizeTextForGoogleSheets(formData.description),
      '',
      '',
      '',
      '',
      '',
      '',
    ];

    try {
      setIsSaving(true);

      await addMonthlyRow({
        sheetName: currentMonthSheetName,
        rowValues,
      });

      setMessage(`Balance entry saved successfully into ${currentMonthSheetName}.`);
      setFormData(DEFAULT_FORM_DATA);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to save balance entry.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="pb-24">
      <PageTitleBar
        title="Balance Entry"
        subtitle="Record money entering your wallet or account."
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
              placeholder="Example: 5000"
              required
            />

            <TextInputField
              label="Source"
              name="source"
              value={formData.source}
              onChange={handleInputChange}
              placeholder="Example: Pocket money, scholarship, salary"
              required
              maxLength={60}
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
              Save Balance Entry
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
            title="Balance Entry Security"
            message="This entry is written directly into the current monthly Google Sheet. The app does not save your balance data in browser storage."
          />

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-xl font-black text-slate-100">
              Saved into monthly sheet
            </h2>

            <div className="mt-4 space-y-2 text-sm leading-6 text-slate-400">
              <p>Current sheet:</p>
              <p className="rounded-2xl bg-slate-950 p-4 text-xs text-emerald-300">
                {getCurrentMonthSheetName()}
              </p>
              <p>Date format:</p>
              <p className="rounded-2xl bg-slate-950 p-4 text-xs text-slate-300">
                {getTodayDisplayDate()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BalanceEntryPage;