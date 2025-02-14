/**
 * Utility to analyze and extract critical CSS for above-the-fold content
 */
class CriticalCSSExtractor {
  constructor() {
    this.styleCache = new Map();
    this.criticalSelectors = new Set();
    this.aboveFoldElements = new Set();
    this.viewportHeight = window.innerHeight;
  }

  /**
   * Initialize critical CSS extraction
   */
  initialize() {
    // Observe DOM changes to detect new above-the-fold elements
    this._setupMutationObserver();
    // Analyze initial state
    this.analyzeAboveFoldContent();
  }

  /**
   * Analyze above-the-fold content and extract critical CSS
   */
  analyzeAboveFoldContent() {
    // Clear previous analysis
    this.aboveFoldElements.clear();
    this.criticalSelectors.clear();

    // Find all elements above the fold
    this._findAboveFoldElements(document.body);

    // Extract critical selectors
    this._extractCriticalSelectors();

    // Generate critical CSS
    return this._generateCriticalCSS();
  }

  /**
   * Extract critical CSS for a specific route
   * @param {string} route - Route path
   * @returns {Promise<string>} Critical CSS
   */
  async extractForRoute(route) {
    if (this.styleCache.has(route)) {
      return this.styleCache.get(route);
    }

    const criticalCSS = this.analyzeAboveFoldContent();
    this.styleCache.set(route, criticalCSS);
    return criticalCSS;
  }

  /**
   * Find all elements that are above the fold
   * @param {Element} element - Root element to analyze
   */
  _findAboveFoldElements(element) {
    const rect = element.getBoundingClientRect();

    // Check if element is above the fold
    if (rect.bottom >= 0 && rect.top <= this.viewportHeight) {
      this.aboveFoldElements.add(element);
    }

    // Recursively check children
    Array.from(element.children).forEach((child) => {
      this._findAboveFoldElements(child);
    });
  }

  /**
   * Extract critical selectors from above-the-fold elements
   */
  _extractCriticalSelectors() {
    // Get all stylesheets
    const sheets = Array.from(document.styleSheets);

    sheets.forEach((sheet) => {
      try {
        const rules = Array.from(sheet.cssRules || sheet.rules || []);
        rules.forEach((rule) => {
          if (rule instanceof CSSStyleRule) {
            // Check if selector matches any above-fold element
            if (this._isSelectorCritical(rule.selectorText)) {
              this.criticalSelectors.add(rule);
            }
          } else if (rule instanceof CSSMediaRule) {
            // Handle media queries
            if (this._isMediaQueryCritical(rule)) {
              this.criticalSelectors.add(rule);
            }
          } else if (rule instanceof CSSKeyframesRule) {
            // Include all keyframe animations used by critical selectors
            if (this._isKeyframeCritical(rule)) {
              this.criticalSelectors.add(rule);
            }
          }
        });
      } catch (error) {
        console.warn("Error accessing stylesheet:", error);
      }
    });
  }

  /**
   * Check if a selector is used by above-the-fold elements
   * @param {string} selector - CSS selector
   * @returns {boolean}
   */
  _isSelectorCritical(selector) {
    try {
      const elements = document.querySelectorAll(selector);
      return Array.from(elements).some((element) =>
        this.aboveFoldElements.has(element)
      );
    } catch (error) {
      console.warn("Invalid selector:", selector);
      return false;
    }
  }

  /**
   * Check if a media query rule contains critical selectors
   * @param {CSSMediaRule} mediaRule - Media query rule
   * @returns {boolean}
   */
  _isMediaQueryCritical(mediaRule) {
    const rules = Array.from(mediaRule.cssRules);
    return rules.some(
      (rule) =>
        rule instanceof CSSStyleRule &&
        this._isSelectorCritical(rule.selectorText)
    );
  }

  /**
   * Check if a keyframe animation is used by critical selectors
   * @param {CSSKeyframesRule} keyframesRule - Keyframes rule
   * @returns {boolean}
   */
  _isKeyframeCritical(keyframesRule) {
    const animationName = keyframesRule.name;
    const criticalRules = Array.from(this.criticalSelectors).filter(
      (rule) => rule instanceof CSSStyleRule
    );

    return criticalRules.some((rule) => {
      const style = rule.style;
      return (
        style.animation?.includes(animationName) ||
        style.animationName?.includes(animationName)
      );
    });
  }

  /**
   * Generate critical CSS from collected selectors
   * @returns {string}
   */
  _generateCriticalCSS() {
    let criticalCSS = "";

    this.criticalSelectors.forEach((rule) => {
      if (rule instanceof CSSStyleRule) {
        criticalCSS += `${rule.cssText}\n`;
      } else if (rule instanceof CSSMediaRule) {
        criticalCSS += `${rule.conditionText} {\n`;
        Array.from(rule.cssRules).forEach((innerRule) => {
          criticalCSS += `  ${innerRule.cssText}\n`;
        });
        criticalCSS += "}\n";
      } else if (rule instanceof CSSKeyframesRule) {
        criticalCSS += `@keyframes ${rule.name} {\n`;
        Array.from(rule.cssRules).forEach((keyframe) => {
          criticalCSS += `  ${keyframe.cssText}\n`;
        });
        criticalCSS += "}\n";
      }
    });

    return this._minifyCss(criticalCSS);
  }

  /**
   * Basic CSS minification
   * @param {string} css - CSS to minify
   * @returns {string}
   */
  _minifyCss(css) {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove comments
      .replace(/\s+/g, " ") // Collapse whitespace
      .replace(/\s*([{}:;,])\s*/g, "$1") // Remove spaces around symbols
      .replace(/;\}/g, "}") // Remove last semicolon
      .trim();
  }

  /**
   * Set up mutation observer to detect new above-the-fold content
   */
  _setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      let needsUpdate = false;

      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const rect = node.getBoundingClientRect();
              if (rect.bottom >= 0 && rect.top <= this.viewportHeight) {
                needsUpdate = true;
              }
            }
          });
        }
      });

      if (needsUpdate) {
        this.analyzeAboveFoldContent();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

// Export singleton instance
export const criticalCSSExtractor = new CriticalCSSExtractor();
