export default {
  title: 'Molecules/InputField',
  component: 'neo-input-field',
  parameters: {
    docs: {
      description: {
        component: 'Complete form field component that combines label, input, validation, and help text for optimal user experience.'
      }
    }
  },
  argTypes: {
    label: { control: 'text' },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'tel', 'url', 'search', 'number']
    },
    value: { control: 'text' },
    placeholder: { control: 'text' },
    helpText: { control: 'text' },
    error: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg']
    }
  }
};

const Template = (args) => {
  const inputField = document.createElement('neo-input-field');
  Object.keys(args).forEach(key => {
    if (args[key] !== undefined) {
      if (typeof args[key] === 'boolean') {
        if (args[key]) {
          inputField.setAttribute(key.replace(/([A-Z])/g, '-$1').toLowerCase(), '');
        }
      } else {
        inputField.setAttribute(key.replace(/([A-Z])/g, '-$1').toLowerCase(), args[key]);
      }
      inputField[key] = args[key];
    }
  });

  // Add event listeners for demonstration
  inputField.addEventListener('neo-input', (e) => {
    console.log('Input changed:', e.detail);
  });

  return inputField;
};

export const Default = Template.bind({});
Default.args = {
  label: 'Email Address',
  type: 'email',
  placeholder: 'Enter your email',
  helpText: 'We\'ll never share your email with anyone else.'
};

export const Required = Template.bind({});
Required.args = {
  label: 'Username',
  type: 'text',
  placeholder: 'Choose a username',
  required: true,
  helpText: 'Must be at least 3 characters long'
};

export const WithError = Template.bind({});
WithError.args = {
  label: 'Password',
  type: 'password',
  value: '123',
  error: 'Password must be at least 8 characters long',
  required: true
};

export const Disabled = Template.bind({});
Disabled.args = {
  label: 'Account Type',
  type: 'text',
  value: 'Premium',
  disabled: true,
  helpText: 'Contact support to change your account type'
};

export const Sizes = () => {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; flex-direction: column; gap: 1rem; max-width: 400px;';

  const sizes = ['sm', 'md', 'lg'];
  sizes.forEach(size => {
    const field = document.createElement('neo-input-field');
    field.label = `${size.toUpperCase()} Size`;
    field.placeholder = `${size} input field`;
    field.size = size;
    container.appendChild(field);
  });

  return container;
};

export const FormValidation = () => {
  const form = document.createElement('form');
  form.style.cssText = 'display: flex; flex-direction: column; gap: 1rem; max-width: 400px; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px;';

  // Email field
  const emailField = document.createElement('neo-input-field');
  emailField.label = 'Email';
  emailField.type = 'email';
  emailField.required = true;
  emailField.helpText = 'Enter a valid email address';

  // Password field
  const passwordField = document.createElement('neo-input-field');
  passwordField.label = 'Password';
  passwordField.type = 'password';
  passwordField.required = true;
  passwordField.minLength = 8;
  passwordField.helpText = 'Must be at least 8 characters';

  // Submit button
  const submitBtn = document.createElement('neo-button');
  submitBtn.textContent = 'Submit';
  submitBtn.variant = 'primary';
  submitBtn.type = 'submit';

  form.appendChild(emailField);
  form.appendChild(passwordField);
  form.appendChild(submitBtn);

  // Form validation
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const isEmailValid = emailField.validate();
    const isPasswordValid = passwordField.validate();

    if (isEmailValid && isPasswordValid) {
      alert('Form is valid!');
    } else {
      alert('Please fix the errors and try again.');
    }
  });

  return form;
};

export const InteractiveDemo = () => {
  const container = document.createElement('div');
  container.style.cssText = 'max-width: 500px; padding: 1rem;';

  const field = document.createElement('neo-input-field');
  field.label = 'Interactive Field';
  field.type = 'text';
  field.placeholder = 'Type something...';
  field.helpText = 'This field demonstrates real-time validation';

  // Custom validation
  field.addEventListener('neo-input', (e) => {
    const value = e.detail.value;
    if (value.length > 0 && value.length < 3) {
      field.error = 'Must be at least 3 characters';
    } else if (value.includes('test')) {
      field.error = 'Cannot contain the word "test"';
    } else {
      field.error = '';
    }
  });

  container.appendChild(field);

  // Status display
  const status = document.createElement('div');
  status.style.cssText = 'margin-top: 1rem; padding: 0.5rem; background: #f3f4f6; border-radius: 4px; font-size: 0.875rem;';
  status.textContent = 'Status: Ready for input';

  field.addEventListener('neo-input', (e) => {
    status.textContent = `Status: ${e.detail.value ? `"${e.detail.value}"` : 'Empty'}`;
  });

  field.addEventListener('neo-focus', () => {
    status.style.background = '#dbeafe';
    status.textContent = 'Status: Focused';
  });

  field.addEventListener('neo-blur', () => {
    status.style.background = '#f3f4f6';
  });

  container.appendChild(status);

  return container;
};
