import { Sequelize } from "sequelize";

const sequelize = process.env.MYSQL_URL
  ? new Sequelize(process.env.MYSQL_URL, {
      dialect: "mysql",
      logging: false,
    })
  : new Sequelize("database_development", "root", "123456", {
      host: "127.0.0.1",
      dialect: "mysql",
      logging: false,
    });
export default sequelize;