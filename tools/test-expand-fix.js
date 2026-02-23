const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  
  page.on('console', (msg) => console.log(`[PAGE] ${msg.text()}`));

  await page.goto('http://localhost:3000', { 
    waitUntil: 'networkidle0',
    timeout: 10000 
  });

  console.log('\n🧪 === 展开功能修复测试 ===\n');

  // 测试 1：检查初始状态
  console.log('📋 测试 1: 初始状态');
  let state = await page.evaluate(() => {
    const panel = document.querySelector('.gui-panel');
    const rect = panel.getBoundingClientRect();
    return {
      width: rect.width.toFixed(0),
      height: rect.height.toFixed(0),
      left: rect.left.toFixed(0),
      top: rect.top.toFixed(0),
      collapsed: panel.classList.contains('collapsed')
    };
  });
  console.log(`✓ 初始: ${state.width}×${state.height} @(${state.left}, ${state.top})`);
  console.log(`✓ 状态: ${state.collapsed ? '收起' : '展开'}\n`);

  // 测试 2：缩放面板到特定大小
  console.log('📋 测试 2: 缩放面板到 500×500');
  const handle = await page.$('#resize-handle');
  const handleBox = await handle.boundingBox();
  const centerX = handleBox.x + handleBox.width / 2;
  const centerY = handleBox.y + handleBox.height / 2;
  
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 150, centerY + 100, { steps: 10 });
  await page.mouse.up();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  state = await page.evaluate(() => {
    const panel = document.querySelector('.gui-panel');
    const rect = panel.getBoundingClientRect();
    return {
      width: rect.width.toFixed(0),
      height: rect.height.toFixed(0),
      left: rect.left.toFixed(0),
      top: rect.top.toFixed(0)
    };
  });
  const resizedWidth = state.width;
  const resizedHeight = state.height;
  console.log(`✓ 缩放后: ${resizedWidth}×${resizedHeight} @(${state.left}, ${state.top})\n`);

  // 测试 3：拖动面板到新位置
  console.log('📋 测试 3: 拖动面板到新位置');
  const header = await page.$('#gui-header');
  const headerBox = await header.boundingBox();
  const headerCenterX = headerBox.x + headerBox.width / 2;
  const headerCenterY = headerBox.y + headerBox.height / 2;
  
  await page.mouse.move(headerCenterX, headerCenterY);
  await page.mouse.down();
  await page.mouse.move(headerCenterX + 200, headerCenterY + 100, { steps: 10 });
  await page.mouse.up();
  await new Promise(resolve => setTimeout(resolve, 300));
  
  state = await page.evaluate(() => {
    const panel = document.querySelector('.gui-panel');
    const rect = panel.getBoundingClientRect();
    return {
      width: rect.width.toFixed(0),
      height: rect.height.toFixed(0),
      left: rect.left.toFixed(0),
      top: rect.top.toFixed(0)
    };
  });
  const movedLeft = state.left;
  const movedTop = state.top;
  console.log(`✓ 移动后: ${state.width}×${state.height} @(${movedLeft}, ${movedTop})\n`);

  // 测试 4：收起面板
  console.log('📋 测试 4: 点击按钮收起面板');
  await page.click('#panel-toggle');
  await new Promise(resolve => setTimeout(resolve, 500));
  
  state = await page.evaluate(() => {
    const panel = document.querySelector('.gui-panel');
    const rect = panel.getBoundingClientRect();
    return {
      width: rect.width.toFixed(0),
      height: rect.height.toFixed(0),
      left: rect.left.toFixed(0),
      top: rect.top.toFixed(0),
      collapsed: panel.classList.contains('collapsed'),
      buttonText: document.getElementById('panel-toggle').innerText
    };
  });
  console.log(`✓ 收起后: ${state.width}×${state.height} @(${state.left}, ${state.top})`);
  console.log(`✓ 状态: ${state.collapsed ? '已收起 ✓' : '仍展开 ✗'}`);
  console.log(`✓ 按钮: ${state.buttonText}\n`);

  // 测试 5：展开面板并验证恢复
  console.log('📋 测试 5: 点击按钮展开面板并验证状态恢复');
  await page.click('#panel-toggle');
  await new Promise(resolve => setTimeout(resolve, 800));
  
  state = await page.evaluate(() => {
    const panel = document.querySelector('.gui-panel');
    const rect = panel.getBoundingClientRect();
    return {
      width: rect.width.toFixed(0),
      height: rect.height.toFixed(0),
      left: rect.left.toFixed(0),
      top: rect.top.toFixed(0),
      collapsed: panel.classList.contains('collapsed'),
      buttonText: document.getElementById('panel-toggle').innerText
    };
  });
  console.log(`✓ 展开后: ${state.width}×${state.height} @(${state.left}, ${state.top})`);
  console.log(`✓ 状态: ${state.collapsed ? '仍收起 ✗' : '已展开 ✓'}`);
  console.log(`✓ 按钮: ${state.buttonText}\n`);

  // 验证恢复是否正确
  console.log('📋 测试 6: 验证状态恢复的准确性');
  const widthMatch = Math.abs(parseInt(state.width) - parseInt(resizedWidth)) < 5;
  const heightMatch = Math.abs(parseInt(state.height) - parseInt(resizedHeight)) < 5;
  const leftMatch = Math.abs(parseInt(state.left) - parseInt(movedLeft)) < 10;
  const topMatch = Math.abs(parseInt(state.top) - parseInt(movedTop)) < 10;
  
  console.log(`✓ 宽度匹配: ${widthMatch ? '✅' : '❌'} (期望 ${resizedWidth}, 实际 ${state.width})`);
  console.log(`✓ 高度匹配: ${heightMatch ? '✅' : '❌'} (期望 ${resizedHeight}, 实际 ${state.height})`);
  console.log(`✓ 左侧位置: ${leftMatch ? '✅' : '❌'} (期望 ${movedLeft}, 实际 ${state.left})`);
  console.log(`✓ 顶部位置: ${topMatch ? '✅' : '❌'} (期望 ${movedTop}, 实际 ${state.top})\n`);

  if (widthMatch && heightMatch && leftMatch && topMatch) {
    console.log('🎉 ✅ === 所有测试通过！展开功能正常工作 ===\n');
  } else {
    console.log('⚠️ ❌ === 某些测试失败，需要进一步调查 ===\n');
  }

  await browser.close();
})();
