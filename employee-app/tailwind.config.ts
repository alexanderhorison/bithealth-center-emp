import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace']
      },
      colors: {
        /* ---- BitHealth Brand (orange) ---- */
        brand: {
          25:  'var(--brand-25)',
          50:  'var(--brand-50)',
          100: 'var(--brand-100)',
          200: 'var(--brand-200)',
          300: 'var(--brand-300)',
          400: 'var(--brand-400)',
          500: 'var(--brand-500)',
          600: 'var(--brand-600)',
          700: 'var(--brand-700)',
          800: 'var(--brand-800)',
          900: 'var(--brand-900)',
          950: 'var(--brand-950)'
        },
        /* ---- Navy (deep blue) ---- */
        navy: {
          25:  'var(--navy-25)',
          50:  'var(--navy-50)',
          100: 'var(--navy-100)',
          200: 'var(--navy-200)',
          300: 'var(--navy-300)',
          400: 'var(--navy-400)',
          500: 'var(--navy-500)',
          600: 'var(--navy-600)',
          700: 'var(--navy-700)',
          800: 'var(--navy-800)',
          900: 'var(--navy-900)',
          950: 'var(--navy-950)'
        },
        /* ---- Success ---- */
        success: {
          25:  'var(--success-25)',
          50:  'var(--success-50)',
          100: 'var(--success-100)',
          300: 'var(--success-300)',
          500: 'var(--success-500)',
          600: 'var(--success-600)',
          700: 'var(--success-700)'
        },
        /* ---- Warning ---- */
        warning: {
          25:  'var(--warning-25)',
          50:  'var(--warning-50)',
          100: 'var(--warning-100)',
          300: 'var(--warning-300)',
          500: 'var(--warning-500)',
          600: 'var(--warning-600)',
          700: 'var(--warning-700)'
        },
        /* ---- Error ---- */
        error: {
          25:  'var(--error-25)',
          50:  'var(--error-50)',
          100: 'var(--error-100)',
          300: 'var(--error-300)',
          500: 'var(--error-500)',
          600: 'var(--error-600)',
          700: 'var(--error-700)'
        },
        /* ---- Semantic text aliases ---- */
        'text-primary':     'var(--text-primary)',
        'text-secondary':   'var(--text-secondary)',
        'text-tertiary':    'var(--text-tertiary)',
        'text-placeholder': 'var(--text-placeholder)',
        'text-disabled':    'var(--text-disabled)',
        'text-on-brand':    'var(--text-on-brand)',
        'text-brand':       'var(--text-brand)',
        'text-navy':        'var(--text-navy)',
        'text-error':       'var(--text-error)',
        'text-success':     'var(--text-success)',
        /* ---- Semantic surface aliases ---- */
        'surface-page':       'var(--surface-page)',
        'surface-subtle':     'var(--surface-subtle)',
        'surface-muted':      'var(--surface-muted)',
        'surface-card':       'var(--surface-card)',
        'surface-brand':      'var(--surface-brand)',
        'surface-brand-soft': 'var(--surface-brand-soft)',
        'surface-navy':       'var(--surface-navy)',
        'surface-inverse':    'var(--surface-inverse)',
        /* ---- Semantic border aliases ---- */
        'border-subtle':  'var(--border-subtle)',
        'border-default': 'var(--border-default)',
        'border-strong':  'var(--border-strong)',
        'border-brand':   'var(--border-brand)',
        'border-error':   'var(--border-error)',
        /* ---- Shadcn compatibility ---- */
        border:     'var(--border)',
        input:      'var(--input)',
        ring:       'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT:    'var(--primary)',
          foreground: 'var(--primary-foreground)'
        },
        muted: {
          DEFAULT:    'var(--muted)',
          foreground: 'var(--muted-foreground)'
        },
        card: {
          DEFAULT:    'var(--card)',
          foreground: 'var(--card-foreground)'
        },
        destructive: {
          DEFAULT:    'var(--destructive)',
          foreground: 'var(--destructive-foreground)'
        }
      },
      borderRadius: {
        xs:   'var(--radius-xs)',
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        '4xl': 'var(--radius-4xl)',
        full: 'var(--radius-full)'
      },
      boxShadow: {
        xs:   'var(--shadow-xs)',
        sm:   'var(--shadow-sm)',
        md:   'var(--shadow-md)',
        lg:   'var(--shadow-lg)',
        xl:   'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)'
      }
    }
  },
  plugins: []
};

export default config;
