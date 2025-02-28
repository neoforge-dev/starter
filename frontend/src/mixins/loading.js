import { dedupeMixin } from "../utils/dedupeMixin.js";
import { html } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

export const LoadingMixin = dedupeMixin(
  (superClass) =>
    class LoadingMixin extends superClass {
      static properties = {
        loading: { type: Boolean, state: true },
      };

      constructor() {
        super();
        this.loading = false;
      }

      startLoading() {
        this.loading = true;
      }

      stopLoading() {
        this.loading = false;
      }

      renderLoading() {
        return html`
          <div class="loading-spinner">
            <ui-spinner></ui-spinner>
            <span>Loading...</span>
          </div>
        `;
      }
    }
);
