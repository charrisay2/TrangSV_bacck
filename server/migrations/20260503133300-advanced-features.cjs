"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("requests", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },

      type: {
        type: Sequelize.ENUM("STUDENT_LEAVE", "TEACHER_SUBSTITUTE"),
        allowNull: false,
      },

      requesterId: {
        type: Sequelize.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      targetClassId: {
        type: Sequelize.INTEGER,
        references: { model: "Classes", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      substituteTeacherId: {
        type: Sequelize.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      reason: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      attachmentUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      reviewNote: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      status: {
        type: Sequelize.ENUM("PENDING", "APPROVED", "REJECTED"),
        defaultValue: "PENDING",
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.createTable("warnings", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      studentId: {
        type: Sequelize.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      type: {
        type: Sequelize.ENUM("ACADEMIC_POOR", "LOW_CREDIT", "VIOLATION"),
        allowNull: false,
      },
      severity: {
        type: Sequelize.ENUM("NOTICE", "WARNING", "SUSPENSION"),
        allowNull: false,
      },
      reason: { type: Sequelize.TEXT, allowNull: false },
      status: {
        type: Sequelize.ENUM("ACTIVE", "RESOLVED"),
        defaultValue: "ACTIVE",
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("exams", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      courseId: {
        type: Sequelize.INTEGER,
        references: { model: "Courses", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      title: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      startTime: { type: Sequelize.DATE, allowNull: false },
      endTime: { type: Sequelize.DATE, allowNull: false },
      isLockdown: { type: Sequelize.BOOLEAN, defaultValue: false },
      status: {
        type: Sequelize.ENUM("DRAFT", "PUBLISHED", "COMPLETED"),
        defaultValue: "DRAFT",
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("exam_questions", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      examId: {
        type: Sequelize.INTEGER,
        references: { model: "exams", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      type: {
        type: Sequelize.ENUM("MULTIPLE_CHOICE", "ESSAY"),
        allowNull: false,
      },
      content: { type: Sequelize.TEXT, allowNull: false },
      options: { type: Sequelize.JSON, allowNull: true },
      correctAnswer: { type: Sequelize.STRING, allowNull: true },
      points: { type: Sequelize.FLOAT, defaultValue: 1.0 },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("exam_submissions", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },

      examId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "exams", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      studentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      answers: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },

      gradingDetails: {
        type: Sequelize.JSON,
        allowNull: true,
      },

      score: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },

      cheatingAttempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      status: {
        type: Sequelize.ENUM("PENDING", "GRADED"),
        allowNull: false,
        defaultValue: "PENDING",
      },

      submittedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
   
    await queryInterface.createTable("face_id_logs", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      studentId: {
        type: Sequelize.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      courseId: {
        type: Sequelize.INTEGER,
        references: { model: "Courses", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      timestamp: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      confidenceScore: { type: Sequelize.FLOAT, allowNull: false },
      snapshotUrl: { type: Sequelize.STRING, allowNull: false },
      status: {
        type: Sequelize.ENUM("RETAINED", "PURGED"),
        defaultValue: "RETAINED",
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("question_banks");
    await queryInterface.dropTable("face_id_logs");
    await queryInterface.dropTable("exam_submissions");
    await queryInterface.dropTable("exam_questions");
    await queryInterface.dropTable("exams");
    await queryInterface.dropTable("warnings");
    await queryInterface.dropTable("requests");
  },
};
