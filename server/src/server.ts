import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import profileRoutes from './routes/profile';
import documentRoutes from './routes/documents';
import telemedicineRoutes from './routes/telemedicine';
import emergencyRoutes from './routes/emergency';
import staffRoutes from './routes/staff';
import auditLogRoutes from './routes/auditLogs';
import familyRoutes from './routes/family';
import nurseRoutes from './routes/nurse';
import pharmacistRoutes from './routes/pharmacist';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Wrap express app in http server for Socket.io
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // In production, restrict this to your frontend URL
    methods: ["GET", "POST"]
  }
});
app.set('io', io);

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/telemedicine', telemedicineRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/nurse', nurseRoutes);
app.use('/api/pharmacist', pharmacistRoutes);


// Telemedicine & Emergency Signaling Logic
io.on('connection', (socket) => {
  console.log('User connected to signaling server:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
    // Notify others in the room
    socket.to(roomId).emit('user-joined', socket.id);
  });

  socket.on('signal', (data) => {
    // data should contain { roomId, signalData }
    socket.to(data.roomId).emit('signal', {
      sender: socket.id,
      signalData: data.signalData
    });
  });

  // Emergency tracking channels
  socket.on('join-emergency', (requestId) => {
    socket.join(`emergency-${requestId}`);
    console.log(`Socket ${socket.id} joined emergency room: emergency-${requestId}`);
    socket.to(`emergency-${requestId}`).emit('emergency-user-joined', { socketId: socket.id });
  });

  socket.on('update-emergency-location', (data) => {
    // data should contain: { requestId, role: 'patient' | 'ambulance', latitude, longitude }
    socket.to(`emergency-${data.requestId}`).emit('location-updated', {
      role: data.role,
      latitude: data.latitude,
      longitude: data.longitude
    });
  });

  // Real-time Staff Management Sync
  socket.on('get-staff-data', async () => {
    try {
      const doctors = await prisma.hospitalDoctor.findMany();
      const shifts = await prisma.shiftAssignment.findMany();
      const leaves = await prisma.leaveRequest.findMany();
      socket.emit('staff-data-updated', { doctors, shifts, leaves });
    } catch (e) {
      console.error(e);
    }
  });

  socket.on('update-staff-data', async () => {
    try {
      const doctors = await prisma.hospitalDoctor.findMany();
      const shifts = await prisma.shiftAssignment.findMany();
      const leaves = await prisma.leaveRequest.findMany();
      io.emit('staff-data-updated', { doctors, shifts, leaves }); // Broadcast new state to ALL active connections!
    } catch (e) {
      console.error(e);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected from signaling server');
  });
});

httpServer.listen(PORT, () => {
  console.log(`PulseGrid backend + signaling running on http://localhost:${PORT}`);
});
