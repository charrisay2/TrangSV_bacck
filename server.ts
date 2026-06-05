import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { EventEmitter } from 'events';



import sequelize from './server/config/database.ts';
import authRoutes from './server/routes/authRoutes.ts';
import userRoutes from './server/routes/userRoutes.ts';
import courseRoutes from './server/routes/courseRoutes.ts';
import notificationRoutes from './server/routes/notificationRoutes.ts';
import invoiceRoutes from './server/routes/invoiceRoutes.ts';
import resourceRoutes from './server/routes/resourceRoutes.ts';
import gradeRoutes from './server/routes/gradeRoutes.ts';
import majorRoutes from './server/routes/majorRoutes.ts';
import subjectRoutes from './server/routes/subjectRoutes.ts';
import semesterRoutes from './server/routes/semesterRoutes.ts';
import enrollmentRoutes from './server/routes/enrollmentRoutes.ts';
import departmentRoutes from './server/routes/departmentRoutes.ts';
import classRoutes from './server/routes/classRoutes.ts';
import roomRoutes from './server/routes/roomRoutes.ts';
import curriculumRoutes from './server/routes/curriculumRoutes.ts';
import attendanceRoutes from './server/routes/attendanceRoutes.ts';
import paymentRoutes from './server/routes/paymentRoutes.ts';
import requestRoutes from './server/routes/requestRoutes.ts';
import importRoutes from './server/routes/importRoutes.ts';
import warningRoutes from './server/routes/warningRoutes.ts';
import examRoutes from './server/routes/examRoutes.ts';


import './server/models/User.ts';
import './server/models/Course.ts';
import './server/models/Notification.ts';
import './server/models/Invoice.ts';
import './server/models/Resource.ts';
import './server/models/Grade.ts';
import './server/models/Major.ts';
import './server/models/Subject.ts';
import './server/models/Curriculum.ts';
import './server/models/Department.ts';
import './server/models/Class.ts';
import './server/models/Room.ts';
import './server/models/Semester.ts';
import './server/models/Attendance.ts';

declare global {
  var notificationEmitter: EventEmitter;
}

// Initialize global event emitter for notifications
if (!global.notificationEmitter) {
  global.notificationEmitter = new EventEmitter();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { 
    origin: [
      "https://trangsv.congsinhvieen.id.vn",
      "http://192.168.20.83:5173",
    ] 
  }
});   

// Make io accessible to routes
app.set('io', io);

// Listen for new notifications and emit via socket.io
global.notificationEmitter.on('new_notification', (notification) => {
  io.emit('notification', notification);
});

const PORT = Number(process.env.PORT) || 3001;

// Middleware
app.use(
  cors({
    origin: [
      "https://trangsv.congsinhvieen.id.vn",
      "http://192.168.20.83:5173",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log requests (giữ lại từ file 1 để dễ debug)
app.use((req, res, next) => {
  console.log('Request:', req.url);
  next();
});

// --- API ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/majors', majorRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/semesters', semesterRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/curriculums', curriculumRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payments', paymentRoutes);
// Chèn các route thiếu vào đây:
app.use('/api/requests', requestRoutes);
app.use('/api/import', importRoutes);
app.use('/api/warnings', warningRoutes);
app.use('/api/exams', examRoutes);
// sửa lai sư
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: `University Management System API is running on port ${PORT}` });
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database MySQL connected successfully.');

    // Tích hợp phần xử lý Vite/Static files từ file trên để chạy được cả production
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (!isProduction) {
      try {
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: 'spa',
        });
        app.use(vite.middlewares);
      } catch (e) {
        console.log('Vite not found, skipping vite middleware');
      }
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

startServer();

export { sequelize };
export default app;