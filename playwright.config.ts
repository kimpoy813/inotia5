import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir:'./tests',testMatch:'**/*.spec.ts',timeout:75000,fullyParallel:false,workers:1,reporter:'list',
  expect:{timeout:8500},
  use:{ ...devices['Desktop Chrome'], baseURL:'http://localhost:4317', screenshot:'only-on-failure', trace:'retain-on-failure',
    launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:process.env.VEILBOUND_SOFTWARE_CANVAS?['--disable-webgl']:[]}},
  webServer:{command:'npm run preview -- --port 4317 --strictPort',url:'http://localhost:4317',reuseExistingServer:!process.env.CI,timeout:15000},
})
