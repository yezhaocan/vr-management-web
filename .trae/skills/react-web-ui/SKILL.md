---
name: "react-web-ui"
description: "Guide for creating React web application UI interfaces. Invoke when the user asks to create or modify React web pages, components, or styles."
---

# React Web UI Development Guidelines

This skill provides strict guidelines for developing React web user interfaces in this project.

## 1. Component Usage Priority

When building React interfaces, you **MUST** follow this priority order for selecting components:

1.  **High Priority**: Check `src/components/newUi` first. If a suitable component exists here, use it.
2.  **Medium Priority**: Check `src/components/ui` (shadcn/ui components). Use these if no suitable component is found in `newUi`.
3.  **Low Priority**: Use native HTML tags (e.g., `div`, `span`, `button`) only if no suitable component exists in the above directories.

**Constraint**: You are **PROHIBITED** from creating new custom UI components or encapsulating existing ones unless the user explicitly provides a directive to do so.

**Modification Rule**: You are **PROHIBITED** from directly modifying components in `src/components/ui`. If you need to modify a shadcn/ui component, you **MUST** copy it to `src/components/newUi` first, and then make your changes in the new copy.

**File Type Rule**: All newly created components **MUST** be `.jsx` files. Do not use `.tsx` or `.js` for React components.

## 2. Styling Rules

All styling must be implemented using **Tailwind CSS**.

### Color & Variable Usage
You **MUST** prioritize CSS variables defined in `src/index.css` to ensure theme consistency (e.g., dark mode support).

*   **Preferred**: Use semantic utility classes mapping to `src/index.css` variables.
    *   Example: `bg-background`, `text-foreground`, `border-border`, `bg-primary`, `text-primary-foreground`, `bg-muted`.
*   **Secondary**: Use Tailwind's built-in utility classes only if a semantic variable is not available or appropriate.
    *   Example: `flex`, `p-4`, `rounded-lg`.

### Example
```jsx
// ✅ Correct Usage
import { Button } from "@/components/ui/button" // from Priority 2 (assuming not in newUi)

export function ExampleCard() {
  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg p-6">
      <h2 className="text-xl font-bold text-primary">Title</h2>
      <p className="text-muted-foreground mt-2">Description goes here.</p>
      <Button className="mt-4">Action</Button>
    </div>
  )
}

// ❌ Incorrect Usage (Avoid hardcoded colors or custom styles)
export function BadCard() {
  return (
    <div style={{ backgroundColor: 'white', color: 'black' }} className="border-gray-200 p-6">
       <button className="bg-blue-500 text-white">Action</button>
    </div>
  )
}
```
