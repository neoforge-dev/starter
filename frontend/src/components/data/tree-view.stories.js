import {  html  } from 'lit';
import "./tree-view.js";

export default {
  title: "Data/TreeView",
  component: "ui-tree-view",
  argTypes: {
    items: { control: "object" },
    variant: {
      control: "select",
      options: ["default", "lines", "folder", "custom"],
    },
    selectable: { control: "boolean" },
    multiSelect: { control: "boolean" },
    defaultExpanded: { control: "boolean" },
    searchable: { control: "boolean" },
    dragAndDrop: { control: "boolean" },
  },
};

const Template = (args) => html`
  <ui-tree-view
    .items=${args.items}
    .variant=${args.variant}
    ?selectable=${args.selectable}
    ?multiSelect=${args.multiSelect}
    ?defaultExpanded=${args.defaultExpanded}
    ?searchable=${args.searchable}
    ?dragAndDrop=${args.dragAndDrop}
    @node-select=${(e) => console.log("Node selected:", e.detail)}
    @node-toggle=${(e) => console.log("Node toggled:", e.detail)}
    @node-drop=${(e) => console.log("Node dropped:", e.detail)}
  ></ui-tree-view>
`;

const fileSystemData = [
  {
    id: "1",
    label: "src",
    icon: "📁",
    children: [
      {
        id: "1-1",
        label: "components",
        icon: "📁",
        children: [
          {
            id: "1-1-1",
            label: "Button.js",
            icon: "📄",
          },
          {
            id: "1-1-2",
            label: "Input.js",
            icon: "📄",
          },
        ],
      },
      {
        id: "1-2",
        label: "utils",
        icon: "📁",
        children: [
          {
            id: "1-2-1",
            label: "helpers.js",
            icon: "📄",
          },
        ],
      },
    ],
  },
  {
    id: "2",
    label: "public",
    icon: "📁",
    children: [
      {
        id: "2-1",
        label: "index.html",
        icon: "📄",
      },
      {
        id: "2-2",
        label: "styles.css",
        icon: "📄",
      },
    ],
  },
];

const organizationData = [
  {
    id: "1",
    label: "Engineering",
    icon: "👥",
    children: [
      {
        id: "1-1",
        label: "Frontend",
        icon: "👤",
        children: [
          {
            id: "1-1-1",
            label: "John Doe",
            icon: "👤",
            meta: "Senior Developer",
          },
        ],
      },
      {
        id: "1-2",
        label: "Backend",
        icon: "👤",
        children: [
          {
            id: "1-2-1",
            label: "Jane Smith",
            icon: "👤",
            meta: "Lead Developer",
          },
        ],
      },
    ],
  },
  {
    id: "2",
    label: "Design",
    icon: "👥",
    children: [
      {
        id: "2-1",
        label: "UI Team",
        icon: "👤",
        children: [
          {
            id: "2-1-1",
            label: "Sarah Johnson",
            icon: "👤",
            meta: "UI Designer",
          },
        ],
      },
    ],
  },
];

const customData = [
  {
    id: "1",
    label: "Project Alpha",
    icon: "🚀",
    status: "active",
    progress: 75,
    children: [
      {
        id: "1-1",
        label: "Phase 1",
        icon: "📌",
        status: "completed",
        progress: 100,
      },
      {
        id: "1-2",
        label: "Phase 2",
        icon: "📌",
        status: "in-progress",
        progress: 50,
        children: [
          {
            id: "1-2-1",
            label: "Task 1",
            icon: "✓",
            status: "completed",
            progress: 100,
          },
          {
            id: "1-2-2",
            label: "Task 2",
            icon: "⚡",
            status: "in-progress",
            progress: 30,
          },
        ],
      },
    ],
  },
  {
    id: "2",
    label: "Project Beta",
    icon: "🚀",
    status: "planned",
    progress: 0,
    children: [
      {
        id: "2-1",
        label: "Planning",
        icon: "📋",
        status: "planned",
        progress: 0,
      },
    ],
  },
];

export const FileSystem = Template.bind({});
FileSystem.args = {
  variant: "folder",
  items: fileSystemData,
  selectable: true,
  multiSelect: false,
  defaultExpanded: false,
  searchable: true,
  dragAndDrop: true,
};

export const Organization = Template.bind({});
Organization.args = {
  variant: "lines",
  items: organizationData,
  selectable: true,
  multiSelect: true,
  defaultExpanded: true,
  searchable: true,
  dragAndDrop: false,
};

export const CustomNodes = Template.bind({});
CustomNodes.args = {
  variant: "custom",
  items: customData,
  selectable: true,
  multiSelect: false,
  defaultExpanded: true,
  searchable: true,
  dragAndDrop: true,
};
