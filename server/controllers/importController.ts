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

export const importUsers = async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data))
      return res.status(400).json({ message: "Invalid data format" });

    let importedCount = 0;
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
      if (existing) continue;

      let email = item.email;
      if (!email) {
        email = `${username}@uni.edu.vn`;
      }
      let courseId = item.courseId;

      if (!courseId && item.courseCode) {
        const course = await Course.findOne({
          where: { code: item.courseCode }
        });

        if (course) {
          courseId = course.id;
        }
      }
      await User.create({
        username: username,
        password: item.password ? item.password.toString() : '123',
        name: item.name || 'Unknown',
        email: email,
        phone: item.phone,
        address: item.address,
        role: item.role as any,
        majorId,
        departmentId,
        classId,
        courseId,
        status: 'ACTIVE',
      });
    }
    res.json({ message: `Imported ${importedCount} users successfully` });
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
        teacherId: item.teacherId,
        credits: item.credits || 3,
        majorId: item.majorId || null,
        schedule: item.schedule || "Thứ Hai (07:00 - 09:30)",
        type: item.type || "Standard",
      });
      importedCount++;
    }

    res.json({ message: `Imported ${importedCount} courses successfully` });
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
      if (!item.semesterNumber) continue;

      let majorId = item.majorId;
      if (!majorId && item.majorName) {
        const major = await Major.findOne({ where: { name: item.majorName } });
        if (major) majorId = major.id;
      }

      let subjectId = item.subjectId;
      if (!subjectId && (item.subjectCode || item.subjectName)) {
        const query: any = {};
        if (item.subjectCode) query.code = item.subjectCode;
        else query.name = item.subjectName;

        const subject = await Subject.findOne({ where: query });
        if (subject) subjectId = subject.id;
      }

      if (!majorId || !subjectId) continue;

      await Curriculum.create({
        majorId,
        subjectId,
        semesterNumber: item.semesterNumber,
      });
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
