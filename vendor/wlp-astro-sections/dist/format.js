// Format helpers for <KeyValueTable> (and any future primitive that
// surfaces flat field values with a row-level format hint).
//
// Cover the easy 90% — text, number, currency, date. Tenants who need
// per-locale i18n / multi-currency support can write a tenant-side primitive
// against the same resolver + asString contract.
/**
 * Format a resolved value per the row's `format` hint. `null` / `undefined`
 * inputs return `null` so the consumer can render an empty cell.
 */
export function formatValue(v, format = "text", options = {}) {
    if (v === null || v === undefined || v === "")
        return null;
    switch (format) {
        case "text":
            return formatText(v);
        case "number":
            return formatNumber(v, options);
        case "currency":
            return formatCurrency(v, options);
        case "date":
            return formatDate(v, options);
        default:
            return formatText(v);
    }
}
function formatText(v) {
    if (typeof v === "string")
        return v;
    if (typeof v === "number" && Number.isFinite(v))
        return String(v);
    if (typeof v === "boolean")
        return v ? "Yes" : "No";
    if (v && typeof v === "object" && "rendered" in v) {
        const r = v.rendered;
        if (typeof r === "string")
            return r;
    }
    return null;
}
function formatNumber(v, options) {
    const n = coerceNumber(v);
    if (n === null)
        return null;
    const locale = options.locale ?? "en-US";
    return new Intl.NumberFormat(locale).format(n);
}
function formatCurrency(v, options) {
    const n = coerceNumber(v);
    if (n === null)
        return null;
    const locale = options.locale ?? "en-US";
    const currency = options.currency ?? "USD";
    try {
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency,
            maximumFractionDigits: 0,
        }).format(n);
    }
    catch {
        // Invalid currency code — fall through to plain number.
        return formatNumber(n, options);
    }
}
function formatDate(v, options) {
    if (typeof v !== "string" && typeof v !== "number")
        return null;
    // Accept ISO timestamps, `YYYY-MM-DD` (ACF date_picker default), or epoch ms.
    const parsed = typeof v === "number" ? new Date(v) : new Date(v);
    if (Number.isNaN(parsed.getTime()))
        return null;
    const locale = options.locale ?? "en-US";
    return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(parsed);
}
function coerceNumber(v) {
    if (typeof v === "number" && Number.isFinite(v))
        return v;
    if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) {
        return Number(v);
    }
    return null;
}
//# sourceMappingURL=format.js.map