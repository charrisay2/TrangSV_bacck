import express from "express";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController";
import { protect, authorize } from "../middleware/authMiddleware";

const router = express.Router();

router
  .route("/")
  .get(protect, authorize("ADMIN", "TEACHER", "STUDENT"), getUsers)
  .post(protect, authorize("ADMIN"), createUser);

router
  .route("/:id")
  .put(protect, authorize("ADMIN"), updateUser);


export default router;
