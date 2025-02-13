import { html } from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";
import "./autoform.js";

export default {
  title: "Form/Autoform",
  component: "ui-autoform",
  argTypes: {
    schema: { control: "object" },
    value: { control: "object" },
    variant: { control: "select", options: ["default", "compact", "floating"] },
    layout: { control: "select", options: ["vertical", "horizontal", "grid"] },
    columns: { control: "number" },
    disabled: { control: "boolean" },
    readonly: { control: "boolean" },
    showValidation: { control: "boolean" },
  },
};

const Template = (args) => html`
  <ui-autoform
    .schema=${args.schema}
    .value=${args.value}
    .variant=${args.variant}
    .layout=${args.layout}
    .columns=${args.columns}
    ?disabled=${args.disabled}
    ?readonly=${args.readonly}
    ?showValidation=${args.showValidation}
    @change=${(e) => console.log("Form changed:", e.detail)}
    @submit=${(e) => console.log("Form submitted:", e.detail)}
    @validate=${(e) => console.log("Form validation:", e.detail)}
  ></ui-autoform>
`;

const userSchema = {
  title: "User Profile",
  description: "Please fill in your profile information",
  type: "object",
  required: ["username", "email", "role"],
  properties: {
    username: {
      type: "string",
      title: "Username",
      description: "Choose a unique username",
      minLength: 3,
      maxLength: 20,
      pattern: "^[a-zA-Z0-9_]+$",
    },
    email: {
      type: "string",
      title: "Email",
      format: "email",
    },
    password: {
      type: "string",
      title: "Password",
      format: "password",
      minLength: 8,
      description: "Must contain at least 8 characters",
    },
    role: {
      type: "string",
      title: "Role",
      enum: ["user", "admin", "editor"],
      default: "user",
    },
    bio: {
      type: "string",
      title: "Biography",
      format: "textarea",
      maxLength: 500,
    },
    newsletter: {
      type: "boolean",
      title: "Subscribe to newsletter",
      default: true,
    },
    avatar: {
      type: "string",
      title: "Avatar",
      format: "file",
      accept: "image/*",
    },
  },
};

const productSchema = {
  title: "Product Details",
  type: "object",
  required: ["name", "price", "category"],
  properties: {
    name: {
      type: "string",
      title: "Product Name",
    },
    description: {
      type: "string",
      title: "Description",
      format: "richtext",
    },
    price: {
      type: "number",
      title: "Price",
      minimum: 0,
      format: "currency",
    },
    category: {
      type: "string",
      title: "Category",
      enum: ["electronics", "clothing", "books", "food"],
    },
    tags: {
      type: "array",
      title: "Tags",
      items: {
        type: "string",
      },
      format: "tags",
    },
    inStock: {
      type: "boolean",
      title: "In Stock",
    },
    images: {
      type: "array",
      title: "Product Images",
      items: {
        type: "string",
        format: "file",
        accept: "image/*",
      },
      minItems: 1,
      maxItems: 5,
    },
    color: {
      type: "string",
      title: "Color",
      format: "color",
    },
    rating: {
      type: "number",
      title: "Rating",
      minimum: 0,
      maximum: 5,
      format: "rating",
    },
  },
};

const addressSchema = {
  title: "Shipping Address",
  type: "object",
  required: ["firstName", "lastName", "street", "city", "country", "zipCode"],
  properties: {
    firstName: {
      type: "string",
      title: "First Name",
    },
    lastName: {
      type: "string",
      title: "Last Name",
    },
    street: {
      type: "string",
      title: "Street Address",
    },
    apartment: {
      type: "string",
      title: "Apartment/Suite",
      optional: true,
    },
    city: {
      type: "string",
      title: "City",
    },
    state: {
      type: "string",
      title: "State/Province",
    },
    country: {
      type: "string",
      title: "Country",
      format: "country",
    },
    zipCode: {
      type: "string",
      title: "ZIP/Postal Code",
      pattern: "^[0-9]{5}(?:-[0-9]{4})?$",
    },
    phone: {
      type: "string",
      title: "Phone Number",
      format: "phone",
    },
  },
};

export const UserProfile = Template.bind({});
UserProfile.args = {
  schema: userSchema,
  value: {
    username: "johndoe",
    email: "john@example.com",
    role: "user",
  },
  variant: "default",
  layout: "vertical",
  disabled: false,
  readonly: false,
  showValidation: true,
};

export const ProductForm = Template.bind({});
ProductForm.args = {
  schema: productSchema,
  value: {
    name: "Sample Product",
    price: 99.99,
    category: "electronics",
    inStock: true,
  },
  variant: "default",
  layout: "grid",
  columns: 2,
  disabled: false,
  readonly: false,
  showValidation: true,
};

export const AddressForm = Template.bind({});
AddressForm.args = {
  schema: addressSchema,
  variant: "floating",
  layout: "horizontal",
  disabled: false,
  readonly: false,
  showValidation: true,
};

export const CompactForm = Template.bind({});
CompactForm.args = {
  schema: userSchema,
  variant: "compact",
  layout: "vertical",
  disabled: false,
  readonly: false,
  showValidation: false,
};

export const ReadonlyForm = Template.bind({});
ReadonlyForm.args = {
  schema: productSchema,
  value: {
    name: "Sample Product",
    description: "This is a sample product description.",
    price: 99.99,
    category: "electronics",
    tags: ["new", "featured"],
    inStock: true,
    rating: 4.5,
  },
  variant: "default",
  layout: "vertical",
  disabled: false,
  readonly: true,
  showValidation: false,
};
