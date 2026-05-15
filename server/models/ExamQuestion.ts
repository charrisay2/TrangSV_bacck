import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Exam from './Exam';

interface ExamQuestionAttributes {
  id: number;
  examId: number;
  type: 'MULTIPLE_CHOICE' | 'ESSAY';
  content: string;
  options?: any; // JSON for choices
  correctAnswer?: string;
  points: number;
}

interface ExamQuestionCreationAttributes extends Optional<ExamQuestionAttributes, 'id' | 'points'> {}

class ExamQuestion extends Model<ExamQuestionAttributes, ExamQuestionCreationAttributes> implements ExamQuestionAttributes {
  public id!: number;
  public examId!: number;
  public type!: 'MULTIPLE_CHOICE' | 'ESSAY';
  public content!: string;
  public options!: any;
  public correctAnswer!: string;
  public points!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ExamQuestion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    examId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Exam, key: 'id' },
      onDelete: 'CASCADE',
    },
    type: {
      type: DataTypes.ENUM('MULTIPLE_CHOICE', 'ESSAY'),
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
      type: DataTypes.STRING,
      allowNull: true,
    },
    points: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.0,
    },
  },
  {
    sequelize,
    tableName: 'exam_questions',
  }
);

Exam.hasMany(ExamQuestion, { foreignKey: 'examId', as: 'questions' });
ExamQuestion.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' });

export default ExamQuestion;
