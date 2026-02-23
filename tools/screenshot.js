const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setViewport({ width: 1400, height: 900 });

  // Capture console messages
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'error') {
      console.log(`[PAGE LOG]:`, msg.text());
    }
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 60000 });

  // Fill intent and click generate（黄塔示例）
  await page.waitForSelector('#intent-input');
  await page.type('#intent-input', '生成一个黄塔');
  await page.click('#btn-generate');

  // wait for building-count to update or timeout
  try {
    await page.waitForFunction(() => {
      const el = document.getElementById('building-count');
      return el && parseInt(el.innerText, 10) > 0;
    }, { timeout: 10000 });
  } catch (e) {
    // ignore timeout, still capture screenshot
  }

  // give some extra time for rendering
  await new Promise((r) => setTimeout(r, 1000));

  const outPath = '/workspaces/MyOpenClaw/screenshot.png';
  await page.screenshot({ path: outPath, fullPage: true });
  console.log('Screenshot saved to', outPath);

  await browser.close();
})();
