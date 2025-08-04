# Apple Design System Guidelines

## Core Design Philosophy

Follow Apple's Human Interface Guidelines three foundational pillars for all web experiences:

### 1. Clarity
- Use systematic typography scales with high contrast ratios
- Implement San Francisco font stack: `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui`
- Maintain visual hierarchy through consistent sizing and spacing
- Ensure all text meets WCAG 2.1 contrast requirements (4.5:1 for normal text, 3:1 for large text)

### 2. Deference
- Design content-first layouts where UI elements support rather than compete
- Use neutral color palettes with strategic accent colors
- Maintain generous white space using the 8pt grid system
- Let content be the primary focus of every interface

### 3. Depth
- Create visual hierarchy through layering and purposeful motion
- Use blur effects instead of traditional shadows when possible
- Implement subtle shadows: 10-15% opacity, 1-2px Y-offset, 2-4px blur radius
- Apply depth to guide user attention and understanding

## Typography System

### Font Hierarchy
Use these specific sizes with corresponding line heights:

```css
/* Large Title */ font-size: 34pt; line-height: 41pt;
/* Title 1 */ font-size: 28pt; line-height: 34pt;
/* Title 2 */ font-size: 22pt; line-height: 28pt;
/* Title 3 */ font-size: 20pt; line-height: 25pt;
/* Headline */ font-size: 17pt; line-height: 22pt;
/* Body */ font-size: 17pt; line-height: 22pt;
/* Callout */ font-size: 16pt; line-height: 21pt;
/* Subhead */ font-size: 15pt; line-height: 20pt;
/* Footnote */ font-size: 13pt; line-height: 18pt;
/* Caption 1 */ font-size: 12pt; line-height: 16pt;
/* Caption 2 */ font-size: 11pt; line-height: 13pt;
```

### Implementation Rules
- SF Pro Text for sizes 19pt and smaller
- SF Pro Display for sizes 20pt and larger
- Use relative units with clamp() for responsive scaling
- Support Dynamic Type with proper scaling ratios
- Maintain 1.2-1.5x line height ratios aligned to 8pt grid

## Color System

### Primary System Colors
Use Tailwind's color system with custom colors defined in your config:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'apple-red': '#FF3B30',
        'apple-orange': '#FF9500', 
        'apple-yellow': '#FFCC00',
        'apple-green': '#34C759',
        'apple-mint': '#00C7BE',
        'apple-teal': '#30B0C7',
        'apple-cyan': '#32D2FF',
        'apple-blue': '#007AFF',
        'apple-indigo': '#5856D6',
        'apple-purple': '#AF52DE',
        'apple-pink': '#FF2D92',
        'apple-brown': '#A2845E',
      }
    }
  }
}
```

### Semantic Colors (Light/Dark)
Use Tailwind's built-in dark mode with semantic color classes:

```html
<!-- Background colors -->
<div class="bg-white dark:bg-black">Primary background</div>
<div class="bg-gray-50 dark:bg-gray-900">Secondary background</div>
<div class="bg-white dark:bg-gray-800">Tertiary background</div>

<!-- Text colors -->
<p class="text-black dark:text-white">Primary text</p>
<p class="text-gray-600 dark:text-gray-400">Secondary text</p>
<p class="text-gray-400 dark:text-gray-500">Tertiary text</p>
<p class="text-gray-300 dark:text-gray-600">Quaternary text</p>
```

## Spacing and Grid System

### 8-Point Grid
Use Tailwind's spacing scale which aligns with the 8pt grid system:

```html
<!-- Tailwind spacing classes (based on 4px units, multiply by 2 for 8pt grid) -->
<div class="p-1">4px padding (0.5 units)</div>
<div class="p-2">8px padding (1 unit)</div>
<div class="p-4">16px padding (2 units)</div>
<div class="p-6">24px padding (3 units)</div>
<div class="p-8">32px padding (4 units)</div>
<div class="p-12">48px padding (6 units)</div>
<div class="p-16">64px padding (8 units)</div>

<!-- Margin classes follow the same pattern -->
<div class="m-2 mb-4 mt-6">8px margin, 16px bottom, 24px top</div>
```

### Layout Rules
- Use 12-column responsive grid
- 24px gutter width (1.5rem)
- Desktop margins: 60px on 1440px viewports
- Mobile margins: 16-20px
- Internal spacing never exceeds external spacing

## Component Standards

### Touch Targets
- Minimum size: 44×44pt (59×59 CSS pixels)
- Recommended: 48×48pt for better usability
- Apply appropriate padding even if visual appearance is smaller

### Buttons
```html
<button class="min-w-[44px] min-h-[44px] px-4 py-3 text-[17px] rounded-lg transition-all duration-150 ease-out">
  Button
</button>
```

### Form Elements
- Text field height: 44pt minimum
- Internal padding: 16pt horizontal, 12pt vertical
- Border: 1pt using separator colors
- Font: 17pt SF Pro Text for input and placeholder
- Focus state: System blue (#007AFF) outline

### Cards and Containers
- Corner radius: 10-12pt for cards, 8pt for smaller elements
- Padding: 16pt standard, 20pt for emphasis
- Shadow: 0.5pt offset, 15% opacity when needed
- Background: Use semantic system colors

## Motion and Animation

### Timing Standards
Use Tailwind's duration classes:

```html
<!-- Microinteractions -->
<div class="transition-all duration-100">Fast feedback</div>

<!-- Component state changes -->
<div class="transition-all duration-200">State changes</div>

<!-- Navigation transitions -->
<div class="transition-all duration-300">Navigation</div>

<!-- Modal presentations -->
<div class="transition-all duration-500">Modals</div>

<!-- Complex transitions -->
<div class="transition-all duration-700">Complex animations</div>
```

### Easing Functions
Use Tailwind's easing classes:

```html
<!-- Standard easing -->
<div class="transition-all ease-out">Default motion</div>

<!-- Entrance animations -->
<div class="transition-all ease-out">Entrance</div>

<!-- Exit animations -->
<div class="transition-all ease-in">Exit</div>

<!-- Spring-like motion (custom) -->
<div class="transition-all ease-[cubic-bezier(0.25,0.46,0.45,0.94)]">Spring</div>
```

### Reduced Motion Support
Use Tailwind's motion-reduce modifier:

```html
<!-- Respect reduced motion preferences -->
<div class="transition-all duration-300 motion-reduce:transition-none">
  Animated element
</div>

<!-- Alternative with opacity only -->
<div class="transition-all duration-300 motion-reduce:transition-opacity motion-reduce:duration-200">
  Gentle animation
</div>
```

## Implementation Checklist

### Typography
- [ ] Implement SF font stack with system fallbacks
- [ ] Define complete type scale using design tokens
- [ ] Support Dynamic Type with relative units
- [ ] Ensure proper optical sizing for display vs text

### Color System
- [ ] Implement semantic color tokens
- [ ] Support automatic dark mode switching
- [ ] Verify contrast ratios meet WCAG standards
- [ ] Test color accessibility for color blindness

### Spacing and Layout
- [ ] Apply 8pt grid system consistently
- [ ] Use systematic spacing scale
- [ ] Implement responsive grid with proper breakpoints
- [ ] Maintain internal ≤ external spacing rule

### Interactive Components
- [ ] Ensure 44pt minimum touch targets
- [ ] Implement proper focus states
- [ ] Add appropriate hover/active states
- [ ] Support keyboard navigation

### Motion Design
- [ ] Use recommended timing and easing functions
- [ ] Implement reduced motion support
- [ ] Optimize for 60fps performance
- [ ] Test on various devices and connections

### Accessibility
- [ ] Meet contrast requirements
- [ ] Support screen readers
- [ ] Implement keyboard navigation
- [ ] Test with assistive technologies