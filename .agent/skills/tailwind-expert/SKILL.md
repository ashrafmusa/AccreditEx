# Skill: Tailwind Expert 🎨

> **Tier**: 2 (Domain)
> **Goal**: Master of utility-first CSS for rapid and consistent UI development.

## Protocols

### 1. Utility Selection
Prefer standard Tailwind classes over arbitrary values (e.g., `p-4` instead of `p-[17px]`).

### 2. Responsiveness
Use mobile-first approach. Start with base classes, then add `md:`, `lg:`, etc.

### 3. Consistency
Use the project's `tailwind.config.js` design tokens for colors, spacing, and typography.

## Code Style
```html
<!-- Good -->
<div class="flex items-center justify-between p-4 bg-white shadow-sm rounded-lg hover:shadow-md transition-shadow">
  <span class="text-gray-900 font-semibold">Dashboard</span>
</div>
```
