import { html } from "lit";
import "./data-table.js";

export default {
  title: "Components/DataTable",
  component: "neo-data-table",
  parameters: {
    layout: "centered",
  },
};

// Sample data
const users = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: "Admin",
    status: "Active",
    lastLogin: "2024-02-12T10:30:00",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    role: "User",
    status: "Inactive",
    lastLogin: "2024-02-10T15:45:00",
  },
  {
    id: 3,
    name: "Bob Wilson",
    email: "bob@example.com",
    role: "Editor",
    status: "Active",
    lastLogin: "2024-02-11T09:15:00",
  },
  // Add more sample data...
].concat(
  Array.from({ length: 47 }, (_, i) => ({
    id: i + 4,
    name: `User ${i + 4}`,
    email: `user${i + 4}@example.com`,
    role: ["Admin", "User", "Editor"][Math.floor(Math.random() * 3)],
    status: ["Active", "Inactive"][Math.floor(Math.random() * 2)],
    lastLogin: new Date(
      Date.now() - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000)
    ).toISOString(),
  }))
);

// Column definitions
const columns = [
  { field: "name", header: "Name" },
  { field: "email", header: "Email" },
  { field: "role", header: "Role" },
  {
    field: "status",
    header: "Status",
    template: (value) => html`
      <span
        style="
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          background: ${value === "Active"
          ? "var(--success-color)"
          : "var(--warning-color)"};
          color: white;
        "
      >
        ${value}
      </span>
    `,
  },
  {
    field: "lastLogin",
    header: "Last Login",
    template: (value) =>
      new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
  },
];

// Basic table
export const Basic = () => html`
  <neo-data-table
    style="width: 800px;"
    .columns=${columns}
    .data=${users}
  ></neo-data-table>
`;

// Sortable table
export const Sortable = () => html`
  <neo-data-table
    style="width: 800px;"
    .columns=${columns}
    .data=${users}
    ?sortable=${true}
  ></neo-data-table>
`;

// Filterable table
export const Filterable = () => html`
  <neo-data-table
    style="width: 800px;"
    .columns=${columns}
    .data=${users}
    ?filterable=${true}
  ></neo-data-table>
`;

// Pageable table
export const Pageable = () => html`
  <neo-data-table
    style="width: 800px;"
    .columns=${columns}
    .data=${users}
    ?pageable=${true}
    .pageSize=${10}
  ></neo-data-table>
`;

// Selectable table
export const Selectable = () => {
  const table = document.createElement("neo-data-table");
  table.style.width = "800px";
  table.columns = columns;
  table.data = users;
  table.selectable = true;

  table.addEventListener("select", (e) => {
    console.log("Selected rows:", e.detail.selected);
  });

  return table;
};

// Full-featured table
export const FullFeatured = () => {
  const table = document.createElement("neo-data-table");
  table.style.width = "800px";
  table.columns = columns;
  table.data = users;
  table.sortable = true;
  table.filterable = true;
  table.pageable = true;
  table.selectable = true;
  table.pageSize = 10;

  // Event handlers
  table.addEventListener("sort", (e) => {
    console.log("Sort:", e.detail);
  });

  table.addEventListener("filter", (e) => {
    console.log("Filter:", e.detail);
  });

  table.addEventListener("page", (e) => {
    console.log("Page:", e.detail);
  });

  table.addEventListener("select", (e) => {
    console.log("Selection:", e.detail);
  });

  return table;
};

// Loading state
export const Loading = () => html`
  <neo-data-table
    style="width: 800px;"
    .columns=${columns}
    .data=${users}
    ?loading=${true}
    ?sortable=${true}
    ?filterable=${true}
    ?pageable=${true}
  ></neo-data-table>
`;

// Empty state
export const Empty = () => html`
  <neo-data-table
    style="width: 800px;"
    .columns=${columns}
    .data=${[]}
    ?sortable=${true}
    ?filterable=${true}
    ?pageable=${true}
  ></neo-data-table>
`;
