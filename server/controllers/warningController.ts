import { Request, Response } from 'express';
import Warning from '../models/Warning';
import User from '../models/User';
import Course from '../models/Course';
import { Grade } from '../models/Grade';
import Notification from '../models/Notification';

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
    const { studentId, type, severity, reason } = req.body;
    
    const warning = await Warning.create({
      studentId,
      type,
      severity,
      reason,
      status: 'ACTIVE'
    });

    // Notify student
    await Notification.create({
      message: `CẢNH BÁO: ${reason}`,
      type: 'WARNING',
      targetRole: 'STUDENT',
      targetUserId: studentId,
      isRead: false
    });

    res.status(201).json(warning);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
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

export const evaluateRules = async (req: Request, res: Response) => {
  try {
    // Demo implementation for evaluating < 15 credits
    // In a real app we'd fetch current semester enrollments.
    // For demo, we just create a dummy warning to show the feature works.
    
    // Example: Find students who registered < 15 credits.
    // 1. Get all students
    const students = await User.findAll({ where: { role: 'STUDENT' } });
    let createdCount = 0;

    for (const student of students) {
      // Simulate low credits check
      // For demo, let's say student with ID = 3 has 12 credits
      if (student.id === 3 || student.id % 5 === 0) {
        const existing = await Warning.findOne({ where: { studentId: student.id, type: 'LOW_CREDIT', status: 'ACTIVE' } });
        if (!existing) {
          await Warning.create({
             studentId: student.id,
             type: 'LOW_CREDIT',
             severity: 'WARNING',
             reason: 'Sinh viên đăng ký dưới 15 tín chỉ trong học kỳ này theo quy định.',
             status: 'ACTIVE'
          });
          
          await Notification.create({
            message: `Hệ thống ghi nhận bạn đăng ký dưới 15 tín chỉ. Vui lòng đăng ký thêm học phần.`,
            type: 'WARNING',
            targetRole: 'STUDENT',
            targetUserId: student.id,
            isRead: false
          });

          createdCount++;
        }
      }
    }

    res.json({ message: `Đã đánh giá thành công. Sinh ra ${createdCount} cảnh báo mới.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error parsing rules' });
  }
};
