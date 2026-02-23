let scene, camera, renderer, cityGen;
let frameCount = 0;
let lastTime = performance.now();
let currentModality = 'text'; // 当前输入模态
let speechRecognition = null;
let videoStream = null;
let isListeningToSpeech = false;

// 初始化语音识别
function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        log("⚠ 浏览器不支持语音识别");
        return;
    }
    
    speechRecognition = new SpeechRecognition();
    speechRecognition.lang = 'zh-CN';
    speechRecognition.continuous = false;
    speechRecognition.interimResults = false;
    
    speechRecognition.onstart = () => {
        log("🎤 开始监听语音...");
        isListeningToSpeech = true;
    };
    
    speechRecognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        log(`🎤 识别结果: "${transcript}"`);
        document.getElementById('intent-input').value = transcript;
    };
    
    speechRecognition.onerror = (event) => {
        log(`⚠ 语音识别错误: ${event.error}`);
        isListeningToSpeech = false;
    };
    
    speechRecognition.onend = () => {
        log("🎤 语音识别结束");
        isListeningToSpeech = false;
    };
}

// 启动语音识别模式
function startVoiceMode() {
    if (!speechRecognition) {
        initSpeechRecognition();
    }
    if (speechRecognition && !isListeningToSpeech) {
        log("按住说话，或点击生成按钮提交...");
        speechRecognition.start();
    }
}

// 启动视频模式
async function startVideoMode() {
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false
        });
        log("✓ 摄像头已启用");
        log("⚠ 视频分析功能（图像识别）等待 AI 后端支持");
        // 可在此尝试打开视频预览或取帧
    } catch (err) {
        log("⚠ 无法访问摄像头: " + err.message);
    }
}

function init() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.002);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(60, 40, 60);
    camera.lookAt(0, 20, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    cityGen = new CityGenerator(scene);

    window.addEventListener('resize', onWindowResize);
    document.getElementById('btn-generate').addEventListener('click', handleGenerate);

    // Request media permissions on init
    initSpeechRecognition();

    // Panel state tracking for collapse/expand and resize
    const panel = document.querySelector('.gui-panel');
    if (panel) {
        // 初始化：使用计算样式获取实际尺寸并转换为 px 值
        const computed = window.getComputedStyle(panel);
        const initialWidth = computed.width;
        const initialHeight = computed.height;
        const initialLeft = computed.left;
        const initialTop = computed.top;
        
        // 强制设置到 inline 样式，确保后续能快速读取
        panel.style.width = initialWidth;
        panel.style.height = initialHeight;
        panel.style.left = initialLeft;
        panel.style.top = initialTop;
        panel.style.minWidth = computed.minWidth;
        panel.style.minHeight = computed.minHeight;
        
        log(`🎯 面板初始化: ${initialWidth} × ${initialHeight} @ (${initialLeft}, ${initialTop})`);
    }

    let panelState = {
        savedWidth: null,
        savedHeight: null,
        savedLeft: null,
        savedTop: null,
        savedMinWidth: null,
        savedMinHeight: null
    };

    // Panel toggle (collapse/expand)
    const toggle = document.getElementById('panel-toggle');
    if (toggle && panel) {
        toggle.addEventListener('click', () => {
            const isCurrentlyCollapsed = panel.classList.contains('collapsed');
            
            if (!isCurrentlyCollapsed) {
                // 即将收起：保存当前 inline 样式
                panelState.savedWidth = panel.style.width;
                panelState.savedHeight = panel.style.height;
                panelState.savedLeft = panel.style.left;
                panelState.savedTop = panel.style.top;
                panelState.savedMinWidth = panel.style.minWidth;
                panelState.savedMinHeight = panel.style.minHeight;
                
                log(`💾 保存状态: ${panelState.savedWidth} × ${panelState.savedHeight}`);
                
                // 收起面板
                panel.classList.add('collapsed');
                toggle.innerText = '⟩';
            } else {
                // 即将展开：移除 collapsed 类
                panel.classList.remove('collapsed');
                log(`📭 移除 collapsed 类，准备恢复: W=${panelState.savedWidth} H=${panelState.savedHeight}`);
                
                // 关键：禁用过渡效果以实现即时恢复
                panel.style.transition = 'none';
                
                setTimeout(() => {
                    // 恢复所有保存的样式
                    panel.style.width = panelState.savedWidth;
                    panel.style.height = panelState.savedHeight;
                    panel.style.left = panelState.savedLeft;
                    panel.style.top = panelState.savedTop;
                    panel.style.minWidth = panelState.savedMinWidth;
                    panel.style.minHeight = panelState.savedMinHeight;
                    
                    log(`✨ 恢复完成: ${panelState.savedWidth} × ${panelState.savedHeight} @ (${panelState.savedLeft}, ${panelState.savedTop})`);
                    
                    // 一帧后重新启用过渡
                    requestAnimationFrame(() => {
                        panel.style.transition = 'left 0.4s ease, opacity 0.3s ease, width 0.2s ease, height 0.2s ease';
                    });
                }, 10);
                
                toggle.innerText = '⟨';
            }
        });

        // Support dragging the panel by header
        const header = document.getElementById('gui-header');
        let dragging = false, offsetX = 0, offsetY = 0;
        header.addEventListener('pointerdown', (e) => {
            dragging = true; 
            header.setPointerCapture(e.pointerId);
            panel.classList.add('dragging');
            const rect = panel.getBoundingClientRect();
            offsetX = e.clientX - rect.left; 
            offsetY = e.clientY - rect.top;
        });
        window.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            const newLeft = e.clientX - offsetX;
            const newTop = e.clientY - offsetY;
            panel.style.left = `${newLeft}px`;
            panel.style.top = `${newTop}px`;
            panel.style.setProperty('--panel-left', `${newLeft}px`);
            // Update saved position for collapse/expand (store as px strings)
            panelState.savedLeft = `${newLeft}px`;
            panelState.savedTop = `${newTop}px`;
        });
        window.addEventListener('pointerup', (e) => {
            if (!dragging) return;
            dragging = false; 
            panel.classList.remove('dragging');
        });
    }

    // Panel resize behavior with improved state tracking
    const handle = document.getElementById('resize-handle');
    if (handle && panel) {
        let resizing = false;
        let startX = 0, startY = 0, startW = 0, startH = 0;
        const minW = 240, minH = 150, maxW = 800, maxH = 600;
        
        handle.addEventListener('pointerdown', (e) => {
            resizing = true;
            handle.setPointerCapture(e.pointerId);
            const rect = panel.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            startW = rect.width;
            startH = rect.height;
            panel.classList.add('dragging');
            e.stopPropagation();
            e.preventDefault();
            log(`📏 开始缩放面板: ${startW.toFixed(0)}×${startH.toFixed(0)}px`);
        });

        window.addEventListener('pointermove', (e) => {
            if (!resizing) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            let nw = Math.max(minW, Math.min(maxW, startW + dx));
            let nh = Math.max(minH, Math.min(maxH, startH + dy));
            panel.style.width = nw + 'px';
            panel.style.height = nh + 'px';
            // Update saved dimensions in real-time
            panelState.savedWidth = nw + 'px';
            panelState.savedHeight = nh + 'px';
        }, false);

        window.addEventListener('pointerup', (e) => {
            if (!resizing) return;
            resizing = false;
            panel.classList.remove('dragging');
            const rect = panel.getBoundingClientRect();
            // Finalize saved state
            panelState.savedWidth = rect.width.toFixed(0) + 'px';
            panelState.savedHeight = rect.height.toFixed(0) + 'px';
            log(`✅ 缩放完成: ${panelState.savedWidth} × ${panelState.savedHeight}`);
        }, false);
    }

    // Modality tags click handlers for multimodal input
    const tags = document.querySelectorAll('.modality-tags .tag');
    const intentInput = document.getElementById('intent-input');
    
    tags.forEach((tag, index) => {
        tag.addEventListener('click', () => {
            tags.forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            
            if (index === 0) { // 文本模态
                currentModality = 'text';
                intentInput.placeholder = '例如：生成一个黄塔';
                intentInput.focus();
                log("📝 已切换到文本输入模态");
            } else if (index === 1) { // 语音模态
                currentModality = 'voice';
                intentInput.placeholder = '开始说话...';
                log("🎤 已切换到语音输入模态");
                startVoiceMode();
            } else if (index === 2) { // 图像/视频模态
                currentModality = 'image';
                intentInput.placeholder = '已启用摄像头';
                log("📷 已切换到图像/视频模态");
                startVideoMode();
            }
        });
    });

    animate();
    log("等待用户指令...");
}

async function handleGenerate() {
    const intent = document.getElementById('intent-input').value;
    const density = document.getElementById('density-select').value;
    const btn = document.getElementById('btn-generate');

    if(!intent) { log("警告：请输入生成意图"); return; }

    btn.disabled = true;
    btn.innerText = "AI 推理中...";
    
    const modalityLabel = { text: '文本', voice: '语音', image: '图像' }[currentModality] || '文本';
    log(`正在调用多模态大模型... 模态:[${modalityLabel}] 意图:"${intent}"`);

    try {
        const resp = await fetch('/api/generate-city', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                intent: intent, 
                modality: currentModality,  // 使用当前模态
                constraints: { density: density } 
            })
        });

        const result = await resp.json();

        if (result.status === 'success') {
            log(`推理完成。耗时：${result.latency}ms`);
            log(`算力节点：${result.compute_node}`);
            const count = await cityGen.generate(result.data);
            document.getElementById('building-count').innerText = count;
            log(`生成 ${count} 个建筑结构实例。`);

            // Auto-collapse panel after generation
            const panel = document.querySelector('.gui-panel');
            const toggle = document.getElementById('panel-toggle');
            if (panel && !panel.classList.contains('collapsed')) {
                panel.classList.add('collapsed');
                toggle.innerText = '⟩';
            }

            gsap.to(camera.position, {
                y: 50,
                x: 70,
                z: 70,
                duration: 2,
                ease: "power2.out"
            });
            gsap.to(camera, {
                onUpdate: () => camera.lookAt(0, 20, 0),
                duration: 2
            });
        } else {
            log("错误：生成失败");
        }
    } catch (e) {
        log("网络错误：请确保后端服务已启动 (node server/app.js)");
        const mockData = { structures: Array.from({length: 50}).map((_,i)=>({
            id:i, type:'residential', height: Math.random()*20+5, 
            position:{x:(Math.random()-0.5)*200, z:(Math.random()-0.5)*200}, color:0x3498db 
        }))};
        const count = await cityGen.generate({structures: mockData.structures});
        document.getElementById('building-count').innerText = count;
        log("降级模式：使用本地模拟数据生成。");
    } finally {
        btn.disabled = false;
        btn.innerText = "生成";
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    frameCount++;
    const time = performance.now();
    if (time >= lastTime + 1000) {
        document.getElementById('fps-counter').innerText = frameCount;
        frameCount = 0;
        lastTime = time;
    }

    if(cityGen && cityGen.mesh) {
        cityGen.mesh.rotation.y += 0.001;
    }

    renderer.render(scene, camera);
}

function log(msg) {
    const consoleDiv = document.getElementById('console-log');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerText = `> ${msg}`;
    consoleDiv.appendChild(entry);
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

init();
