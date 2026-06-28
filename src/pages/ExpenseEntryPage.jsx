import { useEffect, useState } from 'react';
import PageTitleBar from '../components/PageTitleBar.jsx';
import TextInputField from '../components/TextInputField.jsx';
import SelectDropdownField from '../components/SelectDropdownField.jsx';
import SubmitButton from '../components/SubmitButton.jsx';
import SecurityWarningBox from '../components/SecurityWarningBox.jsx';
import { useGoogleAuth } from '../authentication/GoogleAuthProvider.jsx';
import { useGoogleSheetsApi } from '../googleSheets/useGoogleSheetsApi.js';
import {
  ENTRY_TYPES,
  EXPENSE_FLAG_OPTIONS,
  PAYMENT_MEDIUM_OPTIONS,
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
  tag: '',
  newTag: '',
  description: '',
  medium: '',
  flag: '',
};

const CUSTOM_TAG_VALUE = '__CUSTOM_TAG__';

const FALLBACK_TAGS = [
  'Food',
  'Transport',
  'Rent',
  'Education',
  'Health',
  'Mobile Recharge',
  'Shopping',
  'Entertainment',
  'Stationery',
  'Family',
  'Personal',
  'Other',
];

function ExpenseEntryPage() {
  const { accessToken } = useGoogleAuth();
  const appConfig = loadAppConfig();

  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [tagOptions, setTagOptions] = useState(FALLBACK_TAGS);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  const { addMonthlyRow, addTagRow, loadAllSpreadsheetData } = useGoogleSheetsApi({
    accessToken,
    spreadsheetId: appConfig?.spreadsheetId || '',
  });

  useEffect(() => {
    async function loadTags() {
      if (!appConfig?.spreadsheetId || !accessToken) {
        return;
      }

      try {
        setIsLoadingTags(true);

        const data = await loadAllSpreadsheetData();

        if (data.tagRows.length > 0) {
          setTagOptions(data.tagRows);
        }
      } catch {
        setTagOptions(FALLBACK_TAGS);
      } finally {
        setIsLoadingTags(false);
      }
    }

    loadTags();
  }, [accessToken, appConfig?.spreadsheetId, loadAllSpreadsheetData]);

  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    setMessage('');
    setErrorMessage('');
  }

  function getFinalTag() {
    if (formData.tag === CUSTOM_TAG_VALUE) {
      return formData.newTag.trim();
    }

    return formData.tag.trim();
  }

  function validateForm() {
    const amount = sanitizeAmount(formData.amount);
    const finalTag = getFinalTag();

    if (!appConfig?.spreadsheetId) {
      return 'Spreadsheet setup is missing. Please complete setup first.';
    }

    if (amount <= 0) {
      return 'Amount must be greater than 0.';
    }

    if (finalTag === '') {
      return 'Tag is required.';
    }

    if (formData.medium.trim() === '') {
      return 'Payment medium is required.';
    }

    if (formData.flag.trim() === '') {
      return 'Priority flag is required.';
    }

    return '';
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

  async function addNewTagIfNeeded(finalTag) {
    const alreadyExists = tagOptions.some((tag) => {
      return tag.toLowerCase() === finalTag.toLowerCase();
    });

    if (!alreadyExists) {
      await addTagRow(sanitizeTextForGoogleSheets(finalTag));
      setTagOptions((currentTags) => [...currentTags, finalTag]);
    }
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

    const finalTag = getFinalTag();
    const currentMonthSheetName = getCurrentMonthSheetName();

    const rowValues = [
      generateUniqueId('EXP'),
      getTodayDisplayDate(),
      ENTRY_TYPES.EXPENSE,
      sanitizeAmount(formData.amount),
      '',
      sanitizeTextForGoogleSheets(finalTag),
      sanitizeTextForGoogleSheets(formData.description),
      sanitizeTextForGoogleSheets(formData.medium),
      sanitizeTextForGoogleSheets(formData.flag),
      '',
      '',
      '',
      '',
    ];

    try {
      setIsSaving(true);
    
      const data = await loadAllSpreadsheetData();
      const currentAvailableWallet = calculateCurrentAvailableWallet(data);
      const expenseAmount = sanitizeAmount(formData.amount);
    
      if (expenseAmount > currentAvailableWallet) {
        setErrorMessage(
          `You cannot spend ${expenseAmount}. Current available wallet is ${currentAvailableWallet}.`
        );
        return;
      }
    
      await addNewTagIfNeeded(finalTag);
    
      await addMonthlyRow({
        sheetName: currentMonthSheetName,
        rowValues,
      });

      setMessage(`Expense entry saved successfully into ${currentMonthSheetName}.`);
      setFormData(DEFAULT_FORM_DATA);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to save expense entry.');
    } finally {
      setIsSaving(false);
    }
  }

  const displayedTagOptions = [...tagOptions, CUSTOM_TAG_VALUE];

  return (
    <section className="pb-24">
      <PageTitleBar
        title="Expenses Entry"
        subtitle="Record daily expenses by tag, payment medium, and priority flag."
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
              placeholder="Example: 120"
              required
            />

            <SelectDropdownField
              label={isLoadingTags ? 'Tag / Category loading...' : 'Tag (Category)'}
              name="tag"
              value={formData.tag}
              onChange={handleInputChange}
              options={displayedTagOptions}
              placeholder="Select expense tag"
              required
            />

            {formData.tag === CUSTOM_TAG_VALUE ? (
              <TextInputField
                label="New Tag"
                name="newTag"
                value={formData.newTag}
                onChange={handleInputChange}
                placeholder="Example: Exam Fee, Gym, Book"
                required
                maxLength={50}
              />
            ) : null}

            <TextInputField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Optional note, example: Coffee and snacks"
              textarea
              maxLength={200}
            />

            <SelectDropdownField
              label="Payment Medium"
              name="medium"
              value={formData.medium}
              onChange={handleInputChange}
              options={PAYMENT_MEDIUM_OPTIONS}
              placeholder="Select payment medium"
              required
            />

            <SelectDropdownField
              label="Priority Flag"
              name="flag"
              value={formData.flag}
              onChange={handleInputChange}
              options={EXPENSE_FLAG_OPTIONS}
              placeholder="Select priority flag"
              required
            />

            <SubmitButton loading={isSaving} loadingText="Saving...">
              Save Expense Entry
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
            title="Expense Entry Security"
            message="This expense entry is recorded directly into the current month's Google Sheet. New custom tags will be added to the Tags sheet automatically."
          />

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-xl font-black text-slate-100">
              Custom Tag Support
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-400">
              Select the custom tag option, write a new tag, and the app will add
              it under the existing tags in your Google Spreadsheet.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ExpenseEntryPage;