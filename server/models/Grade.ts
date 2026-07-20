import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Course from './Course';
export interface GradeAttributes {
  id: number;
  studentId: number;
  courseId: number;
  processScore: number;
  midterm: number;
  final: number;
  semester: string;
}

export interface GradeCreationAttributes extends Omit<GradeAttributes, 'id'> {}

export class Grade extends Model<GradeAttributes, GradeCreationAttributes> implements GradeAttributes {
  public id!: number;
  public studentId!: number;
  public courseId!: number;
  public processScore!: number;
  public midterm!: number;
  public final!: number;
  public semester!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Grade.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    processScore: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    midterm: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    final: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    semester: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Grade',
    tableName: 'Grades',
  }
);



Grade.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
User.hasMany(Grade, { foreignKey: 'studentId', as: 'grades' });

Grade.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
Course.hasMany(Grade, { foreignKey: 'courseId', as: 'grades' });

export default Grade;
