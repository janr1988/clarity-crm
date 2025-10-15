import { test as base, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Test credentials from your seed data
 * Update these if your seed data changes
 */
export const TEST_USERS = {
  salesLead: {
    email: 'sarah.thompson@clarity.com',
    password: 'agent123', // From seed.ts
    id: '0136cad8-2200-46cc-9186-7c65154f7797',
  },
  salesAgent1: {
    email: 'marcus.weber@clarity.com',
    password: 'agent123', // From seed.ts
    id: '76cc95df-6794-47f6-9533-63127b586c17',
  },
  salesAgent2: {
    email: 'sophie.schneider@clarity.com',
    password: 'agent123', // From seed.ts
    id: '6fd29fee-a891-48ba-941d-8fe702132886',
  },
};

/**
 * Database backup and restore helpers
 */
export const dbHelpers = {
  /**
   * Create a backup of the current database
   */
  async backup() {
    const backupPath = path.join(process.cwd(), 'prisma', 'e2e-backup.db');
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    
    try {
      await fs.copyFile(dbPath, backupPath);
      console.log('✓ Database backed up for E2E tests');
      return backupPath;
    } catch (error) {
      console.error('Failed to backup database:', error);
      throw error;
    }
  },

  /**
   * Restore database from backup
   */
  async restore() {
    const backupPath = path.join(process.cwd(), 'prisma', 'e2e-backup.db');
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    
    try {
      await fs.copyFile(backupPath, dbPath);
      console.log('✓ Database restored from E2E backup');
    } catch (error) {
      console.error('Failed to restore database:', error);
      throw error;
    }
  },

  /**
   * Clean up backup file
   */
  async cleanup() {
    const backupPath = path.join(process.cwd(), 'prisma', 'e2e-backup.db');
    
    try {
      await fs.unlink(backupPath);
      console.log('✓ E2E backup cleaned up');
    } catch (error) {
      // Ignore if file doesn't exist
      if ((error as any).code !== 'ENOENT') {
        console.error('Failed to cleanup backup:', error);
      }
    }
  },
};

/**
 * Extended test fixture with authentication and database helpers
 */
type TestFixtures = {
  authenticatedPage: any;
  salesLeadPage: any;
  dbBackup: void;
};

export const test = base.extend<TestFixtures>({
  /**
   * Database backup fixture - runs before each test
   */
  dbBackup: [async ({}, use) => {
    // Backup before test
    await dbHelpers.backup();
    
    // Run the test
    await use();
    
    // Restore after test
    await dbHelpers.restore();
  }, { auto: true }],

  /**
   * Pre-authenticated page as sales agent
   */
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login
    await page.goto('/login');
    
    // Login as sales agent
    await page.fill('input[type="email"]', TEST_USERS.salesAgent1.email);
    await page.fill('input[type="password"]', TEST_USERS.salesAgent1.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/', { timeout: 10000 });
    
    await use(page);
  },

  /**
   * Pre-authenticated page as sales lead
   */
  salesLeadPage: async ({ page }, use) => {
    // Navigate to login
    await page.goto('/login');
    
    // Login as sales lead
    await page.fill('input[type="email"]', TEST_USERS.salesLead.email);
    await page.fill('input[type="password"]', TEST_USERS.salesLead.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/', { timeout: 10000 });
    
    await use(page);
  },
});

export { expect };

/**
 * Helper to generate unique test data
 */
export function generateTestData() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  
  return {
    unique: `${timestamp}-${random}`,
    timestamp,
    random,
  };
}

/**
 * Helper to wait for API response
 */
export async function waitForApiResponse(page: any, urlPattern: string | RegExp) {
  return page.waitForResponse((response: any) => {
    const url = response.url();
    if (typeof urlPattern === 'string') {
      return url.includes(urlPattern);
    }
    return urlPattern.test(url);
  });
}

