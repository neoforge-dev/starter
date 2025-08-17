export default {
  title: 'Molecules/SearchBar',
  component: 'neo-search-bar',
  parameters: {
    docs: {
      description: {
        component: 'Enhanced search input with icon, clear button, keyboard shortcuts, and suggestion dropdown functionality.'
      }
    }
  },
  argTypes: {
    value: { control: 'text' },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    debounce: { control: 'number' },
    shortcuts: { control: 'text' },
    showSuggestions: { control: 'boolean' },
    loading: { control: 'boolean' },
    autofocus: { control: 'boolean' },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg']
    }
  }
};

const Template = (args) => {
  const searchBar = document.createElement('neo-search-bar');
  Object.keys(args).forEach(key => {
    if (args[key] !== undefined) {
      if (typeof args[key] === 'boolean') {
        if (args[key]) {
          searchBar.setAttribute(key.replace(/([A-Z])/g, '-$1').toLowerCase(), '');
        }
      } else {
        searchBar.setAttribute(key.replace(/([A-Z])/g, '-$1').toLowerCase(), args[key]);
      }
      searchBar[key] = args[key];
    }
  });
  
  // Add event listeners for demonstration
  searchBar.addEventListener('neo-search', (e) => {
    console.log('Search:', e.detail);
  });
  
  searchBar.addEventListener('neo-clear', () => {
    console.log('Search cleared');
  });
  
  return searchBar;
};

export const Default = Template.bind({});
Default.args = {
  placeholder: 'Search documentation...',
  shortcuts: '⌘K'
};

export const WithSuggestions = Template.bind({});
WithSuggestions.args = {
  placeholder: 'Search products...',
  showSuggestions: true,
  suggestions: [
    'iPhone 15 Pro',
    'MacBook Air',
    'iPad Pro',
    'Apple Watch',
    'AirPods Pro',
    'Mac Studio',
    'Studio Display'
  ]
};

export const Loading = Template.bind({});
Loading.args = {
  placeholder: 'Searching...',
  value: 'search query',
  loading: true
};

export const Disabled = Template.bind({});
Disabled.args = {
  placeholder: 'Search is disabled',
  disabled: true,
  value: 'disabled state'
};

export const Sizes = () => {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; flex-direction: column; gap: 1rem; max-width: 400px;';
  
  const sizes = ['sm', 'md', 'lg'];
  sizes.forEach(size => {
    const searchBar = document.createElement('neo-search-bar');
    searchBar.placeholder = `${size.toUpperCase()} search bar`;
    searchBar.size = size;
    searchBar.shortcuts = '⌘K';
    container.appendChild(searchBar);
  });
  
  return container;
};

export const InteractiveDemo = () => {
  const container = document.createElement('div');
  container.style.cssText = 'max-width: 500px; padding: 1rem;';
  
  const searchBar = document.createElement('neo-search-bar');
  searchBar.placeholder = 'Search with live suggestions...';
  searchBar.showSuggestions = true;
  searchBar.shortcuts = '⌘K';
  searchBar.debounce = 150;
  
  // Mock data
  const allSuggestions = [
    'JavaScript fundamentals',
    'React components',
    'Vue.js basics',
    'Angular routing',
    'TypeScript types',
    'CSS Grid layout',
    'Flexbox properties',
    'HTML semantics',
    'Web accessibility',
    'Performance optimization'
  ];
  
  searchBar.suggestions = allSuggestions;
  
  container.appendChild(searchBar);
  
  // Status display
  const status = document.createElement('div');
  status.style.cssText = 'margin-top: 1rem; padding: 0.5rem; background: #f3f4f6; border-radius: 4px; font-size: 0.875rem;';
  status.textContent = 'Status: Ready for search (try ⌘K)';
  
  // Event listeners
  searchBar.addEventListener('neo-search', (e) => {
    status.style.background = '#d1fae5';
    status.textContent = `Status: Searched for "${e.detail.query}"`;
  });
  
  searchBar.addEventListener('neo-search-immediate', (e) => {
    if (e.detail.query) {
      status.style.background = '#fef3c7';
      status.textContent = `Status: Typing "${e.detail.query}"...`;
    } else {
      status.style.background = '#f3f4f6';
      status.textContent = 'Status: Ready for search';
    }
  });
  
  searchBar.addEventListener('neo-suggestion-select', (e) => {
    status.style.background = '#dbeafe';
    status.textContent = `Status: Selected "${e.detail.suggestion}"`;
  });
  
  searchBar.addEventListener('neo-clear', () => {
    status.style.background = '#f3f4f6';
    status.textContent = 'Status: Search cleared';
  });
  
  container.appendChild(status);
  
  return container;
};

export const CustomStyling = () => {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; flex-direction: column; gap: 1rem; max-width: 400px;';
  
  // Dark theme search
  const darkSearch = document.createElement('neo-search-bar');
  darkSearch.placeholder = 'Dark theme search...';
  darkSearch.style.cssText = `
    --color-surface: #1f2937;
    --color-border: #374151;
    --color-text: #f9fafb;
    --color-text-light: #9ca3af;
    --color-primary: #60a5fa;
  `;
  
  // Colored search
  const coloredSearch = document.createElement('neo-search-bar');
  coloredSearch.placeholder = 'Colored search...';
  coloredSearch.style.cssText = `
    --color-primary: #10b981;
    --color-primary-light: #6ee7b7;
    --input-border-color: #10b981;
  `;
  
  container.appendChild(darkSearch);
  container.appendChild(coloredSearch);
  
  return container;
};

export const KeyboardShortcuts = () => {
  const container = document.createElement('div');
  container.style.cssText = 'max-width: 500px; padding: 1rem;';
  
  const info = document.createElement('div');
  info.style.cssText = 'margin-bottom: 1rem; padding: 1rem; background: #f0f9ff; border-radius: 8px; font-size: 0.875rem;';
  info.innerHTML = `
    <strong>Keyboard Shortcuts:</strong><br>
    • <kbd>⌘K</kbd> or <kbd>Ctrl+K</kbd> - Focus search<br>
    • <kbd>↑</kbd>/<kbd>↓</kbd> - Navigate suggestions<br>
    • <kbd>Enter</kbd> - Select suggestion<br>
    • <kbd>Escape</kbd> - Close suggestions
  `;
  
  const searchBar = document.createElement('neo-search-bar');
  searchBar.placeholder = 'Try the keyboard shortcuts...';
  searchBar.shortcuts = '⌘K';
  searchBar.showSuggestions = true;
  searchBar.suggestions = [
    'First suggestion',
    'Second suggestion',
    'Third suggestion',
    'Fourth suggestion'
  ];
  
  container.appendChild(info);
  container.appendChild(searchBar);
  
  return container;
};