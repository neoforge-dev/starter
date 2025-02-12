import { i18n } from "../services/i18n.js";
import { translationUpdater } from "../services/translation-updater.js";

export const TranslationMixin = (superClass) =>
  class extends superClass {
    constructor() {
      super();
      this._translations = {};
    }

    connectedCallback() {
      super.connectedCallback();
      translationUpdater.registerComponent(this);
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      translationUpdater.unregisterComponent(this);
    }

    async updateTranslations(locale) {
      if (this.translationKeys) {
        const keys =
          typeof this.translationKeys === "function"
            ? this.translationKeys()
            : this.translationKeys;

        this._translations = {};
        for (const key of keys) {
          this._translations[key] = await i18n.t(key);
        }
        this.requestUpdate();
      }
    }

    t(key, params = {}) {
      return this._translations[key] || key;
    }
  };
