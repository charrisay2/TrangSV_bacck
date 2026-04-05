import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { EventEmitter } from "events";

// --- IMPORT CẤU HÌNH & ROUTES (Đã thêm đuôi .ts) ---
import sequelize from "./server/config/database.ts";
import authRoutes from "./server/routes/authRoutes.ts";
import userRoutes from "./server/routes/userRoutes.ts";
import courseRoutes from "./server/routes/courseRoutes.ts";
import notificationRoutes from "./server/routes/notificationRoutes.ts";
import invoiceRoutes from "./server/routes/invoiceRoutes.ts";
import resourceRoutes from "./server/routes/resourceRoutes.ts";
import gradeRoutes from "./server/routes/gradeRoutes.ts";
import majorRoutes from "./server/routes/majorRoutes.ts";
import subjectRoutes from "./server/routes/subjectRoutes.ts";
import semesterRoutes from "./server/routes/semesterRoutes.ts";
import enrollmentRoutes from "./server/routes/enrollmentRoutes.ts";
import departmentRoutes from "./server/routes/departmentRoutes.ts";
import classRoutes from "./server/routes/classRoutes.ts";
import roomRoutes from "./server/routes/roomRoutes.ts";
import curriculumRoutes from "./server/routes/curriculumRoutes.ts";
import attendanceRoutes from "./server/routes/attendanceRoutes.ts";
import paymentRoutes from "./server/routes/paymentRoutes.ts";

// --- IMPORT MODELS ---
import "./server/models/User.ts";
import "./server/models/Course.ts";
import "./server/models/Notification.ts";
import "./server/models/Invoice.ts";
import "./server/models/Resource.ts";
import "./server/models/Grade.ts";
import "./server/models/Major.ts";
import "./server/models/Subject.ts";
import "./server/models/Curriculum.ts";
import "./server/models/Department.ts";
import "./server/models/Class.ts";
import "./server/models/Room.ts";
import "./server/models/Semester.ts";
import "./server/models/Attendance.ts";

declare global {
  var notificationEmitter: EventEmitter;
}

if (!global.notificationEmitter) {
  global.notificationEmitter = new EventEmitter();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: "http://localhost:5173" },
});

app.set("io", io);

global.notificationEmitter.on("new_notification", (notification) => {
  io.emit("notification", notification);
});

const PORT = 3001;

// Middleware CORS - Kết nối với cổng Frontend
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/grades", gradeRoutes);
app.use("/api/majors", majorRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/semesters", semesterRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/curriculums", curriculumRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend API is running on port 3001" });
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log(" Database MySQL connected successfully.");

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(` Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

startServer();
export { sequelize };
export default app;