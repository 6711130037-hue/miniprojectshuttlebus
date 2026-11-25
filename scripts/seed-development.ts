import 'dotenv/config';
import oracledb from 'oracledb';
import { hashPassword } from '../server/auth/password';

const password = process.env.DEV_SEED_PASSWORD;
if (!password || password.length < 12) {
  throw new Error('Set DEV_SEED_PASSWORD (at least 12 characters) in local .env before seeding.');
}

const { ORACLE_USER: user, ORACLE_PASSWORD: oraclePassword, ORACLE_CONNECT_STRING: connectString } = process.env;
if (!user || !oraclePassword || !connectString) throw new Error('Oracle environment configuration is incomplete.');

const pool = await oracledb.createPool({ user, password: oraclePassword, connectString, poolMin: 1, poolMax: 2, poolIncrement: 1 });
const connection = await pool.getConnection();
const binds = (data: Record<string, unknown>) => Object.fromEntries(Object.entries(data).map(([k, v]) => [k, { val: v }]));
const exec = (sql: string, values: Record<string, unknown> = {}) => connection.execute(sql, binds(values), { autoCommit: false });
const one = async (sql: string, values: Record<string, unknown> = {}) => {
  const result = await connection.execute<Record<string, unknown>>(sql, binds(values), { outFormat: oracledb.OUT_FORMAT_OBJECT });
  return result.rows?.[0];
};
const passHash = await hashPassword(password);

try {
  await exec(`MERGE INTO DEPARTMENT d USING (SELECT :name department_name FROM dual) s ON (d.DEPARTMENT_NAME=s.department_name) WHEN NOT MATCHED THEN INSERT (DEPARTMENT_NAME) VALUES (s.department_name)`, { name: 'Development Shuttle Operations' });
  await exec(`MERGE INTO POSITION p USING (SELECT :name position_name FROM dual) s ON (p.POSITION_NAME=s.position_name) WHEN NOT MATCHED THEN INSERT (POSITION_NAME) VALUES (s.position_name)`, { name: 'Development Shuttle Driver' });
  await exec(`MERGE INTO POSITION p USING (SELECT :name position_name FROM dual) s ON (p.POSITION_NAME=s.position_name) WHEN NOT MATCHED THEN INSERT (POSITION_NAME) VALUES (s.position_name)`, { name: 'Development Shuttle Administrator' });
  await exec(`MERGE INTO SCREEN x USING (SELECT :code screen_code FROM dual) s ON (x.SCREEN_CODE=s.screen_code) WHEN NOT MATCHED THEN INSERT (SCREEN_CODE,SCREEN_NAME,SCREEN_GROUP) VALUES (s.screen_code,:name,:grp)`, { code: '8820', name: 'Driver Trip Operations', grp: 'Driver' });
  for (const screen of [
    { code: '3456', name: 'Trip Schedule Management', group: 'Operations' },
    { code: '6794', name: 'Route and Stop Management', group: 'Operations' },
    { code: '1101', name: 'Employee Master', group: 'Admin' },
    { code: '1102', name: 'Position Master', group: 'Admin' },
    { code: '1103', name: 'Department Master', group: 'Admin' },
    { code: '9102', name: 'Role Permission Management', group: 'Admin' },
  ]) {
    await exec(`MERGE INTO SCREEN x USING (SELECT :code screen_code FROM dual) s ON (x.SCREEN_CODE=s.screen_code) WHEN NOT MATCHED THEN INSERT (SCREEN_CODE,SCREEN_NAME,SCREEN_GROUP) VALUES (s.screen_code,:name,:grp)`, { code: screen.code, name: screen.name, grp: screen.group });
  }
  const department = await one(`SELECT DEPARTMENT_ID FROM DEPARTMENT WHERE DEPARTMENT_NAME=:name`, { name: 'Development Shuttle Operations' });
  const position = await one(`SELECT POSITION_ID FROM POSITION WHERE POSITION_NAME=:name`, { name: 'Development Shuttle Driver' });
  const adminPosition = await one(`SELECT POSITION_ID FROM POSITION WHERE POSITION_NAME=:name`, { name: 'Development Shuttle Administrator' });
  const screen = await one(`SELECT SCREEN_ID FROM SCREEN WHERE SCREEN_CODE=:code`, { code: '8820' });
  const departmentId = Number(department?.DEPARTMENT_ID), positionId = Number(position?.POSITION_ID), screenId = Number(screen?.SCREEN_ID), adminPositionId = Number(adminPosition?.POSITION_ID);
  await exec(`MERGE INTO ROLE_PERMISSION rp USING (SELECT :pos POSITION_ID,:screen SCREEN_ID FROM dual) s ON (rp.POSITION_ID=s.POSITION_ID AND rp.SCREEN_ID=s.SCREEN_ID) WHEN MATCHED THEN UPDATE SET rp.CAN_VIEW='Y',rp.CAN_EDIT='Y' WHEN NOT MATCHED THEN INSERT (POSITION_ID,SCREEN_ID,CAN_VIEW,CAN_EDIT) VALUES (s.POSITION_ID,s.SCREEN_ID,'Y','Y')`, { pos: positionId, screen: screenId });
  for (const code of ['3456', '6794', '1101', '1102', '1103', '9102']) {
    const adminScreen = await one(`SELECT SCREEN_ID FROM SCREEN WHERE SCREEN_CODE=:code`, { code });
    await exec(`MERGE INTO ROLE_PERMISSION rp USING (SELECT :pos POSITION_ID,:screen SCREEN_ID FROM dual) s ON (rp.POSITION_ID=s.POSITION_ID AND rp.SCREEN_ID=s.SCREEN_ID) WHEN MATCHED THEN UPDATE SET rp.CAN_VIEW='Y',rp.CAN_EDIT='Y' WHEN NOT MATCHED THEN INSERT (POSITION_ID,SCREEN_ID,CAN_VIEW,CAN_EDIT) VALUES (s.POSITION_ID,s.SCREEN_ID,'Y','Y')`, { pos: adminPositionId, screen: Number(adminScreen?.SCREEN_ID) });
  }

  await exec(`MERGE INTO EMPLOYEE e USING (SELECT :id EMPLOYEE_ID FROM dual) s ON (e.EMPLOYEE_ID=s.EMPLOYEE_ID) WHEN MATCHED THEN UPDATE SET e.PASSWORD_HASH=:hash,e.DEPARTMENT_ID=:dept,e.POSITION_ID=:pos,e.IS_ACTIVE='Y' WHEN NOT MATCHED THEN INSERT (EMPLOYEE_ID,FULL_NAME,USERNAME,PASSWORD_HASH,PHONE,EMAIL,DEPARTMENT_ID,POSITION_ID,IS_ACTIVE) VALUES (:id,:name,:username,:hash,:phone,:email,:dept,:pos,'Y')`, {
    id: 'DEVDR001', name: 'Development Driver', username: 'dev.driver@example.test', hash: passHash,
    phone: '0000000000', email: 'dev.driver@example.test', dept: departmentId, pos: positionId,
  });
  await exec(`MERGE INTO EMPLOYEE e USING (SELECT :id EMPLOYEE_ID FROM dual) s ON (e.EMPLOYEE_ID=s.EMPLOYEE_ID) WHEN MATCHED THEN UPDATE SET e.PASSWORD_HASH=:hash,e.DEPARTMENT_ID=:dept,e.POSITION_ID=:pos,e.IS_ACTIVE='Y' WHEN NOT MATCHED THEN INSERT (EMPLOYEE_ID,FULL_NAME,USERNAME,PASSWORD_HASH,PHONE,EMAIL,DEPARTMENT_ID,POSITION_ID,IS_ACTIVE) VALUES (:id,:name,:username,:hash,:phone,:email,:dept,:pos,'Y')`, {
    id: 'DEVAD001', name: 'Development Administrator', username: 'dev.admin@example.test', hash: passHash,
    phone: '0000000002', email: 'dev.admin@example.test', dept: departmentId, pos: adminPositionId,
  });
  await exec(`MERGE INTO SYSTEM_USER u USING (SELECT :username USERNAME FROM dual) s ON (u.USERNAME=s.USERNAME) WHEN MATCHED THEN UPDATE SET u.PASSWORD_HASH=:hash,u.EMAIL=:email,u.IS_ACTIVE='Y' WHEN NOT MATCHED THEN INSERT (NAME,USERNAME,PASSWORD_HASH,USER_TYPE,PHONE,EMAIL,IS_ACTIVE) VALUES (:name,:username,:hash,:type,:phone,:email,'Y')`, {
    username: 'dev.passenger@example.test', hash: passHash, name: 'Development Passenger', type: 'นักศึกษา', phone: '0000000001', email: 'dev.passenger@example.test',
  });
  await exec(`MERGE INTO VEHICLE_TYPE vt USING (SELECT :name NAME FROM dual) s ON (vt.NAME=s.NAME) WHEN NOT MATCHED THEN INSERT (NAME) VALUES (s.NAME)`, { name: 'รถตู้' });
  const vehicleType = await one(`SELECT VEHICLE_TYPE_ID FROM VEHICLE_TYPE WHERE NAME=:name`, { name: 'รถตู้' });
  const vehicleTypeId = Number(vehicleType?.VEHICLE_TYPE_ID);
  if (!Number.isSafeInteger(vehicleTypeId) || vehicleTypeId <= 0) throw new Error('Development vehicle type could not be resolved.');
  await exec(`MERGE INTO VEHICLE v USING (SELECT :id VEHICLE_ID FROM dual) s ON (v.VEHICLE_ID=s.VEHICLE_ID) WHEN MATCHED THEN UPDATE SET v.CAPACITY=9,v.STATUS=1,v.VEHICLE_TYPE_ID=:type WHEN NOT MATCHED THEN INSERT (VEHICLE_ID,LICENSE_PLATE,CAPACITY,STATUS,VEHICLE_TYPE_ID) VALUES (:id,:plate,9,1,:type)`, { id: 'DEVVAN001', plate: 'DEV-VAN-01', type: vehicleTypeId });

  const stopNames = ['Development Gate', 'Development Library', 'Development Residence', 'Development Terminal'];
  for (let i = 0; i < stopNames.length; i++) {
    await exec(`MERGE INTO STOP s USING (SELECT :name NAME FROM dual) x ON (s.NAME=x.NAME) WHEN NOT MATCHED THEN INSERT (NAME,DESCRIPTION,STATUS) VALUES (x.NAME,:description,1)`, { name: stopNames[i], description: `Synthetic development stop ${i + 1}` });
  }
  await exec(`MERGE INTO ROUTE r USING (SELECT :name NAME FROM dual) s ON (r.NAME=s.NAME) WHEN MATCHED THEN UPDATE SET r.STATUS=1 WHEN NOT MATCHED THEN INSERT (NAME,STATUS) VALUES (s.NAME,1)`, { name: 'Development Shuttle Loop' });
  const route = await one(`SELECT ROUTE_ID FROM ROUTE WHERE NAME=:name`, { name: 'Development Shuttle Loop' });
  const routeId = Number(route?.ROUTE_ID);
  for (let i = 0; i < stopNames.length; i++) {
    const stop = await one(`SELECT STOP_ID FROM STOP WHERE NAME=:name`, { name: stopNames[i] });
    await exec(`INSERT INTO ROUTE_STOP (ROUTE_ID,STOP_ID,STOP_ORDER,MINUTES_FROM_PREV) SELECT :route,:stop,:ord,:mins FROM dual WHERE NOT EXISTS (SELECT 1 FROM ROUTE_STOP WHERE ROUTE_ID=:route AND STOP_ORDER=:ord)`, { route: routeId, stop: Number(stop?.STOP_ID), ord: i + 1, mins: i === 0 ? 0 : 5 });
  }

  const departure = new Date();
  departure.setDate(departure.getDate() + 1);
  departure.setHours(9, 0, 0, 0);
  const existing = await one(`SELECT TRIP_ID FROM TRIP WHERE ROUTE_ID=:route AND DRIVER_ID=:driver AND VEHICLE_ID=:vehicle AND DEPARTURE_AT=:departure AND STATUS=1`, { route: routeId, driver: 'DEVDR001', vehicle: 'DEVVAN001', departure });
  if (!existing) await exec(`INSERT INTO TRIP (ROUTE_ID,DRIVER_ID,VEHICLE_ID,DEPARTURE_AT,STATUS) VALUES (:route,:driver,:vehicle,:departure,1)`, { route: routeId, driver: 'DEVDR001', vehicle: 'DEVVAN001', departure });

  await connection.commit();
  const trip = await one(`SELECT TRIP_ID FROM TRIP WHERE ROUTE_ID=:route AND DRIVER_ID=:driver AND VEHICLE_ID=:vehicle AND DEPARTURE_AT=:departure AND STATUS=1`, { route: routeId, driver: 'DEVDR001', vehicle: 'DEVVAN001', departure });
  console.log(JSON.stringify({ status: 'seeded', synthetic: true, routeId, tripId: Number(trip?.TRIP_ID) }));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.close();
  await pool.close(0);
}
