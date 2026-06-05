import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

import Exam from './Exam';
import User from './User';

interface ExamSubmissionAttributes {
  id: number;
  examId: number;
  studentId: number;
  answers: any;
  gradingDetails?: any | null;
  score?: number | null;
  cheatingAttempts?: number;
  status: 'PENDING' | 'GRADED';
  submittedAt: Date;
}

interface ExamSubmissionCreationAttributes
  extends Optional<
    ExamSubmissionAttributes,
    | 'id'
    | 'gradingDetails'
    | 'score'
    | 'cheatingAttempts'
    | 'status'
    | 'submittedAt'
  > {}

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

  public gradingDetails!: any | null;

  public score!: number | null;

  public cheatingAttempts!: number;

  public status!: 'PENDING' | 'GRADED';

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
      references: {
        model: 'exams',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },

    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },

    answers: {
      type: DataTypes.JSON,
      allowNull: false,
    },

    gradingDetails: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
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
      type: DataTypes.ENUM(
        'PENDING',
        'GRADED'
      ),
      allowNull: false,
      defaultValue: 'PENDING',
    },

    submittedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'ExamSubmission',

    tableName: 'exam_submissions',

    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ['examId', 'studentId'],
      },
    ],
  }
);

Exam.hasMany(ExamSubmission, {
  foreignKey: 'examId',
  as: 'submissions',
});

ExamSubmission.belongsTo(Exam, {
  foreignKey: 'examId',
  as: 'exam',
});

User.hasMany(ExamSubmission, {
  foreignKey: 'studentId',
  as: 'examSubmissions',
});

ExamSubmission.belongsTo(User, {
  foreignKey: 'studentId',
  as: 'student',
});

export default ExamSubmission;