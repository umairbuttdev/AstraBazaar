export type AddressInput = {
  label: string | null;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
};

const PHONE_PATTERN = /^[0-9+().\-\s]+$/;

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function optional(value: unknown, max: number, field: string) {
  const trimmed = text(value);
  if (!trimmed) return null;
  if (trimmed.length > max) {
    return { error: `${field} must be ${max} characters or fewer` as const };
  }
  return trimmed;
}

export function parseFullName(value: unknown) {
  const fullName = text(value);
  if (!fullName) return null;
  if (fullName.length > 120) {
    return { error: 'Name must be 120 characters or fewer' as const };
  }
  return fullName;
}

export function parseAddress(input: Record<string, unknown>) {
  const fullName = text(input.fullName);
  const line1 = text(input.line1);
  const city = text(input.city);
  const postalCode = text(input.postalCode);
  const country = (text(input.country) || 'US').toUpperCase();
  const label = optional(input.label, 40, 'Label');
  const line2 = optional(input.line2, 200, 'Address line 2');
  const state = optional(input.state, 100, 'State');
  const phoneText = text(input.phone);

  if (label && typeof label === 'object') return label;
  if (line2 && typeof line2 === 'object') return line2;
  if (state && typeof state === 'object') return state;
  if (!fullName) return { error: 'Full name is required' };
  if (fullName.length > 120) {
    return { error: 'Full name must be 120 characters or fewer' };
  }
  if (!line1) return { error: 'Address is required' };
  if (line1.length > 200) {
    return { error: 'Address must be 200 characters or fewer' };
  }
  if (!city) return { error: 'City is required' };
  if (city.length > 100) {
    return { error: 'City must be 100 characters or fewer' };
  }
  if (!postalCode) return { error: 'Postal code is required' };
  if (postalCode.length > 20) {
    return { error: 'Postal code must be 20 characters or fewer' };
  }
  if (country.length < 2 || country.length > 56) {
    return { error: 'Country is required' };
  }

  let phone: string | null = null;
  if (phoneText) {
    const digits = phoneText.replace(/\D/g, '');
    if (!PHONE_PATTERN.test(phoneText) || digits.length < 7 || digits.length > 15) {
      return { error: 'Enter a valid phone number' };
    }
    phone = phoneText;
  }

  return {
    value: {
      label: typeof label === 'string' ? label : null,
      fullName,
      line1,
      line2: typeof line2 === 'string' ? line2 : null,
      city,
      state: typeof state === 'string' ? state : null,
      postalCode,
      country,
      phone,
      isDefault: input.isDefault === true || input.isDefault === 'true',
    } satisfies AddressInput,
  };
}
