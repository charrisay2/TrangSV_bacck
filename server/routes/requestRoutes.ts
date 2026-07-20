import express from "express";
import {
  createRequest,
  getRequests,
  updateRequestStatus,
} from "../controllers/requestController";

import { protect, authorize } from "../middleware/authMiddleware";
import upload from "../../uploadMiddleware";

const router = express.Router();

router.post(
  "/",
  protect,
  upload.single("attachment"),
  createRequest
);

router.get("/", protect, getRequests);

router.put(
  "/:id",
  protect,
  authorize("ADMIN"),
  updateRequestStatus
);

export default router;