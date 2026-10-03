const receiptAmountPattern = String.raw`(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?`;

export const parseReceiptAmount = (text: string): number => {
  const withoutDates = text
    .replace(/\b\d{4}-\d{1,2}-\d{1,2}\b/g, ' ')
    .replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, ' ');

  const totalMatch = withoutDates.match(new RegExp(
    `\\b(?:grand\\s+total|total|amount\\s+paid|paid|balance\\s+due)\\b[^\\d$£€]{0,12}[$£€]?\\s*(${receiptAmountPattern})`,
    'i',
  ));
  if (totalMatch) return Number(totalMatch[1].replace(/,/g, ''));

  const currencyAmounts = [...withoutDates.matchAll(new RegExp(`[$£€]\\s*(${receiptAmountPattern})`, 'g'))];
  if (currencyAmounts.length) {
    return Number(currencyAmounts[currencyAmounts.length - 1][1].replace(/,/g, ''));
  }

  const decimalAmounts = [...withoutDates.matchAll(/\b((?:\d{1,3}(?:,\d{3})+|\d+)\.\d{1,2})\b/g)];
  if (decimalAmounts.length) {
    return Number(decimalAmounts[decimalAmounts.length - 1][1].replace(/,/g, ''));
  }

  return 0;
};

export const parseReceiptDate = (text: string): string => {
  const dateMatch = text.match(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    return isValidDateParts(Number(year), Number(month), Number(day)) ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` : '';
  }

  const fallback = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
  if (!fallback) return '';

  const [, first, second, yearText] = fallback;
  const firstPart = Number(first);
  const secondPart = Number(second);
  const year = Number(yearText.length === 2 ? `20${yearText}` : yearText);
  const month = secondPart > 12 ? firstPart : secondPart;
  const day = secondPart > 12 ? secondPart : firstPart;
  if (!isValidDateParts(year, month, day)) return '';

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const isValidDateParts = (year: number, month: number, day: number) => {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};
