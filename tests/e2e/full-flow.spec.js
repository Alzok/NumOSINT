const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Full Investigation Flow (Authenticated)', () => {
  test.setTimeout(180000); // 3 minutes timeout for the whole test

  // This test now relies on the global setup for authentication.
  // The user is already logged in.
  test('should allow creating an investigation, running it, creating a case, assigning it, and exporting a report', async ({ page }) => {
    // 1. Go to the investigations page and create a new investigation
    await page.goto('/investigations');
    
    // Wait for the form to be visible
    const emailInput = page.locator('input[placeholder="ex: jean.dupont@email.com"]');
    await emailInput.waitFor({ state: 'visible', timeout: 60000 });
    await emailInput.fill('test-e2e-flow@example.com');
    const submitButton = page.locator('button:has-text("Lancer l\'investigation")');
    await submitButton.click();
    
    // Wait for the button to be disabled
    await expect(submitButton).toBeDisabled({ timeout: 60000 });
    
    const investigationCard = page.locator('text=test-e2e-flow@example.com');
    await expect(investigationCard).toBeVisible();

    // 2. Go to the investigation page and start the analysis
    await investigationCard.click();
    await page.waitForURL(/\/investigation\//);
    await page.click('button:has-text("Démarrer l\'investigation")');

    // 3. Wait for the analysis to complete
    await expect(page.locator('text=COMPLETED')).toBeVisible({ timeout: 120000 }); // 2 minutes timeout

    // 4. Go back to investigations page and create a case
    await page.goto('/investigations');
    await page.click('button:has-text("Créer un dossier")');
    await page.fill('input[name="name"]', 'Test Case E2E');
    await page.click('button:has-text("Créer")');
    
    // 5. Assign the investigation to the case
    await investigationCard.locator('button:has-text("Gérer")').click();
    await page.locator(`button:has-text("Test Case E2E")`).click();
    await page.locator('button:has-text("Assigner")').click();

    // 6. Go to the case page and export a report
    await page.goto('/investigations');
    await page.locator('text=Test Case E2E').click();
    await page.waitForURL(/\/case\//);

    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Exporter PDF")');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('.pdf');
  });
});