export type RowFormat = "text" | "number" | "currency" | "date";
export interface FormatOptions {
    /**
     * BCP-47 locale tag for `Intl` formatters. Default `en-US`. Pass through
     * from the tenant page so each KeyValueTable instance can locale-format
     * independently.
     */
    locale?: string;
    /** ISO 4217 currency code for `format: "currency"`. Default `USD`. */
    currency?: string;
}
/**
 * Format a resolved value per the row's `format` hint. `null` / `undefined`
 * inputs return `null` so the consumer can render an empty cell.
 */
export declare function formatValue(v: unknown, format?: RowFormat, options?: FormatOptions): string | null;
//# sourceMappingURL=format.d.ts.map