export const PERMANENT_SHEETS = {
    TAGS: 'Tags',
    SETTINGS: 'Settings',
  };
  
  export const MONTHLY_HEADERS = [
    'ID',
    'Date',
    'Entry_Type',
    'Amount',
    'Source',
    'Tag',
    'Description',
    'Medium',
    'Flag',
    'Debt_Name',
    'Debt_Status',
    'Reason',
    'IsSettled',
  ];
  
  export const REQUIRED_PERMANENT_SHEETS = [
    PERMANENT_SHEETS.TAGS,
    PERMANENT_SHEETS.SETTINGS,
  ];
  
  export const REQUIRED_HEADERS = {
    Tags: ['Tag'],
    Settings: ['Key', 'Value'],
  };
  
  export const PAYMENT_MEDIUM_OPTIONS = [
    'Cash',
    'Card',
    'Online Banking',
    'Mobile Banking',
  ];
  
  export const EXPENSE_FLAG_OPTIONS = [
    'Forcefully',
    'Required',
    'Optional',
  ];
  
  export const DEBT_STATUS_OPTIONS = [
    'Given',
    'Taken',
  ];
  
  export const ENTRY_TYPES = {
    BALANCE: 'Balance',
    EXPENSE: 'Expense',
    DEBT: 'Debt',
  };
  
  export function getMonthlySheetRange(sheetName) {
    return `${sheetName}!A:M`;
  }
  
  export function getMonthlyHeaderRange(sheetName) {
    return `${sheetName}!1:1`;
  }
  
  export function getTagsRange() {
    return `${PERMANENT_SHEETS.TAGS}!A:A`;
  }
  
  export function getSettingsRange() {
    return `${PERMANENT_SHEETS.SETTINGS}!A:B`;
  }