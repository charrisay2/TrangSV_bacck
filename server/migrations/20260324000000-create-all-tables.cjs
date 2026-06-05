"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. departments
    await queryInterface.createTable("departments", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },

      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 2. rooms
    await queryInterface.createTable("rooms", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },

      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      building: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      status: {
        type: Sequelize.ENUM("ACTIVE", "CLOSED"),
        allowNull: false,
        defaultValue: "ACTIVE",
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 3. semesters
    await queryInterface.createTable("semesters", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },

      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      year: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      startDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      endDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 4. majors
    await queryInterface.createTable("majors", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },

      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      departmentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "departments",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 5. classes
    await queryInterface.createTable("classes", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },

      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      cohort: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      majorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "majors",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 6. subjects
    await queryInterface.createTable("subjects", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },

      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      credits: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 3,
      },

      majorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "majors",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      semesterNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },

      totalPeriods: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 45,
      },

      weeks: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 7. curriculums
    await queryInterface.createTable("curriculums", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },

      majorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "majors",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      subjectId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "subjects",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      semesterNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 8. users
    await queryInterface.createTable("users", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },

      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      address: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      joinDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      role: {
        type: Sequelize.ENUM("ADMIN", "TEACHER", "STUDENT"),
        allowNull: false,
        defaultValue: "STUDENT",
      },

      status: {
        type: Sequelize.ENUM("ACTIVE", "RESERVED", "GRADUATED"),
        allowNull: false,
        defaultValue: "ACTIVE",
      },

      avatar: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      classId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "classes",
          key: "id",
        },
        onDelete: "SET NULL",
      },

      departmentId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "departments",
          key: "id",
        },
        onDelete: "SET NULL",
      },

      majorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "majors",
          key: "id",
        },
        onDelete: "SET NULL",
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 9. courses
    await queryInterface.createTable("courses", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },

      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      code: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      teacherId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      roomId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "rooms",
          key: "id",
        },
        onDelete: "SET NULL",
      },

      schedule: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      type: {
        type: Sequelize.ENUM("Standard", "Advanced"),
        defaultValue: "Standard",
      },

      majorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "majors",
          key: "id",
        },
        onDelete: "SET NULL",
      },

      classId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "classes",
          key: "id",
        },
        onDelete: "SET NULL",
      },

      credits: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 3,
      },

      semesterId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      totalPeriods: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 45,
      },

      weeks: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // add courseId vào users sau khi courses tồn tại
    await queryInterface.addColumn("users", "courseId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "courses",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // 10. attendances
    await queryInterface.createTable("attendances", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },

      studentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      courseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "courses",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      date: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      status: {
        type: Sequelize.ENUM("Present", "Absent", "Late"),
        allowNull: false,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 11. enrollments
    await queryInterface.createTable("enrollments", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },

      courseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "courses",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      studentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      status: {
        type: Sequelize.ENUM("Enrolled", "Dropped", "Completed"),
        defaultValue: "Enrolled",
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 12. notifications
    await queryInterface.createTable("notifications", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      message: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      type: {
        type: Sequelize.ENUM("SYSTEM", "ATTENDANCE", "COURSE"),
        allowNull: false,
        defaultValue: "SYSTEM",
      },

      targetRole: {
        type: Sequelize.ENUM("ADMIN", "TEACHER", "STUDENT"),
        allowNull: false,
      },

      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("notifications");
    await queryInterface.dropTable("enrollments");
    await queryInterface.dropTable("attendances");

    await queryInterface.removeColumn("users", "courseId");

    await queryInterface.dropTable("courses");
    await queryInterface.dropTable("users");
    await queryInterface.dropTable("curriculums");
    await queryInterface.dropTable("subjects");
    await queryInterface.dropTable("classes");
    await queryInterface.dropTable("majors");
    await queryInterface.dropTable("semesters");
    await queryInterface.dropTable("rooms");
    await queryInterface.dropTable("departments");
  },
};