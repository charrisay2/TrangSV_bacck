import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  "database_development",
  "root",
  "123456",
  {
    host: "localhost",
    port: 3306,
    dialect: "mysql",
    logging: false,
  }
);

export default sequelize;