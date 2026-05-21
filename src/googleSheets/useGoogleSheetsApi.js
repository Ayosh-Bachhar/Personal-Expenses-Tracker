import { useCallback } from 'react';
import {
  appendSheetRow,
  batchUpdateSpreadsheet,
  getSpreadsheetMetadata,
  readSheetValues,
  updateSheetValues,
} from './sheetsApiClient.js';
import {
  ENTRY_TYPES,
  MONTHLY_HEADERS,
  REQUIRED_HEADERS,
  REQUIRED_PERMANENT_SHEETS,
  getMonthlyHeaderRange,
  getMonthlySheetRange,
  getSettingsRange,
  getTagsRange,
} from './spreadsheetSchema.js';
import { getCurrentMonthSheetName } from '../utilities/dateFormatter.js';

function normalizeHeaderRow(row) {
  if (!row) {
    return [];
  }

  return row.map((cell) => String(cell).trim());
}

function hasMatchingHeaders(actualHeaders, requiredHeaders) {
  if (actualHeaders.length < requiredHeaders.length) {
    return false;
  }

  for (let index = 0; index < requiredHeaders.length; index += 1) {
    if (actualHeaders[index] !== requiredHeaders[index]) {
      return false;
    }
  }

  return true;
}

function isMonthlySheetName(sheetName) {
  return /^[A-Za-z]+_\d{4}$/.test(sheetName);
}

function mapMonthlyRows(values = []) {
  return values.slice(1).map((row) => ({
    id: row[0] || '',
    date: row[1] || '',
    entryType: row[2] || '',
    amount: Number(row[3] || 0),
    source: row[4] || '',
    tag: row[5] || '',
    description: row[6] || '',
    medium: row[7] || '',
    flag: row[8] || '',
    debtName: row[9] || '',
    debtStatus: row[10] || '',
    reason: row[11] || '',
    isSettled: String(row[12] || '').toLowerCase() === 'true',
  }));
}

function mapBalanceRows(monthlyRows = []) {
  return monthlyRows
    .filter((row) => row.entryType === ENTRY_TYPES.BALANCE)
    .map((row) => ({
      id: row.id,
      timestamp: row.date,
      amount: row.amount,
      source: row.source,
      description: row.description,
    }));
}

function mapExpenseRows(monthlyRows = []) {
  return monthlyRows
    .filter((row) => row.entryType === ENTRY_TYPES.EXPENSE)
    .map((row) => ({
      id: row.id,
      timestamp: row.date,
      amount: row.amount,
      tag: row.tag,
      description: row.description,
      medium: row.medium,
      flag: row.flag,
    }));
}

function mapDebtRows(monthlyRows = []) {
  return monthlyRows
    .filter((row) => row.entryType === ENTRY_TYPES.DEBT)
    .map((row) => ({
      id: row.id,
      timestamp: row.date,
      amount: row.amount,
      name: row.debtName,
      status: row.debtStatus,
      reason: row.reason,
      description: row.description,
      isSettled: row.isSettled,
    }));
}

function mapTagRows(values = []) {
  return values
    .slice(1)
    .map((row) => row[0])
    .filter((tag) => tag && String(tag).trim() !== '')
    .map((tag) => String(tag).trim());
}

function mapSettingsRows(values = []) {
  const settings = {};

  values.slice(1).forEach((row) => {
    const key = row[0];
    const value = row[1];

    if (key) {
      settings[String(key).trim()] = value || '';
    }
  });

  return settings;
}

export function useGoogleSheetsApi({ accessToken, spreadsheetId }) {
  const validateSpreadsheetStructure = useCallback(async () => {
    if (!accessToken) {
      throw new Error('Google access token is missing.');
    }

    if (!spreadsheetId) {
      throw new Error('Spreadsheet ID is missing.');
    }

    const metadata = await getSpreadsheetMetadata({
      spreadsheetId,
      accessToken,
    });

    const existingSheetNames = metadata.sheets.map((sheet) => {
      return sheet.properties.title;
    });

    const missingPermanentSheets = REQUIRED_PERMANENT_SHEETS.filter(
      (requiredSheetName) => {
        return !existingSheetNames.includes(requiredSheetName);
      }
    );

    if (missingPermanentSheets.length > 0) {
      throw new Error(
        `Missing required sheets: ${missingPermanentSheets.join(', ')}`
      );
    }

    const monthlySheetNames = existingSheetNames.filter((sheetName) => {
      return isMonthlySheetName(sheetName);
    });

    if (monthlySheetNames.length === 0) {
      throw new Error('Missing monthly sheet. Example required sheet: May_2026');
    }

    const currentMonthSheetName = getCurrentMonthSheetName();

    if (!existingSheetNames.includes(currentMonthSheetName)) {
      throw new Error(`Missing current month sheet: ${currentMonthSheetName}`);
    }

    const currentMonthHeaderResult = await readSheetValues({
      spreadsheetId,
      accessToken,
      range: getMonthlyHeaderRange(currentMonthSheetName),
    });

    const currentMonthHeaders = normalizeHeaderRow(
      currentMonthHeaderResult.values?.[0]
    );

    if (!hasMatchingHeaders(currentMonthHeaders, MONTHLY_HEADERS)) {
      throw new Error(`Invalid headers in sheet: ${currentMonthSheetName}`);
    }

    const permanentHeaderChecks = await Promise.all(
      Object.entries(REQUIRED_HEADERS).map(async ([sheetName, requiredHeaders]) => {
        const result = await readSheetValues({
          spreadsheetId,
          accessToken,
          range: `${sheetName}!1:1`,
        });

        const actualHeaders = normalizeHeaderRow(result.values?.[0]);

        return {
          sheetName,
          isValid: hasMatchingHeaders(actualHeaders, requiredHeaders),
        };
      })
    );

    const invalidHeaderSheets = permanentHeaderChecks.filter((check) => {
      return check.isValid === false;
    });

    if (invalidHeaderSheets.length > 0) {
      const sheetNames = invalidHeaderSheets.map((sheet) => sheet.sheetName);

      throw new Error(`Invalid headers in sheets: ${sheetNames.join(', ')}`);
    }

    return true;
  }, [accessToken, spreadsheetId]);

  const ensureMonthlySheetExists = useCallback(
    async (sheetName) => {
      const metadata = await getSpreadsheetMetadata({
        spreadsheetId,
        accessToken,
      });

      const existingSheetNames = metadata.sheets.map((sheet) => {
        return sheet.properties.title;
      });

      if (existingSheetNames.includes(sheetName)) {
        return;
      }

      await batchUpdateSpreadsheet({
        spreadsheetId,
        accessToken,
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      });

      await updateSheetValues({
        spreadsheetId,
        accessToken,
        range: `${sheetName}!A1:M1`,
        values: [MONTHLY_HEADERS],
      });
    },
    [accessToken, spreadsheetId]
  );

  const loadAllSpreadsheetData = useCallback(async () => {
    if (!accessToken) {
      throw new Error('Google access token is missing.');
    }

    if (!spreadsheetId) {
      throw new Error('Spreadsheet ID is missing.');
    }

    const metadata = await getSpreadsheetMetadata({
      spreadsheetId,
      accessToken,
    });

    const monthlySheetNames = metadata.sheets
      .map((sheet) => sheet.properties.title)
      .filter((sheetName) => isMonthlySheetName(sheetName));

    const monthlyResults = await Promise.all(
      monthlySheetNames.map((sheetName) =>
        readSheetValues({
          spreadsheetId,
          accessToken,
          range: getMonthlySheetRange(sheetName),
        })
      )
    );

    const monthlyRows = monthlyResults.flatMap((result) => {
      return mapMonthlyRows(result.values || []);
    });

    const [tagsResult, settingsResult] = await Promise.all([
      readSheetValues({
        spreadsheetId,
        accessToken,
        range: getTagsRange(),
      }),
      readSheetValues({
        spreadsheetId,
        accessToken,
        range: getSettingsRange(),
      }),
    ]);

    return {
      monthlyRows,
      balanceRows: mapBalanceRows(monthlyRows),
      expenseRows: mapExpenseRows(monthlyRows),
      debtRows: mapDebtRows(monthlyRows),
      tagRows: mapTagRows(tagsResult.values || []),
      settings: mapSettingsRows(settingsResult.values || []),
    };
  }, [accessToken, spreadsheetId]);

  const addMonthlyRow = useCallback(
    async ({ sheetName, rowValues }) => {
      await ensureMonthlySheetExists(sheetName);

      const currentSheetResult = await readSheetValues({
        spreadsheetId,
        accessToken,
        range: getMonthlySheetRange(sheetName),
      });

      const existingRows = currentSheetResult.values || [];
      const nextRowNumber = existingRows.length + 1;
      const targetRange = `${sheetName}!A${nextRowNumber}:M${nextRowNumber}`;

      return updateSheetValues({
        spreadsheetId,
        accessToken,
        range: targetRange,
        values: [rowValues],
      });
    },
    [accessToken, spreadsheetId, ensureMonthlySheetExists]
  );

  const addTagRow = useCallback(
    async (tagName) => {
      return appendSheetRow({
        spreadsheetId,
        accessToken,
        range: getTagsRange(),
        rowValues: [tagName],
      });
    },
    [accessToken, spreadsheetId]
  );

  return {
    validateSpreadsheetStructure,
    ensureMonthlySheetExists,
    loadAllSpreadsheetData,
    addMonthlyRow,
    addTagRow,
  };
}