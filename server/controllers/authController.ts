import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import User from "../models/User";
import Notification from "../models/Notification";

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key_123";

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập tài khoản và mật khẩu" });
    }

    // 1. Check if user exists
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Tài khoản hoặc mật khẩu không chính xác" });
    }

    // 2. Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Tài khoản hoặc mật khẩu không chính xác" });
    }

    // 3. Generate Token    
    const payload = {
      id: user.id,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });

    // 4. Return user info (excluding password) and token
    const userResponse = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      joinDate: user.joinDate,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      classId: user.classId,
      departmentId: user.departmentId,
      majorId: user.majorId,
      mustChangePassword: user.mustChangePassword, // Giữ thuộc tính kiểm tra đổi mật khẩu bắt buộc
    };

    res.json({
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Login error:", error);
    let errorMessage = "Lỗi server";
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      errorMessage = `Lỗi server: ${error.message}`; // Hợp nhất thông báo lỗi chi tiết
    }
    res.status(500).json({ message: errorMessage });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - user is attached by auth middleware
    const userId = req.user.id;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const forgotPasswordRequest = async (req: Request, res: Response) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ message: "Vui lòng cung cấp Mã sinh viên hoặc Email" });
    }

    // Attempt to find the user by username or email
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: identifier },
          { email: identifier }
        ]
      }
    });

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản với thông tin đã cung cấp." });
    }

    // Create a notification directed to admins
    await Notification.create({
      title: "Yêu cầu khôi phục mật khẩu",
      message: `Người dùng ${user.name} (${user.username}) đã yêu cầu khôi phục mật khẩu. Email: ${user.email}`,
      type: "SYSTEM",
      targetRole: "ADMIN",
      targetUserId: undefined,
      isRead: false
    });

    return res.status(200).json({ message: "Yêu cầu đã được gửi đến quản trị viên." });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    // @ts-ignore
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng nhập mật khẩu cũ và mật khẩu mới' });
    }
    
    if (newPassword.trim() === '') {
      return res.status(400).json({ message: 'Mật khẩu mới không được để trống' });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({ message: 'Mật khẩu mới không được trùng với mật khẩu cũ' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu cũ không chính xác' });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
