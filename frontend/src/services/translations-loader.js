export class TranslationsLoader {
  constructor() {
    this._cache = new Map();
  }

  async loadTranslations(locale) {
    if (this._cache.has(locale)) {
      return this._cache.get(locale);
    }

    try {
      const response = await fetch(`/assets/i18n/${locale}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load translations for ${locale}`);
      }

      const translations = await response.json();
      this._cache.set(locale, translations);
      return translations;
    } catch (error) {
      console.error(`Error loading translations for ${locale}:`, error);
      throw error;
    }
  }

  clearCache() {
    this._cache.clear();
  }

  preloadTranslations(locales) {
    return Promise.all(locales.map((locale) => this.loadTranslations(locale)));
  }
}

export const translationsLoader = new TranslationsLoader();
