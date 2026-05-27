import { useEffect } from "react";

const TEXT_INPUT_SELECTOR = 'input[type="text"]:not([data-sb-autocomplete-reviewed="true"])';

const SEARCH_OR_FILTER_FIELD = /\b(search|filter|find|lookup|keyword)\b/i;
const SENSITIVE_OR_IDENTIFIER_FIELD = /\b(password|passcode|secret|token|pin|otp|verification|security|bvn|nin|tax\s?id|tin|account\s?(number|no)|bank\s?account|iban|swift|sort\s?code|routing|card|cvv|cvc|invoice\s?(number|no)|purchase\s?order|po\s?(number|no)|reference\s?(number|no)|transaction\s?id|journal\s?id|amount|discount|charge|percentage|rate|currency|tax|vat|wht|debit|credit|balance|quantity)\b/i;

const AUTOCOMPLETE_TOKENS = [
  { pattern: /\b(first\s?name|given\s?name|fname)\b/i, token: "given-name" },
  { pattern: /\b(last\s?name|surname|family\s?name|lname)\b/i, token: "family-name" },
  { pattern: /\b(full\s?name|contact\s?name|staff\s?name)\b/i, token: "name" },
  { pattern: /\b(company|business|organisation|organization|client|supplier|vendor)\b/i, token: "organization" },
  { pattern: /\b(address|street)\b/i, token: "street-address" },
  { pattern: /\b(city|town)\b/i, token: "address-level2" },
  { pattern: /\b(state|province|region)\b/i, token: "address-level1" },
  { pattern: /\bcountry\b/i, token: "country-name" },
  { pattern: /\b(phone|telephone|mobile|tel)\b/i, token: "tel" },
  { pattern: /\b(job\s?title|position|designation)\b/i, token: "organization-title" },
];

const describeInput = (input) => {
  const labels = input.labels ? Array.from(input.labels).map((label) => label.textContent || "").join(" ") : "";
  return [input.name, input.id, input.placeholder, input.getAttribute("aria-label"), labels]
    .filter(Boolean)
    .join(" ")
    .replace(/[_-]+/g, " ");
};

const enhanceInput = (input) => {
  if (!(input instanceof HTMLInputElement) || input.dataset.sbAutocompleteReviewed === "true") return;

  input.dataset.sbAutocompleteReviewed = "true";

  if (input.disabled || input.readOnly || input.hasAttribute("autocomplete")) return;

  const context = describeInput(input);

  if (SEARCH_OR_FILTER_FIELD.test(context) || SENSITIVE_OR_IDENTIFIER_FIELD.test(context)) {
    input.autoComplete = "off";
    input.dataset.sbAutocomplete = "disabled";
    return;
  }

  const token = AUTOCOMPLETE_TOKENS.find(({ pattern }) => pattern.test(context))?.token || "on";
  input.autoComplete = token;
  input.dataset.sbAutocomplete = "enabled";
};

const scanForTextFields = (root) => {
  if (root instanceof HTMLInputElement && root.matches(TEXT_INPUT_SELECTOR)) enhanceInput(root);
  if (root instanceof Element || root instanceof Document) {
    root.querySelectorAll(TEXT_INPUT_SELECTOR).forEach(enhanceInput);
  }
};

/**
 * Adds browser autocomplete only to non-sensitive text fields rendered by the app.
 * Search fields and fields likely to contain financial identifiers are explicitly excluded.
 * Components may opt out by setting autoComplete="off" directly on an input.
 */
const NonSensitiveAutocomplete = () => {
  useEffect(() => {
    scanForTextFields(document);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => scanForTextFields(node));
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
};

export default NonSensitiveAutocomplete;
