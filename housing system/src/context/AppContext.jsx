// import { createContext, useContext, useEffect, useState } from "react";

// const AppCtx = createContext(null);

// const CURRENCIES = {
//   USD: { code: "USD", symbol: "$",   locale: "en-US", name: "US Dollar"        },
//   EUR: { code: "EUR", symbol: "€",   locale: "de-DE", name: "Euro"             },
//   GBP: { code: "GBP", symbol: "£",   locale: "en-GB", name: "British Pound"    },
//   NGN: { code: "NGN", symbol: "₦",   locale: "en-NG", name: "Nigerian Naira"   },
//   CAD: { code: "CAD", symbol: "C$",  locale: "en-CA", name: "Canadian Dollar"  },
//   AUD: { code: "AUD", symbol: "A$",  locale: "en-AU", name: "Australian Dollar"},
//   INR: { code: "INR", symbol: "₹",   locale: "en-IN", name: "Indian Rupee"     }
// };

// // Approximate demo FX rates (USD base). Real app would fetch daily.
// const FX = { USD: 1, EUR: 0.92, GBP: 0.79, NGN: 1580, CAD: 1.36, AUD: 1.52, INR: 83.2 };

// export function AppProvider({ children }) {
//   const [theme, setTheme] = useState(() => localStorage.getItem("eh_theme") || "light");
//   const [currency, setCurrency] = useState(() => localStorage.getItem("eh_ccy") || "USD");
//   const [mobileNavOpen, setMobileNavOpen] = useState(false);

//   useEffect(() => {
//     document.documentElement.classList.toggle("dark", theme === "dark");
//     localStorage.setItem("eh_theme", theme);
//   }, [theme]);

//   useEffect(() => { localStorage.setItem("eh_ccy", currency); }, [currency]);

//   // Convert a USD amount to the active currency, then format with proper locale.
//   function fmt(amountUSD, opts = {}) {
//     const c = CURRENCIES[currency] || CURRENCIES.USD;
//     const converted = (amountUSD || 0) * (FX[currency] || 1);
//     return new Intl.NumberFormat(c.locale, {
//       style: "currency",
//       currency: c.code,
//       maximumFractionDigits: opts.decimals ?? 0
//     }).format(converted);
//   }
//   function fmtNum(n) {
//     const c = CURRENCIES[currency] || CURRENCIES.USD;
//     return new Intl.NumberFormat(c.locale).format(n || 0);
//   }

//   const value = {
//     theme, setTheme,
//     currency, setCurrency, currencies: CURRENCIES, fx: FX,
//     mobileNavOpen, setMobileNavOpen,
//     fmt, fmtNum
//   };
//   return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
// }

// export const useApp = () => useContext(AppCtx);







import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";

const AppCtx = createContext(null);

export const CURRENCIES = {
  NGN: { code: "NGN", symbol: "₦", locale: "en-NG", name: "Nigerian Naira" },
  USD: { code: "USD", symbol: "$", locale: "en-US", name: "US Dollar" },
  GBP: { code: "GBP", symbol: "£", locale: "en-GB", name: "British Pound" },
  EUR: { code: "EUR", symbol: "€", locale: "de-DE", name: "Euro" },
  GHS: { code: "GHS", symbol: "₵", locale: "en-GH", name: "Ghana Cedi" },
};

// Fallback rates relative to NGN (used when the API hasn't loaded yet
// or is unavailable — amounts still show in the right ballpark).
const FALLBACK_RATES_FROM_NGN = {
  NGN: 1,
  USD: 0.00063,
  GBP: 0.00050,
  EUR: 0.00058,
  GHS: 0.0077,
};

// Free tier of exchangerate-api.com — no key needed for the open endpoint.
// Returns rates relative to NGN (our base currency, since rents are stored in NGN).
const RATES_API = "https://open.er-api.com/v6/latest/NGN";
const CACHE_KEY = "eh_fx_cache";
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

function loadCachedRates() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { rates, fetchedAt } = JSON.parse(raw);
    if (Date.now() - fetchedAt > CACHE_TTL) return null;
    return rates;
  } catch { return null; }
}

function saveCachedRates(rates) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rates, fetchedAt: Date.now() }));
  } catch { }
}

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("eh_theme") || "light");
  const [currency, setCurrency] = useState(() => localStorage.getItem("eh_ccy") || "NGN");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [rates, setRates] = useState(() => loadCachedRates() || FALLBACK_RATES_FROM_NGN);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState(false);
  const fetchedOnce = useRef(false);

  // Apply + persist theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("eh_theme", theme);
  }, [theme]);

  // Persist selected currency
  useEffect(() => { localStorage.setItem("eh_ccy", currency); }, [currency]);

  // Fetch live FX rates from the free open.er-api endpoint (no key required).
  // Runs once on mount; skips if the cache is still fresh.
  const fetchRates = useCallback(async () => {
    const cached = loadCachedRates();
    if (cached) { setRates(cached); return; }

    setRatesLoading(true);
    setRatesError(false);
    try {
      const res = await fetch(RATES_API);
      const data = await res.json();
      if (data.result !== "success") throw new Error("bad response");

      // We only need the 5 currencies we support
      const subset = {};
      for (const code of Object.keys(CURRENCIES)) {
        subset[code] = data.rates[code] ?? FALLBACK_RATES_FROM_NGN[code];
      }
      saveCachedRates(subset);
      setRates(subset);
    } catch (err) {
      console.warn("FX rate fetch failed, using fallback rates:", err.message);
      setRatesError(true);
      // Keep whatever rates we have (cache or fallback) — don't blank out
    } finally {
      setRatesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!fetchedOnce.current) {
      fetchedOnce.current = true;
      fetchRates();
    }
  }, [fetchRates]);

  /**
   * Format an amount (stored in NGN) into the currently selected currency.
   * @param {number} amountNGN  - the raw stored value (always NGN)
   * @param {object} opts       - { decimals?: number }
   */
  function fmt(amountNGN, opts = {}) {
    const c = CURRENCIES[currency] || CURRENCIES.NGN;
    const rate = rates[currency] ?? FALLBACK_RATES_FROM_NGN[currency] ?? 1;
    const converted = (amountNGN || 0) * rate;
    return new Intl.NumberFormat(c.locale, {
      style: "currency",
      currency: c.code,
      maximumFractionDigits: opts.decimals ?? 0,
    }).format(converted);
  }

  function fmtNum(n) {
    const c = CURRENCIES[currency] || CURRENCIES.NGN;
    return new Intl.NumberFormat(c.locale).format(n || 0);
  }

  /** Raw numeric conversion (useful for chart tooltips that need a number) */
  function convert(amountNGN) {
    const rate = rates[currency] ?? FALLBACK_RATES_FROM_NGN[currency] ?? 1;
    return (amountNGN || 0) * rate;
  }

  const value = {
    theme, setTheme,
    currency, setCurrency, currencies: CURRENCIES,
    rates, ratesLoading, ratesError, fetchRates,
    mobileNavOpen, setMobileNavOpen,
    fmt, fmtNum, convert,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export const useApp = () => useContext(AppCtx);
