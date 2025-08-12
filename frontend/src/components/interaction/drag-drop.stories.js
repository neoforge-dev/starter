import {  html  } from 'lit';
import "./drag-drop.js";

export default {
  title: "Interaction/DragDrop",
  component: "ui-drag-drop",
  argTypes: {
    items: { control: "object" },
    layout: {
      control: "select",
      options: ["grid", "list", "kanban", "gallery"],
    },
    variant: {
      control: "select",
      options: ["default", "card", "minimal", "bordered"],
    },
    columns: { control: "number" },
    gap: { control: "text" },
    sortable: { control: "boolean" },
    groupable: { control: "boolean" },
    copyable: { control: "boolean" },
  },
};

const Template = (args) => html`
  <ui-drag-drop
    .items=${args.items}
    .layout=${args.layout}
    .variant=${args.variant}
    .columns=${args.columns}
    .gap=${args.gap}
    ?sortable=${args.sortable}
    ?groupable=${args.groupable}
    ?copyable=${args.copyable}
    @item-move=${(e) => console.log("Item moved:", e.detail)}
    @item-copy=${(e) => console.log("Item copied:", e.detail)}
    @group-change=${(e) => console.log("Group changed:", e.detail)}
  ></ui-drag-drop>
`;

const gridItems = [
  {
    id: "1",
    title: "Item 1",
    description: "Description for item 1",
    image: "https://picsum.photos/200/200?random=1",
    tags: ["tag1", "tag2"],
  },
  {
    id: "2",
    title: "Item 2",
    description: "Description for item 2",
    image: "https://picsum.photos/200/200?random=2",
    tags: ["tag2", "tag3"],
  },
  {
    id: "3",
    title: "Item 3",
    description: "Description for item 3",
    image: "https://picsum.photos/200/200?random=3",
    tags: ["tag1", "tag3"],
  },
  {
    id: "4",
    title: "Item 4",
    description: "Description for item 4",
    image: "https://picsum.photos/200/200?random=4",
    tags: ["tag2", "tag4"],
  },
];

const kanbanItems = {
  todo: {
    title: "To Do",
    items: [
      {
        id: "1",
        title: "Task 1",
        description: "Complete the documentation",
        priority: "high",
        assignee: "John Doe",
      },
      {
        id: "2",
        title: "Task 2",
        description: "Review pull requests",
        priority: "medium",
        assignee: "Jane Smith",
      },
    ],
  },
  "in-progress": {
    title: "In Progress",
    items: [
      {
        id: "3",
        title: "Task 3",
        description: "Implement new feature",
        priority: "high",
        assignee: "John Doe",
      },
    ],
  },
  done: {
    title: "Done",
    items: [
      {
        id: "4",
        title: "Task 4",
        description: "Setup CI/CD pipeline",
        priority: "medium",
        assignee: "Jane Smith",
      },
    ],
  },
};

const galleryItems = [
  {
    id: "1",
    title: "Image 1",
    image: "https://picsum.photos/400/300?random=1",
    type: "image/jpeg",
    size: "2.4 MB",
  },
  {
    id: "2",
    title: "Image 2",
    image: "https://picsum.photos/400/300?random=2",
    type: "image/jpeg",
    size: "1.8 MB",
  },
  {
    id: "3",
    title: "Image 3",
    image: "https://picsum.photos/400/300?random=3",
    type: "image/jpeg",
    size: "3.2 MB",
  },
  {
    id: "4",
    title: "Image 4",
    image: "https://picsum.photos/400/300?random=4",
    type: "image/jpeg",
    size: "2.1 MB",
  },
];

export const Grid = Template.bind({});
Grid.args = {
  layout: "grid",
  variant: "card",
  items: gridItems,
  columns: 3,
  gap: "1rem",
  sortable: true,
  groupable: false,
  copyable: false,
};

export const List = Template.bind({});
List.args = {
  layout: "list",
  variant: "bordered",
  items: gridItems,
  sortable: true,
  groupable: false,
  copyable: true,
};

export const Kanban = Template.bind({});
Kanban.args = {
  layout: "kanban",
  variant: "default",
  items: kanbanItems,
  sortable: true,
  groupable: true,
  copyable: false,
};

export const Gallery = Template.bind({});
Gallery.args = {
  layout: "gallery",
  variant: "minimal",
  items: galleryItems,
  columns: 4,
  gap: "0.5rem",
  sortable: true,
  groupable: false,
  copyable: true,
};
