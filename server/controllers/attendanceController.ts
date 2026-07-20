import { Request, Response } from "express";
import Attendance from "../models/Attendance";
import User from "../models/User";
import Course from "../models/Course";

// @desc    Get attendance for a course on a specific date
// @route   GET /api/attendance/course/:courseId?date=YYYY-MM-DD
// @access  Private/Teacher/Admin
export const getCourseAttendance = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const attendance = await Attendance.findAll({
      where: {
        courseId,
        date: date as string,
      },
    });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
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
    const today = new Date().toISOString().split("T")[0];

if (date !== today) {
  return res.status(400).json({
    message: "Chỉ được chỉnh sửa điểm danh trong ngày học",
  });
}
    if (!courseId || !date || !records) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Delete existing records for this course and date
    await Attendance.destroy({
      where: {
        courseId,
        date,
      },
    });

    // Create new records
    const attendanceData = Object.entries(records).map(
      ([studentId, status]) => ({
        courseId,
        studentId: Number(studentId),
        date,
        status: status as "Present" | "Absent" | "Late",
      }),
    );

    await Attendance.bulkCreate(attendanceData);

    res.status(201).json({ message: "Attendance saved successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
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
      include: [{ model: Course, as: "course" }],
    });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
// @desc    Mark attendance via QR scan
// @route   POST /api/attendance/qr-scan
// @access  Private/Student
export const markAttendanceQR = async (req: Request, res: Response) => {
  try {
    console.log("BODY:", req.body);

    // @ts-ignore
    console.log("USER:", req.user);
    const { courseId, date } = req.body;
    // @ts-ignore
    const studentId = req.user?.id;

    if (!courseId || !date) {
      return res.status(400).json({ message: "Missing courseId or date" });
    }

    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const course = await Course.findByPk(courseId);

if (!course) {
  return res.status(404).json({
    message: "Không tìm thấy lớp học",
  });
}

// Chỉ cho điểm danh đúng ngày hiện tại
const today = new Date().toISOString().split("T")[0];

if (date !== today) {
  return res.status(400).json({
    message: "Chỉ được điểm danh trong ngày học hiện tại",
  });
}

// Kiểm tra đúng thứ trong lịch học
const getExpectedDays = (schedule: string) => {
  const daysMap: Record<string, number> = {
    "Chủ Nhật": 0,
    "Thứ Hai": 1,
    "Thứ Ba": 2,
    "Thứ Tư": 3,
    "Thứ Năm": 4,
    "Thứ Sáu": 5,
    "Thứ Bảy": 6,
  };

  const result: number[] = [];

  for (const [dayName, dayIndex] of Object.entries(daysMap)) {
    if (schedule.includes(dayName)) {
      result.push(dayIndex);
    }
  }

  return result;
};

const expectedDays = getExpectedDays(course.schedule);

const selectedDay = new Date(date).getDay();

if (!expectedDays.includes(selectedDay)) {
  return res.status(400).json({
    message: "Hôm nay không phải ngày học của lớp này",
  });
}

// Kiểm tra ngày nằm trong khoảng học
const enrollmentStartDate = new Date(
  // @ts-ignore
  enrollment?.startDate || course.startDate
);

const weeks = course.weeks || 10;

const courseEndDate = new Date(enrollmentStartDate);
courseEndDate.setDate(
  courseEndDate.getDate() + weeks * 7
);

const attendanceDate = new Date(date);

if (
  attendanceDate < enrollmentStartDate ||
  attendanceDate > courseEndDate
) {
  return res.status(400).json({
    message: "Buổi học nằm ngoài thời gian của khóa học",
  });
}

// Kiểm tra giờ học
const match = course.schedule.match(
  /(Thứ [^\(]+)\s*\(([\d:]+)\s*-\s*([\d:]+)\)/
);

if (match) {
  const startTime = match[2];
  const endTime = match[3];

  const [startHour, startMinute] = startTime
    .split(":")
    .map(Number);

  const [endHour, endMinute] = endTime
    .split(":")
    .map(Number);

  const now = new Date();

  const classStart = new Date();
  classStart.setHours(
    startHour,
    startMinute,
    0,
    0
  );

  const classEnd = new Date();
  classEnd.setHours(
    endHour,
    endMinute,
    0,
    0
  );

  if (now < classStart || now > classEnd) {
    return res.status(400).json({
      message: "Hiện không nằm trong thời gian điểm danh",
    });
  }
}
    // NEW: Check if student is enrolled in this course
    const Enrollment = (await import("../models/Enrollment")).default;
    const enrollment = await Enrollment.findOne({
      where: {
        courseId,
        studentId,
        status: "Enrolled",
      },
    });

    if (!enrollment) {
      return res
        .status(403)
        .json({
          message: "Bạn không có tên trong danh sách đăng ký môn học này.",
        });
    }

    // Find if already exists
    const existing = await Attendance.findOne({
      where: { courseId, date, studentId },
    });
    if (existing) {
      existing.status = "Present";
      await existing.save();
      return res
        .status(200)
        .json({ message: "Điểm danh thành công (đã cập nhật)" });
    }

    const attendance = await Attendance.create({
      courseId,
      date,
      studentId,
      status: "Present",
      latitude: req.body.latitude,
      longitude: req.body.longitude,
    });

    res.status(200).json({
      message: "Điểm danh thành công",
      attendanceId: attendance.id,
      classLatitude: attendance.latitude,
      classLongitude: attendance.longitude,
    });
  } catch (error: any) {
    console.error("QR ERROR:", error);

    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};
// @desc    Report location violation (background tracking)
// @route   POST /api/attendance/location-violation
// @access  Private/Student
export const reportLocationViolation = async (req: Request, res: Response) => {
  try {
    const { attendanceId } = req.body;
    // @ts-ignore
    const studentId = req.user?.id;

    if (!attendanceId) {
      return res.status(400).json({ message: "Missing attendanceId" });
    }

    const attendance = await Attendance.findOne({
      where: { id: attendanceId, studentId },
    });

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    attendance.hasLeftClass = true;
    attendance.leftClassAt = new Date();
    await attendance.save();

    res.status(200).json({ message: "Đã ghi nhận rời khỏi lớp học." });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
