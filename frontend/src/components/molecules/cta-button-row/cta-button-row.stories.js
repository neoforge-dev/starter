export default {
  title: 'Molecules/CTAButtonRow',
  component: 'neo-cta-button-row',
  parameters: {
    docs: {
      description: {
        component: 'Call-to-action button row component for form actions and key user decisions with multiple layout and styling options.'
      }
    }
  },
  argTypes: {
    actions: { control: 'object' },
    alignment: {
      control: 'select',
      options: ['left', 'center', 'right', 'space-between', 'space-around']
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical']
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg']
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost']
    },
    fullWidth: { control: 'boolean' },
    equal: { control: 'boolean' },
    gap: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg']
    },
    wrap: { control: 'boolean' },
    sticky: { control: 'boolean' },
    primaryAction: { control: 'text' },
    loading: { control: 'boolean' }
  }
};

const sampleActions = [
  {
    id: 'cancel',
    text: 'Cancel',
    variant: 'outline',
    type: 'button'
  },
  {
    id: 'save',
    text: 'Save Changes',
    variant: 'primary',
    type: 'submit',
    primary: true
  }
];

const formActions = [
  {
    id: 'reset',
    text: 'Reset',
    variant: 'ghost',
    type: 'reset'
  },
  {
    id: 'draft',
    text: 'Save Draft',
    variant: 'outline',
    type: 'button'
  },
  {
    id: 'publish',
    text: 'Publish',
    variant: 'primary',
    type: 'submit',
    primary: true
  }
];

const destructiveActions = [
  {
    id: 'cancel',
    text: 'Cancel',
    variant: 'outline'
  },
  {
    id: 'delete',
    text: 'Delete Item',
    variant: 'error',
    type: 'delete',
    description: 'This action cannot be undone'
  }
];

const Template = (args) => {
  const buttonRow = document.createElement('neo-cta-button-row');
  Object.keys(args).forEach(key => {
    if (args[key] !== undefined) {
      if (typeof args[key] === 'boolean') {
        if (args[key]) {
          buttonRow.setAttribute(key.replace(/([A-Z])/g, '-$1').toLowerCase(), '');
        }
      } else if (typeof args[key] === 'object') {
        buttonRow[key] = args[key];
      } else {
        buttonRow.setAttribute(key.replace(/([A-Z])/g, '-$1').toLowerCase(), args[key]);
        buttonRow[key] = args[key];
      }
    }
  });

  // Add event listeners for demonstration
  buttonRow.addEventListener('neo-action-click', (e) => {
    console.log('Action clicked:', e.detail);
  });

  buttonRow.addEventListener('neo-primary-action', (e) => {
    console.log('Primary action triggered:', e.detail);
  });

  return buttonRow;
};

export const Default = Template.bind({});
Default.args = {
  actions: sampleActions,
  alignment: 'right',
  gap: 'md'
};

export const FormActions = Template.bind({});
FormActions.args = {
  actions: formActions,
  alignment: 'space-between',
  gap: 'md'
};

export const DestructiveAction = Template.bind({});
DestructiveAction.args = {
  actions: destructiveActions,
  alignment: 'right',
  gap: 'md'
};

export const VerticalLayout = Template.bind({});
VerticalLayout.args = {
  actions: sampleActions,
  orientation: 'vertical',
  alignment: 'center',
  gap: 'sm'
};

export const EqualWidth = Template.bind({});
EqualWidth.args = {
  actions: sampleActions,
  equal: true,
  gap: 'md'
};

export const StickyFooter = Template.bind({});
StickyFooter.args = {
  actions: formActions,
  sticky: true,
  alignment: 'space-between'
};

export const LoadingState = Template.bind({});
LoadingState.args = {
  actions: sampleActions,
  loading: true,
  alignment: 'right'
};

export const AllAlignments = () => {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; flex-direction: column; gap: 2rem; padding: 1rem;';

  const alignments = [
    { alignment: 'left', title: 'Left Aligned' },
    { alignment: 'center', title: 'Center Aligned' },
    { alignment: 'right', title: 'Right Aligned' },
    { alignment: 'space-between', title: 'Space Between' },
    { alignment: 'space-around', title: 'Space Around' }
  ];

  alignments.forEach(({ alignment, title }) => {
    const section = document.createElement('div');
    section.style.cssText = 'border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem;';

    const heading = document.createElement('h3');
    heading.textContent = title;
    heading.style.cssText = 'margin: 0 0 1rem 0; font-size: 0.875rem; color: #6b7280;';

    const buttonRow = document.createElement('neo-cta-button-row');
    buttonRow.actions = sampleActions;
    buttonRow.alignment = alignment;
    buttonRow.gap = 'md';

    section.appendChild(heading);
    section.appendChild(buttonRow);
    container.appendChild(section);
  });

  return container;
};

export const AllSizes = () => {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; flex-direction: column; gap: 2rem; padding: 1rem;';

  const sizes = ['sm', 'md', 'lg'];

  sizes.forEach(size => {
    const section = document.createElement('div');
    section.style.cssText = 'border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem;';

    const heading = document.createElement('h3');
    heading.textContent = `${size.toUpperCase()} Size`;
    heading.style.cssText = 'margin: 0 0 1rem 0; font-size: 0.875rem; color: #6b7280;';

    const buttonRow = document.createElement('neo-cta-button-row');
    buttonRow.actions = sampleActions;
    buttonRow.size = size;
    buttonRow.alignment = 'center';

    section.appendChild(heading);
    section.appendChild(buttonRow);
    container.appendChild(section);
  });

  return container;
};

export const InteractiveDemo = () => {
  const container = document.createElement('div');
  container.style.cssText = 'max-width: 600px; padding: 1rem;';

  // Form simulation
  const form = document.createElement('div');
  form.style.cssText = 'border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem;';

  const formTitle = document.createElement('h3');
  formTitle.textContent = 'Sample Form';
  formTitle.style.cssText = 'margin: 0 0 1rem 0;';

  const formField = document.createElement('div');
  formField.style.cssText = 'margin-bottom: 1.5rem;';
  formField.innerHTML = `
    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Email Address</label>
    <input type="email" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;" placeholder="Enter your email">
  `;

  const buttonRow = document.createElement('neo-cta-button-row');
  buttonRow.actions = formActions;
  buttonRow.alignment = 'right';
  buttonRow.primaryAction = 'publish';

  form.appendChild(formTitle);
  form.appendChild(formField);
  form.appendChild(buttonRow);

  // Status display
  const status = document.createElement('div');
  status.style.cssText = 'padding: 1rem; background: #f3f4f6; border-radius: 4px; font-size: 0.875rem;';
  status.textContent = 'Status: Ready for action';

  // Event listeners
  buttonRow.addEventListener('neo-action-click', (e) => {
    const { action } = e.detail;
    status.style.background = '#dbeafe';
    status.textContent = `Status: ${action.text} clicked`;

    // Simulate loading state
    if (action.id === 'publish') {\n      buttonRow.setActionLoading('publish', true);\n      buttonRow.updateActionText('publish', 'Publishing...');\n      \n      setTimeout(() => {\n        buttonRow.setActionLoading('publish', false);\n        buttonRow.updateActionText('publish', 'Published!');\n        status.style.background = '#dcfce7';\n        status.textContent = 'Status: Form published successfully!';\n        \n        setTimeout(() => {\n          buttonRow.updateActionText('publish', 'Publish');\n          status.style.background = '#f3f4f6';\n          status.textContent = 'Status: Ready for action';\n        }, 2000);\n      }, 1500);\n    }\n  });\n  \n  buttonRow.addEventListener('neo-primary-action', (e) => {\n    console.log('Primary action triggered:', e.detail);\n  });\n  \n  container.appendChild(form);\n  container.appendChild(status);\n  \n  // Controls\n  const controls = document.createElement('div');\n  controls.style.cssText = 'margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;';\n  \n  const toggleAlignment = document.createElement('button');\n  toggleAlignment.textContent = 'Toggle Alignment';\n  toggleAlignment.style.cssText = 'padding: 0.25rem 0.5rem; font-size: 0.75rem; border: 1px solid #d1d5db; border-radius: 4px; background: white;';\n  toggleAlignment.addEventListener('click', () => {\n    const alignments = ['left', 'center', 'right', 'space-between'];\n    const current = buttonRow.alignment;\n    const currentIndex = alignments.indexOf(current);\n    const nextIndex = (currentIndex + 1) % alignments.length;\n    buttonRow.alignment = alignments[nextIndex];\n  });\n  \n  const toggleLoading = document.createElement('button');\n  toggleLoading.textContent = 'Toggle Loading';\n  toggleLoading.style.cssText = 'padding: 0.25rem 0.5rem; font-size: 0.75rem; border: 1px solid #d1d5db; border-radius: 4px; background: white;';\n  toggleLoading.addEventListener('click', () => {\n    buttonRow.loading = !buttonRow.loading;\n  });\n  \n  controls.appendChild(toggleAlignment);\n  controls.appendChild(toggleLoading);\n  container.appendChild(controls);\n  \n  return container;\n};
