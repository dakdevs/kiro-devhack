# UI Component Standards

## Component Architecture Principles

Follow Apple's systematic approach to component design with consistent patterns, behaviors, and visual treatment.

## Button Components

### Button Hierarchy
Implement a clear button hierarchy following Apple's design patterns:

```typescript
// Button variant types
type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}
```

### Button Styling Standards
```html
<!-- Base button classes -->
<button class="inline-flex items-center justify-center gap-1 min-h-[44px] px-4 py-3 border-none rounded-lg font-system text-[17px] font-semibold leading-tight no-underline cursor-pointer transition-all duration-150 ease-out outline-none focus-visible:outline-2 focus-visible:outline-apple-blue focus-visible:outline-offset-2">
  Button
</button>

<!-- Primary button -->
<button class="inline-flex items-center justify-center gap-1 min-h-[44px] px-4 py-3 bg-apple-blue text-white rounded-lg font-system text-[17px] font-semibold leading-tight cursor-pointer transition-all duration-150 ease-out outline-none focus-visible:outline-2 focus-visible:outline-apple-blue focus-visible:outline-offset-2 hover:bg-[#0056CC] hover:-translate-y-px active:bg-[#004499] active:translate-y-0">
  Primary
</button>

<!-- Secondary button -->
<button class="inline-flex items-center justify-center gap-1 min-h-[44px] px-4 py-3 bg-gray-50 dark:bg-gray-900 text-black dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg font-system text-[17px] font-semibold leading-tight cursor-pointer transition-all duration-150 ease-out outline-none focus-visible:outline-2 focus-visible:outline-apple-blue focus-visible:outline-offset-2">
  Secondary
</button>

<!-- Destructive button -->
<button class="inline-flex items-center justify-center gap-1 min-h-[44px] px-4 py-3 bg-apple-red text-white rounded-lg font-system text-[17px] font-semibold leading-tight cursor-pointer transition-all duration-150 ease-out outline-none focus-visible:outline-2 focus-visible:outline-apple-blue focus-visible:outline-offset-2">
  Destructive
</button>

<!-- Disabled state -->
<button class="inline-flex items-center justify-center gap-1 min-h-[44px] px-4 py-3 bg-apple-blue text-white rounded-lg font-system text-[17px] font-semibold leading-tight cursor-not-allowed transition-all duration-150 ease-out outline-none opacity-60" disabled>
  Disabled
</button>
```

## Form Components

### Input Field Standards
```html
<!-- Basic input -->
<input class="w-full min-h-[44px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500 invalid:border-apple-red" />

<!-- Input with icon -->
<div class="relative">
  <input class="w-full min-h-[44px] pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white font-system text-[17px] leading-tight transition-colors duration-150 ease-out outline-none focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] placeholder:text-gray-400 dark:placeholder:text-gray-500" />
  <div class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 w-5 h-5">
    <!-- Icon content -->
  </div>
</div>
```

### Form Field Component
```typescript
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  id: string;
}

export function FormField({ label, error, required, children, id }: FormFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={id} className="form-label">
        {label}
        {required && <span className="required-indicator">*</span>}
      </label>
      {children}
      {error && (
        <div className="form-error" role="alert" id={`${id}-error`}>
          {error}
        </div>
      )}
    </div>
  );
}
```

## Card Components

### Card Structure
```html
<!-- Card container -->
<div class="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm transition-all duration-200 ease-out hover:shadow-md hover:-translate-y-0.5">
  
  <!-- Card header -->
  <div class="mb-4">
    <h3 class="text-xl font-semibold text-black dark:text-white m-0 mb-1">
      Card Title
    </h3>
    <p class="text-[15px] text-gray-600 dark:text-gray-400 m-0">
      Card subtitle
    </p>
  </div>
  
  <!-- Card content -->
  <div class="mb-4">
    <p>Card content goes here...</p>
  </div>
  
  <!-- Card actions -->
  <div class="flex gap-2 justify-end">
    <button class="px-4 py-2 text-sm">Cancel</button>
    <button class="px-4 py-2 text-sm bg-apple-blue text-white rounded">Save</button>
  </div>
  
</div>
```

## Navigation Components

### Navigation Bar
```html
<!-- Navigation bar -->
<nav class="flex items-center justify-between h-11 px-6 bg-white/80 dark:bg-black/80 border-b border-gray-200 dark:border-gray-700 backdrop-blur-xl">
  
  <!-- Brand -->
  <a href="/" class="text-[17px] font-semibold text-black dark:text-white no-underline">
    Brand
  </a>
  
  <!-- Navigation links -->
  <ul class="flex items-center gap-4 list-none m-0 p-0">
    <li>
      <a href="/home" class="text-black dark:text-white no-underline text-[17px] px-2 py-1 rounded-sm transition-colors duration-150 ease-out hover:bg-gray-50 dark:hover:bg-gray-900">
        Home
      </a>
    </li>
    <li>
      <a href="/about" class="text-black dark:text-white no-underline text-[17px] px-2 py-1 rounded-sm transition-colors duration-150 ease-out hover:bg-gray-50 dark:hover:bg-gray-900">
        About
      </a>
    </li>
    <li>
      <a href="/contact" class="bg-apple-blue text-white no-underline text-[17px] px-2 py-1 rounded-sm transition-colors duration-150 ease-out">
        Contact
      </a>
    </li>
  </ul>
  
</nav>
```

### Tab Navigation
```html
<!-- Tab container -->
<div class="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-black">
  
  <!-- Individual tabs -->
  <button class="flex-1 px-6 py-4 bg-none border-none text-gray-600 dark:text-gray-400 text-[17px] font-normal cursor-pointer transition-all duration-150 ease-out relative hover:text-black hover:dark:text-white hover:bg-gray-50 hover:dark:bg-gray-900">
    Tab 1
  </button>
  
  <button class="flex-1 px-6 py-4 bg-none border-none text-gray-600 dark:text-gray-400 text-[17px] font-normal cursor-pointer transition-all duration-150 ease-out relative hover:text-black hover:dark:text-white hover:bg-gray-50 hover:dark:bg-gray-900">
    Tab 2
  </button>
  
  <!-- Active tab -->
  <button class="flex-1 px-6 py-4 bg-none border-none text-apple-blue text-[17px] font-semibold cursor-pointer transition-all duration-150 ease-out relative after:content-[''] after:absolute after:-bottom-px after:left-0 after:right-0 after:h-0.5 after:bg-apple-blue">
    Active Tab
  </button>
  
</div>
```

## Modal and Overlay Components

### Modal Structure
```html
<!-- Modal overlay -->
<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] animate-in fade-in duration-200">
  
  <!-- Modal container -->
  <div class="bg-white dark:bg-black rounded-xl shadow-2xl max-w-[90vw] max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-5 zoom-in-95 duration-300">
    
    <!-- Modal header -->
    <div class="px-6 py-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
      <h2 class="text-xl font-semibold m-0">Modal Title</h2>
      <button class="w-8 h-8 border-none bg-none rounded-full flex items-center justify-center cursor-pointer text-gray-600 dark:text-gray-400 transition-all duration-150 ease-out hover:bg-gray-50 hover:dark:bg-gray-900 hover:text-black hover:dark:text-white">
        ×
      </button>
    </div>
    
    <!-- Modal content -->
    <div class="px-6 py-6 overflow-y-auto">
      <p>Modal content goes here...</p>
    </div>
    
    <!-- Modal actions -->
    <div class="px-6 py-6 border-t border-gray-200 dark:border-gray-700 flex gap-2 justify-end">
      <button class="px-4 py-2 text-gray-600 dark:text-gray-400">Cancel</button>
      <button class="px-4 py-2 bg-apple-blue text-white rounded-lg">Save</button>
    </div>
    
  </div>
</div>

<!-- Add these custom animations to your Tailwind config -->
<!-- 
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
-->
```

## List and Table Components

### List Component
```html
<!-- List container -->
<div class="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
  
  <!-- List items -->
  <div class="flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors duration-150 ease-out hover:bg-gray-50 hover:dark:bg-gray-900">
    
    <!-- Item content -->
    <div class="flex-1 min-w-0">
      <h3 class="text-[17px] font-normal text-black dark:text-white m-0 mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
        List Item Title
      </h3>
      <p class="text-[15px] text-gray-600 dark:text-gray-400 m-0 whitespace-nowrap overflow-hidden text-ellipsis">
        List item subtitle
      </p>
    </div>
    
    <!-- Item actions -->
    <div class="flex gap-1 ml-4">
      <button class="p-2 text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white">Edit</button>
      <button class="p-2 text-apple-red hover:text-red-700">Delete</button>
    </div>
    
  </div>
  
  <!-- More list items... -->
  <div class="flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors duration-150 ease-out hover:bg-gray-50 hover:dark:bg-gray-900">
    <div class="flex-1 min-w-0">
      <h3 class="text-[17px] font-normal text-black dark:text-white m-0 mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
        Another Item
      </h3>
      <p class="text-[15px] text-gray-600 dark:text-gray-400 m-0 whitespace-nowrap overflow-hidden text-ellipsis">
        Another subtitle
      </p>
    </div>
    <div class="flex gap-1 ml-4">
      <button class="p-2 text-gray-600 dark:text-gray-400 hover:text-black hover:dark:text-white">Edit</button>
      <button class="p-2 text-apple-red hover:text-red-700">Delete</button>
    </div>
  </div>
  
</div>
```

## Status and Feedback Components

### Alert Component
```html
<!-- Info alert -->
<div class="px-4 py-6 rounded-lg border border-apple-blue bg-apple-blue/10 text-apple-blue flex items-start gap-2">
  <div class="w-5 h-5 flex-shrink-0 mt-0.5">
    <!-- Info icon -->
  </div>
  <div class="flex-1">
    <h4 class="font-semibold m-0 mb-1">Info Alert</h4>
    <p class="m-0 opacity-80">This is an informational message.</p>
  </div>
</div>

<!-- Success alert -->
<div class="px-4 py-6 rounded-lg border border-apple-green bg-apple-green/10 text-apple-green flex items-start gap-2">
  <div class="w-5 h-5 flex-shrink-0 mt-0.5">
    <!-- Success icon -->
  </div>
  <div class="flex-1">
    <h4 class="font-semibold m-0 mb-1">Success</h4>
    <p class="m-0 opacity-80">Operation completed successfully.</p>
  </div>
</div>

<!-- Warning alert -->
<div class="px-4 py-6 rounded-lg border border-apple-orange bg-apple-orange/10 text-apple-orange flex items-start gap-2">
  <div class="w-5 h-5 flex-shrink-0 mt-0.5">
    <!-- Warning icon -->
  </div>
  <div class="flex-1">
    <h4 class="font-semibold m-0 mb-1">Warning</h4>
    <p class="m-0 opacity-80">Please review this information.</p>
  </div>
</div>

<!-- Error alert -->
<div class="px-4 py-6 rounded-lg border border-apple-red bg-apple-red/10 text-apple-red flex items-start gap-2">
  <div class="w-5 h-5 flex-shrink-0 mt-0.5">
    <!-- Error icon -->
  </div>
  <div class="flex-1">
    <h4 class="font-semibold m-0 mb-1">Error</h4>
    <p class="m-0 opacity-80">Something went wrong.</p>
  </div>
</div>
```

### Loading States
```html
<!-- Loading spinner -->
<div class="w-5 h-5 border-2 border-gray-200 dark:border-gray-700 border-t-apple-blue rounded-full animate-spin"></div>

<!-- Skeleton loading -->
<div class="bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-sm">
  <!-- Skeleton content -->
</div>

<!-- Skeleton text lines -->
<div class="space-y-2">
  <div class="h-4 bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded"></div>
  <div class="h-4 bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded w-3/5"></div>
</div>

<!-- Skeleton avatar -->
<div class="w-10 h-10 bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-full"></div>

<!-- Add this to your Tailwind config for the shimmer animation -->
<!-- 
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
-->
```

## Component Implementation Guidelines

### TypeScript Interfaces
Always define clear interfaces for component props:

```typescript
interface ComponentProps {
  // Required props first
  id: string;
  children: React.ReactNode;
  
  // Optional props with defaults
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  
  // Event handlers
  onClick?: (event: React.MouseEvent) => void;
  
  // Accessibility props
  'aria-label'?: string;
  'aria-describedby'?: string;
}
```



### Performance Considerations
- Use CSS-in-JS or CSS modules for component styling
- Implement proper memoization for expensive components
- Lazy load components when appropriate
- Optimize bundle size with tree shaking

### Documentation Standards
Each component should include:
- Clear prop documentation
- Usage examples
- Accessibility notes
- Design token references
- Responsive behavior notes