import {   html   } from 'lit';
import "./form.js";
import "./input.js";
import "./button.js";
import { validators } from "../../mixins/form-validation.js";

export default {
  title: "Components/Form",
  component: "neo-form",
  parameters: {
    layout: "centered",
  },
};

// Example login form with validation
export const LoginForm = () => {
  const form = document.createElement("neo-form");

  // Add validators
  form.addValidator("email", validators.required());
  form.addValidator("email", validators.email());
  form.addValidator("password", validators.required());
  form.addValidator("password", validators.minLength(8));

  // Handle form submission
  form.addEventListener("submit", (e) => {
    console.log("Form submitted:", e.detail.data);
  });

  form.addEventListener("error", (e) => {
    console.log("Form errors:", e.detail.errors);
  });

  return html`
    <neo-form style="width: 400px; padding: 2rem;">
      <h2 style="margin-bottom: 2rem;">Login</h2>

      <neo-input
        type="email"
        name="email"
        label="Email"
        required
        placeholder="Enter your email"
      ></neo-input>

      <neo-input
        type="password"
        name="password"
        label="Password"
        required
        placeholder="Enter your password"
      ></neo-input>

      <div class="form-actions">
        <neo-button type="submit" variant="primary">Login</neo-button>
        <neo-button type="reset" variant="secondary">Reset</neo-button>
      </div>
    </neo-form>
  `;
};

// Example registration form with password confirmation
export const RegistrationForm = () => {
  const form = document.createElement("neo-form");

  // Add validators
  form.addValidator("name", validators.required());
  form.addValidator("name", validators.minLength(2));
  form.addValidator("email", validators.required());
  form.addValidator("email", validators.email());
  form.addValidator("password", validators.required());
  form.addValidator("password", validators.minLength(8));
  form.addValidator(
    "password",
    validators.pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    )
  );
  form.addValidator("confirmPassword", validators.required());
  form.addValidator("confirmPassword", validators.match("password"));

  // Example async validator
  form.addAsyncValidator("email", async (value) => {
    // Simulate API call to check if email exists
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return value.includes("taken") ? "This email is already taken" : null;
  });

  return html`
    <neo-form style="width: 400px; padding: 2rem;">
      <h2 style="margin-bottom: 2rem;">Register</h2>

      <neo-input
        type="text"
        name="name"
        label="Full Name"
        required
        placeholder="Enter your full name"
      ></neo-input>

      <neo-input
        type="email"
        name="email"
        label="Email"
        required
        placeholder="Enter your email"
      ></neo-input>

      <neo-input
        type="password"
        name="password"
        label="Password"
        required
        placeholder="Choose a password"
      ></neo-input>

      <neo-input
        type="password"
        name="confirmPassword"
        label="Confirm Password"
        required
        placeholder="Confirm your password"
      ></neo-input>

      <div class="form-actions">
        <neo-button type="submit" variant="primary">Register</neo-button>
        <neo-button type="reset" variant="secondary">Reset</neo-button>
      </div>
    </neo-form>
  `;
};

// Example contact form with custom validation
export const ContactForm = () => {
  const form = document.createElement("neo-form");

  // Add validators
  form.addValidator("name", validators.required());
  form.addValidator("email", validators.required());
  form.addValidator("email", validators.email());
  form.addValidator("message", validators.required());
  form.addValidator("message", validators.minLength(20));

  // Custom validator
  form.addValidator("phone", (value) => {
    if (value && !/^\+?[\d\s-]{10,}$/.test(value)) {
      return "Please enter a valid phone number";
    }
    return null;
  });

  return html`
    <neo-form style="width: 400px; padding: 2rem;">
      <h2 style="margin-bottom: 2rem;">Contact Us</h2>

      <neo-input
        type="text"
        name="name"
        label="Name"
        required
        placeholder="Your name"
      ></neo-input>

      <neo-input
        type="email"
        name="email"
        label="Email"
        required
        placeholder="Your email"
      ></neo-input>

      <neo-input
        type="tel"
        name="phone"
        label="Phone (optional)"
        placeholder="Your phone number"
      ></neo-input>

      <neo-input
        type="textarea"
        name="message"
        label="Message"
        required
        placeholder="Enter your message"
        rows="4"
      ></neo-input>

      <div class="form-actions">
        <neo-button type="submit" variant="primary">Send Message</neo-button>
        <neo-button type="reset" variant="secondary">Reset</neo-button>
      </div>
    </neo-form>
  `;
};
