const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// TODO: Add routes here
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/chat', require('./routes/chat'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
