import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Course from "./Course";
import User from "./User";

interface QuestionBankAttributes {
  id: number;
  courseId: number;
  teacherId: number;
  type: "MULTIPLE_CHOICE" | "ESSAY";
  content: string;
  options?: any;
  correctAnswer?: string;
  points: number;
  examType?: string;
}

interface QuestionBankCreationAttributes extends Optional<
  QuestionBankAttributes,
  "id"
> {}

class QuestionBank
  extends Model<QuestionBankAttributes, QuestionBankCreationAttributes>
  implements QuestionBankAttributes
{
  public id!: number;
  public courseId!: number;
  public teacherId!: number;
  public type!: "MULTIPLE_CHOICE" | "ESSAY";
  public content!: string;
  public options!: any;
  public correctAnswer!: string;
  public points!: number;
  public examType!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

QuestionBank.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("MULTIPLE_CHOICE", "ESSAY"),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    options: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    correctAnswer: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    points: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    examType: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "Tất cả",
    },
  },
  {
    sequelize,
    tableName: "question_banks",
  },
);

Course.hasMany(QuestionBank, { foreignKey: "courseId", as: "questions" });
QuestionBank.belongsTo(Course, { foreignKey: "courseId", as: "course" });
User.hasMany(QuestionBank, { foreignKey: "teacherId", as: "bankQuestions" });
QuestionBank.belongsTo(User, { foreignKey: "teacherId", as: "teacher" });

export default QuestionBank;
