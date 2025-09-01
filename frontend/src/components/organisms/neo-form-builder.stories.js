import './neo-form-builder.js';

// Sample form schemas for demonstration
const contactFormSchema = {
  fields: [
    { id: 'name', type: 'text', label: 'Full Name', name: 'name', required: true, placeholder: 'Enter your full name' },
    { id: 'email', type: 'email', label: 'Email Address', name: 'email', required: true, placeholder: 'your@email.com' },
    { id: 'phone', type: 'text', label: 'Phone Number', name: 'phone', placeholder: '+1 (555) 123-4567' },
    {
      id: 'subject',
      type: 'select',
      label: 'Subject',
      name: 'subject',
      required: true,
      options: [
        { label: 'General Inquiry', value: 'general' },
        { label: 'Technical Support', value: 'support' },
        { label: 'Sales Question', value: 'sales' },
        { label: 'Partnership', value: 'partnership' }
      ]
    },
    {
      id: 'message',
      type: 'textarea',
      label: 'Message',
      name: 'message',
      required: true,
      rows: 5,
      placeholder: 'Tell us how we can help you...',
      helpText: 'Please provide as much detail as possible'
    }
  ]
};

const surveyFormSchema = {
  fields: [
    { id: 'section1', type: 'section', label: 'Personal Information', description: 'Tell us a bit about yourself' },
    { id: 'age', type: 'number', label: 'Age', name: 'age', min: '13', max: '120', required: true },
    {
      id: 'gender',
      type: 'radio',
      label: 'Gender',
      name: 'gender',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
        { label: 'Non-binary', value: 'nonbinary' },
        { label: 'Prefer not to say', value: 'no_answer' }
      ]
    },
    { id: 'spacer1', type: 'spacer' },
    { id: 'section2', type: 'section', label: 'Preferences', description: 'Help us understand your preferences' },
    {
      id: 'interests',
      type: 'checkbox',
      label: 'Areas of Interest',
      name: 'interests',
      options: [
        { label: 'Technology', value: 'tech' },
        { label: 'Sports', value: 'sports' },
        { label: 'Arts & Culture', value: 'arts' },
        { label: 'Travel', value: 'travel' },
        { label: 'Food & Cooking', value: 'food' }
      ]
    },
    {
      id: 'frequency',
      type: 'select',
      label: 'How often do you use our product?',
      name: 'frequency',
      options: [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Rarely', value: 'rarely' }
      ]
    },
    {
      id: 'rating',
      type: 'number',
      label: 'Overall Satisfaction (1-10)',
      name: 'rating',
      min: '1',
      max: '10',
      required: true,
      helpText: '1 = Very Dissatisfied, 10 = Very Satisfied'
    },
    {
      id: 'feedback',
      type: 'textarea',
      label: 'Additional Feedback',
      name: 'feedback',
      rows: 4,
      placeholder: 'Any suggestions for improvement?'
    }
  ]
};

const jobApplicationSchema = {
  fields: [
    { id: 'section1', type: 'section', label: 'Personal Details', description: 'Basic information about the applicant' },
    { id: 'firstName', type: 'text', label: 'First Name', name: 'firstName', required: true },
    { id: 'lastName', type: 'text', label: 'Last Name', name: 'lastName', required: true },
    { id: 'email', type: 'email', label: 'Email Address', name: 'email', required: true },
    { id: 'phone', type: 'text', label: 'Phone Number', name: 'phone', required: true },
    { id: 'birthDate', type: 'date', label: 'Date of Birth', name: 'birthDate' },
    { id: 'spacer1', type: 'spacer' },
    { id: 'section2', type: 'section', label: 'Position Information' },
    {
      id: 'position',
      type: 'select',
      label: 'Position Applied For',
      name: 'position',
      required: true,
      options: [
        { label: 'Software Engineer', value: 'software_engineer' },
        { label: 'Product Manager', value: 'product_manager' },
        { label: 'UX Designer', value: 'ux_designer' },
        { label: 'Marketing Specialist', value: 'marketing_specialist' },
        { label: 'Sales Representative', value: 'sales_rep' }
      ]
    },
    {
      id: 'experience',
      type: 'radio',
      label: 'Years of Experience',
      name: 'experience',
      required: true,
      options: [
        { label: '0-1 years', value: '0-1' },
        { label: '2-5 years', value: '2-5' },
        { label: '6-10 years', value: '6-10' },
        { label: '10+ years', value: '10+' }
      ]
    },
    { id: 'salary', type: 'number', label: 'Expected Salary ($)', name: 'salary', min: '0' },
    {
      id: 'availability',
      type: 'checkbox',
      label: 'Availability',
      name: 'availability',
      options: [
        { label: 'Immediate', value: 'immediate' },
        { label: 'Within 2 weeks', value: '2_weeks' },
        { label: 'Within 1 month', value: '1_month' },
        { label: 'Flexible', value: 'flexible' }
      ]
    },
    {
      id: 'coverLetter',
      type: 'textarea',
      label: 'Cover Letter',
      name: 'coverLetter',
      rows: 6,
      required: true,
      placeholder: 'Tell us why you want to work with us...',
      helpText: 'This is your opportunity to make a great first impression'
    },
    { id: 'resume', type: 'file', label: 'Resume/CV', name: 'resume', required: true },
    { id: 'portfolio', type: 'file', label: 'Portfolio (Optional)', name: 'portfolio' }
  ]
};

// Sample form values
const sampleContactValues = {
  name: 'John Doe',
  email: 'john@example.com',
  subject: 'general',
  message: 'I would like to learn more about your services.'
};

const sampleSurveyValues = {
  age: 28,
  gender: 'male',
  interests: ['tech', 'travel'],
  frequency: 'weekly',
  rating: 8,
  feedback: 'Great product! Could use more features.'
};

export default {
  title: 'Organisms/Neo Form Builder',
  component: 'neo-form-builder',
  parameters: {
    docs: {
      description: {
        component: 'Advanced form builder component with drag-and-drop creation, dynamic forms, validation, and multi-step support.'
      }
    }
  },
  argTypes: {
    schema: {
      control: { type: 'object' },
      description: 'Form schema defining fields and their properties'
    },
    values: {
      control: { type: 'object' },
      description: 'Current form values'
    },
    mode: {
      control: { type: 'select' },
      options: ['builder', 'preview', 'runtime'],
      defaultValue: 'builder',
      description: 'Form builder mode'
    },
    dragEnabled: {
      control: { type: 'boolean' },
      defaultValue: true,
      description: 'Enable drag-and-drop functionality'
    },
    validationEnabled: {
      control: { type: 'boolean' },
      defaultValue: true,
      description: 'Enable form validation'
    },
    multiStep: {
      control: { type: 'boolean' },
      defaultValue: false,
      description: 'Enable multi-step form functionality'
    },
    autoSave: {
      control: { type: 'boolean' },
      defaultValue: false,
      description: 'Enable automatic form saving'
    },
    readonly: {
      control: { type: 'boolean' },
      defaultValue: false,
      description: 'Make form read-only'
    },
    compact: {
      control: { type: 'boolean' },
      defaultValue: false,
      description: 'Use compact layout'
    }
  }
};

// Basic form builder in builder mode
export const BuilderMode = {
  args: {
    schema: { fields: [] },
    values: {},
    mode: 'builder',
    dragEnabled: true,
    validationEnabled: true,
    autoSave: false
  }
};

// Form builder with pre-built contact form
export const ContactFormBuilder = {
  args: {
    schema: contactFormSchema,
    values: {},
    mode: 'builder',
    dragEnabled: true,
    validationEnabled: true,
    autoSave: false
  }
};

// Preview mode showing contact form
export const ContactFormPreview = {
  args: {
    schema: contactFormSchema,
    values: sampleContactValues,
    mode: 'preview',
    validationEnabled: true,
    compact: false
  }
};

// Runtime mode - interactive form
export const ContactFormRuntime = {
  args: {
    schema: contactFormSchema,
    values: {},
    mode: 'runtime',
    validationEnabled: true,
    readonly: false
  }
};

// Survey form with complex field types
export const SurveyFormBuilder = {
  args: {
    schema: surveyFormSchema,
    values: {},
    mode: 'builder',
    dragEnabled: true,
    validationEnabled: true,
    autoSave: true
  }
};

// Survey form in runtime with sample values
export const SurveyFormRuntime = {
  args: {
    schema: surveyFormSchema,
    values: sampleSurveyValues,
    mode: 'runtime',
    validationEnabled: true,
    readonly: false
  }
};

// Job application form (complex example)
export const JobApplicationBuilder = {
  args: {
    schema: jobApplicationSchema,
    values: {},
    mode: 'builder',
    dragEnabled: true,
    validationEnabled: true,
    autoSave: true
  }
};

// Job application form in preview
export const JobApplicationPreview = {
  args: {
    schema: jobApplicationSchema,
    values: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1 (555) 123-4567',
      position: 'software_engineer',
      experience: '2-5',
      salary: 75000,
      availability: ['2_weeks'],
      coverLetter: 'I am excited to apply for the Software Engineer position...'
    },
    mode: 'preview',
    validationEnabled: true
  }
};

// Compact layout demonstration
export const CompactLayout = {
  args: {
    schema: contactFormSchema,
    values: sampleContactValues,
    mode: 'runtime',
    validationEnabled: true,
    compact: true
  }
};

// Read-only form
export const ReadOnlyForm = {
  args: {
    schema: contactFormSchema,
    values: sampleContactValues,
    mode: 'runtime',
    validationEnabled: false,
    readonly: true
  }
};

// Validation showcase
export const ValidationShowcase = {
  args: {
    schema: {
      fields: [
        { id: 'required_text', type: 'text', label: 'Required Text Field', name: 'required_text', required: true, placeholder: 'This field is required' },
        { id: 'email_field', type: 'email', label: 'Email Validation', name: 'email_field', required: true, placeholder: 'Enter a valid email' },
        { id: 'number_range', type: 'number', label: 'Number Range (1-100)', name: 'number_range', min: '1', max: '100', required: true },
        {
          id: 'required_select',
          type: 'select',
          label: 'Required Selection',
          name: 'required_select',
          required: true,
          options: [
            { label: 'Option 1', value: 'opt1' },
            { label: 'Option 2', value: 'opt2' },
            { label: 'Option 3', value: 'opt3' }
          ]
        },
        {
          id: 'required_checkbox',
          type: 'checkbox',
          label: 'Required Checkbox (Select at least one)',
          name: 'required_checkbox',
          required: true,
          options: [
            { label: 'Option A', value: 'a' },
            { label: 'Option B', value: 'b' },
            { label: 'Option C', value: 'c' }
          ]
        }
      ]
    },
    values: {},
    mode: 'runtime',
    validationEnabled: true,
    readonly: false
  }
};

// Auto-save enabled
export const AutoSaveEnabled = {
  args: {
    schema: contactFormSchema,
    values: {},
    mode: 'builder',
    dragEnabled: true,
    validationEnabled: true,
    autoSave: true
  }
};

// Interactive example with event handling
export const InteractiveExample = {
  args: {
    schema: contactFormSchema,
    values: {},
    mode: 'builder',
    dragEnabled: true,
    validationEnabled: true,
    autoSave: false
  },
  play: async ({ canvasElement }) => {
    const formBuilder = canvasElement.querySelector('neo-form-builder');

    // Add comprehensive event listeners
    formBuilder.addEventListener('field-add', (e) => {
      console.log('Field added:', e.detail);
    });

    formBuilder.addEventListener('field-delete', (e) => {
      console.log('Field deleted:', e.detail);
    });

    formBuilder.addEventListener('field-update', (e) => {
      console.log('Field updated:', e.detail);
    });

    formBuilder.addEventListener('value-change', (e) => {
      console.log('Value changed:', e.detail);
    });

    formBuilder.addEventListener('form-save', (e) => {
      console.log('Form saved:', e.detail);
    });

    formBuilder.addEventListener('form-submit', (e) => {
      console.log('Form submitted:', e.detail);
    });
  }
};
