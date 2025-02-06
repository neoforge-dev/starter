# 🖥 Frontend Architecture

```typescript
// Example Lit component
@customElement('neo-button')
export class NeoButton extends LitElement {
  @property() variant: 'primary' | 'secondary' = 'primary';
}
```

## Core Principles
1. Browser-native features first
2. Progressive enhancement
3. Minimal runtime 