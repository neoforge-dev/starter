import './neo-data-grid.js';

// Sample data for the data grid
const sampleEmployees = [
  { id: 1, name: 'Sarah Johnson', role: 'Manager', department: 'Engineering', salary: 95000, active: true, startDate: '2022-01-15' },
  { id: 2, name: 'Mike Chen', role: 'Developer', department: 'Engineering', salary: 85000, active: true, startDate: '2022-03-10' },
  { id: 3, name: 'Lisa Rodriguez', role: 'Designer', department: 'Product', salary: 78000, active: true, startDate: '2021-11-20' },
  { id: 4, name: 'David Park', role: 'Analyst', department: 'Marketing', salary: 72000, active: false, startDate: '2021-09-05' },
  { id: 5, name: 'Emma Wilson', role: 'Developer', department: 'Engineering', salary: 88000, active: true, startDate: '2022-07-12' }
];

const employeeColumns = [
  {
    field: 'id',
    header: 'ID',
    width: '80px',
    type: 'number',
    readonly: true
  },
  {
    field: 'name',
    header: 'Full Name',
    width: '180px',
    validate: (value) => {
      if (!value || value.length < 2) {
        return { valid: false, message: 'Name must be at least 2 characters' };
      }
      return { valid: true };
    }
  },
  {
    field: 'role',
    header: 'Role',
    width: '120px',
    type: 'select',
    options: [
      { value: 'Manager', label: 'Manager' },
      { value: 'Developer', label: 'Developer' },
      { value: 'Designer', label: 'Designer' },
      { value: 'Analyst', label: 'Business Analyst' }
    ]
  },
  {
    field: 'department',
    header: 'Department',
    width: '130px',
    type: 'select',
    options: [
      { value: 'Engineering', label: 'Engineering' },
      { value: 'Product', label: 'Product' },
      { value: 'Marketing', label: 'Marketing' },
      { value: 'Sales', label: 'Sales' }
    ]
  },
  {
    field: 'salary',
    header: 'Salary',
    width: '120px',
    type: 'number',
    render: (value) => `$${value?.toLocaleString()}`
  },
  {
    field: 'active',
    header: 'Active',
    width: '80px',
    type: 'checkbox',
    render: (value) => value ? '✅' : '❌'
  },
  {
    field: 'startDate',
    header: 'Start Date',
    width: '120px',
    type: 'date'
  }
];

const projectData = [
  { id: 'P001', name: 'Website Redesign', status: 'In Progress', priority: 'High', progress: 75, assignee: 'Sarah Johnson' },
  { id: 'P002', name: 'Mobile App', status: 'Planning', priority: 'Medium', progress: 25, assignee: 'Mike Chen' },
  { id: 'P003', name: 'Database Migration', status: 'Completed', priority: 'Critical', progress: 100, assignee: 'Lisa Rodriguez' },
  { id: 'P004', name: 'API Documentation', status: 'On Hold', priority: 'Low', progress: 40, assignee: 'David Park' }
];

const projectColumns = [
  { field: 'id', header: 'Project ID', width: '100px' },
  { field: 'name', header: 'Project Name', width: '180px' },
  {
    field: 'status',
    header: 'Status',
    width: '120px',
    type: 'select',
    options: [
      { value: 'Planning', label: 'Planning' },
      { value: 'In Progress', label: 'In Progress' },
      { value: 'On Hold', label: 'On Hold' },
      { value: 'Completed', label: 'Completed' }
    ],
    render: (value) => {
      const colors = {
        'Planning': '#f59e0b',
        'In Progress': '#3b82f6',
        'On Hold': '#ef4444',
        'Completed': '#10b981'
      };
      return `<span style="color: ${colors[value]}; font-weight: 600;">● ${value}</span>`;
    }
  },
  {
    field: 'priority',
    header: 'Priority',
    width: '100px',
    type: 'select',
    options: [
      { value: 'Low', label: 'Low' },
      { value: 'Medium', label: 'Medium' },
      { value: 'High', label: 'High' },
      { value: 'Critical', label: 'Critical' }
    ]
  },
  {
    field: 'progress',
    header: 'Progress',
    width: '100px',
    type: 'number',
    render: (value) => `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="flex: 1; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
          <div style="width: ${value}%; height: 100%; background: #10b981; transition: width 0.3s;"></div>
        </div>
        <span style="font-size: 12px; color: #6b7280;">${value}%</span>
      </div>
    `
  },
  { field: 'assignee', header: 'Assignee', width: '140px' }
];

export default {
  title: 'Organisms/Neo Data Grid',
  component: 'neo-data-grid',
  parameters: {
    docs: {
      description: {
        component: 'Advanced data grid component with inline editing, real-time updates, drag-and-drop, and comprehensive data manipulation capabilities.'
      }
    }
  },
  argTypes: {
    data: {
      control: { type: 'object' },
      description: 'Array of data objects to display and edit'
    },
    columns: {
      control: { type: 'object' },
      description: 'Array of column definitions with field, header, type, and validation properties'
    },
    editable: {
      control: { type: 'boolean' },
      defaultValue: true,
      description: 'Enable inline cell editing'
    },
    sortable: {
      control: { type: 'boolean' },
      defaultValue: true,
      description: 'Enable column sorting'
    },
    filterable: {
      control: { type: 'boolean' },
      defaultValue: true,
      description: 'Show column filter inputs'
    },
    resizable: {
      control: { type: 'boolean' },
      defaultValue: true,
      description: 'Enable column resizing'
    },
    reorderable: {
      control: { type: 'boolean' },
      defaultValue: false,
      description: 'Enable column reordering'
    },
    autoSave: {
      control: { type: 'boolean' },
      defaultValue: false,
      description: 'Automatically save changes on cell edit'
    },
    validateOnEdit: {
      control: { type: 'boolean' },
      defaultValue: true,
      description: 'Validate cell values during editing'
    },
    showRowNumbers: {
      control: { type: 'boolean' },
      defaultValue: false,
      description: 'Show row numbers column'
    },
    multiSelect: {
      control: { type: 'boolean' },
      defaultValue: true,
      description: 'Enable multi-row selection with checkboxes'
    },
    dragToReorder: {
      control: { type: 'boolean' },
      defaultValue: false,
      description: 'Enable drag-and-drop row reordering'
    },
    realTimeUpdates: {
      control: { type: 'boolean' },
      defaultValue: false,
      description: 'Show real-time update indicator'
    }
  }
};

// Basic editable grid
export const BasicEditable = {
  args: {
    data: sampleEmployees,
    columns: employeeColumns,
    editable: true,
    sortable: true,
    filterable: true,
    validateOnEdit: true,
    multiSelect: true
  }
};

// Project management grid with status indicators
export const ProjectManagement = {
  args: {
    data: projectData,
    columns: projectColumns,
    editable: true,
    sortable: true,
    filterable: true,
    showRowNumbers: true,
    multiSelect: true,
    validateOnEdit: true
  }
};

// Auto-save enabled grid
export const AutoSaveGrid = {
  args: {
    data: sampleEmployees.slice(0, 3),
    columns: employeeColumns,
    editable: true,
    autoSave: true,
    validateOnEdit: true,
    realTimeUpdates: true,
    sortable: true,
    filterable: true
  }
};

// Grid with all features enabled
export const FullFeatured = {
  args: {
    data: sampleEmployees,
    columns: employeeColumns,
    editable: true,
    sortable: true,
    filterable: true,
    resizable: true,
    reorderable: true,
    autoSave: false,
    validateOnEdit: true,
    showRowNumbers: true,
    multiSelect: true,
    dragToReorder: true,
    realTimeUpdates: true
  }
};

// Read-only grid for display purposes
export const ReadOnly = {
  args: {
    data: projectData,
    columns: projectColumns,
    editable: false,
    sortable: true,
    filterable: true,
    showRowNumbers: false,
    multiSelect: false
  }
};

// Large dataset performance test
export const LargeDataset = {
  args: {
    data: Array.from({ length: 500 }, (_, i) => ({
      id: i + 1,
      name: `Employee ${i + 1}`,
      role: ['Manager', 'Developer', 'Designer', 'Analyst'][i % 4],
      department: ['Engineering', 'Product', 'Marketing', 'Sales'][i % 4],
      salary: 50000 + (i % 10) * 5000,
      active: i % 3 !== 0,
      startDate: `2022-${String(Math.floor(i % 12) + 1).padStart(2, '0')}-${String(Math.floor(i % 28) + 1).padStart(2, '0')}`
    })),
    columns: employeeColumns,
    editable: true,
    sortable: true,
    filterable: true,
    multiSelect: true,
    pageSize: 100
  }
};

// Validation showcase
export const ValidationShowcase = {
  args: {
    data: [
      { id: 1, name: '', email: 'invalid-email', age: -5, score: 150 },
      { id: 2, name: 'Valid Name', email: 'valid@email.com', age: 25, score: 85 }
    ],
    columns: [
      {
        field: 'id',
        header: 'ID',
        type: 'number',
        readonly: true
      },
      {
        field: 'name',
        header: 'Name',
        validate: (value) => {
          if (!value || value.length < 2) {
            return { valid: false, message: 'Name required (min 2 chars)' };
          }
          return { valid: true };
        }
      },
      {
        field: 'email',
        header: 'Email',
        validate: (value) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return { valid: false, message: 'Invalid email format' };
          }
          return { valid: true };
        }
      },
      {
        field: 'age',
        header: 'Age',
        type: 'number',
        validate: (value) => {
          if (value < 0 || value > 120) {
            return { valid: false, message: 'Age must be 0-120' };
          }
          return { valid: true };
        }
      },
      {
        field: 'score',
        header: 'Score',
        type: 'number',
        validate: (value) => {
          if (value < 0 || value > 100) {
            return { valid: false, message: 'Score must be 0-100' };
          }
          return { valid: true };
        }
      }
    ],
    editable: true,
    validateOnEdit: true,
    autoSave: false
  }
};

// Interactive example with event handling
export const InteractiveExample = {
  args: {
    data: sampleEmployees.slice(0, 4),
    columns: employeeColumns,
    editable: true,
    sortable: true,
    filterable: true,
    multiSelect: true,
    validateOnEdit: true,
    autoSave: false
  },
  play: async ({ canvasElement }) => {
    const grid = canvasElement.querySelector('neo-data-grid');

    // Add comprehensive event listeners
    grid.addEventListener('cell-edit-start', (e) => {
      console.log('Cell edit started:', e.detail);
    });

    grid.addEventListener('cell-value-change', (e) => {
      console.log('Cell value changed:', e.detail);
    });

    grid.addEventListener('cell-save-success', (e) => {
      console.log('Cell saved successfully:', e.detail);
    });

    grid.addEventListener('cell-save-error', (e) => {
      console.log('Cell save failed:', e.detail);
    });

    grid.addEventListener('row-selection-change', (e) => {
      console.log('Row selection changed:', e.detail);
    });

    grid.addEventListener('row-add', (e) => {
      console.log('Row added:', e.detail);
    });

    grid.addEventListener('row-delete', (e) => {
      console.log('Row deleted:', e.detail);
    });

    grid.addEventListener('real-time-update', (e) => {
      console.log('Real-time update:', e.detail);
    });
  }
};
