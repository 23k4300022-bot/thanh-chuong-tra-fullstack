const { Pool } = require("pg");
require("dotenv").config();

const poolPromise = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

poolPromise
  .connect()
  .then((client) => {
    console.log("Kết nối Supabase PostgreSQL thành công");
    client.release();
  })
  .catch((err) => {
    console.error("Lỗi kết nối Supabase PostgreSQL:", err);
  });

module.exports = {
  poolPromise,
};