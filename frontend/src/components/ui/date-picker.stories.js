import { DatePicker } from "./date-picker.js";

export default {
  title: "Components/DatePicker",
  component: "date-picker",
  tags: ["autodocs"],
  argTypes: {
    value: { control: "text" },
    min: { control: "text" },
    max: { control: "text" },
    disabled: { control: "boolean" },
    format: { control: "text" },
    placeholder: { control: "text" },
    showWeekNumbers: { control: "boolean" },
    firstDayOfWeek: { control: "number" },
    onChange: { action: "changed" },
  },
};

export const Default = {
  args: {
    placeholder: "Select a date",
  },
};

export const WithValue = {
  args: {
    value: "2024-03-15",
    placeholder: "Select a date",
  },
};

export const WithDateRange = {
  args: {
    min: "2024-01-01",
    max: "2024-12-31",
    placeholder: "Select a date in 2024",
  },
};

export const Disabled = {
  args: {
    value: "2024-03-15",
    disabled: true,
  },
};

export const WithWeekNumbers = {
  args: {
    showWeekNumbers: true,
    placeholder: "Select a date",
  },
};

export const MondayFirst = {
  args: {
    firstDayOfWeek: 1,
    placeholder: "Week starts on Monday",
  },
};
