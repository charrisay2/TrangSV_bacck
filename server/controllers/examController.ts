
import { Request, Response } from "express";
import { Op } from "sequelize";

import Exam from "../models/Exam";
import ExamQuestion from "../models/ExamQuestion";
import ExamSubmission from "../models/ExamSubmission";
import Course from "../models/Course";
import User from "../models/User";

// ================= GET TEACHER EXAMS =================
export const getTeacherExams = async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).user?.id;

    const courses = await Course.findAll({
      where: { teacherId },
    });

    const courseIds = courses.map((c) => c.id);

    const exams = await Exam.findAll({
      where: {
        courseId: {
          [Op.in]: courseIds,
        },
      },
      include: [
        {
          model: Course,
          as: "course",
          attributes: ["id", "name", "code"],
        },
        {
          model: ExamQuestion,
          as: "questions",
        },
        {
          model: ExamSubmission,
          as: "submissions",
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(exams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const createExam = async (req: Request, res: Response) => {
  try {
    const {
      courseId,
      title,
      description,
      startTime,
      endTime,
      isLockdown,
    } = req.body;

    const user = (req as any).user;
    const teacherId = user?.id;
    const role = user?.role;

    const course = await Course.findByPk(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Không tìm thấy môn học",
      });
    }

    if (
      role !== "ADMIN" &&
      String(course.teacherId) !== String(teacherId)
    ) {
      return res.status(403).json({
        message:
          "Bạn chỉ được phép tạo bài thi cho môn học mình được phân công",
      });
    }

    const exam = await Exam.create({
      courseId,
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      isLockdown: !!isLockdown,
      status: "DRAFT",
    });

    res.status(201).json(exam);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

export const uploadQuestions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { questions } = req.body;

    const exam = await Exam.findByPk(id);

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found",
      });
    }

    await ExamQuestion.destroy({
      where: { examId: id },
    });

    const questionsToInsert = questions.map((q: any) => ({
      examId: id,
      type: q.type,
      content: q.content,
      options: q.options || null,
      correctAnswer: q.correctAnswer || null,
      points: q.points || 1,
    }));

    await ExamQuestion.bulkCreate(questionsToInsert);

    res.json({
      message: "Questions uploaded successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

export const publishExam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const exam = await Exam.findByPk(id);

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found",
      });
    }

    exam.status = status || "PUBLISHED";

    await exam.save();

    res.json(exam);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

export const autoCompleteExams = async () => {
  try {
    await Exam.update(
      {
        status: "COMPLETED",
      },
      {
        where: {
          status: "PUBLISHED",
          endTime: {
            [Op.lt]: new Date(),
          },
        },
      }
    );

    console.log("Auto completed expired exams");
  } catch (error) {
    console.error("Auto complete exams error:", error);
  }
};

export const getStudentExams = async (req: Request, res: Response) => {
  try {
    const studentId = Number((req as any).user?.id);

    const user = await User.findByPk(studentId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    let courseFilter: any = {};

    if (user.classId) {
      const courses = await Course.findAll({
        where: {
          classId: user.classId,
        },
      });

      courseFilter = {
        id: {
          [Op.in]: courses.map((c) => c.id),
        },
      };
    }

    const exams = await Exam.findAll({
      where: {
        status: {
          [Op.in]: ["PUBLISHED", "COMPLETED"],
        },
      },
      include: [
        {
          model: Course,
          as: "course",
          attributes: ["id", "name", "code"],
          where: courseFilter,
        },
        {
          model: ExamSubmission,
          as: "submissions",
          where: { studentId },
          required: false,
        },
      ],
      order: [["startTime", "DESC"]],
    });

    res.json(exams);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

// ================= GET EXAM FOR STUDENT =================
export const getExamForStudent = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const studentId = (req as any).user?.id;

    const user = await User.findByPk(studentId);

    const exam = await Exam.findByPk(id, {
      include: [
        {
          model: Course,
          as: "course",
        },
        {
          model: ExamQuestion,
          as: "questions",
          attributes: [
            "id",
            "type",
            "content",
            "options",
            "points",
          ],
        },
      ],
    });

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found",
      });
    }

    if (user && user.classId !== (exam as any).course?.classId) {
      return res.status(403).json({
        message: "Bạn không có quyền truy cập bài thi này",
      });
    }

    res.json(exam);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

export const getExamResultForStudent = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const studentId = (req as any).user?.id;

    const submission = await ExamSubmission.findOne({
      where: {
        examId: id,
        studentId,
      },
    });

    if (!submission) {
      return res.status(404).json({
        message: "Submission not found",
      });
    }

    if (submission.status !== "GRADED") {
      return res.status(403).json({
        message: "Kết quả chưa được công bố",
      });
    }

    const exam = await Exam.findByPk(id, {
      include: [
        {
          model: Course,
          as: "course",
        },
        {
          model: ExamQuestion,
          as: "questions",
          attributes: [
            "id",
            "type",
            "content",
            "options",
            "points",
            "correctAnswer",
          ],
        },
      ],
    });

    res.json({
      exam,
      submission,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

export const submitExam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const {
      answers,
      cheatingAttempts = 0,
    } = req.body;

    const studentId = Number((req as any).user?.id);

    const exam = await Exam.findByPk(id, {
      include: [
        {
          model: Course,
          as: "course",
        },
        {
          model: ExamQuestion,
          as: "questions",
        },
      ],
    });

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found",
      });
    }

    if ((exam as any).status === "COMPLETED") {
      return res.status(400).json({
        message: "Bài thi đã kết thúc",
      });
    }

    const user = await User.findByPk(studentId);

    if (
      user &&
      user.classId !== (exam as any).course?.classId
    ) {
      return res.status(403).json({
        message: "Bạn không có quyền truy cập bài thi này",
      });
    }

    const questions: any[] = (exam as any).questions || [];

    let autoScore = 0;
    let hasEssay = false;

    const totalPointsConfigured = questions.reduce(
      (sum, q) => sum + (q.points || 0),
      0
    );

    const pointScale =
      totalPointsConfigured > 0
        ? 100 / totalPointsConfigured
        : 1;

    questions.forEach((q) => {
      if (q.type === "MULTIPLE_CHOICE") {
        const studentAnswer = answers?.[q.id];

        if (
          studentAnswer &&
          studentAnswer === q.correctAnswer
        ) {
          autoScore += q.points * pointScale;
        }
      } else {
        hasEssay = true;
      }
    });

    const cheatingPenalty = cheatingAttempts * 5;

    let finalScore = autoScore - cheatingPenalty;

    if (finalScore < 0) finalScore = 0;
    if (finalScore > 100) finalScore = 100;

    const submission = await ExamSubmission.create({
      examId: Number(id),
      studentId,
      answers,
      cheatingAttempts,
      score: hasEssay
        ? null
        : parseFloat(finalScore.toFixed(2)),
      status: hasEssay ? "PENDING" : "GRADED",
      submittedAt: new Date(),
    });

    res.status(201).json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

export const getSubmissions = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const submissions = await ExamSubmission.findAll({
      where: {
        examId: id,
      },
      include: [
        {
          model: User,
          as: "student",
          attributes: ["id", "name", "username"],
        },
      ],
    });

    const exam = await Exam.findByPk(id, {
      include: [
        {
          model: ExamQuestion,
          as: "questions",
        },
      ],
    });

    res.json({
      submissions,
      questions: exam ? (exam as any).questions : [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

export const gradeSubmission = async (
  req: Request,
  res: Response
) => {
  try {
    const { submissionId } = req.params;
    const { score, gradingDetails } = req.body;

    const submission = await ExamSubmission.findByPk(
      submissionId
    );

    if (!submission) {
      return res.status(404).json({
        message: "Not found",
      });
    }

    submission.score = score;

    if (gradingDetails) {
      submission.gradingDetails = gradingDetails;
    }

    submission.status = "GRADED";

    await submission.save();

    res.json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

