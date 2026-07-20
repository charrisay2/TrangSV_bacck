import { Request, Response } from 'express';
import Warning from '../models/Warning';
import User from '../models/User';
import Course from '../models/Course';
import { Grade } from '../models/Grade';
import Notification from '../models/Notification';
import Enrollment from '../models/Enrollment';

export const getWarnings = async (req: Request, res: Response) => {
  try {
    const warnings = await Warning.findAll({
      include: [{ model: User, as: 'student', attributes: ['id', 'name', 'username', 'email'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(warnings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createWarning = async (req: Request, res: Response) => {
  try {
    const { studentUsername, type, severity, reason } = req.body;
      if (!studentUsername?.trim()) {
      return res.status(400).json({
        message: 'Vui lòng nhập mã sinh viên'
      });
    }

    if (!type) {
      return res.status(400).json({
        message: 'Vui lòng chọn loại cảnh báo'
      });
    }

    if (!severity) {
      return res.status(400).json({
        message: 'Vui lòng chọn mức độ cảnh báo'
      });
    }

    if (!reason?.trim()) {
      return res.status(400).json({
        message: 'Vui lòng nhập nội dung cảnh báo'
      });
    }
    // Find the student by username
    const student = await User.findOne({ where: { username: studentUsername, role: 'STUDENT' } });
    
    if (!student) {
      return res.status(404).json({ message: 'Không tìm thấy sinh viên với mã đăng nhập này' });
    }

    const warning = await Warning.create({
      studentId: student.id,
      type,
      severity,
      reason,
      status: 'ACTIVE'
    });

    // Notify student
    await Notification.create({
      title: 'Thông báo Cảnh báo',
      message: `CẢNH BÁO: ${reason}`,
      type: 'SYSTEM',
      targetRole: 'STUDENT',
      targetUserId: student.id,
      isRead: false
    });

    res.status(201).json(warning);
  } catch (error: any) {
  console.error('CREATE WARNING ERROR:', error);

  res.status(500).json({
    message: error.message,
    error
  });
}
};

export const updateWarningStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const warning = await Warning.findByPk(id);
    if (!warning) return res.status(404).json({ message: 'Not found' });

    warning.status = status;
    await warning.save();

    res.json(warning);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getStudentWarnings = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const studentId = req.user?.id;
    const warnings = await Warning.findAll({
      where: { studentId, status: 'ACTIVE' },
      order: [['createdAt', 'DESC']]
    });
    res.json(warnings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const evaluateRules = async (req: Request, res: Response) => {
  try {
    // 1. Get all students
    const students = await User.findAll({ where: { role: 'STUDENT' } });
    let createdCount = 0;

    for (const student of students) {
      // Find all enrollments for this student
      const enrollments = await Enrollment.findAll({ 
        where: { studentId: student.id, status: 'Enrolled' },
        include: [{ model: Course, as: 'course' }]
      });

      // Calculate total credits
      const totalCredits = enrollments.reduce((sum, enrollment) => {
        // @ts-ignore
        const course = enrollment.course;
        return sum + (course?.credits || 0);
      }, 0);

      if (totalCredits < 15) {
        const existing = await Warning.findOne({ where: { studentId: student.id, type: 'LOW_CREDIT', status: 'ACTIVE' } });
        if (!existing) {
          await Warning.create({
             studentId: student.id,
             type: 'LOW_CREDIT',
             severity: 'WARNING',
             reason: `Sinh viên đăng ký dưới 15 tín chỉ (hiện có: ${totalCredits} TC) trong học kỳ này theo quy định.`,
             status: 'ACTIVE'
          });
          
          await Notification.create({
            title: 'Cảnh báo đăng ký học phần',
            message: `Hệ thống ghi nhận bạn đăng ký dưới 15 tín chỉ (hiện có: ${totalCredits} TC). Vui lòng đăng ký thêm học phần.`,
            type: 'SYSTEM',
            targetRole: 'STUDENT',
            targetUserId: student.id,
            isRead: false
          });

          createdCount++;
        }
      } else {
        // If they have >= 15 credits now, we could automatically resolve any active LOW_CREDIT warning
        const existing = await Warning.findOne({ where: { studentId: student.id, type: 'LOW_CREDIT', status: 'ACTIVE' } });
        if (existing) {
          existing.status = 'RESOLVED';
          await existing.save();
        }
      }
    }

    res.json({ message: `Đã đánh giá thành công. Sinh ra ${createdCount} cảnh báo mới.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error parsing rules' });
  }
};
