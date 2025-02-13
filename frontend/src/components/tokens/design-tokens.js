// Design Tokens - Core design variables
export const colors = {
  // Brand colors
  primary: "var(--color-primary)",
  secondary: "var(--color-secondary)",
  accent: "var(--color-accent)",

  // Semantic colors
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  error: "var(--color-error)",
  info: "var(--color-info)",

  // Neutral colors
  background: "var(--color-background)",
  surface: "var(--color-surface)",
  text: "var(--color-text)",
  textSecondary: "var(--color-text-secondary)",
};

export const typography = {
  // Font families
  fontPrimary: "var(--font-primary)",
  fontSecondary: "var(--font-secondary)",
  fontMono: "var(--font-mono)",

  // Font sizes
  sizeXs: "var(--font-size-xs)",
  sizeSm: "var(--font-size-sm)",
  sizeMd: "var(--font-size-md)",
  sizeLg: "var(--font-size-lg)",
  sizeXl: "var(--font-size-xl)",

  // Line heights
  lineHeightTight: "var(--line-height-tight)",
  lineHeightNormal: "var(--line-height-normal)",
  lineHeightRelaxed: "var(--line-height-relaxed)",
};

export const spacing = {
  // Base spacing units
  unit: "var(--spacing-unit)",
  xs: "var(--spacing-xs)",
  sm: "var(--spacing-sm)",
  md: "var(--spacing-md)",
  lg: "var(--spacing-lg)",
  xl: "var(--spacing-xl)",

  // Component specific
  componentPadding: "var(--component-padding)",
  containerPadding: "var(--container-padding)",
  sectionSpacing: "var(--section-spacing)",
};

export const animation = {
  // Durations
  durationFast: "var(--duration-fast)",
  durationNormal: "var(--duration-normal)",
  durationSlow: "var(--duration-slow)",

  // Easings
  easeDefault: "var(--ease-default)",
  easeIn: "var(--ease-in)",
  easeOut: "var(--ease-out)",
  easeInOut: "var(--ease-in-out)",
};

export const elevation = {
  // Shadows
  low: "var(--elevation-low)",
  medium: "var(--elevation-medium)",
  high: "var(--elevation-high)",
};

export const breakpoints = {
  // Screen sizes
  sm: "var(--breakpoint-sm)",
  md: "var(--breakpoint-md)",
  lg: "var(--breakpoint-lg)",
  xl: "var(--breakpoint-xl)",
};

export const borderRadius = {
  // Border radius
  none: "var(--radius-none)",
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  full: "var(--radius-full)",
};

export const zIndex = {
  // Z-index scale
  base: "var(--z-base)",
  dropdown: "var(--z-dropdown)",
  sticky: "var(--z-sticky)",
  fixed: "var(--z-fixed)",
  modal: "var(--z-modal)",
  popover: "var(--z-popover)",
  toast: "var(--z-toast)",
};
