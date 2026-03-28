// ...existing code...
import { useState, useCallback } from 'react';

const useFormValidation = (validationSchema, formData = {}) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback((field, value) => {
    if (!validationSchema || !validationSchema[field]) return '';

    const fieldRules = validationSchema[field];
    for (const rule of fieldRules) {
      const result = rule(value);
      if (!result.isValid) {
        return result.message;
      }
    }
    return '';
  }, [validationSchema]);

  const handleBlur = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const errorMessage = validateField(field, formData[field]);
    setErrors(prev => ({ ...prev, [field]: errorMessage }));
  }, [validateField, formData]);

  const touchField = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};
    Object.keys(validationSchema || {}).forEach(field => {
      const message = validateField(field, formData[field]);
      if (message) newErrors[field] = message;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [validationSchema, validateField, formData]);

  return {
    errors,
    setErrors,
    touched,
    setTouched,
    validateField,
    validateForm,
    handleBlur,
    touchField
  };
};

export default useFormValidation;
