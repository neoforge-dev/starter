import { DataTable } from "./data-table.js";

export default {
  title: "Components/Data Table",
  component: "data-table",
  tags: ["autodocs"],
  argTypes: {
    columns: { control: "object" },
    data: { control: "object" },
  },
};

export const Default = {
  args: {
    columns: [
      { header: "Name", field: "name" },
      { header: "Age", field: "age" },
      { header: "Email", field: "email" },
    ],
    data: [
      { name: "John Doe", age: 30, email: "john@example.com" },
      { name: "Jane Smith", age: 25, email: "jane@example.com" },
      { name: "Alice Johnson", age: 35, email: "alice@example.com" },
    ],
  },
};
