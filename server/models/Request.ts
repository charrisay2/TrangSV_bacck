import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Class from './Class';

interface RequestAttributes {
  id: number;
  type: 'STUDENT_LEAVE' | 'TEACHER_SUBSTITUTE';
  requesterId: number;
  targetClassId?: number | null;
  substituteTeacherId?: number | null;
  reason: string;
  attachmentUrl?: string | null;
  reviewNote?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface RequestCreationAttributes
  extends Optional<
    RequestAttributes,
    | 'id'
    | 'status'
    | 'targetClassId'
    | 'substituteTeacherId'
    | 'attachmentUrl'
    | 'reviewNote'
  > {}

class Request
  extends Model<RequestAttributes, RequestCreationAttributes>
  implements RequestAttributes
{
  public id!: number;

  public type!: 'STUDENT_LEAVE' | 'TEACHER_SUBSTITUTE';

  public requesterId!: number;

  public targetClassId!: number | null;

  public substituteTeacherId!: number | null;

  public reason!: string;

  public attachmentUrl!: string | null;

  public reviewNote!: string | null;

  public status!: 'PENDING' | 'APPROVED' | 'REJECTED';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Request.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    type: {
      type: DataTypes.ENUM(
        'STUDENT_LEAVE',
        'TEACHER_SUBSTITUTE'
      ),
      allowNull: false,
    },

    requesterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },

    targetClassId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Class,
        key: 'id',
      },
      onDelete: 'SET NULL',
    },

    substituteTeacherId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'SET NULL',
    },

    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    attachmentUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    reviewNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },

    status: {
      type: DataTypes.ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED'
      ),
      allowNull: false,
      defaultValue: 'PENDING',
    },
  },
  {
    sequelize,
    modelName: 'Request',
    tableName: 'requests',
    timestamps: true,
  }
);

User.hasMany(Request, {
  foreignKey: 'requesterId',
  as: 'requests',
});

Request.belongsTo(User, {
  foreignKey: 'requesterId',
  as: 'requester',
});

Class.hasMany(Request, {
  foreignKey: 'targetClassId',
  as: 'leaveRequests',
});

Request.belongsTo(Class, {
  foreignKey: 'targetClassId',
  as: 'targetClass',
});

User.hasMany(Request, {
  foreignKey: 'substituteTeacherId',
  as: 'substituteRequests',
});

Request.belongsTo(User, {
  foreignKey: 'substituteTeacherId',
  as: 'substituteTeacher',
});

export default Request;