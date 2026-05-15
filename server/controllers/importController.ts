import { Request, Response } from 'express';
import User from '../models/User';
import Course from '../models/Course';
import Curriculum from '../models/Curriculum';
import bcrypt from 'bcryptjs';

export const importUsers = async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data)) return res.status(400).json({ message: 'Invalid data format' });

    let importedCount = 0;
    for (const item of data) {
      if (!item.username || !item.password || !item.role) continue;
      
      const existing = await User.findOne({ where: { username: item.username } });
      if (existing) continue; // Skip duplicates for simplicity

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(item.password.toString(), salt);

      await User.create({
        username: item.username,
        password: hashedPassword,
        name: item.name || 'Unknown',
        email: item.email || `${item.username}@vaa.edu.vn`,
        role: item.role as any,
        majorId: item.majorId || null,
      });
      importedCount++;
    }

    res.json({ message: `Imported ${importedCount} users successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during import' });
  }
};

export const importCourses = async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data)) return res.status(400).json({ message: 'Invalid data format' });

    let importedCount = 0;
    for (const item of data) {
      if (!item.name || !item.code || !item.teacherId) continue;
      
      const existing = await Course.findOne({ where: { code: item.code } });
      if (existing) continue;

      await Course.create({
        name: item.name,
        code: item.code,
        teacherId: item.teacherId,
        credits: item.credits || 3,
        majorId: item.majorId || null,
        schedule: item.schedule || 'Thứ Hai (07:00 - 09:30)',
        type: item.type || 'Standard'
      });
      importedCount++;
    }

    res.json({ message: `Imported ${importedCount} courses successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during import' });
  }
};

export const importCurriculum = async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data)) return res.status(400).json({ message: 'Invalid data format' });

    let importedCount = 0;
    for (const item of data) {
      if (!item.majorId || !item.subjectId || !item.semester) continue;

      await Curriculum.create({
        majorId: item.majorId,
        subjectId: item.subjectId,
        semesterNumber: item.semester,
      });
      importedCount++;
    }

    res.json({ message: `Imported ${importedCount} curriculum rows successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during import' });
  }
};
