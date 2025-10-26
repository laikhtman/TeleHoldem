import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';

type View = {
  name: string;
  width: number;
  height: number;
  mobile?: boolean;
};

const BASE_URL = process.env.SNAPSHOT_BASE_URL || 'http://localhost:5173';
const TARGET_PATH = '/demo';
const OUT_DIR = path.resolve(process.cwd(), 'snapshots');

const VIEWS: View[] = [
  { name: 'iphone-portrait', width: 375, height: 812, mobile: true },
  { name: 'iphone-landscape', width: 812, height: 375, mobile: true },
  { name: 'ipad-portrait', width: 768, height: 1024, mobile: true },
  { name: 'ipad-landscape', width: 1024, height: 768, mobile: true },
  { name: 'desktop-1280x800', width: 1280, height: 800 },
];

async function ensureDir(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function snap() {
  await ensureDir(OUT_DIR);

  const browser = await chromium.launch({ headless: true });
  try {
    for (const v of VIEWS) {
      const context = await browser.newContext({
        viewport: { width: v.width, height: v.height },
        isMobile: !!v.mobile,
        deviceScaleFactor: v.mobile ? 3 : 1,
        userAgent: v.mobile
          ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
          : undefined,
      });
      const page = await context.newPage();
      const url = `${BASE_URL}${TARGET_PATH}`;
      console.log(`Navigating to ${url} @ ${v.name}...`);
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      // Wait for table to render (data-testid present in code)
      await page.waitForSelector('[data-testid="poker-table"]', { timeout: 10000 }).catch(() => {});

      // Give animations a moment to settle
      await page.waitForTimeout(400);

      // Full page screenshot
      const fullPath = path.join(OUT_DIR, `${v.name}-full.png`);
      await page.screenshot({ path: fullPath, fullPage: true });
      console.log(`Saved ${fullPath}`);

      // Action controls section screenshot if present
      const controls = await page.$('#action-controls');
      if (controls) {
        const controlsPath = path.join(OUT_DIR, `${v.name}-controls.png`);
        await controls.screenshot({ path: controlsPath });
        console.log(`Saved ${controlsPath}`);
      }

      // If md+ width, try toggling the Hand Strength panel and capture both states
      if (v.width >= 768) {
        const toggle = await page.$('[data-testid="button-toggle-hand-strength"]');
        if (toggle) {
          // Expanded state capture
          const expanded = path.join(OUT_DIR, `${v.name}-hand-strength-expanded.png`);
          await page.screenshot({ path: expanded, fullPage: true });
          console.log(`Saved ${expanded}`);

          // Collapse and capture
          try {
            await toggle.click({ force: true, timeout: 2000 });
          } catch (err) {
            console.warn('Toggle click failed; capturing expanded-only state.');
          }
          await page.waitForTimeout(200);
          const collapsed = path.join(OUT_DIR, `${v.name}-hand-strength-collapsed.png`);
          await page.screenshot({ path: collapsed, fullPage: true });
          console.log(`Saved ${collapsed}`);
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }
}

snap().catch((err) => {
  console.error('Snapshot run failed:', err);
  process.exit(1);
});
