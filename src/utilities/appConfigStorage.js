const CONFIG_STORAGE_KEY = 'personal_expenses_tracker_config';

export function saveAppConfig(config) {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}

export function loadAppConfig() {
  const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);

  if (!savedConfig) {
    return null;
  }

  try {
    return JSON.parse(savedConfig);
  } catch {
    return null;
  }
}

export function clearAppConfig() {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
}

export function hasValidAppConfig(config) {
  if (!config) {
    return false;
  }

  if (!config.spreadsheetId || config.spreadsheetId.trim() === '') {
    return false;
  }

  if (!config.currency || config.currency.trim() === '') {
    return false;
  }

  return true;
}