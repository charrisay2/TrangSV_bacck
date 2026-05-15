import { Request, Response } from "express";
import { Op } from "sequelize";
import Exam from "../models/Exam";
import ExamQuestion from "../models/ExamQuestion";
import ExamSubmission from "../models/ExamSubmission";
import Course from "../models/Course";
import User from "../models/User";

// GET TEACHER EXAMS
export const getTeacherExams = async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).user?.id;

    const courses = await Course.findAll({ where: { teacherId } });
    const courseIds = courses.map((c) => c.id);

    const exams = await Exam.findAll({
      where: {
        courseId: {
          [Op.in]: courseIds, // FIX
        },
      },
      include: [
        { model: Course, as: "course", attributes: ["id", "name", "code"] },
        { model: ExamQuestion, as: "questions" },
        { model: ExamSubmission, as: "submissions" },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(exams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// CREATE EXAM
export const createExam = async (req: Request, res: Response) => {
  try {
    const { courseId, title, description, startTime, endTime, isLockdown } =
      req.body;

    const teacherId = (req as any).user?.id;

    const course = await Course.findByPk(courseId);
    if (!course)
      return res.status(404).json({ message: "Không tìm thấy môn học" });

    if (String(course.teacherId) !== String(teacherId)) {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const exam = await Exam.create({
      courseId,
      title,
      description,
      startTime: startTime,
      endTime: endTime,
      isLockdown: !!isLockdown,
      status: "DRAFT",
    });

    res.status(201).json(exam);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// UPLOAD QUESTIONS
export const uploadQuestions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { questions } = req.body;

    const exam = await Exam.findByPk(id);
    if (!exam) return res.status(404).json({ message: "Not found" });

    await ExamQuestion.destroy({ where: { examId: id } });

    const data = questions.map((q: any) => ({
      examId: id,
      type: q.type,
      content: q.content,
      options: q.options || null,
      correctAnswer: q.correctAnswer || null,
      points: q.points || 1,
    }));

    await ExamQuestion.bulkCreate(data);

    res.json({ message: "OK" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// PUBLISH EXAM
export const publishExam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const exam = await Exam.findByPk(id);
    if (!exam) return res.status(404).json({ message: "Not found" });

    exam.status = status;
    await exam.save();

    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: "Please fill PUBLISHED" });
    // khi bấm vào chuyển sang PU
  }
};

// GET STUDENT EXAMS
export const getStudentExams = async (req: Request, res: Response) => {
  try {
    const studentId = Number((req as any).user?.id);

    const exams = await Exam.findAll({
      where: {
        status: {
          [Op.in]: ["PUBLISHED", "COMPLETED"], // FIX
        },
      },
      include: [
        { model: Course, as: "course", attributes: ["id", "name", "code"] },
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
    res.status(500).json({ message: "Server Error" });
  }
};

// GET EXAM FOR STUDENT
export const getExamForStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const exam = await Exam.findByPk(id, {
      include: [
        {
          model: ExamQuestion,
          as: "questions",
          attributes: ["id", "type", "content", "options", "points"],
        },
      ],
    });

    if (!exam) return res.status(404).json({ message: "Not found" });

    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// SUBMIT EXAM
export const submitExam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { answers, cheatingAttempts = 0 } = req.body;

    const studentId = Number((req as any).user?.id);

    const exam = await Exam.findByPk(id, {
      include: [{ model: ExamQuestion, as: "questions" }],
    });

    if (!exam) return res.status(404).json({ message: "Not found" });

    const questions: any[] = (exam as any).questions || [];

    let autoScore = 0;
    let hasEssay = false;

    questions.forEach((q) => {
      if (q.type === "MULTIPLE_CHOICE") {
        if (answers?.[q.id] === q.correctAnswer) {
          autoScore += q.points;
        }
      } else {
        hasEssay = true;
      }
    });

    const submission = await ExamSubmission.create({
      examId: Number(id),
      studentId,
      answers,
      cheatingAttempts,
      score: hasEssay ? null : autoScore,
      status: hasEssay ? "PENDING" : "GRADED",
      submittedAt: new Date(),
    });
    
    res.status(201).json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// GET SUBMISSIONS
export const getSubmissions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const submissions = await ExamSubmission.findAll({
      where: { examId: id },
      include: [
        { model: User, as: "student", attributes: ["id", "name", "username"] },
      ],
    });

    const exam = await Exam.findByPk(id, {
      include: [{ model: ExamQuestion, as: "questions" }],
    });

    res.json({
      submissions,
      questions: (exam as any)?.questions || [],
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// GRADE SUBMISSION
export const gradeSubmission = async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { score } = req.body;

    const submission = await ExamSubmission.findByPk(submissionId);
    if (!submission)
      return res.status(404).json({ message: "Not found" });

    submission.score = score;
    submission.status = "GRADED";
    await submission.save();

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};