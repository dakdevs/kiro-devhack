# Tailwind Configuration Requirements

## Required Tailwind Config Extensions

To support the Apple Design System guidelines, add these extensions to your `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // or 'media' for system preference
  theme: {
    extend: {
      colors: {
        // Apple System Colors
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
      },
      fontFamily: {
        // San Francisco font stack
        'system': [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'SF Pro Display',
          'system-ui',
          'sans-serif'
        ],
      },
      fontSize: {
        // Apple typography scale
        'large-title': ['34px', '41px'],
        'title-1': ['28px', '34px'],
        'title-2': ['22px', '28px'],
        'title-3': ['20px', '25px'],
        'headline': ['17px', '22px'],
        'body': ['17px', '22px'],
        'callout': ['16px', '21px'],
        'subhead': ['15px', '20px'],
        'footnote': ['13px', '18px'],
        'caption-1': ['12px', '16px'],
        'caption-2': ['11px', '13px'],
      },
      spacing: {
        // 8-point grid system (Tailwind's default already aligns)
        '18': '4.5rem', // 72px
        '22': '5.5rem', // 88px
      },
      borderRadius: {
        // Apple corner radius values
        'apple-sm': '6px',
        'apple-md': '8px',
        'apple-lg': '12px',
        'apple-xl': '16px',
      },
      boxShadow: {
        // Apple shadow system
        'apple-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'apple-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'apple-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'apple-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        // Custom animations
        'shimmer': 'shimmer 1.5s infinite',
        'slide': 'slide 1.5s infinite',
        'modal-enter': 'modalEnter 0.3s ease-out',
        'modal-exit': 'modalExit 0.3s ease-in',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slide: {
          '0%': { left: '-100%' },
          '100%': { left: '100%' },
        },
        modalEnter: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px) scale(0.95)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0) scale(1)',
          },
        },
        modalExit: {
          '0%': {
            opacity: '1',
            transform: 'translateY(0) scale(1)',
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(-10px) scale(0.98)',
          },
        },
      },
      transitionTimingFunction: {
        // Apple easing functions
        'apple-standard': 'cubic-bezier(0.25, 0.1, 0.25, 1.0)',
        'apple-spring': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'apple-sharp': 'cubic-bezier(0.4, 0.0, 0.6, 1.0)',
      },
      backdropBlur: {
        'apple': '20px',
      },
    },
  },
  plugins: [
    // Add container queries support
    require('@tailwindcss/container-queries'),
    
    // Add forms plugin for better form styling
    require('@tailwindcss/forms'),
    
    // Add typography plugin if needed
    require('@tailwindcss/typography'),
  ],
}
```

## Required Plugins

Install these Tailwind plugins to support the design system:

```bash
npm install -D @tailwindcss/container-queries @tailwindcss/forms @tailwindcss/typography
```

## CSS Custom Properties for Dynamic Values

Add these to your global CSS file for values that need to be dynamic:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Dynamic text scaling */
    --text-scale: 1;
    --user-font-scale: 0;
  }
  
  /* Support for user font scaling preferences */
  @media (prefers-reduced-motion: no-preference) {
    :root {
      --text-scale: clamp(1, 1 + 0.5 * var(--user-font-scale, 0), 2);
    }
  }
  
  /* High contrast mode support */
  @media (prefers-contrast: high) {
    :root {
      --focus-outline-width: 3px;
    }
  }
}

@layer utilities {
  /* Custom utilities for Apple design patterns */
  .text-fluid-sm { font-size: clamp(0.875rem, 2vw, 1rem); }
  .text-fluid-base { font-size: clamp(1rem, 2.5vw, 1.125rem); }
  .text-fluid-lg { font-size: clamp(1.125rem, 3vw, 1.5rem); }
  .text-fluid-xl { font-size: clamp(1.25rem, 3.5vw, 2rem); }
  .text-fluid-2xl { font-size: clamp(1.5rem, 4vw, 3rem); }
  
  /* Responsive spacing utilities */
  .space-responsive-xs { gap: clamp(4px, 1vw, 8px); }
  .space-responsive-sm { gap: clamp(8px, 2vw, 16px); }
  .space-responsive-md { gap: clamp(16px, 3vw, 24px); }
  .space-responsive-lg { gap: clamp(24px, 4vw, 32px); }
  .space-responsive-xl { gap: clamp(32px, 5vw, 48px); }
}
```

## Dark Mode Configuration

Ensure your app supports dark mode by adding the dark mode toggle functionality:

```typescript
// Example dark mode toggle hook
export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    const stored = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(stored ? JSON.parse(stored) : prefersDark);
  }, []);
  
  const toggle = () => {
    const newValue = !isDark;
    setIsDark(newValue);
    localStorage.setItem('darkMode', JSON.stringify(newValue));
    document.documentElement.classList.toggle('dark', newValue);
  };
  
  return { isDark, toggle };
}
```

## Usage Notes

1. **Font Loading**: Ensure the San Francisco font stack is properly loaded by using the `font-system` class
2. **Color Usage**: Use semantic color names (e.g., `text-apple-blue`) rather than arbitrary values when possible
3. **Spacing**: Stick to the 8-point grid by using Tailwind's default spacing scale
4. **Animations**: Always include `motion-reduce:` variants for accessibility
5. **Dark Mode**: Test all components in both light and dark modes
6. **Container Queries**: Use `@container` queries for component-level responsiveness when supported

## Validation

Test your configuration by using these example classes:

```html
<div class="bg-apple-blue text-white font-system text-body rounded-apple-lg shadow-apple-md transition-all duration-200 ease-apple-spring motion-reduce:transition-none">
  Apple Design System Test
</div>
```