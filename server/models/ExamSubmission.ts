import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Exam from "./Exam";
import User from "./User";

interface ExamSubmissionAttributes {
  id: number;

  examId: number;
  studentId: number;

  answers: any;

  score: number | null;

  cheatingAttempts: number;

  status: "PENDING" | "GRADED";

  submittedAt: Date;
}

interface ExamSubmissionCreationAttributes
  extends Optional<
    ExamSubmissionAttributes,
    "id" | "score" | "cheatingAttempts" | "status" | "submittedAt"
  > {}
// cập nhật lại cái dữ liệu lên class diagram 
class ExamSubmission
  extends Model<
    ExamSubmissionAttributes,
    ExamSubmissionCreationAttributes
  >
  implements ExamSubmissionAttributes
{
  public id!: number;

  public examId!: number;
  public studentId!: number;

  public answers!: any;

  public score!: number | null;

  public cheatingAttempts!: number;

  public status!: "PENDING" | "GRADED";

  public submittedAt!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ExamSubmission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    examId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    answers: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },

    score: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
    },

    cheatingAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    status: {
      type: DataTypes.ENUM("PENDING", "GRADED"),
      allowNull: false,
      defaultValue: "PENDING",
    },

    submittedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "exam_submissions",
  }
);

// RELATIONS
Exam.hasMany(ExamSubmission, {
  foreignKey: "examId",
  as: "submissions",
});

ExamSubmission.belongsTo(Exam, {
  foreignKey: "examId",
  as: "exam",
});

User.hasMany(ExamSubmission, {
  foreignKey: "studentId",
  as: "examSubmissions",
});

ExamSubmission.belongsTo(User, {
  foreignKey: "studentId",
  as: "student",
});

export default ExamSubmission;