import { useState, useEffect } from 'react';

const useFormPersist = (key, initialValue) => {
  // Get stored value
  const getStoredValue = () => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading ${key} from sessionStorage:`, error);
      return initialValue;
    }
  };

  const [value, setValue] = useState(getStoredValue);

  // Update storage when value changes
  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key} to sessionStorage:`, error);
    }
  }, [value, key]);

  // Clear storage
  const clearStorage = () => {
    try {
      sessionStorage.removeItem(key);
      setValue(initialValue);
    } catch (error) {
      console.error(`Error clearing ${key} from sessionStorage:`, error);
    }
  };

  return [value, setValue, clearStorage];
};

export default useFormPersist;