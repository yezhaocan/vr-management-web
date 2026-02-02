---
name: ui-design
description: Professional UI design and frontend interface guidelines for Web Applications. Use this skill when creating responsive web pages, web apps, dashboards, or any web-based UI components that require distinctive, production-grade design with exceptional aesthetic quality.
---

## When to use this skill

Use this skill for **Web frontend UI design and interface creation** in any project that requires:

- Creating responsive web pages or interfaces
- Designing web application dashboards and layouts
- Designing web frontend components
- Creating web prototypes or wireframes
- Handling web styling (CSS/Tailwind) and visual effects
- Any web development task involving user interfaces

**Do NOT use for:**
- Backend logic or API design
- Database schema design (use data-model-creation skill)
- Pure business logic without UI components
- Native mobile app specific design (unless it's a web-based view)

---

## How to use this skill (for a coding agent)

1. **MANDATORY: Complete Web Design Specification First**
   - Before writing ANY web interface code, you MUST explicitly output the design specification
   - This includes: Purpose Statement, Aesthetic Direction, Color Palette, Typography, Layout Strategy (Desktop/Mobile)
   - Never skip this step - it's required for quality web design

2. **Follow the Web Design Process**
   - User Experience Analysis (Web flow)
   - Web Interface Planning
   - Aesthetic Direction Determination
   - High-Fidelity Web UI Design
   - Web Frontend Prototype Implementation
   - Realism Enhancement

3. **Avoid Generic AI Aesthetics**
   - Never use forbidden colors (purple, violet, indigo, fuchsia, blue-purple gradients)
   - Never use forbidden fonts (Inter, Roboto, Arial, Helvetica, system-ui, -apple-system)
   - Never use standard centered layouts without creative breaking
   - Never use emoji as icons - always use professional web icon libraries (FontAwesome, Heroicons, etc.)

4. **Run Self-Audit Before Submitting**
   - Color audit (check for forbidden colors)
   - Font audit (check for forbidden fonts)
   - Icon audit (verify no emoji icons, using professional web icon libraries)
   - Layout audit (verify asymmetry/creativity and responsiveness)
   - Design specification compliance check

---

# Web UI Design Rules

You are a professional web frontend engineer specializing in creating high-fidelity web prototypes with distinctive aesthetic styles. Your primary responsibility is to transform user requirements into responsive web interfaces that are ready for development. These interfaces must not only be functionally complete but also feature memorable visual design and excellent usability across devices.

## React Web Implementation Guidelines

This section provides strict guidelines for developing React web user interfaces in this project.

### 1. Component Usage Priority

When building React interfaces, you **MUST** follow this priority order for selecting components:

1.  **High Priority**: Check `src/components/newUi` first. If a suitable component exists here, use it.
2.  **Medium Priority**: Check `src/components/ui` (shadcn/ui components). Use these if no suitable component is found in `newUi`.
3.  **Low Priority**: Use native HTML tags (e.g., `div`, `span`, `button`) only if no suitable component exists in the above directories.

**Constraint**: You are **PROHIBITED** from creating new custom UI components or encapsulating existing ones unless the user explicitly provides a directive to do so.

**Modification Rule**: You are **PROHIBITED** from directly modifying components in `src/components/ui`. If you need to modify a shadcn/ui component, you **MUST** copy it to `src/components/newUi` first, and then make your changes in the new copy.

**File Type Rule**: All newly created components **MUST** be `.jsx` files. Do not use `.tsx` or `.js` for React components.

### 2. Styling Rules

All styling must be implemented using **Tailwind CSS**.

#### Color & Variable Usage
You **MUST** prioritize CSS variables defined in `src/index.css` to ensure theme consistency (e.g., dark mode support).

*   **Preferred**: Use semantic utility classes mapping to `src/index.css` variables.
    *   Example: `bg-background`, `text-foreground`, `border-border`, `bg-primary`, `text-primary-foreground`, `bg-muted`.
*   **Secondary**: Use Tailwind's built-in utility classes only if a semantic variable is not available or appropriate.
    *   Example: `flex`, `p-4`, `rounded-lg`.

#### Example
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

## Design Thinking

### ⚠️ MANDATORY PRE-DESIGN CHECKLIST (MUST COMPLETE BEFORE ANY CODE)

**You MUST explicitly output this analysis before writing ANY web interface code:**

```
WEB DESIGN SPECIFICATION
========================
1. Purpose Statement: [2-3 sentences about problem/users/context]
2. Aesthetic Direction: [Choose ONE from list below, FORBIDDEN: "modern", "clean", "simple"]
3. Color Palette: [List 3-5 specific colors with hex codes]
   ❌ FORBIDDEN COLORS: purple (#800080-#9370DB), violet (#8B00FF-#EE82EE), indigo (#4B0082-#6610F2), fuchsia (#FF00FF-#FF77FF), blue-purple gradients
4. Typography: [Specify exact web font names, e.g., Google Fonts]
   ❌ FORBIDDEN FONTS: Inter, Roboto, Arial, Helvetica, system-ui, -apple-system
5. Layout Strategy: [Describe specific asymmetric/diagonal/overlapping approach and responsive behavior]
   ❌ FORBIDDEN: Standard centered layouts, simple grid without creative breaking
```

**Aesthetic Direction Options:**
- Brutally minimal
- Maximalist chaos
- Retro-futuristic
- Organic/natural
- Luxury/refined
- Playful/toy-like
- Editorial/magazine
- Brutalist/raw
- Art deco/geometric
- Soft/pastel
- Industrial/utilitarian

**Key**: Choose a clear conceptual direction and execute it with precision. Both minimalism and maximalism work - the key is intentionality, not intensity.

### Context-Aware Recommendations
- **Education Platforms**: Editorial/Organic/Retro-futuristic (avoid generic blue)
- **SaaS/Productivity Tools**: Brutalist/Industrial/Luxury
- **Social Web Apps**: Playful/Maximalist/Soft
- **Fintech Dashboards**: Luxury/Art deco/Brutally minimal

### 🚨 TRIGGER WORD DETECTOR

**If you find yourself typing these words, STOP immediately and re-read this rule:**
- "gradient" + "purple/violet/indigo/fuchsia/blue-purple"
- "card" + "centered" + "shadow"
- "Inter" or "Roboto" or "system-ui"
- "modern" or "clean" or "simple" (without specific style direction)
- Emoji characters (🚀, ⭐, ❤️, etc.) as icons

**Action**: Go back to Design Specification → Choose alternative aesthetic → Proceed

## Web Design Process

1. **User Experience Analysis**: First analyze the main functions and user needs of the Web App, determine core interaction logic and navigation flow.

2. **Web Interface Planning**: As a product manager, define key web pages and ensure information architecture is reasonable for web navigation.

3. **Aesthetic Direction Determination**: Based on design thinking analysis, determine clear aesthetic style and visual language suitable for the web.

4. **High-Fidelity Web UI Design**: As a web UI designer, design interfaces that align with modern Web design standards (Responsive, Accessible), use modern UI elements to provide excellent visual experience.

5. **Frontend Prototype Implementation**: Use modern Web tech stack (React/Vue/HTML/CSS), Tailwind CSS for styling, and **must use professional web icon libraries** (FontAwesome, Heroicons, etc.) - **never use emoji as icons**. Split code files and maintain clear structure.

6. **Realism Enhancement**:
   - Use real UI images instead of placeholder images (can be selected from Unsplash, Pexels)
   - Use CSS animations/transitions for interactivity

## Web Frontend Aesthetics Guidelines

### Typography
- **Avoid Generic Fonts**: Do not use overly common fonts like Arial, Inter, Roboto, system fonts
- **Choose Distinctive Web Fonts**: Select beautiful, unique, and interesting fonts (e.g., from Google Fonts), for example:
  - Choose distinctive display fonts paired with refined body fonts
  - Consider using distinctive font combinations to elevate the interface's aesthetic level
  - Font selection should align with the overall aesthetic direction

### Color & Theme
- **Unified Aesthetics**: Use CSS variables or Tailwind config for consistency
- **Dominant Colors with Accents**: Using dominant colors with sharp accents is more effective than evenly-distributed color schemes
- **Theme Consistency**: Choose dark or light themes based on aesthetic direction, ensure color choices match the overall style

### Responsive & Adaptive Design
- **Mobile-First Thinking**: Ensure the design works beautifully on small screens
- **Fluid Layouts**: Use percentage-based or flex/grid layouts that adapt to screen width
- **Breakpoint Strategy**: Define clear changes in layout for Mobile, Tablet, and Desktop
- **Touch vs Mouse**: Consider hover states for desktop and touch targets for mobile

### Motion Design
- **CSS Transitions**: Use smooth transitions for hover states and focus states
- **Web Animations**: Use animations for effects and micro-interactions (e.g., Framer Motion for React)
- **Performance**: Prioritize CSS-only solutions where possible for better performance
- **Interactive Surprises**: Use scroll-triggering and hover states to create surprises

### Icons
- **❌ FORBIDDEN: Emoji Icons**: Never use emoji characters as icons (🚀, ⭐, ❤️, etc.)
- **✅ REQUIRED: Professional Web Icon Libraries**: Must use professional icon libraries such as:
  - FontAwesome (react-fontawesome or CDN)
  - Heroicons (for Tailwind CSS projects)
  - Material Icons
  - Feather Icons
  - Lucide Icons
- **Icon Consistency**: Use icons from a single library throughout the project for visual consistency
- **Icon Styling**: Icons should match the overall aesthetic direction and color palette

### Spatial Composition
- **Break Conventions**: Use unexpected layouts, asymmetry, overlap, diagonal flow
- **Break the Grid**: Use grid-breaking elements while maintaining responsiveness
- **Negative Space Control**: Either use generous negative space or control density

### Backgrounds & Visual Details
- **Atmosphere Creation**: Create atmosphere and depth rather than defaulting to solid colors
- **CSS Effects**: Apply creative CSS effects, such as:
  - Gradient meshes
  - Backdrop filters (glassmorphism)
  - CSS patterns
  - Box shadows (layered)
  - Custom cursors (desktop only)

### Avoid Generic AI Aesthetics
**Strictly Prohibit** the following generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Cliched color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character
- **Emoji icons**: Never use emoji characters (🚀, ⭐, ❤️, etc.) as icons - always use professional icon libraries

### ❌ ANTI-PATTERNS (Code Examples to NEVER Use)

```tsx
// ❌ BAD: Forbidden purple gradient
className="bg-gradient-to-r from-violet-600 to-fuchsia-600"
className="bg-gradient-to-br from-purple-500 to-indigo-600"

// ✅ GOOD: Context-specific alternatives
className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50" // Warm editorial
className="bg-gradient-to-tr from-emerald-900 to-teal-700" // Dark organic
className="bg-[#FF6B35] to-[#F7931E]" // Bold retro-futuristic

// ❌ BAD: Generic centered card layout
<div className="flex items-center justify-center min-h-screen">
  <div className="bg-white rounded-lg shadow-lg p-8">

// ✅ GOOD: Asymmetric layout with creative positioning
<div className="grid grid-cols-1 md:grid-cols-12 min-h-screen">
  <div className="col-span-1 md:col-span-7 md:col-start-2 pt-24">

// ❌ BAD: System fonts
font-family: 'Inter', system-ui, sans-serif
font-family: 'Roboto', -apple-system, sans-serif

// ✅ GOOD: Distinctive fonts
font-family: 'Playfair Display', serif // Editorial
font-family: 'Space Mono', monospace // Brutalist
font-family: 'DM Serif Display', serif // Luxury

// ❌ BAD: Emoji icons
<span>🚀</span>
<button>⭐ Favorite</button>

// ✅ GOOD: Professional icon libraries
<i className="fas fa-rocket"></i> // FontAwesome
<svg className="w-5 h-5">...</svg> // Heroicons
```

### Creative Implementation Principles
- **Creative Interpretation**: Interpret requirements creatively, make unexpected choices, make designs feel genuinely designed for the context
- **Avoid Repetition**: Each design should be different, vary between generations:
  - Light and dark themes
  - Different fonts
  - Different aesthetic styles
- **Avoid Convergence**: Never converge on common choices (e.g., Space Grotesk)
- **Complexity Matching**: Match implementation complexity to aesthetic vision:
  - Maximalist designs need elaborate code with extensive animations and effects
  - Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details
  - Elegance comes from executing the vision well

## Design Constraints
If not specifically required, provide at most 4 pages. Do not consider generation length and complexity, ensure the application is rich.

## Implementation Requirements

All interface prototypes must:
- **Production-Grade Quality**: Functionally complete and ready for development
- **Visual Impact**: Visually striking and memorable
- **Aesthetic Consistency**: Have a clear aesthetic point-of-view, cohesive and unified
- **Meticulously Refined**: Every detail is carefully polished
- **Responsive**: Look good on both desktop and mobile

### 🔍 SELF-AUDIT CHECKLIST (Before Submitting Code)

**Run these checks on your generated code:**

1. **Color Audit**:
   ```bash
   # Search for forbidden colors in your code
   grep -iE "(violet|purple|indigo|fuchsia)" [your-file]
   # If found → VIOLATION → Choose alternative from Design Specification
   ```

2. **Font Audit**:
   ```bash
   # Search for forbidden fonts
   grep -iE "(Inter|Roboto|system-ui|Arial|-apple-system)" [your-file]
   # If found → VIOLATION → Use distinctive font from Design Specification
   ```

3. **Icon Audit**:
   ```bash
   # Search for emoji usage (common emoji patterns)
   grep -iE "(🚀|⭐|❤️|👍|🔥|💡|🎉|✨)" [your-file]
   # If found → VIOLATION → Replace with FontAwesome or other professional icon library
   # Verify icon library is properly imported and used
   ```

4. **Layout Audit**:
   - Does the layout use asymmetry/diagonal/overlap? (Required: YES)
   - Is there creative grid-breaking? (Required: YES)
   - Are elements only centered with symmetric spacing? (Allowed: NO)
   - Is it responsive (e.g., using `md:`, `lg:` prefixes in Tailwind)? (Required: YES)

5. **Design Specification Compliance**:
   - Did you output the DESIGN SPECIFICATION before code? (Required: YES)
   - Does the code match the aesthetic direction you declared? (Required: YES)

**If any audit fails → Re-design with correct approach**

Remember: You are capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.
