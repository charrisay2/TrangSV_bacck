import { Request, Response } from "express";
import Exam from "../models/Exam";
import ExamQuestion from "../models/ExamQuestion";
import ExamSubmission from "../models/ExamSubmission";
import Course from "../models/Course";
import User from "../models/User";
import { Op } from "sequelize";
import Grade from "../models/Grade";
import QuestionBank from "../models/QuestionBank";
import Enrollment from "../models/Enrollment";

// Hàm bổ trợ lấy số lượng câu hỏi tối đa dựa theo title mới từ Frontend
const getMaxQuestions = (title: string): number => {
  switch (title) {
    case "Kiểm tra 15 phút":
      return 20;
    case "Kiểm tra giữa kỳ":
      return 30;
    case "Thi cuối kỳ":
      return 45;
    default:
      return 100;
  }
};

export const getQuestionBank = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const teacherId = req.user?.id;
    const { courseId } = req.query;

    const whereClause: any = { teacherId };
    if (courseId) whereClause.courseId = courseId;

    const questions = await QuestionBank.findAll({
      where: whereClause,
      include: [
        { model: Course, as: "course", attributes: ["id", "name", "code"] },
      ],
    });

    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const addQuestionToBank = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const teacherId = req.user?.id;
    const {
      courseId,
      type,
      content,
      options,
      correctAnswer,
      points,
      examType,
    } = req.body;

    const question = await QuestionBank.create({
      courseId,
      teacherId,
      type,
      content,
      options,
      correctAnswer,
      points,
      examType: examType || "Tất cả",
    });

    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const getTeacherExams = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const teacherId = req.user?.id;
    const courses = await Course.findAll({ where: { teacherId } });
    const courseIds = courses.map((c) => c.id);

    const exams = await Exam.findAll({
      where: { courseId: courseIds },
      include: [
        { model: Course, as: "course", attributes: ["id", "name", "code"] },
        { model: ExamQuestion, as: "questions" },
        { model: ExamSubmission, as: "submissions" },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const createExam = async (req: Request, res: Response) => {
  try {
    const { courseId, title, description, startTime, endTime, isLockdown } =
      req.body;
    // @ts-ignore
    const user = req.user;
    const userId = user?.id;
    const role = user?.role;

    const course = await Course.findByPk(courseId);
    if (!course)
      return res.status(404).json({ message: "Không tìm thấy môn học" });
    if (role !== "ADMIN" && String(course.teacherId) !== String(userId)) {
      return res
        .status(403)
        .json({
          message:
            "Bạn chỉ được phép tạo bài thi cho môn học mình được phân công giảng dạy hoặc bạn không có quyền.",
        });
    }

    const exam = await Exam.create({
      courseId,
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      isLockdown: isLockdown || false,
      status: "DRAFT",
    });
    res.status(201).json(exam);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const deleteQuestionFromBank = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const teacherId = req.user?.id;
    const { id } = req.params;

    const question = await QuestionBank.findOne({ where: { id, teacherId } });
    if (!question)
      return res.status(404).json({ message: "Không tìm thấy câu hỏi" });

    await question.destroy();
    res.json({ message: "Xóa câu hỏi thành công" });
  } catch (error: any) {
    console.error("Error deleting question:", error);
    res
      .status(500)
      .json({
        message: "Lỗi khi xóa câu hỏi: " + (error.message || "Server Error"),
      });
  }
};

export const addQuestionsFromBank = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const teacherId = req.user?.id;
    const { id } = req.params;
    const { count } = req.body;

    const exam = await Exam.findByPk(id, {
      include: [
        { model: Course, as: "course" },
        { model: ExamQuestion, as: "questions" },
      ],
    });
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    // @ts-ignore
    if (exam.course?.teacherId !== teacherId)
      return res.status(403).json({ message: "Bạn không có quyền thao tác" });

    // SỬA TẠI ĐÂY: Sử dụng hàm helper đã đồng bộ với Frontend
    const maxQuestions = getMaxQuestions(exam.title);

    // @ts-ignore
    const currentQuestionCount = exam.questions ? exam.questions.length : 0;
    const remainingSlots = maxQuestions - currentQuestionCount;

    if (remainingSlots <= 0) {
      return res
        .status(400)
        .json({
          message: `Bài thi '${exam.title}' đã đạt tối đa ${maxQuestions} câu hỏi. Không thể thêm nữa.`,
        });
    }

    let bankQuestions = await QuestionBank.findAll({
      where: {
        courseId: exam.courseId,
        examType: exam.title,
      },
    });

    if (bankQuestions.length === 0) {
      return res
        .status(400)
        .json({
          message: `Không có câu hỏi nào trong ngân hàng thuộc loại '${exam.title}' cho môn học này.`,
        });
    }

    let requestedCount = count && count > 0 ? count : bankQuestions.length;
    let actualAddCount = Math.min(requestedCount, remainingSlots);

    bankQuestions = bankQuestions
      .sort(() => 0.5 - Math.random())
      .slice(0, actualAddCount);

    const examQuestionsData = bankQuestions.map((bq: any) => ({
      examId: exam.id,
      type: bq.type,
      content: bq.content,
      options: bq.options,
      correctAnswer: bq.correctAnswer,
      points: bq.points,
    }));

    await ExamQuestion.bulkCreate(examQuestionsData);

    res.json({
      message: `Đã lấy ngẫu nhiên ${bankQuestions.length} câu hỏi từ ngân hàng.`,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const uploadQuestionsToBank = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const teacherId = req.user?.id;
    const { questions, courseId } = req.body;

    const questionsToInsert = questions.map((q: any) => ({
      teacherId,
      courseId,
      type: q.type || "MULTIPLE_CHOICE",
      content: q.content,
      options: q.options || null,
      correctAnswer: q.correctAnswer || null,
      points: q.points || 1.0,
      examType: q.examType || "Tất cả",
    }));

    await QuestionBank.bulkCreate(questionsToInsert);

    res
      .status(201)
      .json({
        message: `Added ${questionsToInsert.length} questions to bank.`,
      });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const uploadQuestions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { questions } = req.body;

    const exam = await Exam.findByPk(id, {
      include: [{ model: ExamQuestion, as: "questions" }],
    });
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // SỬA TẠI ĐÂY: Sử dụng hàm helper đã đồng bộ với Frontend
    const maxQuestions = getMaxQuestions(exam.title);

    // @ts-ignore
    const currentQuestionCount = exam.questions ? exam.questions.length : 0;
    const remainingSlots = maxQuestions - currentQuestionCount;

    if (remainingSlots < questions.length) {
      if (remainingSlots <= 0) {
        return res
          .status(400)
          .json({
            message: `Bài thi '${exam.title}' đã đạt tối đa ${maxQuestions} câu hỏi. Không thể thêm nữa.`,
          });
      } else {
        return res
          .status(400)
          .json({
            message: `Bài thi '${exam.title}' chỉ còn phép thêm tối đa ${remainingSlots} câu hỏi. Bạn đang cố thêm ${questions.length} câu.`,
          });
      }
    }

    const questionsToInsert = questions.map((q: any) => ({
      examId: id,
      type: q.type,
      content: q.content,
      options: q.options || null,
      correctAnswer: q.correctAnswer || null,
      points: q.points || 1.0,
    }));

    await ExamQuestion.bulkCreate(questionsToInsert);
    res.json({ message: "Thêm câu hỏi thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const publishExam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const exam = await Exam.findByPk(id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    exam.status = status;
    await exam.save();
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const getStudentExams = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const studentId = req.user?.id;
    const user = await User.findByPk(studentId);
    if (!user) return res.status(404).json({ message: "Lỗi" });

    let courseIds: number[] = [];

    const enrolledCourses = (await Enrollment.findAll({
      where: { studentId: user.id },
    })) as any[];
    courseIds = [...courseIds, ...enrolledCourses.map((e) => e.courseId)];

    courseIds = Array.from(new Set(courseIds));

    let courseFilter: any = {};
    if (courseIds.length > 0) {
      courseFilter = { id: courseIds };
    } else {
      courseFilter = { id: [] };
    }

    const exams = await Exam.findAll({
      where: { status: ["PUBLISHED", "COMPLETED"] },
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
    res.status(500).json({ message: "Server Error" });
  }
};

export const getExamForStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const studentId = req.user?.id;
    const user = await User.findByPk(studentId);

    const exam = await Exam.findByPk(id, {
      include: [
        { model: Course, as: "course" },
        {
          model: ExamQuestion,
          as: "questions",
          attributes: ["id", "type", "content", "options", "points"],
        },
      ],
    });
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    let isPermitted = false;
    const enrollment = await Enrollment.findOne({
      where: { studentId: user?.id, courseId: exam.courseId },
    });
    if (enrollment) isPermitted = true;

    if (!isPermitted) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền truy cập bài thi này" });
    }

    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const getExamResultForStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const studentId = req.user?.id;

    const submission = await ExamSubmission.findOne({
      where: { examId: id, studentId },
    });

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    if (submission.status !== "GRADED") {
      return res.status(403).json({ message: "Kết quả chưa được công bố" });
    }

    const exam = await Exam.findByPk(id, {
      include: [
        { model: Course, as: "course" },
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

    res.json({ exam, submission });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const submitExam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { answers, cheatingAttempts = 0 } = req.body;
    // @ts-ignore
    const studentId = req.user?.id;

    const exam = await Exam.findByPk(id, {
      include: [
        { model: Course, as: "course" },
        { model: ExamQuestion, as: "questions" },
      ],
    });

    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const user = await User.findByPk(studentId);
    let isPermitted = false;
    const enrollment = await Enrollment.findOne({
      where: { studentId: user?.id, courseId: exam.courseId },
    });
    if (enrollment) isPermitted = true;

    if (!isPermitted) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền truy cập bài thi này" });
    }

    // @ts-ignore
    const questions: any[] = exam.questions;

    let autoScore = 0;
    let hasEssay = false;

    const totalPointsConfigured = questions.reduce(
      (sum, q) => sum + (q.points || 0),
      0,
    );
    const pointScale =
      totalPointsConfigured > 0 ? 100 / totalPointsConfigured : 1;

    questions.forEach((q) => {
      if (q.type === "MULTIPLE_CHOICE") {
        const studentAnswer = answers[q.id];
        if (studentAnswer && studentAnswer === q.correctAnswer) {
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
      examId: parseInt(id),
      studentId,
      answers,
      cheatingAttempts,
      score: hasEssay ? null : parseFloat(finalScore.toFixed(2)),
      status: hasEssay ? "PENDING" : "GRADED",
      submittedAt: new Date(),
    });

    res.status(201).json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

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

    res.json({ submissions, questions: exam ? (exam as any).questions : [] });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const gradeSubmission = async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { score, gradingDetails } = req.body;

    const submission = await ExamSubmission.findByPk(submissionId);
    if (!submission) {
      return res.status(404).json({ message: "Not found" });
    }

    submission.score = score;

    if (gradingDetails) {
      submission.gradingDetails = gradingDetails;
    }

    submission.status = "GRADED";
    await submission.save();

    const exam = await Exam.findByPk(submission.examId);

    if (exam) {
      let grade = await Grade.findOne({
        where: {
          studentId: submission.studentId,
          courseId: exam.courseId,
        },
      });

      if (!grade) {
        grade = await Grade.create({
          studentId: submission.studentId,
          courseId: exam.courseId,
          semester: "HK1",
          processScore: 0,
          midterm: 0,
          final: 0,
        });
      }

      // SỬA TẠI ĐÂY: Đồng bộ chuỗi với Frontend để cập nhật điểm chính xác vào bảng cột Điểm thành phần
      if (exam.title === "Kiểm tra 15 phút") {
        grade.processScore = Number(score);
      } else if (exam.title === "Kiểm tra giữa kỳ") {
        grade.midterm = Number(score);
      } else if (exam.title === "Thi cuối kỳ") {
        grade.final = Number(score);
      }

      await grade.save();
    }

    res.json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
