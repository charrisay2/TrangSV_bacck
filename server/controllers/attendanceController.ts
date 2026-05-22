import { Request, Response } from 'express';
import Attendance from '../models/Attendance';
import User from '../models/User';
import Course from '../models/Course';

// @desc    Get attendance for a course on a specific date
// @route   GET /api/attendance/course/:courseId?date=YYYY-MM-DD
// @access  Private/Teacher/Admin
export const getCourseAttendance = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const attendance = await Attendance.findAll({
      where: {
        courseId,
        date: date as string
      }
    });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Save attendance for a course
// @route   POST /api/attendance
// @access  Private/Teacher/Admin
export const saveAttendance = async (req: Request, res: Response) => {
  try {
    const { courseId, date, records } = req.body; // records: { studentId: status }
    // courseid lấy từ pagram xuống
    // date lấy ngày hôm nay
    if (!courseId || !date || !records) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Delete existing records for this course and date
    await Attendance.destroy({
      where: {
        courseId,
        date
      }
    });

    // Create new records
    const attendanceData = Object.entries(records).map(([studentId, status]) => ({
      courseId,
      studentId: Number(studentId),
      date,
      status: status as 'Present' | 'Absent' | 'Late'
    }));

    await Attendance.bulkCreate(attendanceData);

    res.status(201).json({ message: 'Attendance saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get attendance for a student
// @route   GET /api/attendance/student/:studentId
// @access  Private
export const getStudentAttendance = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    const attendance = await Attendance.findAll({
      where: { studentId },
      include: [{ model: Course, as: 'course' }]
    });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
// @desc    Mark attendance via QR scan
// @route   POST /api/attendance/qr-scan
// @access  Private/Student
export const markAttendanceQR = async (req: Request, res: Response) => {
  try {
    const { courseId, date } = req.body;
    // @ts-ignore
    const studentId = req.user?.id; 

    if (!courseId || !date) {
      return res.status(400).json({ message: 'Missing courseId or date' });
    }
    
    if (!studentId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // NEW: Check if student is enrolled in this course
    const Enrollment = (await import('../models/Enrollment')).default;
    const enrollment = await Enrollment.findOne({ 
      where: { 
        courseId, 
        studentId,
        status: 'Enrolled'
      } 
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'Bạn không có tên trong danh sách đăng ký môn học này.' });
    }

    // Find if already exists
    const existing = await Attendance.findOne({ where: { courseId, date, studentId } });
    if (existing) {
       existing.status = 'Present';
       await existing.save();
       return res.status(200).json({ message: 'Điểm danh thành công (đã cập nhật)' });
    }

    await Attendance.create({
       courseId,
       date,
       studentId,
       status: 'Present'
    });

    res.status(200).json({ message: 'Điểm danh thành công' });
  } catch (error) {
     res.status(500).json({ message: 'Server Error' });
  }
};
