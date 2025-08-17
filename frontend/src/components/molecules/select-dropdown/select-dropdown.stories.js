export default {
  title: 'Molecules/SelectDropdown',
  component: 'neo-select-dropdown',
  parameters: {
    docs: {
      description: {
        component: 'Enhanced select dropdown with search, multiple selection, custom options, and comprehensive accessibility features.'
      }
    }
  },
  argTypes: {
    options: { control: 'object' },
    value: { control: 'text' },
    placeholder: { control: 'text' },
    multiple: { control: 'boolean' },
    searchable: { control: 'boolean' },
    clearable: { control: 'boolean' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg']
    },
    variant: {
      control: 'select',
      options: ['default', 'outline', 'ghost']
    },
    label: { control: 'text' },
    error: { control: 'text' },
    help: { control: 'text' },
    loading: { control: 'boolean' },
    maxSelections: { control: 'number' },
    createOption: { control: 'boolean' },
    maxHeight: { control: 'number' }
  }
};

const basicOptions = [
  { value: 'react', label: 'React', description: 'A JavaScript library for building user interfaces' },
  { value: 'vue', label: 'Vue.js', description: 'The Progressive JavaScript Framework' },
  { value: 'angular', label: 'Angular', description: 'Platform for building mobile and desktop web applications' },
  { value: 'svelte', label: 'Svelte', description: 'Cybernetically enhanced web apps' },
  { value: 'lit', label: 'Lit', description: 'Simple. Fast. Web Components.' }
];

const categoryOptions = [
  { value: 'frontend', label: 'Frontend Development', icon: 'monitor', badge: 'Popular' },
  { value: 'backend', label: 'Backend Development', icon: 'server' },
  { value: 'mobile', label: 'Mobile Development', icon: 'smartphone' },
  { value: 'devops', label: 'DevOps & Infrastructure', icon: 'settings', badge: 'Hot' },
  { value: 'design', label: 'UI/UX Design', icon: 'palette' },
  { value: 'data', label: 'Data Science', icon: 'bar-chart', badge: 'New' }
];

const countryOptions = [
  { value: 'us', label: 'United States', icon: '🇺🇸' },
  { value: 'ca', label: 'Canada', icon: '🇨🇦' },
  { value: 'uk', label: 'United Kingdom', icon: '🇬🇧' },
  { value: 'de', label: 'Germany', icon: '🇩🇪' },
  { value: 'fr', label: 'France', icon: '🇫🇷' },
  { value: 'jp', label: 'Japan', icon: '🇯🇵' },
  { value: 'au', label: 'Australia', icon: '🇦🇺' },
  { value: 'br', label: 'Brazil', icon: '🇧🇷' },
  { value: 'in', label: 'India', icon: '🇮🇳' },
  { value: 'cn', label: 'China', icon: '🇨🇳' }
];

const statusOptions = [
  { value: 'active', label: 'Active', badge: '12', badgeVariant: 'success' },
  { value: 'pending', label: 'Pending', badge: '5', badgeVariant: 'warning' },
  { value: 'inactive', label: 'Inactive', badge: '2', badgeVariant: 'neutral' },
  { value: 'blocked', label: 'Blocked', badge: '1', badgeVariant: 'error' }
];

const Template = (args) => {
  const select = document.createElement('neo-select-dropdown');
  Object.keys(args).forEach(key => {
    if (args[key] !== undefined) {
      if (typeof args[key] === 'boolean') {
        if (args[key]) {
          select.setAttribute(key.replace(/([A-Z])/g, '-$1').toLowerCase(), '');
        }
      } else if (typeof args[key] === 'object') {
        select[key] = args[key];
      } else {
        select.setAttribute(key.replace(/([A-Z])/g, '-$1').toLowerCase(), args[key]);
        select[key] = args[key];
      }
    }
  });
  
  // Add event listeners for demonstration
  select.addEventListener('neo-select-change', (e) => {
    console.log('Selection changed:', e.detail);
  });
  
  select.addEventListener('neo-select-search', (e) => {
    console.log('Search term:', e.detail.searchTerm);
  });
  
  return select;
};

export const Default = Template.bind({});
Default.args = {
  options: basicOptions,
  placeholder: 'Choose a framework...',
  label: 'JavaScript Framework'
};

export const Searchable = Template.bind({});
Searchable.args = {
  options: countryOptions,
  placeholder: 'Search and select a country...',
  label: 'Country',
  searchable: true,
  clearable: true
};

export const Multiple = Template.bind({});
Multiple.args = {
  options: categoryOptions,
  placeholder: 'Select development areas...',
  label: 'Areas of Interest',
  multiple: true,
  searchable: true,
  clearable: true,
  maxSelections: 3
};

export const WithIcons = Template.bind({});
WithIcons.args = {
  options: categoryOptions,
  placeholder: 'Choose category...',
  label: 'Development Category',
  searchable: true
};

export const WithBadges = Template.bind({});
WithBadges.args = {
  options: statusOptions,
  placeholder: 'Filter by status...',
  label: 'User Status',
  multiple: true,
  searchable: true
};

export const CreateOption = Template.bind({});
CreateOption.args = {
  options: basicOptions,
  placeholder: 'Type to create or select...',
  label: 'Technologies',
  searchable: true,
  createOption: true,
  multiple: true
};

export const Disabled = Template.bind({});
Disabled.args = {
  options: basicOptions,
  placeholder: 'This field is disabled...',
  label: 'Framework (Disabled)',
  disabled: true,
  value: 'react'
};

export const WithError = Template.bind({});
WithError.args = {
  options: basicOptions,
  placeholder: 'Choose a framework...',
  label: 'Required Framework',
  required: true,
  error: 'Please select a framework to continue'
};

export const WithHelp = Template.bind({});
WithHelp.args = {
  options: basicOptions,
  placeholder: 'Choose your preferred framework...',
  label: 'JavaScript Framework',
  help: 'Select the framework you are most comfortable working with',
  clearable: true
};

export const Loading = Template.bind({});
Loading.args = {
  options: [],
  placeholder: 'Loading options...',
  label: 'Dynamic Options',
  loading: true
};

export const AllSizes = () => {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; flex-direction: column; gap: 1.5rem; max-width: 400px;';
  
  const sizes = ['sm', 'md', 'lg'];
  sizes.forEach(size => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 0.5rem;';
    
    const label = document.createElement('label');
    label.textContent = `${size.toUpperCase()} Size Select`;
    label.style.cssText = 'font-weight: 500; color: #374151;';
    
    const select = document.createElement('neo-select-dropdown');
    select.options = basicOptions;
    select.size = size;
    select.placeholder = `${size.toUpperCase()} select...`;
    select.clearable = true;
    
    wrapper.appendChild(label);
    wrapper.appendChild(select);
    container.appendChild(wrapper);
  });\n  \n  return container;\n};\n\nexport const AllVariants = () => {\n  const container = document.createElement('div');\n  container.style.cssText = 'display: flex; flex-direction: column; gap: 1.5rem; max-width: 400px;';\n  \n  const variants = [\n    { variant: 'default', title: 'Default Variant' },\n    { variant: 'outline', title: 'Outline Variant' },\n    { variant: 'ghost', title: 'Ghost Variant' }\n  ];\n  \n  variants.forEach(({ variant, title }) => {\n    const wrapper = document.createElement('div');\n    wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 0.5rem;';\n    \n    const label = document.createElement('label');\n    label.textContent = title;\n    label.style.cssText = 'font-weight: 500; color: #374151;';\n    \n    const select = document.createElement('neo-select-dropdown');\n    select.options = basicOptions;\n    select.variant = variant;\n    select.placeholder = `${variant} select...`;\n    select.clearable = true;\n    \n    wrapper.appendChild(label);\n    wrapper.appendChild(select);\n    container.appendChild(wrapper);\n  });\n  \n  return container;\n};\n\nexport const FormExample = () => {\n  const container = document.createElement('div');\n  container.style.cssText = 'max-width: 500px; padding: 1.5rem; border: 1px solid #e5e7eb; border-radius: 8px; background: white;';\n  \n  const title = document.createElement('h3');\n  title.textContent = 'Project Setup Form';\n  title.style.cssText = 'margin: 0 0 1.5rem 0; color: #111827;';\n  \n  const form = document.createElement('div');\n  form.style.cssText = 'display: flex; flex-direction: column; gap: 1.5rem;';\n  \n  // Framework selection\n  const frameworkSelect = document.createElement('neo-select-dropdown');\n  frameworkSelect.options = basicOptions;\n  frameworkSelect.label = 'JavaScript Framework';\n  frameworkSelect.placeholder = 'Choose your framework...';\n  frameworkSelect.required = true;\n  frameworkSelect.searchable = true;\n  frameworkSelect.help = 'Select the main framework for your project';\n  \n  // Categories (multiple)\n  const categoriesSelect = document.createElement('neo-select-dropdown');\n  categoriesSelect.options = categoryOptions;\n  categoriesSelect.label = 'Project Categories';\n  categoriesSelect.placeholder = 'Select applicable categories...';\n  categoriesSelect.multiple = true;\n  categoriesSelect.searchable = true;\n  categoriesSelect.maxSelections = 3;\n  categoriesSelect.help = 'Choose up to 3 categories that best describe your project';\n  \n  // Status\n  const statusSelect = document.createElement('neo-select-dropdown');\n  statusSelect.options = statusOptions;\n  statusSelect.label = 'Initial Status';\n  statusSelect.placeholder = 'Set project status...';\n  statusSelect.value = 'pending';\n  statusSelect.clearable = true;\n  \n  // Target countries\n  const countriesSelect = document.createElement('neo-select-dropdown');\n  countriesSelect.options = countryOptions;\n  countriesSelect.label = 'Target Markets';\n  countriesSelect.placeholder = 'Select target countries...';\n  countriesSelect.multiple = true;\n  countriesSelect.searchable = true;\n  countriesSelect.help = 'Countries where you plan to launch';\n  \n  // Submit button\n  const submitButton = document.createElement('button');\n  submitButton.textContent = 'Create Project';\n  submitButton.style.cssText = 'padding: 0.75rem 1.5rem; background: #3b82f6; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer;';\n  submitButton.addEventListener('click', () => {\n    const formData = {\n      framework: frameworkSelect.value,\n      categories: categoriesSelect.value,\n      status: statusSelect.value,\n      countries: countriesSelect.value\n    };\n    console.log('Form data:', formData);\n    alert('Form submitted! Check console for data.');\n  });\n  \n  form.appendChild(frameworkSelect);\n  form.appendChild(categoriesSelect);\n  form.appendChild(statusSelect);\n  form.appendChild(countriesSelect);\n  form.appendChild(submitButton);\n  \n  container.appendChild(title);\n  container.appendChild(form);\n  \n  return container;\n};\n\nexport const InteractiveDemo = () => {\n  const container = document.createElement('div');\n  container.style.cssText = 'max-width: 600px; padding: 1rem;';\n  \n  // Main select\n  const select = document.createElement('neo-select-dropdown');\n  select.options = [...categoryOptions];\n  select.label = 'Interactive Select Dropdown';\n  select.placeholder = 'Try all the features...';\n  select.searchable = true;\n  select.multiple = true;\n  select.clearable = true;\n  select.createOption = true;\n  select.help = 'Search, select multiple, create new options, and more!';\n  \n  // Status display\n  const status = document.createElement('div');\n  status.style.cssText = 'margin: 1.5rem 0; padding: 1rem; background: #f3f4f6; border-radius: 4px; font-size: 0.875rem;';\n  status.textContent = 'Status: Ready for interaction';\n  \n  // Event listeners\n  select.addEventListener('neo-select-change', (e) => {\n    status.style.background = '#dbeafe';\n    status.textContent = `Status: Selected ${JSON.stringify(e.detail.selectedValues)}`;\n  });\n  \n  select.addEventListener('neo-select-search', (e) => {\n    status.style.background = '#fef3c7';\n    status.textContent = `Status: Searching for \"${e.detail.searchTerm}\"`;\n  });\n  \n  select.addEventListener('neo-option-create', (e) => {\n    status.style.background = '#dcfce7';\n    status.textContent = `Status: Created new option \"${e.detail.option.label}\"`;\n  });\n  \n  // Controls\n  const controls = document.createElement('div');\n  controls.style.cssText = 'display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem;';\n  \n  const toggleSearchable = document.createElement('button');\n  toggleSearchable.textContent = 'Toggle Search';\n  toggleSearchable.style.cssText = 'padding: 0.25rem 0.5rem; font-size: 0.75rem; border: 1px solid #d1d5db; border-radius: 4px; background: white;';\n  toggleSearchable.addEventListener('click', () => {\n    select.searchable = !select.searchable;\n  });\n  \n  const toggleMultiple = document.createElement('button');\n  toggleMultiple.textContent = 'Toggle Multiple';\n  toggleMultiple.style.cssText = 'padding: 0.25rem 0.5rem; font-size: 0.75rem; border: 1px solid #d1d5db; border-radius: 4px; background: white;';\n  toggleMultiple.addEventListener('click', () => {\n    select.multiple = !select.multiple;\n    if (!select.multiple) {\n      select.clear();\n    }\n  });\n  \n  const toggleDisabled = document.createElement('button');\n  toggleDisabled.textContent = 'Toggle Disabled';\n  toggleDisabled.style.cssText = 'padding: 0.25rem 0.5rem; font-size: 0.75rem; border: 1px solid #d1d5db; border-radius: 4px; background: white;';\n  toggleDisabled.addEventListener('click', () => {\n    select.disabled = !select.disabled;\n  });\n  \n  const toggleLoading = document.createElement('button');\n  toggleLoading.textContent = 'Toggle Loading';\n  toggleLoading.style.cssText = 'padding: 0.25rem 0.5rem; font-size: 0.75rem; border: 1px solid #d1d5db; border-radius: 4px; background: white;';\n  toggleLoading.addEventListener('click', () => {\n    select.loading = !select.loading;\n  });\n  \n  const clearButton = document.createElement('button');\n  clearButton.textContent = 'Clear Selection';\n  clearButton.style.cssText = 'padding: 0.25rem 0.5rem; font-size: 0.75rem; border: 1px solid #d1d5db; border-radius: 4px; background: white;';\n  clearButton.addEventListener('click', () => {\n    select.clear();\n  });\n  \n  controls.appendChild(toggleSearchable);\n  controls.appendChild(toggleMultiple);\n  controls.appendChild(toggleDisabled);\n  controls.appendChild(toggleLoading);\n  controls.appendChild(clearButton);\n  \n  container.appendChild(select);\n  container.appendChild(status);\n  container.appendChild(controls);\n  \n  return container;\n};