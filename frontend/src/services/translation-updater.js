import { store } from "./store.js";
import { i18n } from "./i18n.js";

export class TranslationUpdater {
  constructor() {
    this._updateQueue = new Set();
    this._processing = false;
    this._setupListeners();
  }

  _setupListeners() {
    window.addEventListener("locale-changed", () => {
      this._processUpdateQueue();
    });
  }

  registerComponent(component) {
    this._updateQueue.add(component);
    if (!this._processing) {
      this._processUpdateQueue();
    }
  }

  unregisterComponent(component) {
    this._updateQueue.delete(component);
  }

  async _processUpdateQueue() {
    if (this._processing) return;
    this._processing = true;

    try {
      const currentLocale = i18n.getCurrentLocale();

      for (const component of this._updateQueue) {
        if (typeof component.updateTranslations === "function") {
          await component.updateTranslations(currentLocale);
        }
      }
    } finally {
      this._processing = false;
    }
  }

  async updateDynamicContent(key, params = {}) {
    const translation = await i18n.t(key, params);
    store.setState({
      dynamicTranslations: {
        ...store.state.dynamicTranslations,
        [key]: translation,
      },
    });
    return translation;
  }
}

export const translationUpdater = new TranslationUpdater();
