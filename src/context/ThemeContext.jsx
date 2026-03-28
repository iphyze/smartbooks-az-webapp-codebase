import React, { createContext, useContext, useEffect, useState } from "react";

// Create the ThemeContext
const ThemeContext = createContext();

// Custom hook for easier context usage
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Retrieve theme from localStorage or default to "light"
    return localStorage.getItem("theme") || "light";
  });

  // Toggle the theme between "light" and "dark"
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Save the selected theme in localStorage
  useEffect(() => {
    localStorage.setItem("theme", theme);
    // Update the body class for styling
    document.body.className = theme;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
