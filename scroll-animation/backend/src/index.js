import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// TODO: Add routes here
// import authRoutes from './routes/auth.js';
// import chatRoutes from './routes/chat.js';
// app.use('/api/auth', authRoutes);
// app.use('/api/chat', chatRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
