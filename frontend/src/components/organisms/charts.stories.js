// Charts class import removed - not used

export default {
  title: "Components/Charts",
  component: "neo-charts",
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: { type: "select" },
      options: ["line", "bar", "pie", "donut"],
    },
    width: { control: "number" },
    height: { control: "number" },
    loading: { control: "boolean" },
  },
};

// Sample data
const sampleData = [10, 45, 30, 25, 60, 20, 65, 75];
const sampleLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

export const Line = {
  args: {
    type: "line",
    data: sampleData,
    labels: sampleLabels,
    width: 600,
    height: 400,
    loading: false,
  },
};

export const Bar = {
  args: {
    type: "bar",
    data: sampleData,
    labels: sampleLabels,
    width: 600,
    height: 400,
    loading: false,
  },
};

export const Pie = {
  args: {
    type: "pie",
    data: sampleData.slice(0, 4),
    labels: sampleLabels.slice(0, 4),
    width: 400,
    height: 400,
    loading: false,
  },
};

export const Donut = {
  args: {
    type: "donut",
    data: sampleData.slice(0, 4),
    labels: sampleLabels.slice(0, 4),
    width: 400,
    height: 400,
    loading: false,
  },
};

export const Loading = {
  args: {
    type: "line",
    data: sampleData,
    labels: sampleLabels,
    width: 600,
    height: 400,
    loading: true,
  },
};
