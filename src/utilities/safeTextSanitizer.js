const DANGEROUS_STARTING_CHARACTERS = ['=', '+', '-', '@'];

export function sanitizeTextForGoogleSheets(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const textValue = String(value).trim();

  if (textValue === '') {
    return '';
  }

  const firstCharacter = textValue.charAt(0);

  if (DANGEROUS_STARTING_CHARACTERS.includes(firstCharacter)) {
    return `'${textValue}`;
  }

  return textValue;
}

export function sanitizeAmount(value) {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return 0;
  }

  if (amount < 0) {
    return 0;
  }

  return amount;
}