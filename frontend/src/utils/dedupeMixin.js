/*
 * dedupeMixin.js
 * A utility function to deduplicate mixins so that each mixin is applied only once per base class.
 *
 * Usage:
 *   import { dedupeMixin } from './dedupeMixin.js';
 *   const MyMixin = dedupeMixin((superclass) => class extends superclass { ... });
 */

/**
 * Utility function to deduplicate mixins in the prototype chain
 * @param {Function} mixin - The mixin function to deduplicate
 * @returns {Function} - The deduped mixin function
 */
export const dedupeMixin = (mixin) => {
  const mixinApplications = new WeakMap();

  return (superClass) => {
    if (!mixinApplications.has(superClass)) {
      mixinApplications.set(superClass, mixin(superClass));
    }
    return mixinApplications.get(superClass);
  };
};
