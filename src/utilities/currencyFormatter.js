export function formatCurrency(amount, currency = 'BDT') {
    const numericAmount = Number(amount);
  
    if (Number.isNaN(numericAmount)) {
      return `${currency} 0`;
    }
  
    return `${currency} ${numericAmount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }