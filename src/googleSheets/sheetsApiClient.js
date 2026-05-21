const GOOGLE_SHEETS_API_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

function buildHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

async function handleGoogleSheetsResponse(response) {
  const responseText = await response.text();

  let responseData = null;

  if (responseText) {
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = null;
    }
  }

  if (!response.ok) {
    const errorMessage =
      responseData?.error?.message || 'Google Sheets request failed.';

    throw new Error(errorMessage);
  }

  return responseData;
}

export async function getSpreadsheetMetadata({ spreadsheetId, accessToken }) {
  const url = `${GOOGLE_SHEETS_API_BASE_URL}/${spreadsheetId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(accessToken),
  });

  return handleGoogleSheetsResponse(response);
}

export async function readSheetValues({ spreadsheetId, range, accessToken }) {
  const encodedRange = encodeURIComponent(range);
  const url = `${GOOGLE_SHEETS_API_BASE_URL}/${spreadsheetId}/values/${encodedRange}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(accessToken),
  });

  return handleGoogleSheetsResponse(response);
}

export async function appendSheetRow({
  spreadsheetId,
  range,
  accessToken,
  rowValues,
}) {
  const encodedRange = encodeURIComponent(range);
  const url = `${GOOGLE_SHEETS_API_BASE_URL}/${spreadsheetId}/values/${encodedRange}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

  const response = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(accessToken),
    body: JSON.stringify({
      values: [rowValues],
    }),
  });

  return handleGoogleSheetsResponse(response);
}

export async function updateSheetValues({
  spreadsheetId,
  range,
  accessToken,
  values,
}) {
  const encodedRange = encodeURIComponent(range);
  const url = `${GOOGLE_SHEETS_API_BASE_URL}/${spreadsheetId}/values/${encodedRange}?valueInputOption=RAW`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: buildHeaders(accessToken),
    body: JSON.stringify({
      values,
    }),
  });

  return handleGoogleSheetsResponse(response);
}

export async function batchUpdateSpreadsheet({
  spreadsheetId,
  accessToken,
  requests,
}) {
  const url = `${GOOGLE_SHEETS_API_BASE_URL}/${spreadsheetId}:batchUpdate`;

  const response = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(accessToken),
    body: JSON.stringify({
      requests,
    }),
  });

  return handleGoogleSheetsResponse(response);
}