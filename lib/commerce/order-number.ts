const PREFIX = "LW-";
const FIRST_NUMBER = 10001;

export function formatOrderNumber(sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < FIRST_NUMBER) {
    throw new RangeError(`Order sequence must be an integer >= ${FIRST_NUMBER}`);
  }
  return `${PREFIX}${sequence}`;
}

export function parseOrderNumber(orderNumber: string): number | null {
  const match = /^LW-(\d{5,})$/.exec(orderNumber.trim().toUpperCase());
  if (!match) return null;
  const sequence = Number(match[1]);
  return sequence >= FIRST_NUMBER ? sequence : null;
}

/** The next order number after the highest one already issued. */
export function nextOrderNumber(existing: Iterable<string>): string {
  let highest = FIRST_NUMBER - 1;
  for (const value of existing) {
    const sequence = parseOrderNumber(value);
    if (sequence !== null && sequence > highest) highest = sequence;
  }
  return formatOrderNumber(highest + 1);
}
