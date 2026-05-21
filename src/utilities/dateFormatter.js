export function getTodayDisplayDate() {
    const date = new Date();
  
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
  
    return `${month}/${day}/${year}`;
  }
  
  export function getCurrentIsoTimestamp() {
    return getTodayDisplayDate();
  }
  
  export function formatReadableDate(dateValue) {
    if (!dateValue) {
      return 'Unknown date';
    }
  
    return String(dateValue);
  }
  
  export function getMonthSheetNameFromDate(dateValue) {
    const date = parseDisplayDate(dateValue);
  
    if (!date) {
      return getCurrentMonthSheetName();
    }
  
    const monthName = date.toLocaleString('en-US', {
      month: 'long',
    });
  
    const year = date.getFullYear();
  
    return `${monthName}_${year}`;
  }
  
  export function getCurrentMonthSheetName() {
    const date = new Date();
  
    const monthName = date.toLocaleString('en-US', {
      month: 'long',
    });
  
    const year = date.getFullYear();
  
    return `${monthName}_${year}`;
  }
  
  export function getYearMonthKey(dateValue) {
    const date = parseDisplayDate(dateValue);
  
    if (!date) {
      return '';
    }
  
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
  
    return `${year}-${month}`;
  }
  
  export function getYearKey(dateValue) {
    const date = parseDisplayDate(dateValue);
  
    if (!date) {
      return '';
    }
  
    return String(date.getFullYear());
  }
  
  export function parseDisplayDate(dateValue) {
    if (!dateValue) {
      return null;
    }
  
    const parts = String(dateValue).split('/');
  
    if (parts.length !== 3) {
      return null;
    }
  
    const month = Number(parts[0]);
    const day = Number(parts[1]);
    const year = Number(parts[2]);
  
    if (
      Number.isNaN(month) ||
      Number.isNaN(day) ||
      Number.isNaN(year)
    ) {
      return null;
    }
  
    return new Date(year, month - 1, day);
  }