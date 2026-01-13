// Anplexa Funnel - Server Entry Point
// TODO: Implement funnel backend routes

import express from 'express';

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Funnel server running on port ${PORT}`);
});

export default app;
