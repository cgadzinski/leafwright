import { z } from "zod";

export function isLuhnValid(cardNumber: string): boolean {
  const digits = cardNumber.replace(/[\s-]/g, "");
  if (!/^\d{12,19}$/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Accepts `MM/YY` or `MM/YYYY` for a month that has not ended yet. */
export function isExpiryValid(expiry: string, now: Date = new Date()): boolean {
  const match = /^\s*(\d{1,2})\s*\/\s*(\d{2}|\d{4})\s*$/.exec(expiry);
  if (!match) return false;
  const month = Number(match[1]);
  if (month < 1 || month > 12) return false;
  const year = match[2].length === 2 ? 2000 + Number(match[2]) : Number(match[2]);
  const endOfMonth = new Date(Date.UTC(year, month, 1));
  return endOfMonth.getTime() > now.getTime();
}

export const CardSchema = z.object({
  cardNumber: z.string().refine(isLuhnValid, "Enter a valid card number."),
  cardExpiry: z.string().refine((value) => isExpiryValid(value), "Enter a valid expiry date."),
  cardCvc: z.string().regex(/^\d{3,4}$/, "Enter the 3 or 4 digit security code."),
});
export type Card = z.infer<typeof CardSchema>;

export function cardLast4(cardNumber: string): string {
  return cardNumber.replace(/\D/g, "").slice(-4);
}
