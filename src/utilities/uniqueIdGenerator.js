export function generateUniqueId(prefix) {
    const timestampPart = Date.now();
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  
    return `${prefix}-${timestampPart}-${randomPart}`;
  }