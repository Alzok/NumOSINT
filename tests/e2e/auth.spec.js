const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {
  const email = `test-user-${Date.now()}@example.com`;
  const password = 'Password123!';

  test('should fail to log in with incorrect credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button:has-text("Se connecter")');

    const errorMessage = page.locator('text=Email ou mot de passe incorrect');
    await expect(errorMessage).toBeVisible();
  });

  test('should allow a user to register and log in', async ({ page }) => {
    // Go to registration page
    await page.goto('/register');

    // Fill out the registration form
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button:has-text("S\'inscrire")');

    // Should be redirected to login page
    await page.waitForURL('/login');
    await expect(page.locator('h1:has-text("Connexion")')).toBeVisible();

    // Log in with the new credentials
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button:has-text("Se connecter")');

    // Should be redirected to the dashboard/investigations page
    await page.waitForURL('/investigations');
    
    // Check for an element that only an authenticated user can see
    const createCaseButton = page.locator('button:has-text("Créer un dossier")');
    await expect(createCaseButton).toBeVisible();
  });
});