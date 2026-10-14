/**
 * Upper bounds for tracker entries. The API routes enforce them and the
 * tracker forms check them first, so both read the same numbers.
 */
export const MAX_AMOUNT_TAKA = 100_000_000_000;
export const MAX_LABEL_LENGTH = 100;
export const MAX_SOURCE_LENGTH = 50;
export const MAX_TERM_MONTHS = 600;
export const MAX_RATE_PCT = 100;
// Per user and per list (income, investments): keeps every page that reads them all bounded.
// shortcut: count-then-create, so concurrent saves can pass it by a few; fine for a size bound.
export const MAX_ENTRIES_PER_USER = 300;
