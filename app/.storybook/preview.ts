import type { Preview } from '@storybook/nextjs-vite'
import '../app/globals.css'

// Load IBM Plex Mono font
const link = document.createElement('link')
link.rel = 'stylesheet'
link.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap'
document.head.appendChild(link)

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'offwhite',
      values: [
        { name: 'offwhite', value: '#F7F5F0' },
        { name: 'white', value: '#FFFFFF' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: { test: 'todo' },
  },
}

export default preview
