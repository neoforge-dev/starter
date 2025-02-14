/**
 * Enhanced lazy loading utility for components with retry logic and better error handling
 * @param {string} path - Path to the component module
 * @param {string} tagName - The custom element tag name
 * @param {Object} options - Configuration options
 * @returns {Promise<void>}
 */
export async function lazyLoad(path, tagName, options = {}) {
  const {
    retries = 3,
    retryDelay = 1000,
    timeout = 10000,
    fallback = null,
  } = options;

  // Check if component is already defined
  if (customElements.get(tagName)) {
    return;
  }

  let attempts = 0;

  const loadComponent = async () => {
    try {
      // Create loading element with transition
      const loadingElement = document.createElement("div");
      loadingElement.innerHTML = `
        <div class="lazy-load-spinner" style="
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          opacity: 0;
          transition: opacity 0.2s ease-in-out;
        ">
          <div class="loading-spinner"></div>
        </div>
      `;
      document.body.appendChild(loadingElement);

      // Show loading spinner with fade
      requestAnimationFrame(() => {
        loadingElement.querySelector(".lazy-load-spinner").style.opacity = "1";
      });

      // Set up timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error(`Loading ${tagName} timed out`)),
          timeout
        );
      });

      // Import with timeout race
      const modulePromise = import(/* @vite-ignore */ path);
      await Promise.race([modulePromise, timeoutPromise]);

      // Remove loading element with fade
      loadingElement.querySelector(".lazy-load-spinner").style.opacity = "0";
      await new Promise((resolve) => setTimeout(resolve, 200));
      loadingElement.remove();

      // Dispatch successful load event
      window.dispatchEvent(
        new CustomEvent("component-loaded", {
          detail: { tagName, path },
        })
      );
    } catch (error) {
      console.error(`Error loading component ${tagName}:`, error);

      // Retry logic
      if (attempts < retries) {
        attempts++;
        console.log(`Retrying ${tagName} load (${attempts}/${retries})...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return loadComponent();
      }

      // If all retries failed, show error or fallback
      if (fallback) {
        const fallbackElement = document.createElement("div");
        fallbackElement.innerHTML =
          typeof fallback === "function" ? fallback() : fallback;
        document.body.appendChild(fallbackElement);
      }

      // Dispatch error event
      window.dispatchEvent(
        new CustomEvent("component-load-error", {
          detail: { tagName, path, error },
        })
      );

      throw error;
    }
  };

  return loadComponent();
}
