export type AccountProfile = {
  email: string;
  fullName: string | null;
};

export type AccountAddress = {
  id: string;
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

export type AccountSummary = AccountProfile & {
  wishlistCount: number;
  addressCount: number;
  defaultAddress: AccountAddress | null;
};

export function accountDisplayName(profile: AccountProfile) {
  const name = profile.fullName?.trim();
  if (name) return name;
  const local = profile.email.split("@")[0]?.trim();
  return local || "there";
}

export function accountFirstName(profile: AccountProfile) {
  const name = profile.fullName?.trim();
  if (name) return name.split(/\s+/)[0] ?? name;
  return accountDisplayName(profile);
}

export function accountInitials(profile: AccountProfile) {
  const name = profile.fullName?.trim();
  if (name) {
    const letters = name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
    if (letters) return letters;
  }
  return (profile.email[0] ?? "A").toUpperCase();
}

export function formatAddressLines(address: AccountAddress) {
  return [
    address.line1,
    address.line2,
    [address.city, address.state].filter(Boolean).join(", "),
    [address.postalCode, address.country].filter(Boolean).join(" "),
  ].filter((line): line is string => Boolean(line));
}
