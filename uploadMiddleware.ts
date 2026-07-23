import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../SVHKback/server/config/cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "svhk",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "pdf"],
    resource_type: "auto",
    public_id: `${Date.now()}`,
  }),
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export default upload;