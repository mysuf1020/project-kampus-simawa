
import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
    // Setup code if needed (e.g. seeding DB, setting up env vars)
    // For now, it can be empty
}

export default globalSetup;
