/**
 * Upper bounds for tracker entries. The API routes enforce them and the
 * tracker forms check them first, so both read the same numbers.
 */
export const MAX_AMOUNT_TAKA = 100_000_000_000;
export const MAX_LABEL_LENGTH = 100;
export const MAX_SOURCE_LENGTH = 50;
export const MAX_TERM_MONTHS = 600;
export const MAX_RATE_PCT = 100;
