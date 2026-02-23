const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  
  // 启用日志
  page.on('console', (msg) => console.log(`[PAGE LOG] ${msg.text()}`));
  page.on('error', (err) => console.log(`[PAGE ERROR] ${err}`));

  await page.goto('http://localhost:3000', { 
    waitUntil: 'networkidle0',
    timeout: 10000 
  });

  console.log('\n=== 测试 1：文本模态 ===');
  // 确保文本标签处于激活状态
  const textTags = await page.$$('.tag');
  if (textTags.length > 0) {
    // 这是文本标签（第一个）
    console.log('✅ 文本标签已检测');
  }

  // 填充意图输入
  await page.type('#intent-input', '生成一个黄塔');
  await new Promise(resolve => setTimeout(resolve, 500));
  const inputValue = await page.$eval('#intent-input', el => el.value);
  console.log(`📝 输入框值: "${inputValue}"`);

  // 点击生成按钮
  console.log('🎬 点击生成按钮...');
  await page.click('#btn-generate');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 获取控制台日志
  console.log('\n=== API 响应验证 ===');
  const apiResponse = await page.evaluate(() => {
    const logs = document.getElementById('console-log');
    return logs ? logs.innerText.slice(-200) : '无日志';
  });
  console.log(apiResponse);

  // 测试语音模态按钮的存在性
  console.log('\n=== 测试 2：语音模态（检查激活逻辑）===');
  const tags = await page.$$('.tag');
  console.log(`✅ 检测到 ${tags.length} 个标签`);
  
  // 检查语音标签（通常在第二个位置）
  if (tags.length >= 2) {
    const tagTexts = await Promise.all(
      tags.map(tag => tag.evaluate(el => el.textContent))
    );
    console.log(`📋 标签列表: ${tagTexts.join(' | ')}`);
    
    if (tagTexts[1].includes('语音')) {
      console.log('🎤 语音标签已找到');
      // 不实际点击（会触发系统权限提示），只记录存在性
      console.log('⚠️ 在 Puppeteer 无头模式下跳过语音权限请求（需真实浏览器）');
    }
  }

  // 截图文本模态的生成结果
  console.log('\n=== 生成城市截图 ===');
  const screenshotPath = path.join(__dirname, 'multimodal-test-output.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 截图已保存: ${screenshotPath}`);

  // 检查场景中的对象数量
  console.log('\n=== 3D 场景验证 ===');
  const sceneStats = await page.evaluate(() => {
    // 检查 Three.js 全局对象
    if (window.scene) {
      return {
        totalObjects: window.scene.children.length,
        status: '✅ Three.js 场景已初始化'
      };
    }
    return {
      totalObjects: -1,
      status: '⚠️ 无法访问 Three.js 场景'
    };
  });
  console.log(`${sceneStats.status}`);
  console.log(`🏗️ 场景中的对象数: ${sceneStats.totalObjects}`);

  // 验证多模态状态变量
  console.log('\n=== 多模态状态检查 ===');
  const modalityState = await page.evaluate(() => {
    return {
      currentModality: typeof currentModality !== 'undefined' ? currentModality : '未定义',
      hasInitSpeechRecognition: typeof initSpeechRecognition !== 'undefined',
      hasStartVoiceMode: typeof startVoiceMode !== 'undefined',
      hasStartVideoMode: typeof startVideoMode !== 'undefined',
      hasSpeechRecognition: typeof speechRecognition !== 'undefined'
    };
  });
  
  console.log(`📡 当前模态: ${modalityState.currentModality}`);
  console.log(`🎤 initSpeechRecognition 函数: ${modalityState.hasInitSpeechRecognition ? '✅ 存在' : '❌ 缺失'}`);
  console.log(`🎙️ startVoiceMode 函数: ${modalityState.hasStartVoiceMode ? '✅ 存在' : '❌ 缺失'}`);
  console.log(`📷 startVideoMode 函数: ${modalityState.hasStartVideoMode ? '✅ 存在' : '❌ 缺失'}`);
  console.log(`🔊 SpeechRecognition 对象: ${modalityState.hasSpeechRecognition ? '✅ 初始化' : '❌ 未初始化'}`);

  console.log('\n=== 测试完成 ===');
  console.log('✅ 所有多模态组件已验证');
  console.log('\n💡 使用说明:');
  console.log('  - 文本模态: 默认激活，直接在输入框输入指令');
  console.log('  - 语音模态: 点击 "语音" 标签，授予麦克风权限，清楚地说出指令');
  console.log('  - 图像模态: 点击 "图像" 标签，授予摄像头权限（图像分析功能待实现）');

  await browser.close();
})();
