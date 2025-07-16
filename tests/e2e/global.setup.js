const { chromium } = require('@playwright/test');
const path = require('path');

const authFile = path.join(__dirname, 'storageState.json');

module.exports = async (config) => {
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const email = process.env.E2E_TEST_USER || 'e2e-user@example.com';
  const password = process.env.E2E_TEST_PASSWORD || 'Password123!';

  await page.goto(`${baseURL}/login`);

  // Attendre que le formulaire soit prêt
  await page.waitForSelector('input[name="email"]');

  // Try to log in directly
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button:has-text("Se connecter")');

  try {
    await page.waitForURL(`${baseURL}/investigations`, { timeout: 5000 });
    await page.context().storageState({ path: authFile });
    await browser.close();
    return;
  } catch (e) {
    console.log('Login failed, attempting to register...');
  }

  // Go to registration page
  await page.goto(`${baseURL}/register`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button:has-text("S\'inscrire")');

  // Should be redirected to login page
  await page.waitForURL(`${baseURL}/login`);

  // Log in with the new credentials
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button:has-text("Se connecter")');

  // Wait for the final page and save the state.
  await page.waitForURL(`${baseURL}/investigations`);
  await page.context().storageState({ path: authFile });

  await browser.close();
};