export interface CurrencyRates {
  DZD: number;
  EUR: number;
  USD: number;
}

export interface CurrencySettings {
  active: boolean;
  defaultCurrency: 'DZD' | 'EUR' | 'USD';
  rates: CurrencyRates;
}

export const DEFAULT_CURRENCY: CurrencySettings = {
  active: true,
  defaultCurrency: 'DZD',
  rates: { DZD: 1, EUR: 0.0068, USD: 0.0074 },
};

const SYMBOLS: Record<keyof CurrencyRates, string> = { DZD: 'DA', EUR: '€', USD: '$' };

export function convertPrice(amountDZD: number, currency: keyof CurrencyRates, rates: CurrencyRates): number {
  const rate = rates[currency] ?? 1;
  const converted = amountDZD * rate;
  return currency === 'DZD' ? Math.round(converted) : Math.round(converted * 100) / 100;
}

export function formatConverted(amountDZD: number, currency: keyof CurrencyRates, rates: CurrencyRates): string {
  const v = convertPrice(amountDZD, currency, rates);
  return `${v.toLocaleString('fr-DZ')} ${SYMBOLS[currency]}`;
}
