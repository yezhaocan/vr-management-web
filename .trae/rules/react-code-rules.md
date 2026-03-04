---
alwaysApply: true
description: Integrated guidelines for core project structure, React development standards, styling, dependency whitelist, and workflow.
---

# React Development & Core Project Rules

## 1. Core Development Constraints

### 1.1 Language & File Standards
- **JavaScript Only**: Use only `.js` and `.jsx` files. Introduction of TypeScript (`.ts`, `.tsx`) is strictly forbidden.
- **Code Comments**: Core business logic must be documented with Chinese comments for clarity.

### 1.2 Import & Pathing Rules
- **Component Resolution**: All custom components must reside in `src/components/`.
- **Absolute Paths Required**: Use full paths for imports (e.g., `import { List } from "@/components/List.jsx"`). Relative paths (e.g., `./List`) or shorthand extensions are prohibited.
- **Dependency Integrity**: Monitor relationships between components to prevent dead links or invalid references.

### 1.3 Read-Only Protection
- **`src/components/ui/`**: Pre-installed shadcn/ui components. Manual modification is prohibited.
- **`src/App.jsx`**: Application entry point and router configuration. Read-only.
- **`src/lowcode.json`**: Global configuration file. Read-only.

### 1.4 Dependency Whitelist (Strict Enforcement)
Only the following npm packages are permitted. Prioritize native JS or built-in React APIs whenever possible.

| Category | Allowed npm Packages |
| :--- | :--- |
| **Framework Core** | `react`, `react-dom`, `react-router-dom` |
| **State/Data** | `mobx`, `react-hook-form` |
| **UI/Icons** | `lucide-react`, `recharts`, `clsx`, `tailwind-merge` |
| **Utilities/Time** | `date-fns` |
| **CloudBase SDK** | `@cloudbase/js-sdk`, `@cloudbase/weda-cloud-sdk`, `@cloudbase/weda-client`, `@cloudbase/lowcode-render` |
| **Other** | `@zxing/library` |

**⚠️ WARNING: Installing or using any third-party packages outside of this whitelist is strictly prohibited.**

---

## 2. Directory Structure

### 2.1 Root Directories
- **`.datasources/`**: Data source definitions (`schema.json` and `data.json`).
- **`.functions/`**: Cloud Function source code.
- **`.ai/`**: Internal directory for AI-managed intermediate files.

### 2.2 Frontend Source (`src/`)
- **`components/`**: Root directory for all components.
  - **`ui/`**: **[READ-ONLY]** Preset UI components.
  - **`newUi/`**: Custom UI components or customized versions of `ui/` components.
- **`pages/`**: Application pages named as `${pageId}.jsx`.
- **`lib/`**: Utility library containing `utils.js`.
- **`App.jsx`**: **[READ-ONLY]** Main routing shell.
- **`index.css`**: Global styles and CSS variable definitions.

---

## 3. Component & Styling Standards

### 3.1 Component Prioritization
- **Order of Preference**: `newUi` > `ui` > Native Elements.
- **Guideline**: Do not create or wrap general-purpose UI components unless explicitly requested by the user.
- **Customization**: To customize a `ui/` component, copy it to `newUi/` first.

### 3.2 Styling (Tailwind Only)
- **Semantic Classes**: Prioritize classes defined in `src/index.css` (e.g., `bg-background`, `text-foreground`, `border-border`, `bg-primary`).
- **Utility Classes**: Use generic Tailwind utilities only when semantic classes are unavailable.
- **Prohibitions**: Hardcoded theme colors and large inline style blocks are strictly forbidden.

---

## 4. Development Workflow & Self-Check

### 4.1 Pre-Development Steps
- Check `newUi` for existing reusable components.
- Verify if the intended changes involve any Read-only files or directories.

### 4.2 Quality Assurance Checklist
- [ ] **Language Check**: Are only `.js` and `.jsx` files used? (No `.ts` or `.tsx`)
- [ ] **Pathing Check**: Are all imports using full absolute paths (e.g., `@/components/...`)?
- [ ] **Protection Check**: Have you avoided modifying `src/components/ui/` or `src/App.jsx`?
- [ ] **Dependency Check**: Are all new dependencies within the approved whitelist?
- [ ] **Structure Check**: Are new files placed strictly according to the directory standards?
- [ ] **Styling Check**: Are you using Tailwind semantic classes instead of hardcoded colors?
