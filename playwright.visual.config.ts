import { defineConfig, devices } from '@playwright/test'
import base from './playwright.config'

export default defineConfig({
  ...base,
  testMatch: ['visual-studio.e2e.spec.ts', 'readability.e2e.spec.ts'],
  workers: 1,
  expect: { timeout: 15000 },
  use: { ...base.use, screenshot: 'only-on-failure' },
  reporter: [['line'], ['html', { outputFolder: '.tools/visual-report', open: 'never' }]],
  projects: [
    {
      name: 'studio-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
    { name: 'studio-webkit', use: { ...devices['iPhone 13'] } },
  ],
})
