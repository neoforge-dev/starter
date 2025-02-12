export class I18nService {
  constructor() {
    this._translations = new Map();
    this._currentLocale = "en";
    this._fallbackLocale = "en";
  }

  async initialize() {
    // Load user's preferred language
    const savedLocale = localStorage.getItem("preferred_locale");
    const browserLocale = navigator.language.split("-")[0];

    await this.setLocale(savedLocale || browserLocale || this._fallbackLocale);
  }

  async setLocale(locale) {
    if (!this._translations.has(locale)) {
      try {
        const response = await fetch(`/assets/i18n/${locale}.json`);
        const translations = await response.json();
        this._translations.set(locale, translations);
      } catch (error) {
        console.error(`Failed to load translations for ${locale}:`, error);
        if (locale !== this._fallbackLocale) {
          return this.setLocale(this._fallbackLocale);
        }
        return false;
      }
    }

    this._currentLocale = locale;
    localStorage.setItem("preferred_locale", locale);
    document.documentElement.lang = locale;

    // Dispatch event for components to update
    window.dispatchEvent(
      new CustomEvent("locale-changed", { detail: { locale } })
    );
    return true;
  }

  t(key, params = {}) {
    const translations = this._translations.get(this._currentLocale) || {};
    let text =
      translations[key] ||
      this._translations.get(this._fallbackLocale)?.[key] ||
      key;

    // Replace parameters
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(`{${param}}`, value);
    });

    return text;
  }

  getCurrentLocale() {
    return this._currentLocale;
  }

  getSupportedLocales() {
    return Array.from(this._translations.keys());
  }
}

export const i18n = new I18nService();

// Create a lit directive for translations
import { directive } from "lit/directive.js";

export const t = directive((key, params = {}) => (part) => {
  part.setValue(i18n.t(key, params));
});
