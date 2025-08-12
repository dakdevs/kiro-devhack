# Accessibility Standards

## Core Accessibility Principles

Follow WCAG 2.1 AA standards as the minimum baseline, with Apple's enhanced accessibility requirements where applicable.

## Color and Contrast

### Contrast Requirements
- **Normal text**: 4.5:1 minimum contrast ratio
- **Large text** (18pt+ or 14pt+ bold): 3:1 minimum contrast ratio
- **UI components**: 3:1 contrast against adjacent colors
- **Focus indicators**: 3:1 contrast ratio
- **Graphical objects**: 3:1 contrast for meaningful graphics

### Color Usage Rules
- Never use color alone to convey information
- Provide text labels, icons, or patterns as alternatives
- Test with color blindness simulators
- Ensure interactive states are distinguishable without color

```html
<!-- Good: Multiple indicators for state -->
<button class="bg-apple-blue border-2 border-transparent text-white px-4 py-2 rounded-lg focus:outline-2 focus:outline-apple-blue focus:outline-offset-2 focus:border-apple-blue disabled:bg-gray-400 disabled:opacity-60 disabled:cursor-not-allowed">
  Accessible Button
</button>

<!-- Button with multiple state indicators -->
<button class="bg-apple-blue text-white px-4 py-2 rounded-lg border-2 border-transparent hover:bg-blue-600 focus-visible:outline-2 focus-visible:outline-apple-blue focus-visible:outline-offset-2 active:bg-blue-700 disabled:bg-gray-400 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-gray-400">
  Multi-state Button
</button>
```

## Typography and Readability

### Dynamic Type Support
Support system font scaling from 100% to 200%:

```html
<!-- Dynamic type support with Tailwind -->
<p class="text-base leading-relaxed">
  Base text that scales with user preferences
</p>

<!-- Responsive text that scales appropriately -->
<h1 class="text-2xl md:text-3xl lg:text-4xl leading-tight">
  Responsive heading
</h1>

<!-- Text with proper line height for readability -->
<p class="text-base leading-[1.5] max-w-[75ch]">
  Text with optimal line length and spacing for readability
</p>

<!-- Custom scaling with CSS custom properties -->
<div class="text-[calc(1rem*var(--text-scale,1))] leading-[1.5]" style="--text-scale: clamp(1, 1 + 0.5 * var(--user-font-scale, 0), 2)">
  Text that respects user font scaling preferences
</div>
```

### Reading Experience
- Maintain line lengths between 45-75 characters
- Use sufficient line spacing (1.5x minimum)
- Provide adequate paragraph spacing
- Ensure text reflows properly when zoomed to 200%

## Focus Management

### Focus Indicators
Provide clear, high-contrast focus indicators:

```html
<!-- Clear focus indicators -->
<button class="px-4 py-2 bg-apple-blue text-white rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-apple-blue focus-visible:outline-offset-2 focus-visible:rounded-sm contrast-more:focus-visible:outline-[3px] contrast-more:focus-visible:outline-[Highlight]">
  Focusable Button
</button>

<!-- Link with focus indicator -->
<a href="/page" class="text-apple-blue underline outline-none focus-visible:outline-2 focus-visible:outline-apple-blue focus-visible:outline-offset-2 focus-visible:rounded-sm">
  Focusable Link
</a>

<!-- Input with focus ring -->
<input class="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-apple-blue focus-visible:outline-offset-2 focus:border-apple-blue" />

<!-- Custom focusable element -->
<div tabindex="0" class="p-4 bg-gray-100 rounded-lg cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-apple-blue focus-visible:outline-offset-2 focus-visible:bg-gray-200">
  Custom focusable content
</div>
```

### Focus Order
- Ensure logical tab order follows visual layout
- Skip links for main content navigation
- Trap focus within modals and dialogs
- Return focus to trigger element when closing overlays

```javascript
// Focus trap example for modals
function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  });
}
```

## Touch Targets and Interaction

### Minimum Touch Targets
- **Apple standard**: 44×44 points (59×59 CSS pixels)
- **WCAG 2.5.5 (AAA)**: 44×44 CSS pixels minimum
- **Recommended**: 48×48 points for optimal usability

```html
<!-- Minimum touch targets -->
<button class="min-w-[44px] min-h-[44px] p-3 m-1 bg-apple-blue text-white rounded-lg pointer-coarse:min-w-[48px] pointer-coarse:min-h-[48px]">
  Touch Target
</button>

<!-- Icon button with adequate touch area -->
<button class="min-w-[44px] min-h-[44px] p-2 m-1 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200">
  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"/>
  </svg>
</button>

<!-- List of touch targets with proper spacing -->
<div class="space-y-1">
  <button class="w-full min-h-[44px] px-4 py-3 text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
    List Item 1
  </button>
  <button class="w-full min-h-[44px] px-4 py-3 text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
    List Item 2
  </button>
</div>
```

### Gesture Alternatives
- Provide alternatives to complex gestures
- Support both touch and keyboard interaction
- Avoid drag-only interactions
- Provide undo functionality for destructive actions

## Screen Reader Support

### Semantic HTML
Use proper semantic elements:

```html
<!-- Good: Semantic structure -->
<main>
  <section aria-labelledby="dashboard-heading">
    <h1 id="dashboard-heading">Dashboard</h1>
    <nav aria-label="Dashboard navigation">
      <ul>
        <li><a href="/overview">Overview</a></li>
        <li><a href="/analytics">Analytics</a></li>
      </ul>
    </nav>
  </section>
</main>

<!-- Bad: Generic divs -->
<div>
  <div>Dashboard</div>
  <div>
    <div><a href="/overview">Overview</a></div>
    <div><a href="/analytics">Analytics</a></div>
  </div>
</div>
```

### ARIA Labels and Descriptions
```html
<!-- Descriptive labels -->
<button aria-label="Close dialog">×</button>

<!-- Additional context -->
<input 
  type="password" 
  aria-describedby="password-help"
  required
>
<div id="password-help">
  Password must be at least 8 characters long
</div>

<!-- Live regions for dynamic content -->
<div aria-live="polite" id="status-message"></div>
```



## Keyboard Navigation

### Keyboard Support Requirements
- All interactive elements must be keyboard accessible
- Provide visible focus indicators
- Support standard keyboard shortcuts
- Implement logical tab order

```html
<!-- Skip links for keyboard users -->
<a href="#main-content" class="absolute -top-10 left-1.5 bg-apple-blue text-white px-2 py-2 no-underline rounded z-[1000] focus:top-1.5">
  Skip to main content
</a>

<!-- Skip navigation -->
<a href="#navigation" class="absolute -top-10 left-1.5 bg-apple-blue text-white px-2 py-2 no-underline rounded z-[1000] focus:top-1.5">
  Skip to navigation
</a>

<!-- Main content with proper landmark -->
<main id="main-content" class="p-4">
  <h1>Page Content</h1>
  <!-- Content -->
</main>

<!-- Navigation with proper landmark -->
<nav id="navigation" aria-label="Main navigation" class="p-4">
  <ul class="space-y-2">
    <li><a href="/" class="block p-2 hover:bg-gray-100 rounded">Home</a></li>
    <li><a href="/about" class="block p-2 hover:bg-gray-100 rounded">About</a></li>
  </ul>
</nav>
```

### Custom Component Keyboard Patterns
```javascript
// Example: Custom dropdown keyboard support
class AccessibleDropdown {
  constructor(element) {
    this.dropdown = element;
    this.trigger = element.querySelector('[data-dropdown-trigger]');
    this.menu = element.querySelector('[data-dropdown-menu]');
    this.items = this.menu.querySelectorAll('[role="menuitem"]');
    
    this.bindEvents();
  }
  
  bindEvents() {
    this.trigger.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
        case 'ArrowDown':
          e.preventDefault();
          this.open();
          this.items[0]?.focus();
          break;
      }
    });
    
    this.menu.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'Escape':
          this.close();
          this.trigger.focus();
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.focusNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.focusPrevious();
          break;
      }
    });
  }
}
```

## Motion and Animation Accessibility

### Reduced Motion Support
Always respect user preferences for reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  /* Replace motion with opacity changes */
  .slide-in {
    animation: none;
    opacity: 1;
  }
}
```

### Safe Animation Practices
- Avoid flashing content (no more than 3 flashes per second)
- Provide pause controls for auto-playing content
- Use subtle, purposeful animations
- Ensure animations don't interfere with reading

## Form Accessibility

### Form Labels and Instructions
```html
<!-- Proper labeling -->
<label for="email">Email Address</label>
<input 
  type="email" 
  id="email" 
  name="email"
  required
  aria-describedby="email-error"
  aria-invalid="false"
>
<div id="email-error" role="alert"></div>

<!-- Fieldset for grouped inputs -->
<fieldset>
  <legend>Contact Preferences</legend>
  <label>
    <input type="radio" name="contact" value="email">
    Email
  </label>
  <label>
    <input type="radio" name="contact" value="phone">
    Phone
  </label>
</fieldset>
```

### Error Handling
```javascript
function showFieldError(field, message) {
  const errorElement = document.getElementById(`${field.id}-error`);
  
  field.setAttribute('aria-invalid', 'true');
  errorElement.textContent = message;
  errorElement.setAttribute('role', 'alert');
  
  // Focus the field for immediate attention
  field.focus();
}
```



## Implementation Guidelines

### Progressive Enhancement
Start with accessible baseline, enhance with JavaScript:

```html
<!-- Works without JavaScript -->
<details>
  <summary>Show more options</summary>
  <div>Additional content...</div>
</details>

<!-- Enhanced with JavaScript for better UX -->
<script>
  // Enhance with custom dropdown behavior
  enhanceDropdown(document.querySelector('details'));
</script>
```

### Accessibility-First Development
1. Start with semantic HTML
2. Add ARIA attributes where needed
3. Implement keyboard navigation
4. Implement keyboard navigation
5. Add ARIA attributes where needed

This approach ensures accessibility is built-in rather than retrofitted.