import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "railway", 
  process.env.DB_USER || "root", 
  process.env.DB_PASSWORD, 
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    dialect: "mysql",
    logging: false,
    dialectOptions: {
      connectTimeout: 60000 // Tăng thời gian chờ kết nối
    }
  }
);

export default sequelize;