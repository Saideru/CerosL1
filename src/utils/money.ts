/**
 * Currency & Integer Centavos Utility
 * All monetary amounts are stored and calculated as integer centavos (1 PHP = 100 centavos)
 * to prevent floating-point rounding errors.
 */

export function roundHalfUp(num: number): number {
  if (num < 0) {
    return Math.ceil(num - 0.5);
  }
  return Math.floor(num + 0.5);
}

/**
 * Parses a numeric input or string into integer centavos.
 * Rejects negative amounts (returns null or throws based on usage).
 * Handles inputs with or without commas and currency prefixes.
 */
export function parseToCentavos(value: string | number): {
  centavos: number | null;
  error?: string;
} {
  if (value === '' || value === null || value === undefined) {
    return { centavos: 0 };
  }

  let cleanStr = typeof value === 'number' ? value.toString() : value.trim();

  // Strip optional 'PHP', 'Php', '₱' prefixes and commas or whitespace
  cleanStr = cleanStr.replace(/^(PHP|Php|₱)\s*/i, '').replace(/,/g, '').trim();

  if (cleanStr === '') {
    return { centavos: 0 };
  }

  // Check for negative numbers
  if (cleanStr.startsWith('-') || cleanStr.includes('-')) {
    return {
      centavos: null,
      error: 'Negative amounts are not permitted.'
    };
  }

  // Check for valid number pattern
  if (!/^\d+(\.\d+)?$/.test(cleanStr)) {
    return {
      centavos: null,
      error: 'Please enter a valid positive number.'
    };
  }

  const parts = cleanStr.split('.');
  const wholePart = parseInt(parts[0], 10);
  let decimalPart = 0;

  if (parts.length > 1) {
    const decStr = (parts[1] + '00').slice(0, 2);
    decimalPart = parseInt(decStr, 10);
    // If there were 3 or more decimal places, check for round half up
    if (parts[1].length > 2) {
      const thirdDigit = parseInt(parts[1][2], 10);
      if (thirdDigit >= 5) {
        decimalPart += 1;
      }
    }
  }

  const totalCentavos = wholePart * 100 + decimalPart;
  return { centavos: totalCentavos };
}

/**
 * Formats integer centavos to "PHP 168,000.00"
 */
export function formatPHP(centavos: number, includePrefix = true): string {
  const isNegative = centavos < 0;
  const absCents = Math.abs(centavos);
  const pesos = Math.floor(absCents / 100);
  const remCents = absCents % 100;

  const pesosFormatted = pesos.toLocaleString('en-US');
  const centsFormatted = remCents.toString().padStart(2, '0');
  const amountStr = `${pesosFormatted}.${centsFormatted}`;

  const sign = isNegative ? '-' : '';
  return includePrefix ? `${sign}PHP ${amountStr}` : `${sign}${amountStr}`;
}

/**
 * Formats integer centavos to plain number with 2 decimals (for CSV export)
 * E.g. 15000000 -> "150000.00"
 */
export function formatPlainAmount(centavos: number): string {
  const isNegative = centavos < 0;
  const absCents = Math.abs(centavos);
  const pesos = Math.floor(absCents / 100);
  const remCents = absCents % 100;
  const sign = isNegative ? '-' : '';
  return `${sign}${pesos}.${remCents.toString().padStart(2, '0')}`;
}

/**
 * VAT Calculations:
 * Mode: "Add VAT" (net to gross)
 * Mode: "Extract VAT" (gross to net)
 * When extracting: net = round(gross / (1 + rate)), and VAT = gross - net.
 */
export function calculateAddVat(netCentavos: number, rate: number): {
  netCentavos: number;
  vatCentavos: number;
  grossCentavos: number;
} {
  const vatCentavos = roundHalfUp(netCentavos * rate);
  const grossCentavos = netCentavos + vatCentavos;
  return { netCentavos, vatCentavos, grossCentavos };
}

export function calculateExtractVat(grossCentavos: number, rate: number): {
  netCentavos: number;
  vatCentavos: number;
  grossCentavos: number;
} {
  if (rate === 0) {
    return {
      netCentavos: grossCentavos,
      vatCentavos: 0,
      grossCentavos: grossCentavos
    };
  }
  const netCentavos = roundHalfUp(grossCentavos / (1 + rate));
  const vatCentavos = grossCentavos - netCentavos;
  return { netCentavos, vatCentavos, grossCentavos };
}
