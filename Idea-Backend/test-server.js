require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3001;

console.log('Environment PORT:', process.env.PORT);
console.log('Using PORT:', PORT);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', port: PORT });
});

app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}/health`);
});
