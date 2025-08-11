/**
 * Smart Search System for Playground
 * 
 * Provides lightning-fast search with:
 * - Fuzzy matching for typo tolerance
 * - Category and property-based search
 * - Search suggestions and autocomplete
 * - Recent components history
 * - Performance-optimized filtering
 */

export class SmartSearch {
  constructor(playgroundApp) {
    this.app = playgroundApp;
    this.searchIndex = new Map();
    this.suggestions = [];
    this.recentSearches = [];
    this.searchHistory = [];
    this.debounceTimeout = null;
    
    this.initializeSearch();
  }

  /**
   * Initialize search system
   */
  initializeSearch() {
    this.buildSearchIndex();
    this.setupSearchInput();
    this.loadSearchHistory();
  }

  /**
   * Build comprehensive search index
   */
  buildSearchIndex() {
    const componentButtons = document.querySelectorAll('.component-item');
    
    componentButtons.forEach((item, index) => {
      const category = item.dataset.category;
      const componentName = item.dataset.component;
      const displayName = this.formatComponentName(componentName);
      
      // Create search entry
      const searchEntry = {
        category,
        componentName,
        displayName,
        element: item,
        keywords: this.generateKeywords(category, componentName, displayName),
        index,
        priority: this.calculatePriority(category, componentName)
      };
      
      this.searchIndex.set(`${category}-${componentName}`, searchEntry);
    });

    // Build suggestions list
    this.suggestions = Array.from(this.searchIndex.values())
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10)
      .map(entry => ({
        text: entry.displayName,
        category: entry.category,
        component: entry.componentName
      }));
  }

  /**
   * Generate searchable keywords
   */
  generateKeywords(category, componentName, displayName) {
    const keywords = new Set();
    
    // Add component name variations
    keywords.add(componentName.toLowerCase());
    keywords.add(displayName.toLowerCase());
    
    // Add category
    keywords.add(category.toLowerCase());
    
    // Add hyphen-separated parts
    componentName.split('-').forEach(part => keywords.add(part.toLowerCase()));
    
    // Add space-separated parts
    displayName.split(' ').forEach(part => keywords.add(part.toLowerCase()));
    
    // Add purpose-based keywords
    const purposeKeywords = this.getPurposeKeywords(componentName);
    purposeKeywords.forEach(keyword => keywords.add(keyword));
    
    return Array.from(keywords);
  }

  /**
   * Get purpose-based keywords for components
   */
  getPurposeKeywords(componentName) {
    const keywordMap = {
      'button': ['click', 'action', 'submit', 'primary', 'secondary'],
      'input': ['form', 'text', 'field', 'typing', 'data'],
      'modal': ['popup', 'dialog', 'overlay', 'lightbox'],
      'card': ['container', 'content', 'display', 'layout'],
      'table': ['data', 'grid', 'rows', 'columns', 'list'],
      'form': ['input', 'validation', 'submit', 'fields'],
      'navigation': ['menu', 'nav', 'sidebar', 'links'],
      'icon': ['graphics', 'symbol', 'image', 'visual'],
      'badge': ['status', 'label', 'notification', 'indicator'],
      'alert': ['notification', 'warning', 'message', 'toast'],
      'spinner': ['loading', 'wait', 'progress', 'busy'],
      'tooltip': ['hint', 'help', 'info', 'popup'],
      'dropdown': ['select', 'menu', 'options', 'choose'],
      'checkbox': ['selection', 'boolean', 'toggle', 'option'],
      'radio': ['choice', 'selection', 'option', 'pick'],
      'tabs': ['navigation', 'sections', 'pages', 'content'],
      'breadcrumbs': ['navigation', 'path', 'hierarchy', 'location'],
      'pagination': ['pages', 'navigation', 'next', 'previous'],
      'progress': ['loading', 'completion', 'status', 'bar'],
      'accordion': ['collapse', 'expand', 'sections', 'faq'],
      'carousel': ['slider', 'images', 'slideshow', 'gallery']
    };

    const keywords = [];
    Object.entries(keywordMap).forEach(([key, values]) => {
      if (componentName.includes(key)) {
        keywords.push(...values);
      }
    });

    return keywords;
  }

  /**
   * Calculate search priority
   */
  calculatePriority(category, componentName) {
    let priority = 0;
    
    // Atomic components have higher priority
    if (category === 'atoms') priority += 10;
    else if (category === 'molecules') priority += 7;
    else if (category === 'organisms') priority += 5;
    
    // Common components get boost
    const commonComponents = ['button', 'input', 'card', 'modal', 'form'];
    if (commonComponents.some(common => componentName.includes(common))) {
      priority += 5;
    }
    
    return priority;
  }

  /**
   * Setup search input with enhanced functionality
   */
  setupSearchInput() {
    const searchInput = document.getElementById('component-search');
    if (!searchInput) return;

    // Create search suggestions container
    this.createSuggestionsContainer(searchInput);
    
    // Enhanced search with debouncing
    searchInput.addEventListener('input', (e) => {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(() => {
        this.performSearch(e.target.value.trim());
      }, 150); // 150ms debounce for optimal performance
    });

    // Handle keyboard navigation in search
    searchInput.addEventListener('keydown', (e) => {
      this.handleSearchKeyboard(e);
    });

    // Show suggestions on focus
    searchInput.addEventListener('focus', () => {
      this.showSuggestions();
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !this.suggestionsContainer.contains(e.target)) {
        this.hideSuggestions();
      }
    });
  }

  /**
   * Create suggestions dropdown container
   */
  createSuggestionsContainer(searchInput) {
    this.suggestionsContainer = document.createElement('div');
    this.suggestionsContainer.className = 'search-suggestions';
    
    // Style the suggestions container
    Object.assign(this.suggestionsContainer.style, {
      position: 'absolute',
      top: '100%',
      left: '0',
      right: '0',
      background: 'white',
      border: '1px solid #e9ecef',
      borderTop: 'none',
      borderRadius: '0 0 4px 4px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      maxHeight: '200px',
      overflowY: 'auto',
      zIndex: '1000',
      display: 'none'
    });
    
    // Make search container relative
    const searchContainer = searchInput.parentElement;
    if (searchContainer.style.position !== 'relative') {
      searchContainer.style.position = 'relative';
    }
    
    searchContainer.appendChild(this.suggestionsContainer);
  }

  /**
   * Perform fuzzy search with performance optimization
   */
  performSearch(query) {
    const startTime = performance.now();
    
    if (!query) {
      this.showAllComponents();
      this.showSuggestions();
      return;
    }

    // Add to search history
    this.addToSearchHistory(query);
    
    const results = this.fuzzySearch(query);
    this.displaySearchResults(results);
    this.updateSearchSuggestions(query, results);
    
    const endTime = performance.now();
    console.log(`Search completed in ${(endTime - startTime).toFixed(2)}ms`);
  }

  /**
   * Fuzzy search implementation with scoring
   */
  fuzzySearch(query) {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(' ').filter(word => word.length > 0);
    const results = [];

    this.searchIndex.forEach((entry, key) => {
      let score = 0;
      let matches = 0;

      // Check each keyword for matches
      entry.keywords.forEach(keyword => {
        queryWords.forEach(queryWord => {
          const matchScore = this.calculateMatchScore(keyword, queryWord);
          if (matchScore > 0) {
            score += matchScore;
            matches++;
          }
        });
      });

      // Boost exact matches
      if (entry.keywords.includes(queryLower)) {
        score += 100;
      }

      // Boost prefix matches
      if (entry.keywords.some(keyword => keyword.startsWith(queryLower))) {
        score += 50;
      }

      // Add result if it matches
      if (score > 0) {
        results.push({
          ...entry,
          score: score + entry.priority,
          matches
        });
      }
    });

    // Sort by score (descending)
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate match score for fuzzy matching
   */
  calculateMatchScore(keyword, queryWord) {
    // Exact match
    if (keyword === queryWord) return 100;
    
    // Prefix match
    if (keyword.startsWith(queryWord)) return 80;
    
    // Contains match
    if (keyword.includes(queryWord)) return 60;
    
    // Fuzzy match (Levenshtein distance)
    const distance = this.levenshteinDistance(keyword, queryWord);
    const maxLength = Math.max(keyword.length, queryWord.length);
    const similarity = 1 - (distance / maxLength);
    
    // Only return score if similarity is high enough
    return similarity > 0.6 ? Math.floor(similarity * 40) : 0;
  }

  /**
   * Calculate Levenshtein distance for fuzzy matching
   */
  levenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill().map(() => Array(str1.length + 1).fill(0));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i] + 1,     // deletion
          matrix[j - 1][i - 1] + cost // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Display search results
   */
  displaySearchResults(results) {
    const componentItems = document.querySelectorAll('.component-item');
    const categories = document.querySelectorAll('.component-category');
    
    // Hide all items first
    componentItems.forEach(item => {
      item.style.display = 'none';
    });
    
    // Show matching items
    results.forEach(result => {
      result.element.style.display = 'block';
    });
    
    // Show/hide categories based on visible items
    categories.forEach(category => {
      const visibleItems = category.querySelectorAll('.component-item[style*="block"], .component-item:not([style*="none"])');
      category.style.display = visibleItems.length > 0 ? 'block' : 'none';
    });

    // Show "no results" message if needed
    this.showNoResultsMessage(results.length === 0);
  }

  /**
   * Show all components (clear search)
   */
  showAllComponents() {
    const componentItems = document.querySelectorAll('.component-item');
    const categories = document.querySelectorAll('.component-category');
    
    componentItems.forEach(item => {
      item.style.display = 'block';
    });
    
    categories.forEach(category => {
      category.style.display = 'block';
    });
    
    this.hideNoResultsMessage();
  }

  /**
   * Show/hide no results message
   */
  showNoResultsMessage(show) {
    let noResultsDiv = document.getElementById('no-search-results');
    
    if (show && !noResultsDiv) {
      noResultsDiv = document.createElement('div');
      noResultsDiv.id = 'no-search-results';
      noResultsDiv.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #6c757d;">
          <p>🔍 No components found</p>
          <p style="font-size: 0.9em;">Try a different search term or browse categories</p>
        </div>
      `;
      
      const treeContainer = document.getElementById('component-tree');
      if (treeContainer) {
        treeContainer.appendChild(noResultsDiv);
      }
    } else if (!show && noResultsDiv) {
      noResultsDiv.remove();
    }
  }

  /**
   * Hide no results message
   */
  hideNoResultsMessage() {
    const noResultsDiv = document.getElementById('no-search-results');
    if (noResultsDiv) {
      noResultsDiv.remove();
    }
  }

  /**
   * Update search suggestions
   */
  updateSearchSuggestions(query, results) {
    if (!query) {
      this.showSuggestions();
      return;
    }

    const suggestions = results.slice(0, 5).map(result => ({
      text: result.displayName,
      category: result.category,
      component: result.componentName,
      score: result.score
    }));
    
    this.renderSuggestions(suggestions, query);
  }

  /**
   * Show default suggestions
   */
  showSuggestions() {
    if (this.suggestions.length > 0) {
      this.renderSuggestions([
        ...this.getRecentComponents(),
        ...this.suggestions.slice(0, 6)
      ]);
    }
  }

  /**
   * Get recent components for suggestions
   */
  getRecentComponents() {
    return this.searchHistory.slice(0, 3).map(search => ({
      text: search.query,
      category: 'recent',
      isRecent: true
    }));
  }

  /**
   * Render suggestions dropdown
   */
  renderSuggestions(suggestions, query = '') {
    if (suggestions.length === 0) {
      this.hideSuggestions();
      return;
    }

    this.suggestionsContainer.innerHTML = suggestions.map((suggestion, index) => {
      const highlightedText = query ? 
        this.highlightText(suggestion.text, query) : 
        suggestion.text;
      
      return `
        <div class="suggestion-item" data-index="${index}" data-category="${suggestion.category}" data-component="${suggestion.component}">
          <span class="suggestion-icon">${suggestion.isRecent ? '🕐' : '🧩'}</span>
          <span class="suggestion-text">${highlightedText}</span>
          <span class="suggestion-category">${suggestion.category}</span>
        </div>
      `;
    }).join('');

    // Add click handlers
    this.suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const category = item.dataset.category;
        const component = item.dataset.component;
        
        if (category !== 'recent' && component) {
          this.selectSuggestion(category, component);
        }
      });
    });

    this.suggestionsContainer.style.display = 'block';
    
    // Style suggestion items
    this.styleSuggestionItems();
  }

  /**
   * Style suggestion items
   */
  styleSuggestionItems() {
    const style = document.createElement('style');
    if (!document.head.querySelector('#search-suggestions-style')) {
      style.id = 'search-suggestions-style';
      style.textContent = `
        .suggestion-item {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          cursor: pointer;
          border-bottom: 1px solid #f1f3f4;
          transition: background-color 0.1s ease;
        }
        .suggestion-item:hover {
          background-color: #f8f9fa;
        }
        .suggestion-item:last-child {
          border-bottom: none;
        }
        .suggestion-icon {
          margin-right: 8px;
          font-size: 14px;
        }
        .suggestion-text {
          flex: 1;
          font-size: 14px;
        }
        .suggestion-category {
          font-size: 12px;
          color: #6c757d;
          text-transform: uppercase;
        }
        .suggestion-text mark {
          background-color: #fff3cd;
          padding: 1px 2px;
          border-radius: 2px;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Highlight matching text
   */
  highlightText(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${query.split(' ').join('|')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Hide suggestions
   */
  hideSuggestions() {
    this.suggestionsContainer.style.display = 'none';
  }

  /**
   * Select a suggestion
   */
  selectSuggestion(category, component) {
    this.hideSuggestions();
    
    // Update search input
    const searchInput = document.getElementById('component-search');
    if (searchInput) {
      searchInput.value = this.formatComponentName(component);
    }
    
    // Load component
    if (this.app.loadComponent) {
      this.app.loadComponent(category, component);
    }
  }

  /**
   * Handle keyboard navigation in search
   */
  handleSearchKeyboard(e) {
    const suggestions = this.suggestionsContainer.querySelectorAll('.suggestion-item');
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      // Focus first suggestion
      if (suggestions.length > 0) {
        suggestions[0].focus();
      }
    } else if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault();
      // Select first suggestion
      suggestions[0].click();
    }
  }

  /**
   * Add to search history
   */
  addToSearchHistory(query) {
    if (!query || query.length < 2) return;
    
    // Remove if already exists
    this.searchHistory = this.searchHistory.filter(item => item.query !== query);
    
    // Add to front
    this.searchHistory.unshift({
      query,
      timestamp: Date.now()
    });
    
    // Keep only last 10
    if (this.searchHistory.length > 10) {
      this.searchHistory.pop();
    }
    
    // Save to localStorage
    this.saveSearchHistory();
  }

  /**
   * Save search history to localStorage
   */
  saveSearchHistory() {
    try {
      localStorage.setItem('playground-search-history', JSON.stringify(this.searchHistory));
    } catch (e) {
      console.warn('Failed to save search history:', e);
    }
  }

  /**
   * Load search history from localStorage
   */
  loadSearchHistory() {
    try {
      const stored = localStorage.getItem('playground-search-history');
      if (stored) {
        this.searchHistory = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load search history:', e);
    }
  }

  /**
   * Format component name for display
   */
  formatComponentName(name) {
    return name.split('-').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
  }

  /**
   * Get search performance metrics
   */
  getSearchMetrics() {
    return {
      indexSize: this.searchIndex.size,
      suggestionsCount: this.suggestions.length,
      historyCount: this.searchHistory.length
    };
  }
}