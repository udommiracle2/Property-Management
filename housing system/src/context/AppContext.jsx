import { createContext, useContext, useEffect, useState } from "react";

const AppCtx = createContext(null);

const CURRENCIES = {
  USD: { code: "USD", symbol: "$",   locale: "en-US", name: "US Dollar"        },
  EUR: { code: "EUR", symbol: "€",   locale: "de-DE", name: "Euro"             },
  GBP: { code: "GBP", symbol: "£",   locale: "en-GB", name: "British Pound"    },
  NGN: { code: "NGN", symbol: "₦",   locale: "en-NG", name: "Nigerian Naira"   },
  CAD: { code: "CAD", symbol: "C$",  locale: "en-CA", name: "Canadian Dollar"  },
  AUD: { code: "AUD", symbol: "A$",  locale: "en-AU", name: "Australian Dollar"},
  INR: { code: "INR", symbol: "₹",   locale: "en-IN", name: "Indian Rupee"     }
};

// Approximate demo FX rates (USD base). Real app would fetch daily.
const FX = { USD: 1, EUR: 0.92, GBP: 0.79, NGN: 1580, CAD: 1.36, AUD: 1.52, INR: 83.2 };

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("eh_theme") || "light");
  const [currency, setCurrency] = useState(() => localStorage.getItem("eh_ccy") || "USD");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("eh_theme", theme);
  }, [theme]);

  useEffect(() => { localStorage.setItem("eh_ccy", currency); }, [currency]);

  // Convert a USD amount to the active currency, then format with proper locale.
  function fmt(amountUSD, opts = {}) {
    const c = CURRENCIES[currency] || CURRENCIES.USD;
    const converted = (amountUSD || 0) * (FX[currency] || 1);
    return new Intl.NumberFormat(c.locale, {
      style: "currency",
      currency: c.code,
      maximumFractionDigits: opts.decimals ?? 0
    }).format(converted);
  }
  function fmtNum(n) {
    const c = CURRENCIES[currency] || CURRENCIES.USD;
    return new Intl.NumberFormat(c.locale).format(n || 0);
  }

  const value = {
    theme, setTheme,
    currency, setCurrency, currencies: CURRENCIES, fx: FX,
    mobileNavOpen, setMobileNavOpen,
    fmt, fmtNum
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export const useApp = () => useContext(AppCtx);
