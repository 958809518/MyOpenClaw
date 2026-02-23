const express = require('express');
const cors = require('cors');
const path = require('path');
const aiMock = require('./aiMock');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from public
app.use(express.static(path.join(__dirname, '..', 'public')));

// Health endpoint
app.get('/health', (req, res) => res.json({ ok: true }));

// Simulated AI generation endpoint matching project spec
app.post('/api/generate-city', async (req, res) => {
  const { intent, modality, constraints } = req.body || {};
  // Simulate compute latency
  const latency = Math.floor(Math.random() * 1000) + 500;

  try {
    const result = await aiMock.processIntent(intent, modality, constraints);

    res.json({
      status: 'success',
      compute_node: 'Domestic-NPU-Cluster-01',
      latency: latency,
      data: result
    });
  } catch (err) {
    console.error('generate-city error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Performance / monitoring endpoint
app.get('/api/performance', (req, res) => {
  res.json({
    memory_usage: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
    uptime: process.uptime(),
    active_agents: Math.floor(Math.random() * 5) + 1
  });
});

// Fallback for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Smart City MLLM Server running at http://localhost:${PORT}`);
});
