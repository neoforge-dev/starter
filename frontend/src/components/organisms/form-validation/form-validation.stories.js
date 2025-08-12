import {   html   } from 'lit';
import { action } from "@storybook/addon-actions";
import "./form-validation.js"; // Assuming form-validation component is defined here
import "../../atoms/button/button.js";
import "../../atoms/text-input/text-input.js";
import "../../atoms/checkbox/checkbox.js";

export default {
  title: "Organisms/Form Validation",
  component: "neo-form-validation",
  argTypes: {
    // Props for the form itself
    novalidate: {
      control: "boolean",
      description: "Disable browser native validation",
      defaultValue: true,
    },
    // Events
    onSubmit: {
      action: "submit",
      description:
        "Fired when the form is submitted successfully after validation",
      table: { category: "Events" },
    },
    onInvalid: {
      action: "invalid",
      description: "Fired when the form submission fails validation",
      table: { category: "Events" },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "A form wrapper that handles validation logic for child input elements.",
      },
      source: {
        code: `
<neo-form-validation @submit=\${(e) => console.log('Valid Submit:', e.detail)}
                     @invalid=\${() => console.log('Invalid Submit')}>
  <neo-text-input label="Name" name="name" required minlength="3"></neo-text-input>
  <neo-text-input label="Email" name="email" type="email" required></neo-text-input>
  <neo-button type="submit">Submit</neo-button>
</neo-form-validation>
        `,
      },
    },
  },
};

const handleSubmit = (e) => {
  e.preventDefault(); // Prevent actual form submission in Storybook
  action("submit")(e.detail); // Log the event detail to Storybook actions
};

const handleInvalid = () => {
  action("invalid")("Form validation failed");
};

const Template = ({ novalidate }) => html`
  <neo-form-validation
    ?novalidate=${novalidate}
    @submit=${handleSubmit}
    @invalid=${handleInvalid}
    style="display: flex; flex-direction: column; gap: 1rem; max-width: 400px;"
  >
    <neo-text-input
      label="Name (Required, min 3 chars)"
      name="name"
      required
      minlength="3"
      help-text="Enter your full name"
    ></neo-text-input>

    <neo-text-input
      label="Email (Required, email format)"
      name="email"
      type="email"
      required
      help-text="We need a valid email address"
    ></neo-text-input>

    <neo-text-input
      label="Age (Optional, number between 18 and 99)"
      name="age"
      type="number"
      min="18"
      max="99"
    ></neo-text-input>

    <neo-text-input
      label="Website (Optional, URL format)"
      name="website"
      type="url"
    ></neo-text-input>

    <neo-text-input
      label="Password (Required, pattern: letters/numbers)"
      name="password"
      type="password"
      required
      pattern="[A-Za-z0-9]+"
      help-text="Must contain only letters and numbers"
    ></neo-text-input>

    <neo-checkbox name="terms" required label="I agree to the terms (Required)">
    </neo-checkbox>

    <neo-button type="submit">Submit</neo-button>
    <neo-button type="reset">Reset</neo-button>
  </neo-form-validation>
`;

export const Default = Template.bind({});
Default.args = {
  novalidate: true,
};

export const WithBrowserValidation = Template.bind({});
WithBrowserValidation.args = {
  novalidate: false,
};
WithBrowserValidation.parameters = {
  docs: {
    description: {
      story:
        "This example allows browser native validation tooltips to appear by setting `novalidate` to false.",
    },
  },
};
