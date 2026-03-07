import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { connectDB } from './config/database.js';
import routes from './routes/index.js';
import { initSocket } from './socket/index.js';

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/api', routes);
app.get('/health', (_, res) => res.json({ status: 'OK', service: 'Nexus API v2' }));

initSocket(io);

const PORT = parseInt(process.env.PORT || '5000');

connectDB()
  .then(() => server.listen(PORT, () => console.log(`🚀 Nexus API → http://localhost:${PORT}`)))
  .catch(err => { console.error('Failed to start:', err); process.exit(1); });
