/**
 * 最终验证脚本：展开面板功能修复验证
 * 测试场景：缩放 → 拖动 → 收起 → 展开 → 验证恢复
 */

const puppeteer = require('puppeteer');

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

  console.log('\n' + '='.repeat(60));
  console.log('  ✨ 展开面板功能修复验证');
  console.log('='.repeat(60));

  // 获取初始状态
  console.log('\n📌 初始状态');
  let state = await page.evaluate(() => {
    const panel = document.querySelector('.gui-panel');
    const rect = panel.getBoundingClientRect();
    return {
      width: parseInt(rect.width),
      height: parseInt(rect.height),
      left: parseInt(rect.left),
      top: parseInt(rect.top),
      collapsed: panel.classList.contains('collapsed')
    };
  });
  console.log(`   尺寸: ${state.width}×${state.height}`);
  console.log(`   位置: (${state.left}, ${state.top})`);
  const initial = state;

  // 缩放到更大
  console.log('\n📏 缩放面板到 500×550');
  const handle = await page.$('#resize-handle');
  const handleBox = await handle.boundingBox();
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox.x + handleBox.width / 2 + 150, handleBox.y + handleBox.height / 2 + 120, { steps: 10 });
  await page.mouse.up();
  await new Promise(r => setTimeout(r, 300));

  state = await page.evaluate(() => {
    const panel = document.querySelector('.gui-panel');
    const rect = panel.getBoundingClientRect();
    return { width: parseInt(rect.width), height: parseInt(rect.height), left: parseInt(rect.left), top: parseInt(rect.top) };
  });
  console.log(`   ✓ 缩放后: ${state.width}×${state.height}`);
  const resized = state;

  // 拖动位置
  console.log('\n🖱️ 拖动面板到新位置');
  const header = await page.$('#gui-header');
  const headerBox = await header.boundingBox();
  await page.mouse.move(headerBox.x + headerBox.width / 2, headerBox.y + headerBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(headerBox.x + headerBox.width / 2 + 200, headerBox.y + headerBox.height / 2 + 100, { steps: 10 });
  await page.mouse.up();
  await new Promise(r => setTimeout(r, 300));

  state = await page.evaluate(() => {
    const panel = document.querySelector('.gui-panel');
    const rect = panel.getBoundingClientRect();
    return { width: parseInt(rect.width), height: parseInt(rect.height), left: parseInt(rect.left), top: parseInt(rect.top) };
  });
  console.log(`   ✓ 移动后: @(${state.left}, ${state.top})`);
  const dragged = state;

  // 收起
  console.log('\n⟨ 点击收起面板');
  await page.click('#panel-toggle');
  await new Promise(r => setTimeout(r, 500));

  state = await page.evaluate(() => {
    const panel = document.querySelector('.gui-panel');
    return { collapsed: panel.classList.contains('collapsed'), btnText: document.getElementById('panel-toggle').innerText };
  });
  console.log(`   ✓ 按钮变为: ${state.btnText}`);
  console.log(`   ✓ 面板: ${state.collapsed ? '已收起 ✓' : '等待确认'}`);

  // 展开并验证
  console.log('\n⟩ 点击展开面板 (关键!!)');
  await page.click('#panel-toggle');
  await new Promise(r => setTimeout(r, 800));

  state = await page.evaluate(() => {
    const panel = document.querySelector('.gui-panel');
    const rect = panel.getBoundingClientRect();
    return {
      width: parseInt(rect.width),
      height: parseInt(rect.height),
      left: parseInt(rect.left),
      top: parseInt(rect.top),
      collapsed: panel.classList.contains('collapsed'),
      btnText: document.getElementById('panel-toggle').innerText
    };
  });

  console.log(`   ✓ 按钮变为: ${state.btnText}`);
  console.log(`   ✓ 面板: ${state.collapsed ? '仍收起' : '已展开 ✓'}`);

  // 验证恢复
  console.log('\n✅ 状态恢复验证');
  
  const tests = [
    {
      name: '宽度',
      expected: dragged.width,
      actual: state.width,
      tolerance: 2
    },
    {
      name: '高度',
      expected: dragged.height,
      actual: state.height,
      tolerance: 2
    },
    {
      name: '左侧位置',
      expected: dragged.left,
      actual: state.left,
      tolerance: 5
    },
    {
      name: '顶部位置',
      expected: dragged.top,
      actual: state.top,
      tolerance: 5
    }
  ];

  let allPass = true;
  tests.forEach(test => {
    const diff = Math.abs(test.expected - test.actual);
    const pass = diff <= test.tolerance;
    allPass = allPass && pass;
    
    const symbol = pass ? '✅' : '❌';
    console.log(`   ${symbol} ${test.name}: ${test.expected} → ${test.actual} (差异: ${diff}px)`);
  });

  // 最终结果
  console.log('\n' + '='.repeat(60));
  if (allPass) {
    console.log('  🎉 ✅ 展开功能修复成功！所有状态完全恢复！');
  } else {
    console.log('  ⚠️ ❌ 某些状态未能完全恢复，需要进一步调查');
  }
  console.log('='.repeat(60) + '\n');

  await browser.close();
})();
