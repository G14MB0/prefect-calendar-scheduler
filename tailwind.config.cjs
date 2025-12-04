/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          details: 'var(--bg-details)'
        },
        border: {
          primary: 'var(--border-primary)',
          secondary: 'var(--border-secondary)'
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          button: 'var(--text-button)',
          error: 'var(--text-error)'
        },
        button: {
          primary: 'var(--button-primary)',
          hover: 'var(--button-hover)'
        },
        focus: {
          primary: 'var(--focus-primary)'
        },
        accent: {
          blue: 'var(--accent-blue)',
          green: 'var(--accent-green)',
          orange: 'var(--accent-orange)',
          purple: 'var(--accent-purple)'
        }
      },
      boxShadow: {
        custom: '0 0 6px -0.5px var(--tw-shadow-color)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
