import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Semester from './Semester';
import Room from './Room';
import Major from './Major';
import Class from './Class';

interface CourseAttributes {
  id: number;
  name: string;
  code: string;
  teacherId: number;
  roomId?: number;
  schedule: string;
  type: 'Standard' | 'Advanced';
  majorId?: number;
  classId?: number;
  credits?: number;
  semesterId?: number;
  totalPeriods?: number;
  weeks?: number;
  startDate?: Date; // Tích hợp từ file 2
  endDate?: Date;   // Tích hợp từ file 2
}

interface CourseCreationAttributes extends Optional<CourseAttributes, 'id' | 'totalPeriods' | 'weeks' | 'startDate' | 'endDate'> {}

class Course extends Model<CourseAttributes, CourseCreationAttributes> implements CourseAttributes {
  public id!: number;
  public name!: string;
  public code!: string;
  public teacherId!: number;
  public roomId!: number;
  public schedule!: string;
  public type!: 'Standard' | 'Advanced';
  public majorId!: number;
  public classId!: number;
  public credits!: number;
  public semesterId!: number;
  public totalPeriods!: number;
  public weeks!: number;
  public startDate!: Date; // Tích hợp từ file 2
 
  // một khóa học có thể óc nhiều hs và tương tự 
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Course.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    roomId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Room,
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    schedule: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('Standard', 'Advanced'),
      defaultValue: 'Standard',
    },
    majorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Major,
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    classId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Class,
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    credits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
    },
    semesterId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    totalPeriods: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 45,
    },
    weeks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'courses', // Bạn có thể đổi thành 'Courses' nếu cấu hình Database của bạn phân biệt chữ hoa chữ thường
    hooks: {
      afterCreate: async (course, options) => {
        const Notification = (await import('./Notification')).default;
        await Notification.create({
          message: `Môn học mới được tạo: ${course.name}`,
          type: 'SYSTEM',
          targetRole: 'ADMIN',
          isRead: false
        });
        await Notification.create({
          message: `Bạn được phân công dạy môn: ${course.name}`,
          type: 'CLASS_UPDATE',
          targetRole: 'TEACHER',
          targetUserId: course.teacherId,
          isRead: false
        });
      },
      afterUpdate: async (course, options) => {
        const Notification = (await import('./Notification')).default;
        await Notification.create({
          message: `Môn học được cập nhật: ${course.name}`,
          type: 'SYSTEM',
          targetRole: 'ADMIN',
          isRead: false
        });
        await Notification.create({
          message: `Thông tin môn học thay đổi: ${course.name}`,
          type: 'CLASS_UPDATE',
          targetRole: 'TEACHER',
          targetUserId: course.teacherId,
          isRead: false
        });
        
        // Trộn logic tạo thông báo cho sinh viên từ cả 2 file để tương thích tuyệt đối
        await Notification.create({
          message: `Lịch học môn ${course.name} có thay đổi.`,
          type: 'CLASS_UPDATE',
          targetRole: 'STUDENT',
          classId: course.id,       // Giữ nguyên thuộc tính của file 1
          isRead: false
        });
      },
      afterDestroy: async (course, options) => {
        const Notification = (await import('./Notification')).default;
        await Notification.create({
          message: `Môn học đã bị xóa: ${course.name}`,
          type: 'SYSTEM',
          targetRole: 'ADMIN',
          isRead: false
        });
        await Notification.create({
          message: `Môn học của bạn đã bị hủy: ${course.name}`,
          type: 'CLASS_UPDATE',
          targetRole: 'TEACHER',
          targetUserId: course.teacherId,
          isRead: false
        });
      }
    }
  }
);

// Define associations
Course.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });
User.hasMany(Course, { foreignKey: 'teacherId', as: 'courses' });
Course.belongsTo(Semester, { foreignKey: 'semesterId', as: 'semester' });
Semester.hasMany(Course, { foreignKey: 'semesterId', as: 'courses' });
Course.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });
Room.hasMany(Course, { foreignKey: 'roomId', as: 'courses' });
Course.belongsTo(Major, { foreignKey: 'majorId', as: 'major' });
Major.hasMany(Course, { foreignKey: 'majorId', as: 'courses' });
Course.belongsTo(Class, { foreignKey: 'classId', as: 'targetClass' });
Class.hasMany(Course, { foreignKey: 'classId', as: 'courses' });

export default Course;