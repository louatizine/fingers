const NAGER_API_BASE = 'https://date.nager.at/api/v3';

export async function fetchTunisiaPublicHolidays(year) {
  const response = await fetch(`${NAGER_API_BASE}/PublicHolidays/${year}/TN`);
  if (!response.ok) {
    throw new Error(`Failed to load holidays (${response.status})`);
  }
  return response.json();
}

export async function fetchAvailableCountries() {
  const response = await fetch(`${NAGER_API_BASE}/AvailableCountries`);
  if (!response.ok) {
    throw new Error(`Failed to load countries (${response.status})`);
  }
  return response.json();
}
