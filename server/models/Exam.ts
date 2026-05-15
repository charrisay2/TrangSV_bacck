import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Course from "./Course";

interface ExamAttributes {
  id: number;
  courseId: number;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  isLockdown: boolean;
  status: "DRAFT" | "PUBLISHED" | "COMPLETED";
}

interface ExamCreationAttributes extends Optional<
  ExamAttributes,
  "id" | "status" | "isLockdown"
> {}

class Exam
  extends Model<ExamAttributes, ExamCreationAttributes>
  implements ExamAttributes
{
  public id!: number;
  public courseId!: number;
  public title!: string;
  public description!: string;
  public startTime!: Date;
  public endTime!: Date;
  public isLockdown!: boolean;
  public status!: "DRAFT" | "PUBLISHED" | "COMPLETED";

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Exam.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Course, key: "id" },
      onDelete: "CASCADE",
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isLockdown: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM("DRAFT", "PUBLISHED", "COMPLETED"),
      allowNull: false,
      defaultValue: "DRAFT",
    },
  },
  {
    sequelize,
    tableName: "exams",
  },
);

Course.hasMany(Exam, { foreignKey: "courseId", as: "exams" });
Exam.belongsTo(Course, { foreignKey: "courseId", as: "course" });

export default Exam;
