import { Request, Response } from "express";
import Course from "../models/Course";
import User from "../models/User";
import Invoice from "../models/Invoice";
import Notification from "../models/Notification";
import Enrollment from "../models/Enrollment";
import Room from "../models/Room";
import Major from "../models/Major";
import Class from "../models/Class";
import Semester from "../models/Semester";
import { Op } from "sequelize";

// @desc    Get available resources (rooms and teachers)
export const getAvailableResources = async (req: Request, res: Response) => {
  try {
    const { schedule, semesterId, excludeCourseId, majorId } = req.query;
    if (!schedule || !semesterId) {
      return res
        .status(400)
        .json({ message: "Missing schedule or semesterId" });
    }
    const whereClause: any = {
      schedule: schedule as string,
      semesterId: semesterId as string,
    };
    if (excludeCourseId) {
      whereClause.id = { [Op.ne]: excludeCourseId };
    }
    const conflictingCourses = await Course.findAll({
      where: whereClause,
      attributes: ["roomId", "teacherId"],
    });
    const occupiedRoomIds = conflictingCourses
      .map((c) => c.roomId)
      .filter(Boolean);
    const occupiedTeacherIds = conflictingCourses
      .map((c) => c.teacherId)
      .filter(Boolean);
    const roomWhereClause: any = { status: "ACTIVE" };
    if (occupiedRoomIds.length > 0) {
      roomWhereClause.id = { [Op.notIn]: occupiedRoomIds };
    }
    const availableRooms = await Room.findAll({ where: roomWhereClause });
    let departmentIdFilter: any = undefined;
    if (majorId) {
      const major = await Major.findByPk(majorId as string);
      if (major) {
        departmentIdFilter = major.departmentId;
      }
    }
    const teacherWhereClause: any = {
      role: "TEACHER",
      ...(occupiedTeacherIds.length > 0
        ? { id: { [Op.notIn]: occupiedTeacherIds } }
        : {}),
    };
    if (departmentIdFilter) {
      teacherWhereClause.departmentId = departmentIdFilter;
    }
    const availableTeachers = await User.findAll({
      where: teacherWhereClause,
      attributes: ["id", "name", "email"],
    });
    res.json({ rooms: availableRooms, teachers: availableTeachers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getCourses = async (req: Request, res: Response) => {
  try {
    const courses = await Course.findAll({
      include: [
        { model: User, as: "teacher", attributes: ["id", "name", "email"] },
        { model: Room, as: "room" },
        { model: Major, as: "major" },
        { model: Class, as: "targetClass" },
        { model: Semester, as: "semester" },
        {
          model: User,
          as: "enrolledStudents",
          attributes: ["id"],
          through: { attributes: [] },
        },
      ],
    });
    const formattedCourses = courses.map((c) => {
      const plain = c.get({ plain: true }) as any;
      plain.students = plain.enrolledStudents
        ? plain.enrolledStudents.map((s: any) => s.id)
        : [];
      delete plain.enrolledStudents;
      return plain;
    });
    res.json(formattedCourses);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const getCourseById = async (req: Request, res: Response) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        { model: User, as: "teacher", attributes: ["id", "name", "email"] },
        { model: Room, as: "room" },
        { model: Major, as: "major" },
        { model: Class, as: "targetClass" },
        { model: Semester, as: "semester" },
        {
          model: User,
          as: "enrolledStudents",
          attributes: ["id"],
          through: { attributes: [] },
        },
      ],
    });
    if (course) {
      const plain = course.get({ plain: true }) as any;
      plain.students = plain.enrolledStudents
        ? plain.enrolledStudents.map((s: any) => s.id)
        : [];
      delete plain.enrolledStudents;
      res.json(plain);
    } else {
      res.status(404).json({ message: "Course not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const createCourse = async (req: Request, res: Response) => {
  try {
    const {
      name,
      code,
      teacherId,
      roomId,
      schedule,
      type,
      majorId,
      classId,
      credits,
      semesterId,
      totalPeriods,
      weeks,
    } = req.body;
    const course = await Course.create({
      name,
      code,
      teacherId,
      roomId,
      schedule,
      type,
      majorId,
      classId,
      credits: credits || 3,
      semesterId,
      totalPeriods: totalPeriods || 45,
      weeks: weeks || 10,
    });
    const createdCourse = await Course.findByPk(course.id, {
      include: [
        { model: User, as: "teacher", attributes: ["id", "name", "email"] },
        { model: Room, as: "room" },
        { model: Major, as: "major" },
        { model: Class, as: "targetClass" },
        { model: Semester, as: "semester" },
        {
          model: User,
          as: "enrolledStudents",
          attributes: ["id"],
          through: { attributes: [] },
        },
      ],
    });
    const plain = createdCourse?.get({ plain: true }) as any;
    if (plain) {
      plain.students = plain.enrolledStudents
        ? plain.enrolledStudents.map((s: any) => s.id)
        : [];
      delete plain.enrolledStudents;
    }
    res.status(201).json(plain);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateCourse = async (req: Request, res: Response) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (course) {
      course.name = req.body.name || course.name;
      course.code = req.body.code || course.code;
      course.teacherId = req.body.teacherId || course.teacherId;
      course.roomId = req.body.roomId || course.roomId;
      course.schedule = req.body.schedule || course.schedule;
      course.type = req.body.type || course.type;
      course.majorId = req.body.majorId || course.majorId;
      course.classId = req.body.classId || course.classId;
      course.credits = req.body.credits || course.credits;
      course.semesterId = req.body.semesterId || course.semesterId;
      course.totalPeriods = req.body.totalPeriods || course.totalPeriods;
      course.weeks = req.body.weeks || course.weeks;
      await course.save();
      const updatedCourse = await Course.findByPk(course.id, {
        include: [
          { model: User, as: "teacher", attributes: ["id", "name", "email"] },
          { model: Room, as: "room" },
          { model: Major, as: "major" },
          { model: Class, as: "targetClass" },
          { model: Semester, as: "semester" },
          {
            model: User,
            as: "enrolledStudents",
            attributes: ["id"],
            through: { attributes: [] },
          },
        ],
      });
      const plain = updatedCourse?.get({ plain: true }) as any;
      if (plain) {
        plain.students = plain.enrolledStudents
          ? plain.enrolledStudents.map((s: any) => s.id)
          : [];
        delete plain.enrolledStudents;
      }
      res.json(plain);
    } else {
      res.status(404).json({ message: "Course not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// ĐÃ FIX: Lấy thêm dữ liệu Room để kiểm tra sức chứa thật
export const registerCourse = async (req: Request, res: Response) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [{ model: Room, as: "room" }],
    });
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (course) {
      // 1. Kiểm tra sĩ số thực tế đang đăng ký
      const currentEnrollments = await Enrollment.count({
        where: { courseId: course.id, status: "Enrolled" },
      });

      // 2. Lấy sức chứa chuẩn từ database của Phòng học (mặc định 60 nếu chưa xếp phòng)
      const MAX_CAPACITY = (course as any).room?.capacity || 60;

      if (currentEnrollments >= MAX_CAPACITY) {
        return res
          .status(400)
          .json({ message: "Lớp học đã đủ sĩ số, không thể đăng ký thêm." });
      }

      // 3. Kiểm tra xem đã đăng ký chưa
      const existingEnrollment = await Enrollment.findOne({
        where: { courseId: course.id, studentId },
      });

      if (existingEnrollment) {
        return res
          .status(400)
          .json({ message: "Already registered for this course" });
      }

      await Enrollment.create({
        courseId: course.id,
        studentId,
        status: "Enrolled",
      });

      // Logic tạo hóa đơn và thông báo
      const credits = course.credits || 3;
      let amount = credits * 1000;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      await Invoice.create({
        studentId,
        title: `Học phí môn ${course.name} (${course.code})`,
        amount,
        dueDate: dueDate.toLocaleDateString("vi-VN"),
        status: "Unpaid",
      });

      await Notification.create({
        message: `Bạn có hóa đơn học phí mới cho môn ${course.name}`,
        type: "FEE_REMINDER",
        targetRole: "STUDENT",
        targetUserId: studentId,
        isRead: false,
      });

      const updatedCourse = await Course.findByPk(course.id, {
        include: [
          { model: User, as: "teacher", attributes: ["id", "name", "email"] },
          { model: Room, as: "room" },
          { model: Major, as: "major" },
          { model: Class, as: "targetClass" },
          { model: Semester, as: "semester" },
          {
            model: User,
            as: "enrolledStudents",
            attributes: ["id"],
            through: { attributes: [] },
          },
        ],
      });

      const plain = updatedCourse?.get({ plain: true }) as any;
      if (plain) {
        plain.students = plain.enrolledStudents
          ? plain.enrolledStudents.map((s: any) => s.id)
          : [];
        delete plain.enrolledStudents;
      }
      res.json(plain);
    } else {
      res.status(404).json({ message: "Course not found" });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const unregisterCourse = async (req: Request, res: Response) => {
  try {
    const course = await Course.findByPk(req.params.id);
    const studentId = req.user?.id;
    if (!studentId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    if (course) {
      const enrollment = await Enrollment.findOne({
        where: { courseId: course.id, studentId },
      });
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      const now = new Date();
      const createdAt = new Date(enrollment.createdAt);
      const diffInHours =
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      if (diffInHours > 3) {
        return res.status(400).json({
          message: "Không thể hủy đăng ký sau 3 giờ kể từ khi đăng ký",
        });
      }
      await enrollment.destroy();
      const invoiceTitle = `Học phí môn ${course.name} (${course.code})`;
      await Invoice.destroy({
        where: { studentId, title: invoiceTitle, status: "Unpaid" },
      });
      const updatedCourse = await Course.findByPk(course.id, {
        include: [
          { model: User, as: "teacher", attributes: ["id", "name", "email"] },
          { model: Room, as: "room" },
          { model: Major, as: "major" },
          { model: Class, as: "targetClass" },
          { model: Semester, as: "semester" },
          {
            model: User,
            as: "enrolledStudents",
            attributes: ["id"],
            through: { attributes: [] },
          },
        ],
      });
      const plain = updatedCourse?.get({ plain: true }) as any;
      if (plain) {
        plain.students = plain.enrolledStudents
          ? plain.enrolledStudents.map((s: any) => s.id)
          : [];
        delete plain.enrolledStudents;
      }
      res.json(plain);
    } else {
      res.status(404).json({ message: "Course not found" });
    }
  } catch (error) {
    console.error("Unregistration error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (course) {
      await course.destroy();
      res.json({ message: "Course removed" });
    } else {
      res.status(404).json({ message: "Course not found" });
    }
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
