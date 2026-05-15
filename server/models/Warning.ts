import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface WarningAttributes {
  id: number;
  studentId: number;
  type: 'ACADEMIC_POOR' | 'LOW_CREDIT' | 'VIOLATION';
  severity: 'NOTICE' | 'WARNING' | 'SUSPENSION';
  reason: string;
  status: 'ACTIVE' | 'RESOLVED';
}

interface WarningCreationAttributes extends Optional<WarningAttributes, 'id' | 'status'> {}

class Warning extends Model<WarningAttributes, WarningCreationAttributes> implements WarningAttributes {
  public id!: number;
  public studentId!: number;
  public type!: 'ACADEMIC_POOR' | 'LOW_CREDIT' | 'VIOLATION';
  public severity!: 'NOTICE' | 'WARNING' | 'SUSPENSION';
  public reason!: string;
  public status!: 'ACTIVE' | 'RESOLVED';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Warning.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: User, key: 'id' },
      onDelete: 'CASCADE',
    },
    type: {
      type: DataTypes.ENUM('ACADEMIC_POOR', 'LOW_CREDIT', 'VIOLATION'),
      allowNull: false,
    },
    severity: {
      type: DataTypes.ENUM('NOTICE', 'WARNING', 'SUSPENSION'),
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'RESOLVED'),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
  },
  {
    sequelize,
    tableName: 'warnings',
  }
);

User.hasMany(Warning, { foreignKey: 'studentId', as: 'warnings' });
Warning.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

export default Warning;
