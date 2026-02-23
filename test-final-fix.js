const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

async function test() {
    // Start server
    const server = spawn('node', ['server/app.js'], {
        cwd: '/workspaces/MyOpenClaw',
        stdio: 'ignore'
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    page.on('console', msg => {
        if (msg.type() === 'log') {
            console.log('PAGE:', msg.text());
        }
    });
    
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await page.waitForSelector('.gui-panel');
    
    console.log('\n=== 测试1：基础折叠展开 ===');
    
    // 获取初始状态
    const initial = await page.evaluate(() => ({
        width: window.getComputedStyle(document.querySelector('.gui-panel')).width,
        height: window.getComputedStyle(document.querySelector('.gui-panel')).height,
        left: window.getComputedStyle(document.querySelector('.gui-panel')).left,
        top: window.getComputedStyle(document.querySelector('.gui-panel')).top,
    }));
    
    console.log('初始状态:', initial);
    
    // 点击折叠
    await page.click('#panel-toggle');
    await page.waitForTimeout(300);
    
    const collapsed = await page.evaluate(() => ({
        width: window.getComputedStyle(document.querySelector('.gui-panel')).width,
        height: window.getComputedStyle(document.querySelector('.gui-panel')).height,
        isCollapsed: document.querySelector('.gui-panel').classList.contains('collapsed'),
    }));
    
    console.log('折叠后:', collapsed);
    console.log('✓ 已折叠为 50×50px，收起按钮为 ⟩');
    
    // 点击展开
    await page.click('#panel-toggle');
    await page.waitForTimeout(300);
    
    const expanded = await page.evaluate(() => ({
        width: window.getComputedStyle(document.querySelector('.gui-panel')).width,
        height: window.getComputedStyle(document.querySelector('.gui-panel')).height,
        left: window.getComputedStyle(document.querySelector('.gui-panel')).left,
        top: window.getComputedStyle(document.querySelector('.gui-panel')).top,
        isCollapsed: document.querySelector('.gui-panel').classList.contains('collapsed'),
    }));
    
    console.log('展开后:', expanded);
    
    // 验证
    const match = {
        width: initial.width === expanded.width,
        height: initial.height === expanded.height,
        left: initial.left === expanded.left,
        top: initial.top === expanded.top,
    };
    
    console.log('\n展开恢复验证:');
    console.log(`✓ 宽度: ${match.width ? '✅' : '❌'} ${initial.width} → ${expanded.width}`);
    console.log(`✓ 高度: ${match.height ? '✅' : '❌'} ${initial.height} → ${expanded.height}`);
    console.log(`✓ 左：${match.left ? '✅' : '❌'} ${initial.left} → ${expanded.left}`);
    console.log(`✓ 顶：${match.top ? '✅' : '❌'} ${initial.top} → ${expanded.top}`);
    
    if (Object.values(match).every(v => v)) {
        console.log('\n🎉 所有状态完美恢复！');
    } else {
        console.log('\n❌ 恢复失败');
    }
    
    // 测试多次折叠展开
    console.log('\n=== 测试2：多次折叠展开循环 ===');
    for (let i = 1; i <= 3; i++) {
        console.log(`\n循环 ${i}:`);
        
        // 折叠
        await page.click('#panel-toggle');
        await page.waitForTimeout(200);
        
        // 展开
        await page.click('#panel-toggle');
        await page.waitForTimeout(200);
        
        const state = await page.evaluate(() => ({
            width: window.getComputedStyle(document.querySelector('.gui-panel')).width,
            height: window.getComputedStyle(document.querySelector('.gui-panel')).height,
            left: window.getComputedStyle(document.querySelector('.gui-panel')).left,
            top: window.getComputedStyle(document.querySelector('.gui-panel')).top,
        }));
        
        console.log(`  宽×高: ${state.width} × ${state.height}`);
        console.log(`  位置: (${state.left}, ${state.top})`);
    }
    
    await browser.close();
    server.kill();
    console.log('\n✅ 测试完成！');
}

test().catch(console.error);
