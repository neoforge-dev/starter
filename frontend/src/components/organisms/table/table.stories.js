import {   html   } from 'lit';
import "./table.js";

const columns = [
  { key: "id", label: "ID", sortable: true, filterable: true },
  { key: "name", label: "Name", sortable: true, filterable: true },
  { key: "email", label: "Email", sortable: true, filterable: true },
  { key: "role", label: "Role", sortable: true, filterable: true },
  { key: "status", label: "Status", sortable: true, filterable: true },
];

const users = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: "Admin",
    status: "Active",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    role: "User",
    status: "Active",
  },
  {
    id: 3,
    name: "Bob Johnson",
    email: "bob@example.com",
    role: "Editor",
    status: "Inactive",
  },
  {
    id: 4,
    name: "Alice Brown",
    email: "alice@example.com",
    role: "User",
    status: "Active",
  },
  {
    id: 5,
    name: "Charlie Wilson",
    email: "charlie@example.com",
    role: "Editor",
    status: "Active",
  },
  {
    id: 6,
    name: "Diana Miller",
    email: "diana@example.com",
    role: "Admin",
    status: "Inactive",
  },
  {
    id: 7,
    name: "Edward Davis",
    email: "edward@example.com",
    role: "User",
    status: "Active",
  },
  {
    id: 8,
    name: "Fiona Clark",
    email: "fiona@example.com",
    role: "Editor",
    status: "Active",
  },
  {
    id: 9,
    name: "George White",
    email: "george@example.com",
    role: "User",
    status: "Inactive",
  },
  {
    id: 10,
    name: "Helen Young",
    email: "helen@example.com",
    role: "Admin",
    status: "Active",
  },
];

const productColumns = [
  { key: "id", label: "ID", sortable: true, filterable: true },
  { key: "name", label: "Product", sortable: true, filterable: true },
  { key: "category", label: "Category", sortable: true, filterable: true },
  { key: "price", label: "Price", sortable: true, filterable: true },
  { key: "stock", label: "Stock", sortable: true, filterable: true },
];

const products = [
  {
    id: 1,
    name: "Laptop Pro",
    category: "Electronics",
    price: "$1299.99",
    stock: 45,
  },
  {
    id: 2,
    name: "Wireless Mouse",
    category: "Accessories",
    price: "$29.99",
    stock: 150,
  },
  {
    id: 3,
    name: "4K Monitor",
    category: "Electronics",
    price: "$499.99",
    stock: 30,
  },
  {
    id: 4,
    name: "Mechanical Keyboard",
    category: "Accessories",
    price: "$129.99",
    stock: 75,
  },
  {
    id: 5,
    name: "USB-C Hub",
    category: "Accessories",
    price: "$49.99",
    stock: 100,
  },
];

export default {
  title: "Organisms/Table",
  component: "neo-table",
  argTypes: {
    sortable: { control: "boolean" },
    filterable: { control: "boolean" },
    selectable: { control: "boolean" },
    paginated: { control: "boolean" },
    pageSize: { control: "number" },
    emptyMessage: { control: "text" },
  },
};

const Template = (args) => html`
  <neo-table
    .columns=${args.columns}
    .data=${args.data}
    ?sortable=${args.sortable}
    ?filterable=${args.filterable}
    ?selectable=${args.selectable}
    ?paginated=${args.paginated}
    .pageSize=${args.pageSize}
    .emptyMessage=${args.emptyMessage}
    @neo-sort=${(e) => console.log("Sort:", e.detail)}
    @neo-filter=${(e) => console.log("Filter:", e.detail)}
    @neo-select=${(e) => console.log("Select:", e.detail)}
    @neo-page=${(e) => console.log("Page:", e.detail)}
  ></neo-table>
`;

// Basic table without any features
export const Basic = Template.bind({});
Basic.args = {
  columns,
  data: users,
  sortable: false,
  filterable: false,
  selectable: false,
  paginated: false,
};

// Table with all features enabled
export const FullFeatured = Template.bind({});
FullFeatured.args = {
  columns,
  data: users,
  sortable: true,
  filterable: true,
  selectable: true,
  paginated: true,
  pageSize: 5,
};

// Table with sorting only
export const SortableOnly = Template.bind({});
SortableOnly.args = {
  columns,
  data: users,
  sortable: true,
  filterable: false,
  selectable: false,
  paginated: false,
};

// Table with filtering only
export const FilterableOnly = Template.bind({});
FilterableOnly.args = {
  columns,
  data: users,
  sortable: false,
  filterable: true,
  selectable: false,
  paginated: false,
};

// Table with row selection only
export const SelectableOnly = Template.bind({});
SelectableOnly.args = {
  columns,
  data: users,
  sortable: false,
  filterable: false,
  selectable: true,
  paginated: false,
};

// Table with pagination only
export const PaginatedOnly = Template.bind({});
PaginatedOnly.args = {
  columns,
  data: users,
  sortable: false,
  filterable: false,
  selectable: false,
  paginated: true,
  pageSize: 5,
};

// Empty table
export const Empty = Template.bind({});
Empty.args = {
  columns,
  data: [],
  sortable: true,
  filterable: true,
  selectable: true,
  paginated: true,
  emptyMessage: "No users found",
};

// Product table example
export const ProductTable = Template.bind({});
ProductTable.args = {
  columns: productColumns,
  data: products,
  sortable: true,
  filterable: true,
  selectable: true,
  paginated: true,
  pageSize: 5,
};

// Small page size
export const SmallPageSize = Template.bind({});
SmallPageSize.args = {
  columns,
  data: users,
  sortable: true,
  filterable: true,
  selectable: true,
  paginated: true,
  pageSize: 3,
};

// Large page size
export const LargePageSize = Template.bind({});
LargePageSize.args = {
  columns,
  data: users,
  sortable: true,
  filterable: true,
  selectable: true,
  paginated: true,
  pageSize: 10,
};
