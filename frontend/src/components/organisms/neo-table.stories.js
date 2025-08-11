import './neo-table.js';

// Sample data for demonstration
const sampleData = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', status: 'Active', lastLogin: '2024-01-15' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'User', status: 'Active', lastLogin: '2024-01-14' },
  { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Editor', status: 'Inactive', lastLogin: '2024-01-10' },
  { id: 4, name: 'Diana Prince', email: 'diana@example.com', role: 'Admin', status: 'Active', lastLogin: '2024-01-16' },
  { id: 5, name: 'Edward Norton', email: 'edward@example.com', role: 'User', status: 'Active', lastLogin: '2024-01-13' },
  { id: 6, name: 'Fiona Green', email: 'fiona@example.com', role: 'Editor', status: 'Active', lastLogin: '2024-01-12' },
  { id: 7, name: 'George Wilson', email: 'george@example.com', role: 'User', status: 'Inactive', lastLogin: '2024-01-05' },
  { id: 8, name: 'Helen Davis', email: 'helen@example.com', role: 'Admin', status: 'Active', lastLogin: '2024-01-16' },
  { id: 9, name: 'Ian Foster', email: 'ian@example.com', role: 'User', status: 'Active', lastLogin: '2024-01-11' },
  { id: 10, name: 'Julia Roberts', email: 'julia@example.com', role: 'Editor', status: 'Active', lastLogin: '2024-01-15' },
];

const largeDataSet = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: ['Admin', 'User', 'Editor'][i % 3],
  status: ['Active', 'Inactive'][i % 2],
  lastLogin: `2024-01-${String(Math.floor(Math.random() * 30) + 1).padStart(2, '0')}`,
  score: Math.floor(Math.random() * 100),
  department: ['Engineering', 'Marketing', 'Sales', 'HR'][i % 4]
}));

const columns = [
  { field: 'id', header: 'ID', width: '80px' },
  { field: 'name', header: 'Name', width: '150px' },
  { field: 'email', header: 'Email', width: '200px' },
  { field: 'role', header: 'Role', width: '100px' },
  { 
    field: 'status', 
    header: 'Status', 
    width: '100px',
    render: (value) => {
      const color = value === 'Active' ? '#10b981' : '#ef4444';
      return `<span style="color: ${color}; font-weight: 600;">${value}</span>`;
    }
  },
  { field: 'lastLogin', header: 'Last Login', width: '120px' }
];

const extendedColumns = [
  ...columns,
  { field: 'score', header: 'Score', width: '80px' },
  { field: 'department', header: 'Department', width: '120px' }
];

export default {
  title: 'Organisms/Neo Table',
  component: 'neo-table',
  parameters: {
    docs: {
      description: {
        component: 'Advanced data table component with sorting, filtering, pagination, selection, and export capabilities.'
      }
    }
  },
  argTypes: {
    data: {
      control: { type: 'object' },
      description: 'Array of data objects to display in the table'
    },
    columns: {
      control: { type: 'object' },
      description: 'Array of column definitions with field, header, and optional width/render properties'
    },
    pageSize: {
      control: { type: 'number', min: 5, max: 100, step: 5 },
      defaultValue: 10,
      description: 'Number of rows per page'
    },
    selectable: {
      control: { type: 'boolean' },
      defaultValue: false,
      description: 'Enable row selection with checkboxes'
    },
    exportable: {
      control: { type: 'boolean' },
      defaultValue: false,
      description: 'Show export buttons for CSV and JSON'
    },
    striped: {
      control: { type: 'boolean' },
      defaultValue: true,
      description: 'Alternate row background colors'
    },
    bordered: {
      control: { type: 'boolean' },
      defaultValue: true,
      description: 'Show table borders'
    },
    hover: {
      control: { type: 'boolean' },
      defaultValue: true,
      description: 'Highlight rows on hover'
    },
    loading: {
      control: { type: 'boolean' },
      defaultValue: false,
      description: 'Show loading spinner overlay'
    },
    emptyMessage: {
      control: { type: 'text' },
      defaultValue: 'No data available',
      description: 'Message shown when table has no data'
    }
  }
};

// Basic table story
export const Basic = {
  args: {
    data: sampleData,
    columns: columns,
    pageSize: 10,
    striped: true,
    bordered: true,
    hover: true
  }
};

// Table with selection enabled
export const WithSelection = {
  args: {
    data: sampleData,
    columns: columns,
    pageSize: 10,
    selectable: true,
    striped: true,
    bordered: true,
    hover: true
  }
};

// Table with export functionality
export const WithExport = {
  args: {
    data: sampleData,
    columns: columns,
    pageSize: 10,
    exportable: true,
    selectable: true,
    striped: true,
    bordered: true,
    hover: true
  }
};

// Large dataset with pagination
export const LargeDataset = {
  args: {
    data: largeDataSet,
    columns: extendedColumns,
    pageSize: 20,
    exportable: true,
    selectable: true,
    striped: true,
    bordered: true,
    hover: true
  }
};

// Loading state
export const LoadingState = {
  args: {
    data: [],
    columns: columns,
    loading: true,
    pageSize: 10,
    striped: true,
    bordered: true
  }
};

// Empty state
export const EmptyState = {
  args: {
    data: [],
    columns: columns,
    emptyMessage: 'No users found. Try adjusting your search criteria.',
    pageSize: 10,
    striped: true,
    bordered: true
  }
};

// Minimal styling
export const Minimal = {
  args: {
    data: sampleData.slice(0, 5),
    columns: columns,
    pageSize: 10,
    striped: false,
    bordered: false,
    hover: false
  }
};

// Interactive example with event handling
export const InteractiveExample = {
  args: {
    data: sampleData,
    columns: columns,
    pageSize: 5,
    selectable: true,
    exportable: true,
    striped: true,
    bordered: true,
    hover: true
  },
  play: async ({ canvasElement }) => {
    const table = canvasElement.querySelector('neo-table');
    
    // Add event listeners to demonstrate functionality
    table.addEventListener('sort-change', (e) => {
      console.log('Sort changed:', e.detail);
    });
    
    table.addEventListener('filter-change', (e) => {
      console.log('Filter changed:', e.detail);
    });
    
    table.addEventListener('selection-change', (e) => {
      console.log('Selection changed:', e.detail);
    });
    
    table.addEventListener('export-complete', (e) => {
      console.log('Export completed:', e.detail);
    });
  }
};