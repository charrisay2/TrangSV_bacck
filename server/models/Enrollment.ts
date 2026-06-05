// Enrollment.ts

import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

import User from "./User";
import Course from "./Course";

interface EnrollmentAttributes {
  id: number;
  courseId: number;
  studentId: number;
  status: "Enrolled" | "Dropped" | "Completed";
}

interface EnrollmentCreationAttributes
  extends Optional<EnrollmentAttributes, "id" | "status"> {}

class Enrollment
  extends Model<EnrollmentAttributes, EnrollmentCreationAttributes>
  implements EnrollmentAttributes
{
  public id!: number;
  public courseId!: number;
  public studentId!: number;
  public status!: "Enrolled" | "Dropped" | "Completed";

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Enrollment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "courses",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    status: {
      type: DataTypes.ENUM(
        "Enrolled",
        "Dropped",
        "Completed",
      ),
      defaultValue: "Enrolled",
    },
  },
  {
    sequelize,
    tableName: "enrollments",
  },
);

// =========================
// RELATIONSHIPS
// =========================

User.belongsToMany(Course, {
  through: Enrollment,
  as: "enrolledCourses",
  foreignKey: "studentId",
});

Course.belongsToMany(User, {
  through: Enrollment,
  as: "enrolledStudents",
  foreignKey: "courseId",
});

Enrollment.belongsTo(User, {
  foreignKey: "studentId",
  as: "student",
});

Enrollment.belongsTo(Course, {
  foreignKey: "courseId",
  as: "course",
});

User.hasMany(Enrollment, {
  foreignKey: "studentId",
  as: "enrollments",
});

Course.hasMany(Enrollment, {
  foreignKey: "courseId",
  as: "enrollments",
});

export default Enrollment;