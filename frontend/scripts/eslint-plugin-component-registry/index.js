/**
 * ESLint plugin for detecting potential component duplicates
 * This plugin checks for components with similar names or functionality
 */

export default {
  rules: {
    "no-duplicate-components": {
      meta: {
        type: "suggestion",
        docs: {
          description: "Detect potential component duplicates",
          category: "Best Practices",
          recommended: true,
        },
        fixable: null,
        schema: [],
      },
      create(context) {
        // Track component definitions
        const components = new Map();

        // Check if a name is similar to existing components
        const findSimilarComponents = (name) => {
          const similarComponents = [];

          // Simple similarity check - components with similar names
          for (const [existingName, info] of components.entries()) {
            // Check for similar names (e.g., Button vs NeoButton, ErrorPage vs ErrorPageComponent)
            const normalizedName = name
              .toLowerCase()
              .replace(/component$|neo|page|element/g, "");
            const normalizedExisting = existingName
              .toLowerCase()
              .replace(/component$|neo|page|element/g, "");

            if (
              normalizedName === normalizedExisting &&
              name !== existingName
            ) {
              similarComponents.push({
                name: existingName,
                path: info.path,
              });
            }
          }

          return similarComponents;
        };

        return {
          // Detect class declarations that might be components
          ClassDeclaration(node) {
            // Check if this looks like a component class
            const isComponent =
              // Extends HTMLElement or a class that might be a component
              (node.superClass &&
                (node.superClass.name === "HTMLElement" ||
                  node.superClass.name === "LitElement" ||
                  node.superClass.name === "BaseComponent")) ||
              // Has static properties that might indicate a component
              node.body.body.some(
                (member) =>
                  member.type === "ClassProperty" &&
                  member.static &&
                  (member.key.name === "properties" ||
                    member.key.name === "styles" ||
                    member.key.name === "observedAttributes")
              );

            if (isComponent) {
              const componentName = node.id.name;
              const filePath = context.getFilename();

              // Store component info
              components.set(componentName, {
                path: filePath,
                node,
              });

              // Check for similar components
              const similarComponents = findSimilarComponents(componentName);

              if (similarComponents.length > 0) {
                context.report({
                  node,
                  message: `Potential duplicate component: '${componentName}' is similar to existing component(s): ${similarComponents.map((c) => `'${c.name}' (${c.path})`).join(", ")}. Check the component registry.`,
                });
              }
            }
          },

          // Detect customElements.define calls
          CallExpression(node) {
            if (
              node.callee.type === "MemberExpression" &&
              node.callee.object.name === "customElements" &&
              node.callee.property.name === "define" &&
              node.arguments.length >= 2
            ) {
              const tagName = node.arguments[0].value;
              const className = node.arguments[1].name;

              // Store the tag name with the component
              if (components.has(className)) {
                components.get(className).tagName = tagName;
              }

              // Check for similar tag names
              for (const [name, info] of components.entries()) {
                if (info.tagName && info.tagName !== tagName) {
                  const normalizedTag = tagName
                    .toLowerCase()
                    .replace(/^neo-/, "");
                  const normalizedExisting = info.tagName
                    .toLowerCase()
                    .replace(/^neo-/, "");

                  if (normalizedTag === normalizedExisting) {
                    context.report({
                      node,
                      message: `Potential duplicate component tag: '${tagName}' is similar to existing tag '${info.tagName}' used by component '${name}'. Check the component registry.`,
                    });
                  }
                }
              }
            }
          },
        };
      },
    },
  },
};
