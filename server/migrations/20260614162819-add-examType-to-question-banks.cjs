'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check if table exists first
    const tables = await queryInterface.showAllTables();
    if (tables.includes('question_banks')) {
      await queryInterface.addColumn('question_banks', 'examType', { 
        type: Sequelize.ENUM('Tất cả', 'Kiểm tra 15 phút', 'Kiểm tra giữa kỳ', 'Thi cuối kỳ'), 
        allowNull: true,
        defaultValue: 'Tất cả'
      });
    } else {
      await queryInterface.createTable('question_banks', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        courseId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Courses', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        teacherId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        type: {
          type: Sequelize.ENUM('MULTIPLE_CHOICE', 'ESSAY'),
          allowNull: false,
        },
        content: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        options: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        correctAnswer: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        points: {
          type: Sequelize.FLOAT,
          allowNull: false,
          defaultValue: 1.0
        },
        examType: {
          type: Sequelize.ENUM('Tất cả', 'Kiểm tra 15 phút', 'Kiểm tra giữa kỳ', 'Thi cuối kỳ'),
          allowNull: true,
          defaultValue: 'Tất cả'
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
        }
      });
    }
  },

  async down (queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('question_banks')) {
      await queryInterface.dropTable('question_banks');
    }
  }
};
