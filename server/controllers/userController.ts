import { Request, Response } from 'express';
import User from '../models/User';
import Class from '../models/Class';
import Department from '../models/Department';
import Major from '../models/Major';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [
        { model: Class, as: 'studentClass' },
        { model: Department, as: 'department' },
        { model: Major, as: 'major' }
      ]
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a user
// @route   POST /api/users
// @access  Private/Admin
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, phone, address, joinDate, role, avatar, classId, departmentId, majorId, status } = req.body;
    let { username, email, password } = req.body;

    if (!username) {
      if (role === 'STUDENT') {
        const studentClass = await Class.findByPk(classId);
        let yearPrefix = new Date().getFullYear().toString().slice(-2);
        if (studentClass && studentClass.cohort) {
          const match = studentClass.cohort.match(/\d+$/);
          if (match) {
            yearPrefix = match[0].slice(-2);
          }
        }
        
        const lastUser = await User.findOne({
          where: { role: 'STUDENT', username: { [Op.like]: `${yearPrefix}%` } },
          order: [['username', 'DESC']]
        });
        
        let counter = 1;
        if (lastUser && lastUser.username) {
            const lastCounter = parseInt(lastUser.username.slice(2));
            if (!isNaN(lastCounter)) {
                counter = lastCounter + 1;
            }
        }
        username = `${yearPrefix}${counter.toString().padStart(4, '0')}`;
      } else if (role === 'TEACHER') {
        const lastTeacher = await User.findOne({
          where: { role: 'TEACHER', username: { [Op.like]: `GV%` } },
          order: [['username', 'DESC']]
        });
        let counter = 1;
        if (lastTeacher && lastTeacher.username) {
          const lastCounter = parseInt(lastTeacher.username.slice(2));
          if (!isNaN(lastCounter)) {
            counter = lastCounter + 1;
          }
        }
        username = `GV${counter.toString().padStart(4, '0')}`;
      } else {
        const lastAdmin = await User.findOne({
            where: { role: 'ADMIN', username: { [Op.like]: `AD%` } },
            order: [['username', 'DESC']]
          });
          let counter = 1;
          if (lastAdmin && lastAdmin.username) {
            const lastCounter = parseInt(lastAdmin.username.slice(2));
            if (!isNaN(lastCounter)) {
              counter = lastCounter + 1;
            }
          }
          username = `AD${counter.toString().padStart(4, '0')}`;
      }
    }

    if (!email) {
      email = `${username}@uni.edu.vn`;
    }
    
    if (!password) {
      password = '123';
    }

    const userExists = await User.findOne({ where: { username } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const emailExists = await User.findOne({ where: { email } });
    if (emailExists) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const user = await User.create({
      username,
      password,
      name,
      email,
      phone,
      address,
      joinDate,
      role,
      avatar,
      classId,
      departmentId,
      majorId,
      status: status || 'ACTIVE',
  
    });

    const userWithAssociations = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Class, as: 'studentClass' },
        { model: Department, as: 'department' },
        { model: Major, as: 'major' }
      ]
    });

    res.status(201).json(userWithAssociations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (user) {
      // Do not update name, username, joinDate, role as per requirements
      // user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
      user.address = req.body.address !== undefined ? req.body.address : user.address;
      // user.joinDate = req.body.joinDate !== undefined ? req.body.joinDate : user.joinDate;
      // user.role = req.body.role || user.role;
      user.avatar = req.body.avatar || user.avatar;
      user.classId = req.body.classId !== undefined ? req.body.classId : user.classId;
      user.departmentId = req.body.departmentId !== undefined ? req.body.departmentId : user.departmentId;
      user.majorId = req.body.majorId !== undefined ? req.body.majorId : user.majorId;
      user.status = req.body.status || user.status;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      
      const userWithAssociations = await User.findByPk(updatedUser.id, {
        attributes: { exclude: ['password'] },
        include: [
          { model: Class, as: 'studentClass' },
          { model: Department, as: 'department' },
          { model: Major, as: 'major' }
        ]
      });

      res.json(userWithAssociations);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req: Request, res: Response) => {
  try {
    console.log(`Attempting to delete user with ID: ${req.params.id}`);
    const user = await User.findByPk(req.params.id);

    if (user) {
      await user.destroy();
      console.log(`User ${req.params.id} deleted successfully`);
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
