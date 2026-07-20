import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Course from './Course';

export interface AttendanceAttributes {
  id: number;
  studentId: number;
  courseId: number;
  date: string;
  status: 'Present' | 'Absent' | 'Late';
  latitude?: number;
  longitude?: number;
  hasLeftClass?: boolean;
  leftClassAt?: Date;
}

export interface AttendanceCreationAttributes extends Omit<AttendanceAttributes, 'id'> {}

export class Attendance extends Model<AttendanceAttributes, AttendanceCreationAttributes> implements AttendanceAttributes {
  public id!: number;
  public studentId!: number;
  public courseId!: number;
  public date!: string;
  public status!: 'Present' | 'Absent' | 'Late';
  public latitude?: number;
  public longitude?: number;
  public hasLeftClass?: boolean;
  public leftClassAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Attendance.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Course,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Present', 'Absent', 'Late'),
      allowNull: false,
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    hasLeftClass: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    leftClassAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'Attendances',
  }
);

Attendance.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
Course.hasMany(Attendance, { foreignKey: 'courseId', as: 'attendances' });

Attendance.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
User.hasMany(Attendance, { foreignKey: 'studentId', as: 'attendances' });

export default Attendance;
