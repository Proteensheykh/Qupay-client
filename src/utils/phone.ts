import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';

export interface PhoneValidationResult {
  valid: boolean;
  e164: string | null;
}

export function parseAndFormat(
  value: string,
  defaultCountry: CountryCode = 'NG',
): PhoneValidationResult {
  if (!value || !value.trim()) {
    return { valid: false, e164: null };
  }

  const phone = parsePhoneNumberFromString(value, defaultCountry);

  if (!phone || !phone.isValid()) {
    return { valid: false, e164: null };
  }

  return { valid: true, e164: phone.format('E.164') };
}
