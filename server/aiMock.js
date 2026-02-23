// 模拟多模态大模型的内容生成逻辑
function getColorByType(type) {
  const colors = {
    residential: 0x3498db,
    commercial: 0xf1c40f,
    security: 0xe74c3c,
    governance: 0x2ecc71
  };
  return colors[type] || 0xffffff;
}

module.exports = {
  processIntent: async (intent = '', modality = 'text', constraints = {}) => {
    // Simulate async processing
    await new Promise((r) => setTimeout(r, 300));

    const text = (intent || '').toString();

    // If intent requests a specific tower color/shape, return a single tower
    const lower = text.replace(/\s+/g, '').toLowerCase();
    const isTower = /塔|tower/.test(lower);
    const wantsYellow = /黄|黄色|黄塔/.test(lower);
    const wantsWhite = /白|白色|白塔/.test(lower);

    if (isTower && (wantsYellow || wantsWhite)) {
      const color = wantsYellow ? 0xf1c40f : 0xffffff;
      const structure = {
        id: 0,
        type: 'tower',
        height: 40, // taller for tower
        position: { x: 0, z: 0 },
        color: color
      };

      return {
        tokens_used: 64,
        model_version: 'MLLM-City-v1.0-tower',
        structures: [structure]
      };
    }

    const density = (constraints && constraints.density) || 'low';
    const buildingCount = density === 'high' ? 100 : 50;
    const types = ['residential', 'commercial', 'security', 'governance'];

    const buildings = Array.from({ length: buildingCount }).map((_, i) => {
      const type = types[Math.floor(Math.random() * types.length)];
      return {
        id: i,
        type: type,
        height: Math.random() * 20 + 5,
        position: {
          x: (Math.random() - 0.5) * 200,
          z: (Math.random() - 0.5) * 200
        },
        color: getColorByType(type)
      };
    });

    return {
      tokens_used: 1024,
      model_version: 'MLLM-City-v1.0',
      structures: buildings
    };
  }
};
