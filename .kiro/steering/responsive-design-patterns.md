# Responsive Design Patterns

## Breakpoint System

Use Tailwind's built-in responsive breakpoints which align with Apple's systematic approach:

```html
<!-- Tailwind responsive prefixes -->
<div class="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 2xl:w-1/6">
  Responsive width
</div>

<!-- Breakpoint values: -->
<!-- sm: 640px   - Mobile landscape -->
<!-- md: 768px   - Tablet portrait -->
<!-- lg: 1024px  - Tablet landscape -->
<!-- xl: 1280px  - Desktop -->
<!-- 2xl: 1536px - Large desktop -->
```

## Component Adaptation Patterns

### Navigation Patterns
- **Mobile**: Hamburger menu with slide-out drawer
- **Tablet**: Collapsible sidebar or tab bar
- **Desktop**: Horizontal navigation bar or persistent sidebar

### Grid Layouts
- **Mobile**: Single column, full-width cards
- **Tablet**: 2-3 column grid with appropriate gutters
- **Desktop**: 3-4+ column grid with larger gutters

### Typography Scaling
Use Tailwind's responsive text sizes and custom clamp values:

```html
<!-- Responsive text sizes -->
<h1 class="text-2xl md:text-3xl lg:text-4xl xl:text-5xl">Responsive heading</h1>
<p class="text-sm md:text-base lg:text-lg">Responsive body text</p>

<!-- Fluid typography with arbitrary values -->
<h1 class="text-[clamp(1.5rem,4vw,3rem)]">Fluid heading</h1>
<p class="text-[clamp(1rem,2.5vw,1.125rem)]">Fluid body text</p>

<!-- Or define custom utilities in your Tailwind config -->
<h1 class="text-fluid-2xl">Custom fluid text</h1>
```

## Touch Target Optimization

### Device-Specific Targets
- **Mobile**: 44×44pt minimum (touch-friendly)
- **Tablet**: 44×44pt minimum (hybrid touch/cursor)
- **Desktop**: 32×32pt minimum (cursor-optimized)

### Implementation
```html
<!-- Touch-friendly targets with desktop optimization -->
<button class="min-w-[44px] min-h-[44px] hover:min-w-8 hover:min-h-8 p-3 hover:p-2">
  Interactive element
</button>

<!-- Using Tailwind's pointer media queries -->
<button class="min-w-[44px] min-h-[44px] pointer-fine:min-w-8 pointer-fine:min-h-8">
  Pointer-aware button
</button>
```

## Layout Patterns

### Container Queries (Preferred)
Use Tailwind's container query support:

```html
<!-- Container with size tracking -->
<div class="@container">
  <!-- Component that responds to container size -->
  <div class="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 gap-4">
    <div class="@sm:flex @sm:items-center @sm:gap-4">
      <!-- Card content -->
    </div>
  </div>
</div>
```

### Media Queries (Fallback)
Standard responsive grid patterns:

```html
<!-- Responsive grid -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <div class="bg-white p-4 rounded-lg">Card 1</div>
  <div class="bg-white p-4 rounded-lg">Card 2</div>
  <div class="bg-white p-4 rounded-lg">Card 3</div>
</div>

<!-- Auto-fit grid -->
<div class="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
  <div class="bg-white p-4 rounded-lg">Auto-sizing card</div>
</div>
```

## Spacing Adaptation

### Responsive Spacing Scale
```html
<!-- Responsive spacing with Tailwind -->
<div class="p-4 md:p-6 lg:p-8">Responsive padding</div>
<div class="m-2 md:m-4 lg:m-6">Responsive margin</div>
<div class="space-y-4 md:space-y-6 lg:space-y-8">Responsive gap</div>

<!-- Fluid spacing with arbitrary values -->
<div class="p-[clamp(16px,3vw,24px)]">Fluid padding</div>
<div class="m-[clamp(8px,2vw,16px)]">Fluid margin</div>

<!-- Custom responsive spacing utilities -->
<div class="space-responsive-md">Custom responsive spacing</div>
```

### Margin and Padding Rules
- **Mobile**: Tighter spacing, 16-20px margins
- **Tablet**: Moderate spacing, 24-32px margins
- **Desktop**: Generous spacing, 40-60px margins

## Image and Media Handling

### Responsive Images
```html
<!-- Basic responsive image -->
<img class="w-full h-auto object-cover rounded-lg" src="image.jpg" alt="Description" />

<!-- Art direction with responsive aspect ratios -->
<img class="w-full h-auto object-cover rounded-lg aspect-[4/3] md:aspect-video" src="hero.jpg" alt="Hero image" />

<!-- Responsive image sizes -->
<img class="w-full md:w-1/2 lg:w-1/3 h-auto object-cover rounded-lg" src="thumbnail.jpg" alt="Thumbnail" />
```

### Video Responsiveness
```html
<!-- Responsive video container -->
<div class="relative w-full aspect-video rounded-xl overflow-hidden">
  <video class="absolute inset-0 w-full h-full object-cover" controls>
    <source src="video.mp4" type="video/mp4" />
  </video>
</div>

<!-- Responsive iframe embed -->
<div class="relative w-full aspect-video rounded-xl overflow-hidden">
  <iframe class="absolute inset-0 w-full h-full" src="https://youtube.com/embed/..." frameborder="0"></iframe>
</div>
```

## Form Adaptations

### Mobile-First Form Design
```html
<!-- Responsive form layout -->
<div class="space-y-4">
  <div class="w-full">
    <label class="block text-sm font-medium mb-2">Name</label>
    <input class="w-full min-h-[44px] px-4 py-3 border rounded-lg" />
  </div>
  
  <!-- Form row that stacks on mobile, side-by-side on desktop -->
  <div class="flex flex-col md:flex-row gap-4">
    <div class="w-full md:flex-1">
      <label class="block text-sm font-medium mb-2">First Name</label>
      <input class="w-full min-h-[44px] px-4 py-3 border rounded-lg" />
    </div>
    <div class="w-full md:flex-1">
      <label class="block text-sm font-medium mb-2">Last Name</label>
      <input class="w-full min-h-[44px] px-4 py-3 border rounded-lg" />
    </div>
  </div>
</div>
```

### Input Sizing
```html
<!-- Responsive input with iOS zoom prevention -->
<input class="w-full min-h-[44px] px-4 py-3 text-base md:text-[17px] border rounded-lg" />

<!-- Form with responsive sizing -->
<form class="space-y-4 md:space-y-6">
  <input class="w-full min-h-[44px] px-4 py-3 text-base md:text-[17px] border rounded-lg" placeholder="Email" />
  <button class="w-full md:w-auto min-h-[44px] px-6 py-3 bg-apple-blue text-white rounded-lg">
    Submit
  </button>
</form>
```

## Performance Considerations

### Critical CSS
Load critical styles inline for above-the-fold content:

```html
<style>
  /* Critical styles for initial viewport */
  .hero { /* styles */ }
  .navigation { /* styles */ }
</style>
```

### Progressive Enhancement
Start with mobile-first, enhance for larger screens:

```css
/* Base mobile styles */
.component {
  /* Mobile-first styles */
}

/* Progressive enhancement */
@media (min-width: 768px) {
  .component {
    /* Tablet enhancements */
  }
}

@media (min-width: 1024px) {
  .component {
    /* Desktop enhancements */
  }
}
```



## Common Patterns

### Sidebar Layout
```html
<!-- Responsive sidebar layout -->
<div class="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
  <aside class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
    Sidebar content
  </aside>
  <main class="bg-white dark:bg-black p-4 rounded-lg">
    Main content
  </main>
</div>
```

### Card Grid
```html
<!-- Auto-fit card grid -->
<div class="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
  <div class="bg-white p-6 rounded-lg shadow">Card 1</div>
  <div class="bg-white p-6 rounded-lg shadow">Card 2</div>
  <div class="bg-white p-6 rounded-lg shadow">Card 3</div>
</div>

<!-- Responsive card grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  <div class="bg-white p-6 rounded-lg shadow">Responsive card</div>
</div>
```

### Flexible Navigation
```html
<!-- Responsive navigation -->
<nav class="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
  <a href="/" class="px-3 py-2 rounded hover:bg-gray-100">Home</a>
  <a href="/about" class="px-3 py-2 rounded hover:bg-gray-100">About</a>
  <a href="/contact" class="px-3 py-2 rounded hover:bg-gray-100">Contact</a>
</nav>

<!-- Mobile hamburger menu -->
<div class="md:hidden">
  <button class="p-2" aria-label="Toggle menu">
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
    </svg>
  </button>
</div>
```