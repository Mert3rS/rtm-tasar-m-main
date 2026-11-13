import { defineConfig, devices } from '@playwright/test'
import base from './playwright.config'

export default defineConfig({
  ...base,
  testMatch: /mobile(?:-cms|-admin)?\.e2e\.spec\.ts/,
  workers: 1,
  reporter: [['line'], ['html', { open: 'never', outputFolder: '.tools/mobile-report' }]],
  projects: [
    { name: 'touch-chromium', use: { ...devices['Pixel 7'], browserName: 'chromium' } },
    { name: 'touch-webkit', use: { ...devices['iPhone 13'], browserName: 'webkit' } },
  ],
})
