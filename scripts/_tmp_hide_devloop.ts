import 'dotenv/config';
import oracledb from 'oracledb';
const { ORACLE_USER: user, ORACLE_PASSWORD: password, ORACLE_CONNECT_STRING: connectString } = process.env;
const pool = await oracledb.createPool({ user, password, connectString, poolMin: 1, poolMax: 1, poolIncrement: 1 });
const conn = await pool.getConnection();
try {
  const before = await conn.execute(
    `SELECT ROUTE_ID, NAME, STATUS FROM ROUTE WHERE NAME = 'Development Shuttle Loop'`,
    [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
  console.log('before=' + JSON.stringify(before.rows));
  await conn.execute(`UPDATE ROUTE SET STATUS = 0 WHERE NAME = 'Development Shuttle Loop' AND STATUS <> 0`);
  await conn.commit();
  const after = await conn.execute(
    `SELECT ROUTE_ID, NAME, STATUS FROM ROUTE WHERE NAME = 'Development Shuttle Loop'`,
    [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
  console.log('after=' + JSON.stringify(after.rows));
} finally { await pool.close(10); }
