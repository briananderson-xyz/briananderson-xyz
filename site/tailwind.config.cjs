/** @type {import('tailwindcss').Config} */
function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}), ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

module.exports = {
  content: ['./src/**/*.{svelte,ts,js,md,svx}', './content/**/*.{md,svx}', './static/**/*.html'],
  darkMode: ['class'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lato', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Inter', 'Noto Sans', 'Ubuntu', 'Cantarell', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['"Fira Code"', '"JetBrains Mono"', '"Courier New"', 'Courier', 'monospace']
      },
      colors: {
        terminal: {
          black: withOpacity('--color-terminal-black'),
          dark: '#1e1e1e',
          green: withOpacity('--color-terminal-accent'),
          dim: '#2d2d2d',
          text: '#cccccc'
        },
        skin: {
          page: withOpacity('--color-bg-page'),
          base: withOpacity('--color-text-base'),
          muted: withOpacity('--color-text-muted'),
          border: withOpacity('--color-border'),
          accent: withOpacity('--color-accent'),
          'accent-contrast': withOpacity('--color-accent-contrast'),
        }
      },
      borderRadius: { xl: '1rem', '2xl': '1.25rem' },
      keyframes: {
        'terminal-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        }
      },
      animation: {
        'terminal-blink': 'terminal-blink 1s step-end infinite',
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': 'rgb(var(--color-text-base))',
            '--tw-prose-headings': 'rgb(var(--color-text-base))',
            '--tw-prose-links': 'rgb(var(--color-accent))',
            '--tw-prose-bold': 'rgb(var(--color-accent))',
            '--tw-prose-counters': 'rgb(var(--color-text-muted))',
            '--tw-prose-bullets': 'rgb(var(--color-text-muted))',
            '--tw-prose-hr': 'rgb(var(--color-border))',
            '--tw-prose-quotes': 'rgb(var(--color-text-base))',
            '--tw-prose-quote-borders': 'rgb(var(--color-accent))',
            '--tw-prose-captions': 'rgb(var(--color-text-muted))',
            '--tw-prose-code': 'rgb(var(--color-accent))',
            '--tw-prose-pre-code': 'rgb(var(--color-text-base))',
            '--tw-prose-pre-bg': 'rgb(var(--color-bg-page))',
            '--tw-prose-th-borders': 'rgb(var(--color-border))',
            '--tw-prose-td-borders': 'rgb(var(--color-border))',
            // Invert variants (used for dark mode)
            '--tw-prose-invert-body': 'rgb(var(--color-text-base))',
            '--tw-prose-invert-headings': 'rgb(var(--color-text-base))',
            '--tw-prose-invert-links': 'rgb(var(--color-accent))',
            '--tw-prose-invert-bold': 'rgb(var(--color-accent))',
            '--tw-prose-invert-counters': 'rgb(var(--color-text-muted))',
            '--tw-prose-invert-bullets': 'rgb(var(--color-text-muted))',
            '--tw-prose-invert-hr': 'rgb(var(--color-border))',
            '--tw-prose-invert-quotes': 'rgb(var(--color-text-base))',
            '--tw-prose-invert-quote-borders': 'rgb(var(--color-accent))',
            '--tw-prose-invert-captions': 'rgb(var(--color-text-muted))',
            '--tw-prose-invert-code': 'rgb(var(--color-accent))',
            '--tw-prose-invert-pre-code': 'rgb(var(--color-text-base))',
            '--tw-prose-invert-pre-bg': 'rgb(var(--color-bg-page))',
            '--tw-prose-invert-th-borders': 'rgb(var(--color-border))',
            '--tw-prose-invert-td-borders': 'rgb(var(--color-border))',
            // Direct element styling
            color: 'rgb(var(--color-text-base))',
            strong: {
              color: 'rgb(var(--color-accent))',
              fontWeight: '700',
            },
            'h1, h2, h3, h4': {
              color: 'rgb(var(--color-text-base))',
              fontFamily: theme('fontFamily.mono'),
            },
            code: {
              color: 'rgb(var(--color-accent))',
              fontFamily: theme('fontFamily.mono'),
            },
            a: {
              color: 'rgb(var(--color-accent))',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            },
            blockquote: {
              color: 'rgb(var(--color-text-base))',
              borderLeftColor: 'rgb(var(--color-accent))',
            },
            'ul > li::marker': {
              color: 'rgb(var(--color-text-muted))',
            },
            'ol > li::marker': {
              color: 'rgb(var(--color-text-muted))',
            },
            hr: {
              borderColor: 'rgb(var(--color-border))',
            },
            pre: {
              backgroundColor: 'rgb(var(--color-bg-page))',
              color: 'rgb(var(--color-text-base))',
            },
          },
        },
      }),
    }
  },
  plugins: [require('@tailwindcss/typography'), require('tailwindcss-animate')]
};
