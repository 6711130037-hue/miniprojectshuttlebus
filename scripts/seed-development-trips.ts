import 'dotenv/config';
import oracledb from 'oracledb';

const { ORACLE_USER: user, ORACLE_PASSWORD: password, ORACLE_CONNECT_STRING: connectString } = process.env;
if (!user || !password || !connectString) throw new Error('Oracle environment configuration is incomplete.');

const pool = await oracledb.createPool({ user, password, connectString, poolMin: 1, poolMax: 1, poolIncrement: 1 });
try {
  const connection = await pool.getConnection();
  try {
    const routeResult = await connection.execute<{ ROUTE_ID: number }>(
      `SELECT ROUTE_ID FROM ROUTE WHERE NAME = :routeName AND STATUS = 1 ORDER BY ROUTE_ID FETCH FIRST 1 ROW ONLY`,
      { routeName: 'เส้นทางที่ 1' },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );
    const driverResult = await connection.execute<{ EMPLOYEE_ID: string }>(
      `SELECT EMPLOYEE_ID FROM EMPLOYEE WHERE EMPLOYEE_ID = :employeeId AND IS_ACTIVE = 'Y'`,
      { employeeId: 'DEVDR001' },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );
    const vehicleResult = await connection.execute<{ VEHICLE_ID: string }>(
      `SELECT VEHICLE_ID FROM VEHICLE WHERE VEHICLE_ID = :vehicleId AND STATUS = 1`,
      { vehicleId: 'DEVVAN001' },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    const routeId = routeResult.rows?.[0]?.ROUTE_ID;
    const driverId = driverResult.rows?.[0]?.EMPLOYEE_ID;
    const vehicleId = vehicleResult.rows?.[0]?.VEHICLE_ID;
    if (!routeId || !driverId || !vehicleId) {
      throw new Error('Active development route, driver, or vehicle is missing.');
    }

    const dateResult = await connection.execute<{ SERVICE_DATE: string }>(
      `SELECT TO_CHAR(CURRENT_DATE + 1, 'YYYY-MM-DD') AS SERVICE_DATE FROM DUAL`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );
    const serviceDate = dateResult.rows?.[0]?.SERVICE_DATE;
    if (!serviceDate) throw new Error('Could not resolve next service date.');

    const departures = ['07:00:00', '10:00:00', '13:00:00', '16:00:00', '19:00:00', '22:00:00'];
    const created: string[] = [];
    for (const time of departures) {
      const departureAt = `${serviceDate} ${time}`;
      const existing = await connection.execute(
        `SELECT TRIP_ID FROM TRIP
         WHERE ROUTE_ID = :routeId AND DRIVER_ID = :driverId AND VEHICLE_ID = :vehicleId
           AND DEPARTURE_AT = TO_TIMESTAMP(:departureAt, 'YYYY-MM-DD HH24:MI:SS')`,
        { routeId, driverId, vehicleId, departureAt },
      );
      if (!existing.rows?.length) {
        await connection.execute(
          `INSERT INTO TRIP (ROUTE_ID, DRIVER_ID, VEHICLE_ID, DEPARTURE_AT, STATUS)
           VALUES (:routeId, :driverId, :vehicleId, TO_TIMESTAMP(:departureAt, 'YYYY-MM-DD HH24:MI:SS'), 1)`,
          { routeId, driverId, vehicleId, departureAt },
        );
        created.push(`${serviceDate} ${time.slice(0, 5)}`);
      }
    }
    await connection.commit();
    console.log(JSON.stringify({ routeId, serviceDate, scheduledDepartures: departures.map((time) => time.slice(0, 5)), insertedCount: created.length }));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.close();
  }
} finally {
  await pool.close(10);
}
