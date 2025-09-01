/**
 * Performance Optimizer for Playground
 *
 * Provides lightning-fast performance through:
 * - Lazy loading of component definitions
 * - Component caching and preloading
 * - Optimized DOM updates and rendering
 * - Background preloading of adjacent components
 * - Memory-efficient component management
 */

export class PerformanceOptimizer {
  constructor(playgroundApp) {
    this.app = playgroundApp;
    this.componentCache = new Map();
    this.loadedComponents = new Set();
    this.preloadQueue = [];
    this.renderQueue = [];
    this.isRendering = false;
    this.metrics = {
      componentSwitchTimes: [],
      searchTimes: [],
      renderTimes: [],
      cacheHits: 0,
      cacheMisses: 0
    };

    this.initializeOptimizer();
  }

  /**
   * Initialize performance optimizer
   */
  initializeOptimizer() {
    this.setupComponentCaching();
    this.setupLazyLoading();
    this.setupPreloading();
    this.setupRenderOptimization();
    this.setupPerformanceMonitoring();
  }

  /**
   * Setup component caching system
   */
  setupComponentCaching() {
    // Cache component definitions and configurations
    this.componentDefinitions = new Map();
    this.componentConfigs = new Map();
    this.renderedComponents = new Map();

    // Set cache limits to prevent memory issues
    this.maxCacheSize = 50; // Maximum cached components
    this.maxRenderCache = 20; // Maximum rendered component instances
  }

  /**
   * Setup lazy loading for components
   */
  setupLazyLoading() {
    // Use Intersection Observer for lazy loading component previews
    this.previewObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const componentData = entry.target.dataset;
          if (componentData.category && componentData.component) {
            this.lazyLoadComponent(componentData.category, componentData.component);
          }
        }
      });
    }, {
      rootMargin: '100px' // Load components 100px before they come into view
    });

    // Observe component list items
    this.observeComponentItems();
  }

  /**
   * Observe component items for lazy loading
   */
  observeComponentItems() {
    const componentItems = document.querySelectorAll('.component-item');
    componentItems.forEach(item => {
      this.previewObserver.observe(item);
    });
  }

  /**
   * Setup intelligent preloading
   */
  setupPreloading() {
    // Preload adjacent components when user hovers or focuses
    document.addEventListener('mouseover', (e) => {
      const componentItem = e.target.closest('.component-item');
      if (componentItem) {
        this.scheduleAdjacentPreload(componentItem);
      }
    });

    // Preload components during idle time
    this.setupIdlePreloading();
  }

  /**
   * Setup idle time preloading
   */
  setupIdlePreloading() {
    if ('requestIdleCallback' in window) {
      const preloadDuringIdle = (deadline) => {
        while (deadline.timeRemaining() > 0 && this.preloadQueue.length > 0) {
          const componentData = this.preloadQueue.shift();
          this.preloadComponent(componentData.category, componentData.name);
        }

        // Schedule next idle callback
        requestIdleCallback(preloadDuringIdle);
      };

      requestIdleCallback(preloadDuringIdle);
    }
  }

  /**
   * Setup render optimization
   */
  setupRenderOptimization() {
    // Use requestAnimationFrame for smooth rendering
    this.frameScheduled = false;

    // Batch DOM updates
    this.pendingUpdates = [];
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    // Monitor component switching performance
    this.originalLoadComponent = this.app.loadComponent;
    this.app.loadComponent = this.optimizedLoadComponent.bind(this);

    // Monitor search performance
    if (this.app.filterComponents) {
      this.originalFilterComponents = this.app.filterComponents;
      this.app.filterComponents = this.optimizedFilterComponents.bind(this);
    }
  }

  /**
   * Optimized component loading with caching
   */
  async optimizedLoadComponent(category, name) {
    const startTime = performance.now();
    const cacheKey = `${category}-${name}`;

    try {
      // Check cache first
      let componentConfig = this.componentCache.get(cacheKey);

      if (componentConfig) {
        this.metrics.cacheHits++;
        console.log(`Cache hit for ${name} (${(performance.now() - startTime).toFixed(2)}ms)`);
      } else {
        this.metrics.cacheMisses++;

        // Load component and cache result
        componentConfig = await this.loadAndCacheComponent(category, name);
        console.log(`Cache miss for ${name} - loaded and cached (${(performance.now() - startTime).toFixed(2)}ms)`);
      }

      // Optimized rendering
      await this.optimizedRenderComponent(componentConfig);

      // Schedule preloading of adjacent components
      this.scheduleAdjacentPreload(category, name);

      const endTime = performance.now();
      const switchTime = endTime - startTime;
      this.metrics.componentSwitchTimes.push(switchTime);

      // Ensure we meet the <100ms target
      if (switchTime > 100) {
        console.warn(`Component switch took ${switchTime.toFixed(2)}ms (target: <100ms)`);
      }

      return componentConfig;

    } catch (error) {
      console.error('Optimized component loading failed:', error);
      // Fallback to original method
      return this.originalLoadComponent.call(this.app, category, name);
    }
  }

  /**
   * Load and cache component configuration
   */
  async loadAndCacheComponent(category, name) {
    const cacheKey = `${category}-${name}`;

    // Load component configuration
    const componentConfig = await this.app.componentLoader.loadPlayground(category, name);

    // Cache the configuration
    this.componentCache.set(cacheKey, componentConfig);

    // Manage cache size
    if (this.componentCache.size > this.maxCacheSize) {
      const firstKey = this.componentCache.keys().next().value;
      this.componentCache.delete(firstKey);
    }

    return componentConfig;
  }

  /**
   * Optimized component rendering
   */
  async optimizedRenderComponent(componentConfig) {
    const renderStartTime = performance.now();

    // Use virtual rendering for better performance
    const renderData = this.prepareRenderData(componentConfig);

    // Batch DOM updates
    this.batchDOMUpdate(() => {
      // Update title and description
      this.updateComponentInfo(renderData.title, renderData.description);

      // Render examples efficiently
      this.renderComponentExamples(renderData);

      // Setup property editor
      this.setupOptimizedPropertyEditor(renderData);
    });

    const renderTime = performance.now() - renderStartTime;
    this.metrics.renderTimes.push(renderTime);

    console.log(`Component rendered in ${renderTime.toFixed(2)}ms`);
  }

  /**
   * Batch DOM updates for better performance
   */
  batchDOMUpdate(updateFunction) {
    if (!this.frameScheduled) {
      this.frameScheduled = true;
      requestAnimationFrame(() => {
        updateFunction();
        this.frameScheduled = false;
      });
    }
  }

  /**
   * Prepare render data efficiently
   */
  prepareRenderData(componentConfig) {
    return {
      title: componentConfig.title,
      description: componentConfig.description,
      component: componentConfig.component,
      examples: componentConfig.examples || [],
      argTypes: componentConfig.argTypes || {}
    };
  }

  /**
   * Update component info efficiently
   */
  updateComponentInfo(title, description) {
    const titleElement = document.getElementById('current-component-title');
    const descElement = document.getElementById('current-component-description');

    if (titleElement && titleElement.textContent !== title) {
      titleElement.textContent = title;
    }
    if (descElement && descElement.textContent !== description) {
      descElement.textContent = description;
    }
  }

  /**
   * Render component examples efficiently
   */
  renderComponentExamples(renderData) {
    const showcaseContainer = document.getElementById('component-showcase');
    if (!showcaseContainer) return;

    // Use document fragment for efficient DOM manipulation
    const fragment = document.createDocumentFragment();

    // Create component header
    const headerDiv = document.createElement('div');
    headerDiv.className = 'component-header';
    headerDiv.innerHTML = `
      <h3>${renderData.title}</h3>
      <p>${renderData.description}</p>
    `;
    fragment.appendChild(headerDiv);

    // Render examples efficiently
    renderData.examples.forEach((exampleGroup, groupIndex) => {
      const groupDiv = this.createExampleGroup(exampleGroup, groupIndex);
      fragment.appendChild(groupDiv);
    });

    // Add interactive playground
    const playgroundDiv = this.createInteractivePlayground();
    fragment.appendChild(playgroundDiv);

    // Replace content in one operation
    showcaseContainer.innerHTML = '';
    showcaseContainer.appendChild(fragment);

    // Insert live components efficiently
    this.insertLiveComponentsOptimized(renderData);
  }

  /**
   * Create example group element efficiently
   */
  createExampleGroup(exampleGroup, groupIndex) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'example-group';

    const variantsHtml = (exampleGroup.variants || []).map((variant, index) => `
      <div class="example-variant">
        <div class="variant-preview" id="variant-${groupIndex}-${index}"></div>
        <div class="variant-label">${variant.label}</div>
      </div>
    `).join('');

    groupDiv.innerHTML = `
      <h4>${exampleGroup.name}</h4>
      <p class="example-description">${exampleGroup.description || ''}</p>
      <div class="example-variants">${variantsHtml}</div>
    `;

    return groupDiv;
  }

  /**
   * Create interactive playground element
   */
  createInteractivePlayground() {
    const playgroundDiv = document.createElement('div');
    playgroundDiv.className = 'interactive-playground';
    playgroundDiv.innerHTML = `
      <h4>Interactive Playground</h4>
      <p>Use the Properties panel to customize this component instance:</p>
      <div class="interactive-preview" id="interactive-preview"></div>
    `;
    return playgroundDiv;
  }

  /**
   * Insert live components with optimization
   */
  insertLiveComponentsOptimized(renderData) {
    // Use requestIdleCallback for non-critical component insertion
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.insertComponents(renderData);
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => this.insertComponents(renderData), 16);
    }
  }

  /**
   * Insert components efficiently
   */
  insertComponents(renderData) {
    // Insert example variants
    renderData.examples.forEach((exampleGroup, groupIndex) => {
      (exampleGroup.variants || []).forEach((variant, index) => {
        const containerId = `variant-${groupIndex}-${index}`;
        const container = document.getElementById(containerId);
        if (container) {
          const component = this.createOptimizedComponent(renderData.component, variant.props);
          container.appendChild(component);
        }
      });
    });

    // Insert interactive component
    const interactiveContainer = document.getElementById('interactive-preview');
    if (interactiveContainer) {
      const interactive = this.createOptimizedComponent(renderData.component, this.app.currentProps || {});
      interactive.id = 'live-interactive-component';
      interactiveContainer.appendChild(interactive);

      // Store reference for property updates
      this.app.liveInteractiveComponent = interactive;
    }
  }

  /**
   * Create optimized component instances
   */
  createOptimizedComponent(componentName, props) {
    // Check if we have a cached component
    const cacheKey = `${componentName}-${JSON.stringify(props)}`;
    const cached = this.renderedComponents.get(cacheKey);

    if (cached) {
      return cached.cloneNode(true);
    }

    // Create new component
    const element = document.createElement(componentName);

    // Set properties efficiently
    Object.entries(props || {}).forEach(([key, value]) => {
      if (key === 'label' || key === 'text') {
        element.textContent = value;
      } else {
        element[key] = value;
      }
    });

    // Cache the component if cache isn't full
    if (this.renderedComponents.size < this.maxRenderCache) {
      this.renderedComponents.set(cacheKey, element.cloneNode(true));
    }

    return element;
  }

  /**
   * Setup optimized property editor
   */
  setupOptimizedPropertyEditor(renderData) {
    // Use RAF to avoid blocking the main thread
    requestAnimationFrame(() => {
      if (this.app.setupLivePropsEditor) {
        this.app.setupLivePropsEditor(renderData.argTypes, renderData.component);
      }
    });
  }

  /**
   * Optimized search filtering
   */
  optimizedFilterComponents(searchTerm) {
    const startTime = performance.now();

    // Use original filter method but with performance tracking
    const result = this.originalFilterComponents.call(this.app, searchTerm);

    const filterTime = performance.now() - startTime;
    this.metrics.searchTimes.push(filterTime);

    // Ensure we meet the <50ms target
    if (filterTime > 50) {
      console.warn(`Search took ${filterTime.toFixed(2)}ms (target: <50ms)`);
    }

    return result;
  }

  /**
   * Lazy load component definition
   */
  async lazyLoadComponent(category, name) {
    const cacheKey = `${category}-${name}`;

    if (!this.loadedComponents.has(cacheKey)) {
      try {
        await this.loadAndCacheComponent(category, name);
        this.loadedComponents.add(cacheKey);
        console.log(`Lazy loaded: ${name}`);
      } catch (error) {
        console.warn(`Failed to lazy load ${name}:`, error);
      }
    }
  }

  /**
   * Preload component for faster access
   */
  async preloadComponent(category, name) {
    const cacheKey = `${category}-${name}`;

    if (!this.componentCache.has(cacheKey)) {
      try {
        await this.loadAndCacheComponent(category, name);
        console.log(`Preloaded: ${name}`);
      } catch (error) {
        console.warn(`Failed to preload ${name}:`, error);
      }
    }
  }

  /**
   * Schedule preloading of adjacent components
   */
  scheduleAdjacentPreload(categoryOrItem, name) {
    if (typeof categoryOrItem === 'string') {
      // Called with category and name
      this.scheduleAdjacentPreloadByName(categoryOrItem, name);
    } else {
      // Called with DOM element
      this.scheduleAdjacentPreloadByElement(categoryOrItem);
    }
  }

  /**
   * Schedule preloading by component name
   */
  scheduleAdjacentPreloadByName(category, name) {
    const componentItems = Array.from(document.querySelectorAll('.component-item'));
    const currentIndex = componentItems.findIndex(item =>
      item.dataset.category === category && item.dataset.component === name
    );

    if (currentIndex >= 0) {
      // Preload previous and next components
      [-1, 1].forEach(offset => {
        const adjacentIndex = currentIndex + offset;
        if (adjacentIndex >= 0 && adjacentIndex < componentItems.length) {
          const adjacentItem = componentItems[adjacentIndex];
          this.addToPreloadQueue(adjacentItem.dataset.category, adjacentItem.dataset.component);
        }
      });
    }
  }

  /**
   * Schedule preloading by DOM element
   */
  scheduleAdjacentPreloadByElement(item) {
    const category = item.dataset.category;
    const name = item.dataset.component;

    if (category && name) {
      this.addToPreloadQueue(category, name);
    }
  }

  /**
   * Add component to preload queue
   */
  addToPreloadQueue(category, name) {
    const cacheKey = `${category}-${name}`;

    if (!this.componentCache.has(cacheKey) &&
        !this.preloadQueue.some(item => item.category === category && item.name === name)) {
      this.preloadQueue.push({ category, name });
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const componentSwitchTimes = this.metrics.componentSwitchTimes;
    const searchTimes = this.metrics.searchTimes;
    const renderTimes = this.metrics.renderTimes;

    return {
      componentSwitching: {
        count: componentSwitchTimes.length,
        average: componentSwitchTimes.length > 0 ?
          componentSwitchTimes.reduce((sum, time) => sum + time, 0) / componentSwitchTimes.length : 0,
        fastest: componentSwitchTimes.length > 0 ? Math.min(...componentSwitchTimes) : 0,
        slowest: componentSwitchTimes.length > 0 ? Math.max(...componentSwitchTimes) : 0,
        under100ms: componentSwitchTimes.filter(time => time < 100).length,
        percentage: componentSwitchTimes.length > 0 ?
          (componentSwitchTimes.filter(time => time < 100).length / componentSwitchTimes.length) * 100 : 0
      },
      search: {
        count: searchTimes.length,
        average: searchTimes.length > 0 ?
          searchTimes.reduce((sum, time) => sum + time, 0) / searchTimes.length : 0,
        under50ms: searchTimes.filter(time => time < 50).length,
        percentage: searchTimes.length > 0 ?
          (searchTimes.filter(time => time < 50).length / searchTimes.length) * 100 : 0
      },
      rendering: {
        count: renderTimes.length,
        average: renderTimes.length > 0 ?
          renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length : 0
      },
      caching: {
        hits: this.metrics.cacheHits,
        misses: this.metrics.cacheMisses,
        hitRate: this.metrics.cacheHits + this.metrics.cacheMisses > 0 ?
          (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100 : 0,
        cacheSize: this.componentCache.size,
        preloadQueueSize: this.preloadQueue.length
      }
    };
  }

  /**
   * Clear performance metrics
   */
  clearMetrics() {
    this.metrics = {
      componentSwitchTimes: [],
      searchTimes: [],
      renderTimes: [],
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  /**
   * Optimize memory usage
   */
  optimizeMemory() {
    // Clear old cached components
    if (this.componentCache.size > this.maxCacheSize * 0.8) {
      const entries = Array.from(this.componentCache.entries());
      const toKeep = entries.slice(-Math.floor(this.maxCacheSize * 0.6));
      this.componentCache.clear();
      toKeep.forEach(([key, value]) => this.componentCache.set(key, value));
    }

    // Clear rendered component cache
    if (this.renderedComponents.size > this.maxRenderCache * 0.8) {
      const entries = Array.from(this.renderedComponents.entries());
      const toKeep = entries.slice(-Math.floor(this.maxRenderCache * 0.6));
      this.renderedComponents.clear();
      toKeep.forEach(([key, value]) => this.renderedComponents.set(key, value));
    }

    // Clear old preload queue
    this.preloadQueue = this.preloadQueue.slice(-10);

    console.log('Memory optimization completed');
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats() {
    return {
      componentCache: this.componentCache.size,
      renderedComponents: this.renderedComponents.size,
      loadedComponents: this.loadedComponents.size,
      preloadQueue: this.preloadQueue.length,
      estimatedMemoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estimate memory usage
   */
  estimateMemoryUsage() {
    // Rough estimation in KB
    const cacheSize = this.componentCache.size * 2; // ~2KB per cached component
    const renderSize = this.renderedComponents.size * 1; // ~1KB per rendered component
    const totalSize = cacheSize + renderSize;

    return {
      cache: cacheSize,
      rendered: renderSize,
      total: totalSize,
      unit: 'KB'
    };
  }
}
