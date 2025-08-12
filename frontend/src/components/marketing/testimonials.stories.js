import {  html  } from 'lit';
import "./testimonials.js";

export default {
  title: "Marketing/Testimonials",
  component: "ui-testimonials",
  argTypes: {
    items: { control: "object" },
    layout: {
      control: "select",
      options: ["grid", "carousel", "masonry", "featured"],
    },
    variant: {
      control: "select",
      options: ["default", "minimal", "card", "quote"],
    },
    columns: { control: "number" },
    autoplay: { control: "boolean" },
    interval: { control: "number" },
  },
};

const Template = (args) => html`
  <ui-testimonials
    .items=${args.items}
    .layout=${args.layout}
    .variant=${args.variant}
    .columns=${args.columns}
    ?autoplay=${args.autoplay}
    .interval=${args.interval}
  ></ui-testimonials>
`;

const defaultTestimonials = [
  {
    content:
      "NeoForge has transformed our development workflow. The components are well-designed, performant, and a joy to work with.",
    author: "Sarah Chen",
    role: "Lead Developer",
    company: "TechCorp",
    avatar: "https://i.pravatar.cc/150?u=sarah",
    rating: 5,
  },
  {
    content:
      "The attention to detail and performance optimizations in NeoForge are outstanding. It's become our go-to framework for new projects.",
    author: "Michael Rodriguez",
    role: "CTO",
    company: "StartupX",
    avatar: "https://i.pravatar.cc/150?u=michael",
    rating: 5,
  },
  {
    content:
      "We've cut our development time in half since switching to NeoForge. The documentation is excellent and the community is incredibly helpful.",
    author: "Emily Thompson",
    role: "Frontend Engineer",
    company: "DesignLabs",
    avatar: "https://i.pravatar.cc/150?u=emily",
    rating: 4,
  },
];

export const Grid = Template.bind({});
Grid.args = {
  layout: "grid",
  variant: "default",
  columns: 3,
  items: defaultTestimonials,
};

export const Carousel = Template.bind({});
Carousel.args = {
  layout: "carousel",
  variant: "card",
  autoplay: true,
  interval: 5000,
  items: [
    ...defaultTestimonials,
    {
      content:
        "The component library is extensive and well-documented. It's saved us countless hours of development time.",
      author: "David Kim",
      role: "Senior Developer",
      company: "WebSolutions",
      avatar: "https://i.pravatar.cc/150?u=david",
      rating: 5,
    },
    {
      content:
        "NeoForge's performance optimizations are incredible. Our load times have improved significantly.",
      author: "Lisa Wang",
      role: "Performance Engineer",
      company: "SpeedTech",
      avatar: "https://i.pravatar.cc/150?u=lisa",
      rating: 5,
    },
  ],
};

export const Masonry = Template.bind({});
Masonry.args = {
  layout: "masonry",
  variant: "minimal",
  columns: 3,
  items: [
    ...defaultTestimonials,
    {
      content:
        "The flexibility and extensibility of NeoForge is unmatched. It's perfect for both small and large-scale applications.",
      author: "James Wilson",
      role: "Software Architect",
      company: "ArchitectCo",
      avatar: "https://i.pravatar.cc/150?u=james",
      rating: 5,
    },
    {
      content:
        "Customer support is exceptional. Any issues we've encountered were resolved quickly and professionally.",
      author: "Anna Martinez",
      role: "Product Manager",
      company: "ProductPro",
      avatar: "https://i.pravatar.cc/150?u=anna",
      rating: 4,
    },
  ],
};

export const Featured = Template.bind({});
Featured.args = {
  layout: "featured",
  variant: "quote",
  items: [
    {
      content:
        "NeoForge has revolutionized how we build web applications. The developer experience is unmatched, and the performance benefits are real. We've seen a 40% improvement in our core web vitals since making the switch.",
      author: "Alexandra Foster",
      role: "VP of Engineering",
      company: "EnterpriseNow",
      avatar: "https://i.pravatar.cc/150?u=alexandra",
      rating: 5,
      featured: true,
    },
    ...defaultTestimonials,
  ],
};
