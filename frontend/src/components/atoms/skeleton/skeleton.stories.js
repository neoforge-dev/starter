import "./skeleton.js";

export default {
  title: "Atoms/Skeleton",
  component: "neo-skeleton",
  parameters: {
    docs: {
      description: {
        component: `
A flexible skeleton loader component that provides better loading UX compared to traditional spinners. Perfect for content placeholders while data is being fetched.

## Features
- Multiple skeleton variants (text, heading, paragraph, circle, rectangle, card)
- Smooth shimmer animation with customization options
- Multiple size variants (xs, sm, md, lg, xl)
- Light and dark theme support
- Customizable dimensions and styling
- Multiple skeleton rendering
- Full accessibility support
- Responsive design

## Usage
\`\`\`html
<neo-skeleton variant="text" animated></neo-skeleton>
<neo-skeleton variant="card" animated></neo-skeleton>
<neo-skeleton variant="paragraph" lines="3" animated></neo-skeleton>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: "radio",
      options: ["text", "heading", "paragraph", "circle", "rectangle", "card"],
      description: "Type of skeleton loader",
    },
    size: {
      control: "radio",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Size of the skeleton",
    },
    width: {
      control: "text",
      description: "Custom width (CSS value)",
    },
    height: {
      control: "text",
      description: "Custom height (CSS value)",
    },
    lines: {
      control: { type: "number", min: 1, max: 10 },
      description: "Number of lines for paragraph variant",
    },
    count: {
      control: { type: "number", min: 1, max: 10 },
      description: "Number of skeleton items to render",
    },
    animated: {
      control: "boolean",
      description: "Whether to show shimmer animation",
    },
    theme: {
      control: "radio",
      options: ["light", "dark"],
      description: "Color theme",
    },
    borderRadius: {
      control: "text",
      description: "Custom border radius (CSS value)",
    },
    spacing: {
      control: "text",
      description: "Spacing between multiple skeletons",
    },
  },
};

const Template = (args) => {
  const skeleton = document.createElement("neo-skeleton");
  
  Object.keys(args).forEach((key) => {
    if (args[key] !== undefined && args[key] !== null) {
      if (typeof args[key] === "boolean") {
        if (args[key]) {
          skeleton.setAttribute(key, "");
        }
      } else {
        skeleton.setAttribute(key, args[key]);
      }
    }
  });

  return skeleton;
};

export const Default = Template.bind({});
Default.args = {
  variant: "text",
  animated: true,
};

export const Variants = () => {
  const container = document.createElement("div");
  container.style.cssText = "display: flex; flex-direction: column; gap: 1.5rem;";

  const variants = [
    { variant: "text", label: "Text" },
    { variant: "heading", label: "Heading" },
    { variant: "paragraph", lines: 3, label: "Paragraph (3 lines)" },
    { variant: "circle", label: "Circle" },
    { variant: "rectangle", width: "200px", height: "100px", label: "Rectangle" },
    { variant: "card", label: "Card" },
  ];

  variants.forEach(({ label, ...props }) => {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "display: flex; flex-direction: column; gap: 0.5rem;";
    
    const labelElement = document.createElement("h4");
    labelElement.textContent = label;
    labelElement.style.margin = "0";
    labelElement.style.fontSize = "0.875rem";
    labelElement.style.color = "#666";
    
    const skeleton = Template({ ...props, animated: true });
    
    wrapper.appendChild(labelElement);
    wrapper.appendChild(skeleton);
    container.appendChild(wrapper);
  });

  return container;
};

export const Sizes = () => {
  const container = document.createElement("div");
  container.style.cssText = "display: flex; flex-direction: column; gap: 1.5rem;";

  const sizes = ["xs", "sm", "md", "lg", "xl"];
  
  // Text sizes
  const textContainer = document.createElement("div");
  textContainer.style.cssText = "display: flex; flex-direction: column; gap: 0.5rem;";
  const textTitle = document.createElement("h4");
  textTitle.textContent = "Text Sizes";
  textTitle.style.margin = "0 0 0.5rem 0";
  textContainer.appendChild(textTitle);
  
  sizes.forEach((size) => {
    const skeleton = Template({
      variant: "text",
      size,
      animated: true,
    });
    textContainer.appendChild(skeleton);
  });
  
  // Circle sizes
  const circleContainer = document.createElement("div");
  circleContainer.style.cssText = "display: flex; flex-direction: column; gap: 0.5rem;";
  const circleTitle = document.createElement("h4");
  circleTitle.textContent = "Circle Sizes";
  circleTitle.style.margin = "0 0 0.5rem 0";
  circleContainer.appendChild(circleTitle);
  
  const circleWrapper = document.createElement("div");
  circleWrapper.style.cssText = "display: flex; align-items: center; gap: 1rem;";
  
  sizes.forEach((size) => {
    const skeleton = Template({
      variant: "circle",
      size,
      animated: true,
    });
    circleWrapper.appendChild(skeleton);
  });
  
  circleContainer.appendChild(circleWrapper);

  container.appendChild(textContainer);
  container.appendChild(circleContainer);
  
  return container;
};

export const Themes = () => {
  const container = document.createElement("div");
  container.style.cssText = "display: flex; gap: 2rem;";

  const themes = [
    { theme: "light", label: "Light Theme" },
    { theme: "dark", label: "Dark Theme" },
  ];

  themes.forEach(({ theme, label }) => {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = `
      display: flex; 
      flex-direction: column; 
      gap: 1rem; 
      padding: 1rem; 
      border-radius: 8px;
      background-color: ${theme === "dark" ? "#1a1a1a" : "#ffffff"};
      border: 1px solid ${theme === "dark" ? "#333" : "#ddd"};
      min-width: 200px;
    `;
    
    const title = document.createElement("h4");
    title.textContent = label;
    title.style.margin = "0";
    title.style.color = theme === "dark" ? "#fff" : "#333";
    
    const skeletons = [
      { variant: "heading", animated: true },
      { variant: "paragraph", lines: 3, animated: true },
      { variant: "circle", animated: true },
    ];
    
    wrapper.appendChild(title);
    
    skeletons.forEach((props) => {
      const skeleton = Template({ ...props, theme });
      wrapper.appendChild(skeleton);
    });
    
    container.appendChild(wrapper);
  });

  return container;
};

export const CustomDimensions = () => {
  const container = document.createElement("div");
  container.style.cssText = "display: flex; flex-direction: column; gap: 1.5rem;";

  const configs = [
    {
      title: "Custom Width Text",
      variant: "text",
      width: "150px",
    },
    {
      title: "Custom Rectangle",
      variant: "rectangle",
      width: "300px",
      height: "60px",
    },
    {
      title: "Custom Circle",
      variant: "circle",
      width: "80px",
      height: "80px",
    },
    {
      title: "Custom Border Radius",
      variant: "rectangle",
      width: "200px",
      height: "100px",
      borderRadius: "20px",
    },
  ];

  configs.forEach(({ title, ...props }) => {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "display: flex; flex-direction: column; gap: 0.5rem;";
    
    const titleElement = document.createElement("h4");
    titleElement.textContent = title;
    titleElement.style.margin = "0";
    titleElement.style.fontSize = "0.875rem";
    titleElement.style.color = "#666";
    
    const skeleton = Template({ ...props, animated: true });
    
    wrapper.appendChild(titleElement);
    wrapper.appendChild(skeleton);
    container.appendChild(wrapper);
  });

  return container;
};

export const MultipleSkeletons = () => {
  const container = document.createElement("div");
  container.style.cssText = "display: flex; flex-direction: column; gap: 2rem;";

  const configs = [
    {
      title: "Multiple Text Lines",
      variant: "text",
      count: 5,
      spacing: "8px",
    },
    {
      title: "Multiple Cards",
      variant: "card",
      count: 3,
      spacing: "16px",
    },
    {
      title: "Multiple Circles",
      variant: "circle",
      count: 4,
      spacing: "12px",
    },
  ];

  configs.forEach(({ title, ...props }) => {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "display: flex; flex-direction: column; gap: 0.5rem;";
    
    const titleElement = document.createElement("h4");
    titleElement.textContent = title;
    titleElement.style.margin = "0";
    titleElement.style.fontSize = "0.875rem";
    titleElement.style.color = "#666";
    
    const skeleton = Template({ ...props, animated: true });
    
    wrapper.appendChild(titleElement);
    wrapper.appendChild(skeleton);
    container.appendChild(wrapper);
  });

  return container;
};

export const CardLayouts = () => {
  const container = document.createElement("div");
  container.style.cssText = "display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;";

  const cards = Array.from({ length: 3 }, (_, index) => {
    return Template({
      variant: "card",
      animated: true,
    });
  });

  cards.forEach(card => container.appendChild(card));
  
  return container;
};

export const ListLayout = () => {
  const container = document.createElement("div");
  container.style.cssText = "display: flex; flex-direction: column; gap: 1rem; max-width: 600px;";

  const items = Array.from({ length: 5 }, (_, index) => {
    const item = document.createElement("div");
    item.style.cssText = "display: flex; align-items: center; gap: 1rem; padding: 1rem; border: 1px solid #eee; border-radius: 8px;";
    
    const avatar = Template({
      variant: "circle",
      size: "md",
      animated: true,
    });
    
    const content = document.createElement("div");
    content.style.cssText = "flex: 1; display: flex; flex-direction: column; gap: 0.5rem;";
    
    const title = Template({
      variant: "text",
      width: "60%",
      animated: true,
    });
    
    const subtitle = Template({
      variant: "text",
      width: "40%",
      size: "sm",
      animated: true,
    });
    
    content.appendChild(title);
    content.appendChild(subtitle);
    
    item.appendChild(avatar);
    item.appendChild(content);
    
    return item;
  });

  items.forEach(item => container.appendChild(item));
  
  return container;
};

export const AnimationComparison = () => {
  const container = document.createElement("div");
  container.style.cssText = "display: flex; gap: 2rem;";

  const configs = [
    { title: "With Animation", animated: true },
    { title: "Without Animation", animated: false },
  ];

  configs.forEach(({ title, animated }) => {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "display: flex; flex-direction: column; gap: 1rem; min-width: 200px;";
    
    const titleElement = document.createElement("h4");
    titleElement.textContent = title;
    titleElement.style.margin = "0";
    
    const skeletons = [
      { variant: "heading" },
      { variant: "paragraph", lines: 3 },
      { variant: "circle" },
    ];
    
    wrapper.appendChild(titleElement);
    
    skeletons.forEach((props) => {
      const skeleton = Template({ ...props, animated });
      wrapper.appendChild(skeleton);
    });
    
    container.appendChild(wrapper);
  });

  return container;
};

export const RealWorldExample = () => {
  const container = document.createElement("div");
  container.style.cssText = "display: flex; flex-direction: column; gap: 1.5rem; max-width: 800px;";

  // Header skeleton
  const header = document.createElement("div");
  header.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding-bottom: 1rem; border-bottom: 1px solid #eee;";
  
  const headerTitle = Template({
    variant: "heading",
    size: "lg",
    width: "200px",
    animated: true,
  });
  
  const headerAction = Template({
    variant: "rectangle",
    width: "100px",
    height: "40px",
    borderRadius: "6px",
    animated: true,
  });
  
  header.appendChild(headerTitle);
  header.appendChild(headerAction);

  // Content grid
  const grid = document.createElement("div");
  grid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;";
  
  const cards = Array.from({ length: 6 }, () => {
    return Template({
      variant: "card",
      animated: true,
    });
  });
  
  cards.forEach(card => grid.appendChild(card));

  container.appendChild(header);
  container.appendChild(grid);
  
  return container;
};

export const Accessibility = Template.bind({});
Accessibility.args = {
  variant: "paragraph",
  lines: 3,
  animated: true,
};
Accessibility.parameters = {
  docs: {
    description: {
      story: `
This story demonstrates the accessibility features:
- Proper ARIA attributes (role="status", aria-live="polite")
- Screen reader announcements for loading state
- Semantic structure that doesn't interfere with assistive technology
- Keyboard navigation compatibility
      `,
    },
  },
};