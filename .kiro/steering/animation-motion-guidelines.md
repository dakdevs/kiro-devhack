# Animation and Motion Guidelines

## Motion Design Philosophy

Follow Apple's approach to motion design: animations should feel natural, purposeful, and enhance understanding rather than distract. Every animation should have a clear functional purpose.

## Timing and Easing Standards

### Duration Guidelines
Use Tailwind's duration classes for consistent motion:

```html
<!-- Micro-interactions -->
<div class="transition-all duration-100">Instant feedback</div>
<div class="transition-all duration-150">Fast feedback</div>

<!-- Component state changes -->
<div class="transition-all duration-200">Normal transitions</div>
<div class="transition-all duration-300">Moderate transitions</div>

<!-- Navigation and transitions -->
<div class="transition-all duration-500">Slow transitions</div>
<div class="transition-all duration-700">Complex animations</div>
```

### Easing Functions
Use Tailwind's easing classes and custom curves:

```html
<!-- Standard easing -->
<div class="transition-all ease-out">Most common</div>

<!-- Entrance animations -->
<div class="transition-all ease-out">Entrance</div>

<!-- Exit animations -->
<div class="transition-all ease-in">Exit</div>

<!-- Spring-like motion -->
<div class="transition-all ease-[cubic-bezier(0.25,0.46,0.45,0.94)]">Spring</div>

<!-- Sharp, decisive motion -->
<div class="transition-all ease-[cubic-bezier(0.4,0.0,0.6,1.0)]">Sharp</div>
```

## Animation Categories

### Micro-Interactions (100-200ms)
Quick feedback for user actions:

```html
<!-- Button with hover effects -->
<button class="px-4 py-2 bg-apple-blue text-white rounded-lg transition-all duration-150 ease-out hover:-translate-y-px hover:shadow-md active:translate-y-0 active:duration-100">
  Interactive Button
</button>

<!-- Input focus states -->
<input class="w-full px-4 py-3 border border-gray-200 rounded-lg transition-colors duration-150 ease-out focus:border-apple-blue focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)] focus:outline-none" />

<!-- Icon button with scale effect -->
<button class="p-2 rounded-full transition-transform duration-150 ease-out hover:scale-110 active:scale-95">
  <svg class="w-5 h-5"><!-- icon --></svg>
</button>
```

### Component State Changes (200-400ms)
Smooth transitions between component states:

```html
<!-- Card with hover effects -->
<div class="bg-white p-6 rounded-xl shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg">
  <h3 class="text-lg font-semibold">Card Title</h3>
  <p class="text-gray-600">Card content</p>
</div>

<!-- Toggle switch -->
<button class="relative w-12 h-6 bg-gray-200 rounded-full transition-colors duration-200 ease-out data-[active]:bg-apple-blue">
  <div class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] data-[active]:translate-x-6"></div>
</button>

<!-- Expandable section -->
<div class="overflow-hidden transition-all duration-300 ease-out data-[expanded]:max-h-96 max-h-0">
  <div class="p-4">
    <p>Expandable content</p>
  </div>
</div>
```

### Navigation Transitions (300-500ms)
Page and view transitions:

```html
<!-- Page enter animation -->
<div class="animate-in slide-in-from-right-5 fade-in duration-300">
  <h1>New Page Content</h1>
</div>

<!-- Page exit animation -->
<div class="animate-out slide-out-to-left-5 fade-out duration-300">
  <h1>Exiting Page Content</h1>
</div>

<!-- Sidebar with slide animation -->
<aside class="fixed inset-y-0 left-0 w-64 bg-white transform -translate-x-full transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] data-[open]:translate-x-0">
  <nav class="p-4">
    <a href="/" class="block py-2">Home</a>
    <a href="/about" class="block py-2">About</a>
  </nav>
</aside>

<!-- Mobile menu overlay -->
<div class="fixed inset-0 bg-black/50 opacity-0 transition-opacity duration-300 data-[open]:opacity-100">
  <div class="fixed inset-y-0 right-0 w-64 bg-white transform translate-x-full transition-transform duration-300 ease-out data-[open]:translate-x-0">
    <!-- Menu content -->
  </div>
</div>
```

### Modal and Overlay Animations (400-600ms)
Entrance and exit animations for overlays:

```css
.modal-overlay {
  opacity: 0;
  animation: fadeIn var(--duration-slow) var(--ease-out) forwards;
}

.modal {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
  animation: modalEnter var(--duration-slow) var(--ease-spring) forwards;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

@keyframes modalEnter {
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Exit animations */
.modal-overlay.exiting {
  animation: fadeOut var(--duration-moderate) var(--ease-in) forwards;
}

.modal.exiting {
  animation: modalExit var(--duration-moderate) var(--ease-in) forwards;
}

@keyframes fadeOut {
  to {
    opacity: 0;
  }
}

@keyframes modalExit {
  to {
    opacity: 0;
    transform: translateY(-10px) scale(0.98);
  }
}
```

## Loading and Progress Animations

### Spinner Animations
```html
<!-- Loading spinner -->
<div class="w-5 h-5 border-2 border-gray-200 border-t-apple-blue rounded-full animate-spin"></div>

<!-- Pulsing loader -->
<div class="w-4 h-4 bg-apple-blue rounded-full animate-pulse"></div>

<!-- Bouncing dots -->
<div class="flex space-x-1">
  <div class="w-2 h-2 bg-apple-blue rounded-full animate-bounce"></div>
  <div class="w-2 h-2 bg-apple-blue rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
  <div class="w-2 h-2 bg-apple-blue rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
</div>

<!-- Custom pulse animation -->
<div class="w-8 h-8 bg-apple-blue/20 rounded-full animate-[pulse_1.5s_ease-in-out_infinite]">
  <div class="w-full h-full bg-apple-blue rounded-full animate-[pulse_1.5s_ease-in-out_infinite_0.5s]"></div>
</div>
```

### Progress Indicators
```html
<!-- Progress bar -->
<div class="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
  <div class="h-full bg-apple-blue rounded-full transition-all duration-200 ease-out" style="width: 60%"></div>
</div>

<!-- Indeterminate progress -->
<div class="w-full h-1 bg-gray-200 rounded-full overflow-hidden relative">
  <div class="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-apple-blue to-transparent animate-[slide_1.5s_infinite]"></div>
</div>

<!-- Circular progress -->
<div class="relative w-8 h-8">
  <svg class="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2" fill="none" class="text-gray-200" />
    <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2" fill="none" 
            class="text-apple-blue transition-all duration-300 ease-out"
            stroke-dasharray="87.96" 
            stroke-dashoffset="26.39" 
            stroke-linecap="round" />
  </svg>
</div>

<!-- Add to Tailwind config for slide animation -->
<!-- 
@keyframes slide {
  0% { left: -100%; }
  100% { left: 100%; }
}
-->
```

## Skeleton Loading Animations

### Content Placeholders
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-secondary) 25%,
    var(--bg-tertiary) 50%,
    var(--bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Skeleton variants */
.skeleton-text {
  height: 1em;
  margin-bottom: 0.5em;
}

.skeleton-text:last-child {
  width: 60%;
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.skeleton-button {
  height: 44px;
  width: 120px;
  border-radius: var(--radius-md);
}
```

## List and Grid Animations

### Staggered Animations
```css
.list-item {
  opacity: 0;
  transform: translateY(20px);
  animation: listItemEnter var(--duration-moderate) var(--ease-out) forwards;
}

.list-item:nth-child(1) { animation-delay: 0ms; }
.list-item:nth-child(2) { animation-delay: 50ms; }
.list-item:nth-child(3) { animation-delay: 100ms; }
.list-item:nth-child(4) { animation-delay: 150ms; }
.list-item:nth-child(5) { animation-delay: 200ms; }

@keyframes listItemEnter {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Grid item animations */
.grid-item {
  opacity: 0;
  transform: scale(0.8);
  animation: gridItemEnter var(--duration-slow) var(--ease-spring) forwards;
}

@keyframes gridItemEnter {
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

## Scroll-Based Animations

### Intersection Observer Animations
```javascript
// Fade in elements as they enter viewport
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-in');
    }
  });
}, observerOptions);

// CSS for scroll animations
.scroll-animate {
  opacity: 0;
  transform: translateY(30px);
  transition: all var(--duration-slow) var(--ease-out);
}

.scroll-animate.animate-in {
  opacity: 1;
  transform: translateY(0);
}
```

### Parallax Effects (Subtle)
```css
.parallax-element {
  transform: translateY(var(--scroll-offset, 0));
  transition: transform 0.1s linear;
}

/* Use sparingly and subtly */
.hero-background {
  transform: translateY(calc(var(--scroll-y) * 0.5px));
}
```

## Reduced Motion Support

### Accessibility-First Approach
Always provide reduced motion alternatives using Tailwind's motion-reduce modifier:

```html
<!-- Respect reduced motion preferences -->
<div class="transition-all duration-300 motion-reduce:transition-none motion-reduce:transform-none">
  <button class="transform hover:scale-105 motion-reduce:hover:scale-100 transition-transform duration-150">
    Accessible button
  </button>
</div>

<!-- Modal with reduced motion support -->
<div class="animate-in slide-in-from-bottom-4 fade-in duration-300 motion-reduce:animate-none motion-reduce:opacity-100">
  <div class="bg-white p-6 rounded-lg">Modal content</div>
</div>

<!-- Loading spinner with reduced motion -->
<div class="w-5 h-5 border-2 border-gray-200 border-t-apple-blue rounded-full animate-spin motion-reduce:animate-none motion-reduce:opacity-60">
</div>

<!-- Keep essential feedback -->
<button class="bg-apple-blue hover:bg-blue-600 motion-reduce:hover:bg-blue-700 transition-colors duration-150 motion-reduce:duration-0">
  Button with accessible feedback
</button>

<!-- Alternative: Use opacity changes for reduced motion -->
<div class="opacity-0 animate-in fade-in duration-500 motion-reduce:opacity-100 motion-reduce:animate-none">
  Content that fades in
</div>
```

## Performance Optimization

### GPU Acceleration
Use transform and opacity for smooth animations:

```css
/* Good - GPU accelerated */
.smooth-animation {
  transform: translate3d(0, 0, 0); /* Force GPU layer */
  will-change: transform, opacity;
  transition: transform var(--duration-normal) var(--ease-out);
}

/* Avoid - causes layout thrashing */
.avoid-animation {
  transition: width var(--duration-normal); /* Bad */
  transition: height var(--duration-normal); /* Bad */
  transition: padding var(--duration-normal); /* Bad */
}
```

### Animation Cleanup
```javascript
// Clean up will-change after animation
element.addEventListener('transitionend', () => {
  element.style.willChange = 'auto';
});

// Use will-change sparingly
element.style.willChange = 'transform';
// Animate...
setTimeout(() => {
  element.style.willChange = 'auto';
}, animationDuration);
```



## Implementation Guidelines

### CSS Custom Properties for Dynamic Animations
```css
.dynamic-animation {
  --animation-delay: 0ms;
  --animation-duration: var(--duration-normal);
  --animation-distance: 20px;
  
  animation: slideIn var(--animation-duration) var(--ease-out);
  animation-delay: var(--animation-delay);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(var(--animation-distance));
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### JavaScript Animation Utilities
```javascript
// Utility for staggered animations
function staggerAnimation(elements, delay = 50) {
  elements.forEach((element, index) => {
    element.style.animationDelay = `${index * delay}ms`;
    element.classList.add('animate-in');
  });
}

// Utility for scroll-triggered animations
function animateOnScroll(selector, options = {}) {
  const elements = document.querySelectorAll(selector);
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        if (options.once) {
          observer.unobserve(entry.target);
        }
      }
    });
  }, {
    threshold: options.threshold || 0.1,
    rootMargin: options.rootMargin || '0px'
  });
  
  elements.forEach(el => observer.observe(el));
}
```

Remember: Animation should enhance usability and provide meaningful feedback, never be purely decorative. Every animation should serve a purpose in guiding user attention or providing system feedback.