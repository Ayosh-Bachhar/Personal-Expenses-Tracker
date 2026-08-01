import { useEffect, useState } from 'react';
import PageTitleBar from '../components/PageTitleBar.jsx';
import TextInputField from '../components/TextInputField.jsx';
import SubmitButton from '../components/SubmitButton.jsx';
import SecurityWarningBox from '../components/SecurityWarningBox.jsx';
import {
  hasValidAppConfig,
  loadAppConfig,
  saveAppConfig,
} from '../utilities/appConfigStorage.js';
import { useGoogleAuth } from '../authentication/GoogleAuthProvider.jsx';
import { useGoogleSheetsApi } from '../googleSheets/useGoogleSheetsApi.js';

function buildSpreadsheetUrl(spreadsheetId) {
  if (!spreadsheetId) {
    return '';
  }

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
}

const DEFAULT_FORM_DATA = {
  spreadsheetId: '',
  currency: 'BDT',
};

function SpreadsheetSetupPage() {
  const { accessToken } = useGoogleAuth();

  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const temporarySpreadsheetId = formData.spreadsheetId.trim();
  const spreadsheetUrl = buildSpreadsheetUrl(temporarySpreadsheetId);

  const { validateSpreadsheetStructure } = useGoogleSheetsApi({
    accessToken,
    spreadsheetId: temporarySpreadsheetId,
  });

  useEffect(() => {
    const savedConfig = loadAppConfig();

    if (hasValidAppConfig(savedConfig)) {
      setFormData({
        spreadsheetId: savedConfig.spreadsheetId,
        currency: savedConfig.currency,
      });

      setMessage('Existing setup configuration loaded.');
    }
  }, []);

  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    setMessage('');
    setErrorMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const spreadsheetId = formData.spreadsheetId.trim();
    const currency = formData.currency.trim().toUpperCase();

    setMessage('');
    setErrorMessage('');

    if (spreadsheetId === '') {
      setErrorMessage('Spreadsheet ID is required.');
      return;
    }

    if (currency === '') {
      setErrorMessage('Currency is required.');
      return;
    }

    try {
      setIsChecking(true);

      await validateSpreadsheetStructure();

      saveAppConfig({
        spreadsheetId,
        currency,
      });

      setMessage(
        'Spreadsheet verified and setup saved successfully. You can now use the app pages.'
      );
    } catch (error) {
      setErrorMessage(error.message || 'Spreadsheet verification failed.');
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <section className="pb-24">
      <PageTitleBar
        title="Spreadsheet Setup"
        subtitle="Connect this app to your personal Google Spreadsheet database."
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl"
        >
          <div className="grid gap-5">
            <TextInputField
              label="Spreadsheet ID"
              name="spreadsheetId"
              value={formData.spreadsheetId}
              onChange={handleInputChange}
              placeholder="Paste your Google Spreadsheet ID"
              required
            />

            <TextInputField
              label="Currency"
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              placeholder="BDT"
              required
              maxLength={10}
            />

            <SubmitButton loading={isChecking} loadingText="Verifying...">
              Verify and Save Setup
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
            title="Security Rule"
            message="This app verifies that your logged-in Gmail can access the spreadsheet before saving setup. It saves only your Spreadsheet ID and currency preference locally. It does not save your balance, expenses, debts, or financial summary in browser storage."
          />

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-xl font-black text-slate-100">
              Connected Spreadsheet
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              After saving setup, you can open your connected Google Spreadsheet directly.
            </p>

            <a
              href={spreadsheetUrl || '#'}
              target="_blank"
              rel="noreferrer"
              className={`mt-5 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-black transition ${
                spreadsheetUrl
                  ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                  : 'cursor-not-allowed bg-slate-700 text-slate-400'
              }`}
            >
              Open Google Spreadsheet
            </a>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-xl font-black text-slate-100">
              Required Spreadsheet Structure
            </h2>

            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-400">
              <p>Required permanent sheets:</p>

              <ul className="list-inside list-disc">
                <li>Tags</li>
                <li>Settings</li>
              </ul>

              <p>Required monthly sheet example:</p>

              <p className="rounded-2xl bg-slate-950 p-4 text-xs text-emerald-300">
                May_2026
              </p>

              <p>Monthly sheet header:</p>

              <p className="break-words rounded-2xl bg-slate-950 p-4 text-xs text-slate-300">
                ID | Date | Entry_Type | Amount | Source | Tag | Description | Medium | Flag | Debt_Name | Debt_Status | Reason | IsSettled
              </p>

              <p>
                The app writes balance, expense, and debt records into the current monthly sheet.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-xl font-black text-slate-100">
              How to find Spreadsheet ID
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Open your Google Sheet. Copy the part of the URL between /d/ and /edit.
            </p>

            <div className="mt-4 break-all rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-400">
              https://docs.google.com/spreadsheets/d/
              <span className="text-emerald-400">SPREADSHEET_ID</span>
              /edit
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SpreadsheetSetupPage;