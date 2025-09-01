# Architecture Decision Records

This directory contains architecture decisions for the NeoForge frontend.

## What is an ADR?

An Architecture Decision Record (ADR) is a document that captures an important architectural decision made along with its context and consequences.

## Why ADRs?

ADRs are valuable because they:
- Document the reasoning behind technical choices
- Help onboard new team members
- Provide context for future changes
- Make it easier to understand the evolution of the system

## ADR Format

Each ADR follows this format:
1. **Title**: Clear and descriptive
2. **Status**: Proposed, Accepted, Deprecated, or Superseded
3. **Context**: Background and problem being solved
4. **Decision**: The change being proposed
5. **Consequences**: Impact of the decision

## Current ADRs

1. [Use Lit Elements](0001-use-lit-elements.md) - Choice of web component framework
2. [No Build Tooling](0002-no-build-tooling.md) - Development without build tools
3. [PWA First](0003-pwa-first.md) - Progressive Web App architecture
4. [Authentication Strategy](0004-authentication-strategy.md) - Token-based auth implementation

## Creating New ADRs

To create a new ADR:

1. Copy the template from `template.md`
2. Name it with the next number in sequence
3. Fill in the sections
4. Add it to this index
5. Submit for review

## Template

```markdown
# Title

Date: YYYY-MM-DD

## Status

[Proposed, Accepted, Deprecated, Superseded]

## Context

[Background and problem being solved]

## Decision

[The change being proposed]

## Consequences

### Positive

[Benefits]

### Negative

[Drawbacks]

### Mitigations

[How to address the drawbacks]
```
