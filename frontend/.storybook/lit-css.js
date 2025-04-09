// This file provides a css function for lit components in Storybook
// It's used to fix compatibility issues with different lit versions

import { css as litCss } from "@lit/reactive-element/css-tag.js";

export const css = litCss;
export default css;
