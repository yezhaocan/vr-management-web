import * as React from "react"
import { cn } from "@/lib/utils"

// Button 样式变体 - 基于 Tailwind CSS
// 使用方式: className={buttonVariants.primary} 或 className={`${buttonVariants.primary} ${buttonVariants.sizes.md}`}

export const buttonVariants = {
  // 主要按钮 - 用于主要操作
  primary: `
    inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200
    bg-blue-600 text-white outline-none ring-0
    hover:bg-blue-700 hover:shadow-md
    active:bg-blue-800 active:shadow-none
    disabled:bg-blue-300 disabled:cursor-not-allowed disabled:opacity-60
    focus:bg-blue-700
  `.replace(/\s+/g, ' ').trim(),

  // 次要按钮 - 用于次要操作
  secondary: `
    inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200
    bg-gray-100 text-gray-700 outline-none ring-0
    hover:bg-gray-200 hover:shadow-sm
    active:bg-gray-300 active:shadow-none
    disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60
    focus:bg-gray-200
    dark:bg-gray-800 dark:text-gray-200
    dark:hover:bg-gray-700
    dark:active:bg-gray-600 dark:active:shadow-none
    dark:focus:bg-gray-700
    dark:disabled:bg-gray-900 dark:disabled:text-gray-500
  `.replace(/\s+/g, ' ').trim(),

  // 警告按钮 - 用于需要注意的操作
  warning: `
    inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200
    bg-amber-500 text-white outline-none ring-0
    hover:bg-amber-600 hover:shadow-md
    active:bg-amber-700 active:shadow-none
    disabled:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60
    focus:bg-amber-600
  `.replace(/\s+/g, ' ').trim(),

  // 危险按钮 - 用于危险操作（删除、取消等）
  danger: `
    inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200
    bg-red-600 text-white outline-none ring-0
    hover:bg-red-700 hover:shadow-md
    active:bg-red-800 active:shadow-none
    disabled:bg-red-300 disabled:cursor-not-allowed disabled:opacity-60
    focus:bg-red-700
  `.replace(/\s+/g, ' ').trim(),

  // 尺寸变体
  sizes: {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2 text-sm h-10',
    lg: 'px-6 py-3 text-base h-12',
    xl: 'px-8 py-4 text-lg h-14'
  },

  // Ghost 变体（无边框样式）
  // 注意：Outline 变体已移除，因为去除边框后与 Ghost 样式一致，使用 Ghost 样式替代
  ghost: {
    primary: `
      inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200
      bg-transparent text-blue-600 outline-none ring-0
      hover:bg-blue-50 hover:text-blue-700
      active:bg-blue-100 active:text-blue-800 active:shadow-none
      disabled:bg-transparent disabled:text-blue-300 disabled:cursor-not-allowed disabled:opacity-60
      focus:bg-blue-50 focus:text-blue-700
      dark:text-blue-400
      dark:hover:bg-blue-900/20 dark:hover:text-blue-300
      dark:active:bg-blue-900/40 dark:active:shadow-none
      dark:focus:bg-blue-900/20 dark:focus:text-blue-300
      dark:disabled:text-blue-600
    `.replace(/\s+/g, ' ').trim(),

    secondary: `
      inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200
      bg-transparent text-gray-600 outline-none ring-0
      hover:bg-gray-100 hover:text-gray-700
      active:bg-gray-200 active:text-gray-800 active:shadow-none
      disabled:bg-transparent disabled:text-gray-300 disabled:cursor-not-allowed disabled:opacity-60
      focus:bg-gray-100 focus:text-gray-700
      dark:text-gray-400
      dark:hover:bg-gray-800 dark:hover:text-gray-300
      dark:active:bg-gray-700 dark:active:shadow-none
      dark:focus:bg-gray-800 dark:focus:text-gray-300
      dark:disabled:text-gray-600
    `.replace(/\s+/g, ' ').trim(),

    warning: `
      inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200
      bg-transparent text-amber-600 outline-none ring-0
      hover:bg-amber-50 hover:text-amber-700
      active:bg-amber-100 active:text-amber-800 active:shadow-none
      disabled:bg-transparent disabled:text-amber-300 disabled:cursor-not-allowed disabled:opacity-60
      focus:bg-amber-50 focus:text-amber-700
      dark:text-amber-400
      dark:hover:bg-amber-900/20 dark:hover:text-amber-300
      dark:active:bg-amber-900/40 dark:active:shadow-none
      dark:focus:bg-amber-900/20 dark:focus:text-amber-300
    `.replace(/\s+/g, ' ').trim(),

    danger: `
      inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200
      bg-transparent text-red-600 outline-none ring-0
      hover:bg-red-50 hover:text-red-700
      active:bg-red-100 active:text-red-800 active:shadow-none
      disabled:bg-transparent disabled:text-red-300 disabled:cursor-not-allowed disabled:opacity-60
      focus:bg-red-50 focus:text-red-700
      dark:text-red-400
      dark:hover:bg-red-900/20 dark:hover:text-red-300
      dark:active:bg-red-900/40 dark:active:shadow-none
      dark:focus:bg-red-900/20 dark:focus:text-red-300
    `.replace(/\s+/g, ' ').trim()
  }
};

// 辅助函数：组合按钮样式
export const combineButtonStyles = (variant = 'primary', size = 'md', type = 'solid') => {
  let baseStyle = '';
  
  switch (type) {
    case 'outline':
    case 'ghost':
      // 去除边框后，Outline 与 Ghost 样式一致，复用 Ghost 样式
      baseStyle = buttonVariants.ghost[variant];
      break;
    default:
      baseStyle = buttonVariants[variant];
  }
  
  return `${baseStyle} ${buttonVariants.sizes[size]}`;
};

const Button = React.forwardRef(
  ({ className, variant = "primary", size = "default", asChild = false, children, ...props }, ref) => {
    // Map 'size' prop to button-variants.js sizes
    // Original: default, sm, lg, icon
    // button-variants.js: sm, md, lg, xl
    const sizeMap = {
      default: "md",
      sm: "sm",
      lg: "lg",
      icon: "md", // Base size for icon, will override dimensions
      xl: "xl",
      md: "md"
    }

    const mappedSize = sizeMap[size] || "md"

    // Logic to resolve styles based on variant
    // We aim to support:
    // 1. Keys from button-variants.js (primary, secondary, warning, danger)
    // 2. Compound variants (outline-primary, ghost-danger)
    // 3. Legacy/Original variants mapping (default -> primary, destructive -> danger, link)
    // 4. 'outline' and 'ghost' as shorthands
    
    let type = "solid"
    let colorVariant = variant
    let isLink = false

    // Handle legacy mappings
    if (variant === "default") colorVariant = "primary"
    else if (variant === "destructive") colorVariant = "danger"
    else if (variant === "link") {
      isLink = true
      // Link doesn't fit well into the solid/outline/ghost system of button-variants.js
      // We will handle it specifically
    }
    // Handle compound variants or type shorthands
    else if (variant.startsWith("outline")) {
      type = "outline"
      if (variant === "outline") {
        colorVariant = "secondary" // Default outline color
      } else {
        const parts = variant.split("-")
        if (parts.length > 1) colorVariant = parts.slice(1).join("-")
      }
    } else if (variant.startsWith("ghost")) {
      type = "ghost"
      if (variant === "ghost") {
        colorVariant = "secondary" // Default ghost color
      } else {
        const parts = variant.split("-")
        if (parts.length > 1) colorVariant = parts.slice(1).join("-")
      }
    }

    // Generate base classes
    let buttonClasses = ""
    
    if (isLink) {
      // Recreate link style from original button or similar
      buttonClasses = "text-primary underline-offset-4 hover:underline bg-transparent"
      // Append size classes? Link usually has size padding? Original button includes size classes for link.
      // We'll use the size classes from button-variants
      buttonClasses = `${buttonClasses} ${buttonVariants.sizes[mappedSize] || ""}`
    } else {
      // Validate if colorVariant exists for the type to avoid "undefined" classes
      const isValid = (t, c) => {
        if (t === "solid") return !!buttonVariants[c]
        // Since outline variant is removed and mapped to ghost, we check ghost instead
        if (t === "outline") return buttonVariants.ghost && !!buttonVariants.ghost[c]
        if (t === "ghost") return buttonVariants.ghost && !!buttonVariants.ghost[c]
        return false
      }

      if (!isValid(type, colorVariant)) {
        // Fallback to primary solid if invalid
        type = "solid"
        colorVariant = "primary"
      }

      buttonClasses = combineButtonStyles(colorVariant, mappedSize, type)
    }

    // Additional overrides
    const iconClasses = size === "icon" ? "h-10 w-10 p-0 shrink-0" : ""
    
    // Ensure we include the base structure classes if they are not fully covered by button-variants
    // button-variants includes: inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200
    // Original button includes: inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0
    
    // button-variants.js covers most visual properties but might miss some accessibility/layout tweaks (like focus rings, gap-2, svg sizing).
    // We should probably merge the essential structural classes from original button to ensure "core functionality" and consistency.
    const baseStructure = "gap-2 whitespace-nowrap disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"

    // Handle asChild prop - render children directly if asChild is true
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        className: cn(baseStructure, buttonClasses, iconClasses, className, children.props.className),
        ref,
        ...props,
        ...children.props
      })
    }

    return (
      <button
        className={cn(baseStructure, buttonClasses, iconClasses, className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
