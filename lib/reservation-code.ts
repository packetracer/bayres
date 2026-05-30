export function generateReservationCode(year: number, sequence: number) {
  if (!Number.isInteger(year) || year < 2000 || year > 9999) {
    throw new Error("Reservation code year must be a four-digit year.");
  }
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error("Reservation code sequence must be a positive integer.");
  }
  return `BAY-${year}-${String(sequence).padStart(6, "0")}`;
}

export function nextSequenceFromCode(code?: string | null) {
  if (!code) return 1;
  const match = code.match(/^BAY-\d{4}-(\d{6})$/);
  if (!match) return 1;
  return Number(match[1]) + 1;
}
