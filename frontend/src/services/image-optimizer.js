/**
 * Service to handle image optimization and responsive image loading
 */
class ImageOptimizer {
  constructor() {
    this.supportedFormats = {
      webp: this._checkWebPSupport(),
      avif: this._checkAVIFSupport(),
    };
    this.observedImages = new WeakSet();
    this._setupIntersectionObserver();
  }

  /**
   * Initialize image optimization service
   */
  initialize() {
    // Add MutationObserver to watch for new images
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this._processNewElement(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Process an image element for optimization
   * @param {HTMLImageElement} img - Image element to optimize
   */
  processImage(img) {
    if (this.observedImages.has(img)) return;

    // Add loading="lazy" attribute
    if (!img.hasAttribute("loading")) {
      img.loading = "lazy";
    }

    // Add decoding="async" attribute
    if (!img.hasAttribute("decoding")) {
      img.decoding = "async";
    }

    // Generate srcset if not present
    if (!img.srcset && !img.sizes) {
      this._generateSrcSet(img);
    }

    // Add to intersection observer
    this._intersectionObserver.observe(img);
    this.observedImages.add(img);
  }

  /**
   * Generate optimized image URL
   * @param {string} url - Original image URL
   * @param {Object} options - Optimization options
   * @returns {string} Optimized image URL
   */
  getOptimizedUrl(url, options = {}) {
    const {
      width,
      height,
      format = this._getBestFormat(),
      quality = 80,
    } = options;

    // Construct URL for image optimization service
    const baseUrl = "/api/images/optimize";
    const params = new URLSearchParams({
      url: encodeURIComponent(url),
      format,
      quality,
      ...(width && { width }),
      ...(height && { height }),
    });

    return `${baseUrl}?${params}`;
  }

  /**
   * Check WebP support
   * @returns {Promise<boolean>}
   */
  async _checkWebPSupport() {
    if (!this._webpPromise) {
      this._webpPromise = new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img.width === 2);
        img.onerror = () => resolve(false);
        img.src =
          "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA";
      });
    }
    return this._webpPromise;
  }

  /**
   * Check AVIF support
   * @returns {Promise<boolean>}
   */
  async _checkAVIFSupport() {
    if (!this._avifPromise) {
      this._avifPromise = new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img.width === 2);
        img.onerror = () => resolve(false);
        img.src =
          "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=";
      });
    }
    return this._avifPromise;
  }

  /**
   * Get best supported image format
   * @returns {string}
   */
  _getBestFormat() {
    if (this.supportedFormats.avif) return "avif";
    if (this.supportedFormats.webp) return "webp";
    return "jpeg";
  }

  /**
   * Generate srcset for responsive images
   * @param {HTMLImageElement} img - Image element
   */
  _generateSrcSet(img) {
    const originalSrc = img.src;
    const widths = [320, 640, 960, 1280, 1920];
    const srcset = widths
      .map((width) => {
        const url = this.getOptimizedUrl(originalSrc, { width });
        return `${url} ${width}w`;
      })
      .join(", ");

    img.srcset = srcset;
    img.sizes =
      "(max-width: 320px) 320px, (max-width: 640px) 640px, (max-width: 960px) 960px, (max-width: 1280px) 1280px, 1920px";
  }

  /**
   * Set up intersection observer for lazy loading
   */
  _setupIntersectionObserver() {
    this._intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            // Load high-quality image
            if (img.dataset.src) {
              img.src = img.dataset.src;
              delete img.dataset.src;
            }
            // Stop observing once loaded
            this._intersectionObserver.unobserve(img);
          }
        });
      },
      {
        rootMargin: "50px 0px",
        threshold: 0.01,
      }
    );
  }

  /**
   * Process new element for images
   * @param {Element} element - DOM element to process
   */
  _processNewElement(element) {
    // Process element if it's an image
    if (element instanceof HTMLImageElement) {
      this.processImage(element);
    }
    // Process child images
    element.querySelectorAll("img").forEach((img) => {
      this.processImage(img);
    });
  }
}

// Export singleton instance
export const imageOptimizer = new ImageOptimizer();
