// utils/numberFormat.js

// Formats with 2 decimals → 1,250.00
export const formatWithDecimals = (number) => {
  if (number === null || number === undefined || isNaN(number)) return "0.00";
  return Number(number)
    .toFixed(2) // force 2 decimal places
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Formats without decimals → 1,250
export const formatWithoutDecimals = (number) => {
  if (number === null || number === undefined || isNaN(number)) return "0";
  return Math.round(Number(number)) // round to nearest integer
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};


export const formatCurrencyDecimals = (number, cur = 'NGN') => {
  // 1. Handle invalid numbers
  if (number === null || number === undefined || isNaN(number)) return "0.00";

  // 2. Map the currency codes to symbols
  const symbols = {
    NGN: "₦",
    USD: "$",
    GBP: "£",
    EUR: "€"
  };

  // 3. Get the symbol (defaults to NGN if the code isn't in our list)
  const symbol = symbols[cur.toUpperCase()] || "₦";

  // 4. Format the number with 2 decimals and commas
  const formattedNumber = Number(number)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `${symbol} ${formattedNumber}`;
};


// Format date string from "2025-11-07 23:28:07" to "November 11th, 2025"
export const formatDateLong = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = date.toLocaleDateString('en-US', options);
  
  // Add ordinal suffix to day (1st, 2nd, 3rd, 4th, etc.)
  const day = date.getDate();
  const suffix = getOrdinalSuffix(day);
  
  // Replace the day number with day + suffix
  return formattedDate.replace(/\b\d+\b/, `${day}${suffix}`);
};


// Format date string to "Month Year" format (e.g., "December 2025")
export const formatDateMonthYear = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const options = { year: 'numeric', month: 'long' };
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};


// Helper function to get ordinal suffix for a number
const getOrdinalSuffix = (num) => {
  const j = num % 10;
  const k = num % 100;
  
  if (j === 1 && k !== 11) {
    return 'st';
  }
  if (j === 2 && k !== 12) {
    return 'nd';
  }
  if (j === 3 && k !== 13) {
    return 'rd';
  }
  return 'th';
};


// ADD after imports, before createEmptyItem
export const HOURS = Array.from({ length: 24 }, (_, i) => ({
  id: String(i).padStart(2, "0"),
  label: String(i).padStart(2, "0"),
}));

export const MINUTES = Array.from({ length: 60 }, (_, i) => ({
  id: String(i).padStart(2, "0"),
  label: String(i).padStart(2, "0"),
}));

export const parseTime = (val) => {
  if (!val) return { h: "", m: "" };
  const [h = "", m = ""] = val.split(":");
  return { h, m };
};

export const buildTime = (h, m) => (h && m ? `${h}:${m}` : "");


export const fmt = (n) => {
  const num = Number(n || 0);
  const abs = Math.abs(num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return num < 0 ? `(${abs})` : abs;
};

export const toLocalISO = (d) => {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const fmtDate = (d) => {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(`${d}T00:00:00`) : d;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export const fmtDatetime = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};