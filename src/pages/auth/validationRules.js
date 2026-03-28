export const validationRules = {
  required: (value) => ({
    isValid: value && value.toString().trim().length > 0,
    message: 'This field is required'
  }),

  minLength: (length) => (value) => ({
    isValid: value && value.toString().trim().length >= length,
    message: `Must be at least ${length} characters`
  }),

  email: (value) => ({
    isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Please enter a valid email address'
  }),

  password: (value) => {
    const checks = [
      { isValid: value.length >= 6, message: 'Password must be at least 6 characters long' },
      { isValid: /[A-Z]/.test(value), message: 'Password must contain at least one uppercase letter' },
      { isValid: /[!@#$%^&*(),.?":{}|<>]/.test(value), message: 'Password must contain at least one special character' },
      { isValid: /\d/.test(value), message: 'Password must contain at least one number' }
    ];

    const failedCheck = checks.find(check => !check.isValid);
    return {
      isValid: !failedCheck,
      message: failedCheck ? failedCheck.message : ''
    };
  },

  match: (matchValue) => (value) => ({
    isValid: value === matchValue,
    message: 'Values do not match'
  }),

  checkbox: (value) => ({
    isValid: value === true,
    message: 'You must agree to continue'
  })
};