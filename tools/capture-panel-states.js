const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { 
    waitUntil: 'networkidle0',
    timeout: 10000 
  });

  console.log('\n📸 === 生成面板功能展示截图 ===\n');

  // 截图 1：展开状态
  console.log('📷 1. 捕获展开状态...');
  let screenshotPath = path.join(__dirname, 'panel-state-1-expanded.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`✓ 已保存: panel-state-1-expanded.png\n`);

  // 截图 2：缩放状态（更大）
  console.log('📷 2. 缩放面板到更大尺寸...');
  const handle = await page.$('#resize-handle');
  const handleBox = await handle.boundingBox();
  const centerX = handleBox.x + handleBox.width / 2;
  const centerY = handleBox.y + handleBox.height / 2;
  
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 150, centerY + 150, { steps: 10 });
  await page.mouse.up();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  screenshotPath = path.join(__dirname, 'panel-state-2-resized.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`✓ 已保存: panel-state-2-resized.png\n`);

  // 截图 3：收起状态
  console.log('📷 3. 收起面板...');
  await page.click('#panel-toggle');
  await new Promise(resolve => setTimeout(resolve, 500));
  
  screenshotPath = path.join(__dirname, 'panel-state-3-collapsed.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`✓ 已保存: panel-state-3-collapsed.png\n`);

  // 截图 4：关键信息
  const panelInfo = await page.evaluate(() => {
    const panel = document.querySelector('.gui-panel');
    const rect = panel.getBoundingClientRect();
    return {
      width: rect.width.toFixed(0),
      height: rect.height.toFixed(0),
      isCollapsed: panel.classList.contains('collapsed'),
      toggleButton: document.getElementById('panel-toggle').innerText
    };
  });

  console.log('✅ === 截图生成完成 ===\n');
  console.log('📊 面板状态信息：');
  console.log(`   宽度: ${panelInfo.width}px`);
  console.log(`   高度: ${panelInfo.height}px`);
  console.log(`   状态: ${panelInfo.isCollapsed ? '已收起 🔵' : '已展开 🟢'}`);
  console.log(`   按钮: ${panelInfo.toggleButton}\n`);

  console.log('📁 输出文件：');
  console.log('   ✓ panel-state-1-expanded.png   (展开状态)');
  console.log('   ✓ panel-state-2-resized.png    (缩放后状态)');
  console.log('   ✓ panel-state-3-collapsed.png  (收起状态)\n');

  console.log('💡 提示：所有图片已保存到 tools/ 目录\n');

  await browser.close();
})();
