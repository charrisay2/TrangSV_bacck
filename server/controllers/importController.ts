import { Request, Response } from "express";
import User from "../models/User";
import Course from "../models/Course";
import Curriculum from "../models/Curriculum";
import Major from "../models/Major";
import Department from "../models/Department";
import Class from "../models/Class";
import Subject from "../models/Subject";
import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import Enrollment from "../models/Enrollment";

export const importEnrollments = async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data))
      return res.status(400).json({ message: "Invalid data format" });

    let importedCount = 0;
    for (const item of data) {
      const studentUsername =
        item["Tên đăng nhập"]?.toString() || item.studentId?.toString();
      const courseCode =
        item["Mã lớp học phần"]?.toString() || item.courseId?.toString();

      if (!studentUsername || !courseCode) continue;

      const user = await User.findOne({
        where: {
          username: studentUsername,
          role: "STUDENT",
        },
      });
      const course = await Course.findOne({
        where: {
          [Op.or]: [{ id: parseInt(courseCode) || 0 }, { code: courseCode }],
        },
      });

      if (!user || !course) continue;

      const [enrollment, created] = await Enrollment.findOrCreate({
        where: {
          studentId: user.id,
          courseId: course.id,
        },
        defaults: {
          status: "Enrolled",
        },
      });

      if (created) importedCount++;
    }

    res.json({ message: `Imported ${importedCount} enrollments successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during import" });
  }
};
export const importUsers = async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data))
      return res.status(400).json({ message: "Invalid data format" });

    let importedCount = 0;

    const usernamesInFile = data
      .filter((item) => item.username)
      .map((item) => item.username);
    const hasDuplicates = usernamesInFile.some(
      (item, idx) => usernamesInFile.indexOf(item) !== idx,
    );
    if (hasDuplicates) {
      return res
        .status(400)
        .json({
          message: "Danh sách trong file Excel chứa các mã bị trùng lặp",
        });
    }

    const phonesInFile = data
      .filter((item) => item.phone)
      .map((item) => item.phone?.toString());
    const hasDuplicatePhones = phonesInFile.some(
      (item, idx) => phonesInFile.indexOf(item) !== idx,
    );
    if (hasDuplicatePhones) {
      return res
        .status(400)
        .json({
          message:
            "Danh sách trong file Excel chứa các số điện thoại bị trùng lặp",
        });
    }

    for (const item of data) {
      if (!item.name || !item.role) continue;

      let majorId = item.majorId;
      if (!majorId && item.majorName) {
        const major = await Major.findOne({ where: { name: item.majorName } });
        if (major) majorId = major.id;
      }

      let departmentId = item.departmentId;
      if (!departmentId && item.departmentName) {
        const dept = await Department.findOne({
          where: { name: item.departmentName },
        });
        if (dept) departmentId = dept.id;
      }

      let classId = item.classId;
      if (!classId && item.className) {
        const cls = await Class.findOne({ where: { name: item.className } });
        if (cls) classId = cls.id;
      }

      let username = item.username;

      if (!username) {
        if (item.role === "STUDENT") {
          let yearPrefix = new Date().getFullYear().toString().slice(-2);
          if (classId) {
            const studentClass = await Class.findByPk(classId);
            if (studentClass && studentClass.cohort) {
              const match = studentClass.cohort.match(/\d+$/);
              if (match) yearPrefix = match[0].slice(-2);
            }
          }

          const lastUser = await User.findOne({
            where: {
              role: "STUDENT",
              username: { [Op.like]: `${yearPrefix}%` },
            },
            order: [["username", "DESC"]],
          });

          let counter = 1;
          if (lastUser && lastUser.username) {
            const lastCounter = parseInt(lastUser.username.slice(2));
            if (!isNaN(lastCounter)) {
              counter = lastCounter + 1;
            }
          }
          username = `${yearPrefix}${counter.toString().padStart(4, "0")}`;
        } else if (item.role === "TEACHER") {
          const lastTeacher = await User.findOne({
            where: { role: "TEACHER", username: { [Op.like]: `GV%` } },
            order: [["username", "DESC"]],
          });
          let counter = 1;
          if (lastTeacher && lastTeacher.username) {
            const lastCounter = parseInt(lastTeacher.username.slice(2));
            if (!isNaN(lastCounter)) {
              counter = lastCounter + 1;
            }
          }
          username = `GV${counter.toString().padStart(4, "0")}`;
        } else {
          const lastAdmin = await User.findOne({
            where: { role: "ADMIN", username: { [Op.like]: `AD%` } },
            order: [["username", "DESC"]],
          });
          let counter = 1;
          if (lastAdmin && lastAdmin.username) {
            const lastCounter = parseInt(lastAdmin.username.slice(2));
            if (!isNaN(lastCounter)) {
              counter = lastCounter + 1;
            }
          }
          username = `AD${counter.toString().padStart(4, "0")}`;
        }
      }

      const existing = await User.findOne({ where: { username } });
      if (existing) {
        return res
          .status(400)
          .json({
            message: `Mã tài khoản sinh viên/giảng viên bị trùng lặp: ${username}`,
          });
      }

      if (item.phone) {
        const existingPhone = await User.findOne({
          where: { phone: item.phone.toString() },
        });
        if (existingPhone) {
          return res
            .status(400)
            .json({
              message: `Số điện thoại bị trùng lặp: ${item.phone} (thuộc về người dùng: ${existingPhone.name} - ${existingPhone.username})`,
            });
        }
      }

      let email = item.email;
      if (!email) {
        email = `${username}@uni.edu.vn`;
      }

      let userPassword = item.password ? item.password.toString() : "123456";
      if (userPassword.length < 6) {
        userPassword = "123456";
      }

      await User.create({
        username: username,
        password: userPassword,
        name: item.name || "Unknown",
        email: email,
        phone: item.phone,
        address: item.address,
        role: item.role as any,
        majorId,
        departmentId,
        classId,
        status: "ACTIVE",
        mustChangePassword: true,
      });
      importedCount++;
    }

    res.json({ message: `Imported ${importedCount} users successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during import" });
  }
};

export const importSubjects = async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data))
      return res.status(400).json({ message: "Invalid data format" });

    let importedCount = 0;
    for (const item of data) {
      if (!item.name) continue;

      let majorId = item.majorId;
      let majorCode = "SUB";
      if (!majorId && item.majorName) {
        const major = await Major.findOne({ where: { name: item.majorName } });
        if (major) {
          majorId = major.id;
          majorCode = major.code;
        }
      }

      if (!majorId) continue;

      let code = item.code;
      if (!code) {
        // Find highest existing subject code for this major
        const lastSubject = await Subject.findOne({
          where: { majorId },
          order: [["code", "DESC"]],
        });

        let startCounter = 1;
        if (lastSubject && lastSubject.code) {
          const match = lastSubject.code.match(/\d+$/);
          if (match) {
            startCounter = parseInt(match[0]) + 1;
          }
        }
        code = `${majorCode}${String(startCounter).padStart(3, "0")}`;
      }

      const existingSubject = await Subject.findOne({ where: { code } });
      if (existingSubject) {
        continue; // Skip existing
      }

      const newSubject = await Subject.create({
        code: code,
        name: item.name,
        credits: item.credits || 3,
        semesterNumber: item.semesterNumber || 1,
        totalPeriods: item.totalPeriods || 45,
        weeks: item.weeks || 10,
        majorId: majorId,
      });

      // Auto-assign to Curriculum if requested or by default
      const Curriculum = (await import("../models/Curriculum")).default;
      await Curriculum.create({
        majorId: majorId,
        subjectId: newSubject.id,
        semesterNumber: item.semesterNumber || 1,
      });

      importedCount++;
    }

    res.json({ message: `Imported ${importedCount} subjects successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during import" });
  }
};

export const importCurriculum = async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data))
      return res.status(400).json({ message: "Invalid data format" });

    let importedCount = 0;
    for (const item of data) {
      const semesterNumber = item["Học kỳ"] || item.semesterNumber;
      if (!semesterNumber) continue;

      let majorId = item.majorId;
      const majorName = item["Tên ngành"] || item.majorName;
      if (!majorId && majorName) {
        const major = await Major.findOne({ where: { name: majorName } });
        if (major) majorId = major.id;
      }

      let subjectId = item.subjectId;
      const subjectCode = item["Mã môn học"] || item.subjectCode;
      const subjectName = item.subjectName;

      if (!subjectId && (subjectCode || subjectName)) {
        const query: any = {};
        if (subjectCode) query.code = subjectCode;
        else query.name = subjectName;

        const subject = await Subject.findOne({ where: query });
        if (subject) subjectId = subject.id;
      }

      if (!majorId) {
        return res
          .status(400)
          .json({
            message: `Không tìm thấy ngành học với tên "${majorName || "Trống"}"`,
          });
      }

      if (!subjectId) {
        return res
          .status(400)
          .json({
            message: `Không tìm thấy môn học với mã "${subjectCode || subjectName || "Trống"}"`,
          });
      }

      await Curriculum.create({
        majorId,
        subjectId,
        semesterNumber: semesterNumber,
      });
      if (subjectId) {
        await Subject.update(
          {
            semesterNumber,
          },
          {
            where: {
              id: subjectId,
            },
          },
        );
      }
      importedCount++;
    }

    res.json({
      message: `Imported ${importedCount} curriculum rows successfully`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during import" });
  }
};

export const importCourses = async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data))
      return res.status(400).json({ message: "Invalid data format" });

    let importedCount = 0;
    for (const item of data) {
      if (!item.name || !item.code) continue;

      const existing = await Course.findOne({ where: { code: item.code } });
      if (existing) continue;

      let teacherId = item.teacherId;
      if (!teacherId && (item.teacherEmail || item.teacherUsername)) {
        const query: any = {};
        if (item.teacherEmail) query.email = item.teacherEmail;
        else query.username = item.teacherUsername;

        const teacher = await User.findOne({ where: query });
        if (teacher) teacherId = teacher.id;
      }

      if (!teacherId) continue; // Still need a teacher

      let majorId = item.majorId;
      if (!majorId && item.majorName) {
        const major = await Major.findOne({ where: { name: item.majorName } });
        if (major) majorId = major.id;
      }

      let classId = item.classId;
      if (!classId && item.className) {
        const cls = await Class.findOne({ where: { name: item.className } });
        if (cls) classId = cls.id;
      }

      await Course.create({
        name: item.name,
        code: item.code,
        teacherId,
        credits: item.credits || 3,
        majorId: majorId || null,
        classId: classId || null,
        schedule: item.schedule || "Thứ Hai (07:00 - 09:30)",
        type: item.type || "Standard",
        startDate: item.startDate || null,
        endDate: item.endDate || null,
      });
      importedCount++;
    }

    res.json({ message: `Imported ${importedCount} courses successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during import" });
  }
};
