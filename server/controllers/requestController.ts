import { Request, Response } from 'express';
import RequestModel from '../models/Request';
import User from '../models/User';
import Class from '../models/Class';
import Notification from '../models/Notification';

export const createRequest = async (req: Request, res: Response) => {
  try {
    const { type, targetClassId, substituteTeacherId, reason, attachmentUrl } = req.body;
    // @ts-ignore
    const requesterId = (req as any).user?.id;

    const newRequest = await RequestModel.create({
      type,
      requesterId,
      targetClassId,
      substituteTeacherId,
      reason,
      attachmentUrl,
      status: 'PENDING'
    });

    // Notify admins
    await Notification.create({
      message: `Đơn từ mới: ${type === 'STUDENT_LEAVE' ? 'Xin phép nghỉ' : 'Báo bận/Dạy thay'}`,
      type: 'SYSTEM',
      targetRole: 'ADMIN',
      isRead: false
    });

    res.status(201).json(newRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRequests = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const { id, role } = req.user;

    let whereClause = {};
    if (role === 'STUDENT' || role === 'TEACHER') {
      whereClause = { requesterId: id };
    }
    // ADMIN sees all

    const requests = await RequestModel.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'requester', attributes: ['id', 'name', 'username'] },
        { model: Class, as: 'targetClass', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'substituteTeacher', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateRequestStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'APPROVED' or 'REJECTED'

    const userRequest = await RequestModel.findByPk(id);
    if (!userRequest) return res.status(404).json({ message: 'Không tìm thấy đơn.' });

    userRequest.status = status;
    await userRequest.save();

    await Notification.create({
      message: `Đơn của bạn đã được ${status === 'APPROVED' ? 'chấp nhận' : 'từ chối'}`,
      type: 'SYSTEM',
      targetRole: userRequest.type === 'STUDENT_LEAVE' ? 'STUDENT' : 'TEACHER',
      targetUserId: userRequest.requesterId,
      isRead: false
    });

    res.json(userRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
