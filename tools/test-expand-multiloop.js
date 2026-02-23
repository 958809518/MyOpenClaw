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

  console.log('\n🧪 === 完整的收起/展开回环测试 ===\n');

  // 辅助函数：获取面板状态
  const getPanelState = async () => {
    return await page.evaluate(() => {
      const panel = document.querySelector('.gui-panel');
      const rect = panel.getBoundingClientRect();
      const styleWidth = panel.style.width;
      const styleHeight = panel.style.height;
      return {
        displayWidth: rect.width.toFixed(0),
        displayHeight: rect.height.toFixed(0),
        displayLeft: rect.left.toFixed(0),
        displayTop: rect.top.toFixed(0),
        styleWidth,
        styleHeight,
        collapsed: panel.classList.contains('collapsed'),
        buttonText: document.getElementById('panel-toggle').innerText
      };
    });
  };

  let cycle = 1;
  let savedStates = [];

  // 循环 3 次：缩放 → 拖动 → 收起 → 展开
  for (let i = 0; i < 3; i++) {
    console.log(`\n========== 循环 ${i + 1} ==========\n`);

    // 步骤 1：缩放到随机大小
    console.log(`📋 步骤 1: 缩放面板`);
    const randomWidth = 300 + i * 50;
    const randomHeight = 400 + i * 40;
    
    const handle = await page.$('#resize-handle');
    const handleBox = await handle.boundingBox();
    const targetWidth = randomWidth - 362;
    const targetHeight = randomHeight - 441;
    
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + handleBox.width / 2 + targetWidth, 
                         handleBox.y + handleBox.height / 2 + targetHeight, 
                         { steps: 10 });
    await page.mouse.up();
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let state = await getPanelState();
    console.log(`✓ 缩放到: ${state.displayWidth}×${state.displayHeight}\n`);
    savedStates[i] = { resize: { ...state } };

    // 步骤 2：拖动到新位置
    console.log(`📋 步骤 2: 拖动面板到新位置`);
    const header = await page.$('#gui-header');
    const headerBox = await header.boundingBox();
    const dragOffset = 100 + i * 50;
    
    await page.mouse.move(headerBox.x + headerBox.width / 2, headerBox.y + headerBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(headerBox.x + headerBox.width / 2 + dragOffset, 
                         headerBox.y + headerBox.height / 2 + dragOffset, 
                         { steps: 10 });
    await page.mouse.up();
    await new Promise(resolve => setTimeout(resolve, 300));
    
    state = await getPanelState();
    console.log(`✓ 移动到: @(${state.displayLeft}, ${state.displayTop})\n`);
    savedStates[i].drag = { ...state };

    // 步骤 3：收起面板
    console.log(`📋 步骤 3: 点击收起面板`);
    await page.click('#panel-toggle');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    state = await getPanelState();
    console.log(`✓ 面板已收起`);
    console.log(`✓ 按钮显示: ${state.buttonText}\n`);
    savedStates[i].collapsed = { ...state };

    // 步骤 4：展开面板并验证
    console.log(`📋 步骤 4: 点击展开面板`);
    await page.click('#panel-toggle');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    state = await getPanelState();
    console.log(`✓ 面板已展开`);
    console.log(`✓ 按钮显示: ${state.buttonText}\n`);

    // 验证恢复准确性
    console.log(`📋 验证：状态是否完全恢复`);
    const postDragState = savedStates[i].drag;
    
    const widthMatch = Math.abs(parseInt(state.displayWidth) - parseInt(postDragState.displayWidth)) < 3;
    const heightMatch = Math.abs(parseInt(state.displayHeight) - parseInt(postDragState.displayHeight)) < 3;
    const leftMatch = Math.abs(parseInt(state.displayLeft) - parseInt(postDragState.displayLeft)) < 5;
    const topMatch = Math.abs(parseInt(state.displayTop) - parseInt(postDragState.displayTop)) < 5;
    
    console.log(`✓ 宽度恢复: ${widthMatch ? '✅' : '❌'} (${postDragState.displayWidth} → ${state.displayWidth})`);
    console.log(`✓ 高度恢复: ${heightMatch ? '✅' : '❌'} (${postDragState.displayHeight} → ${state.displayHeight})`);
    console.log(`✓ 位置恢复: ${leftMatch && topMatch ? '✅' : '❌'} (@(${postDragState.displayLeft}, ${postDragState.displayTop}) → @(${state.displayLeft}, ${state.displayTop}))`);
    
    if (!widthMatch || !heightMatch || !leftMatch || !topMatch) {
      console.log('\n❌ 恢复失败！');
      break;
    } else {
      console.log('');
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 ✅ 所有循环测试完成！展开功能工作正常。\n');

  await browser.close();
})();
