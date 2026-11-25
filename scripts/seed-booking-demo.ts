import 'dotenv/config';
import oracledb from 'oracledb';

const { ORACLE_USER: user, ORACLE_PASSWORD: password, ORACLE_CONNECT_STRING: connectString } = process.env;
if (!user || !password || !connectString) {
  throw new Error('Oracle environment configuration is incomplete.');
}

const pool = await oracledb.createPool({ user, password, connectString, poolMin: 1, poolMax: 1, poolIncrement: 1 });
const schedules = [
  {
    name: 'DEMO: มหาวิทยาลัย - โลตัส - โรงพยาบาล - บิ๊กซี',
    stops: [
      { name: 'มหาวิทยาลัยเทคโนโลยีมหานคร', description: 'จุดรับส่งหน้าอาคารอำนวยการ', minutes: 0 },
      { name: 'โลตัสหนองจอก', description: 'จุดรับส่งหน้าโลตัส หนองจอก', minutes: 8 },
      { name: 'โรงพยาบาลหนองจอก', description: 'จุดรับส่งหน้าโรงพยาบาลหนองจอก', minutes: 7 },
      { name: 'Big C หนองจอก', description: 'จุดรับส่งหน้า Big C หนองจอก', minutes: 8 },
      { name: 'มหาวิทยาลัยเทคโนโลยีมหานคร', description: 'จุดรับส่งหน้าอาคารอำนวยการ', minutes: 12 },
    ],
    departures: ['07:00:00', '10:00:00', '13:00:00', '16:00:00', '19:00:00', '22:00:00'],
  },
  {
    name: 'DEMO: มหาวิทยาลัย - โลตัส - สวนหนองจอก - บ้านนา',
    stops: [
      { name: 'มหาวิทยาลัยเทคโนโลยีมหานคร', description: 'จุดรับส่งหน้าอาคารอำนวยการ', minutes: 0 },
      { name: 'โลตัสหนองจอก', description: 'จุดรับส่งหน้าโลตัส หนองจอก', minutes: 8 },
      { name: 'สวนสาธารณะหนองจอก', description: 'จุดรับส่งสวนสาธารณะหนองจอก', minutes: 9 },
      { name: 'ร้านส้มตำบ้านนา', description: 'จุดรับส่งบริเวณร้านส้มตำบ้านนา', minutes: 10 },
      { name: 'มหาวิทยาลัยเทคโนโลยีมหานคร', description: 'จุดรับส่งหน้าอาคารอำนวยการ', minutes: 15 },
    ],
    departures: ['08:00:00', '11:00:00', '14:00:00', '17:00:00', '20:00:00'],
  },
  {
    name: 'DEMO: มหาวิทยาลัย - บิ๊กซี - โรงพยาบาล - โลตัส',
    stops: [
      { name: 'มหาวิทยาลัยเทคโนโลยีมหานคร', description: 'จุดรับส่งหน้าอาคารอำนวยการ', minutes: 0 },
      { name: 'Big C หนองจอก', description: 'จุดรับส่งหน้า Big C หนองจอก', minutes: 10 },
      { name: 'โรงพยาบาลหนองจอก', description: 'จุดรับส่งหน้าโรงพยาบาลหนองจอก', minutes: 8 },
      { name: 'โลตัสหนองจอก', description: 'จุดรับส่งหน้าโลตัส หนองจอก', minutes: 7 },
      { name: 'มหาวิทยาลัยเทคโนโลยีมหานคร', description: 'จุดรับส่งหน้าอาคารอำนวยการ', minutes: 12 },
    ],
    departures: ['09:00:00', '12:00:00', '15:00:00', '18:00:00', '21:00:00'],
  },
];

try {
  const connection = await pool.getConnection();
  try {
    const driverResult = await connection.execute<{ EMPLOYEE_ID: string }>(`
      SELECT EMPLOYEE_ID
      FROM EMPLOYEE
      WHERE IS_ACTIVE = 'Y'
      ORDER BY CASE WHEN EMPLOYEE_ID = 'DEVDR001' THEN 0 ELSE 1 END, EMPLOYEE_ID
      FETCH FIRST 1 ROW ONLY
    `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const vehicleResult = await connection.execute<{ VEHICLE_ID: string }>(`
      SELECT VEHICLE_ID
      FROM VEHICLE
      WHERE STATUS = 1
      ORDER BY CASE WHEN VEHICLE_ID = 'DEVVAN001' THEN 0 ELSE 1 END, VEHICLE_ID
      FETCH FIRST 1 ROW ONLY
    `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const driverId = driverResult.rows?.[0]?.EMPLOYEE_ID;
    const vehicleId = vehicleResult.rows?.[0]?.VEHICLE_ID;
    if (!driverId || !vehicleId) {
      throw new Error('No active employee or vehicle found. Run npm run seed:dev first.');
    }

    const rangeResult = await connection.execute<{ START_DATE: string; END_DATE: string }>(`
      SELECT TO_CHAR(TRUNC(CURRENT_DATE), 'YYYY-MM-DD') AS START_DATE,
             TO_CHAR(ADD_MONTHS(TRUNC(CURRENT_DATE, 'MM'), 1) + 4, 'YYYY-MM-DD') AS END_DATE
      FROM DUAL
    `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const startDate = rangeResult.rows?.[0]?.START_DATE;
    const endDate = rangeResult.rows?.[0]?.END_DATE;
    if (!startDate || !endDate) throw new Error('Could not determine booking date range.');

    const stopIds = new Map<string, number>();
    for (const stop of schedules.flatMap((schedule) => schedule.stops)) {
      if (stopIds.has(stop.name)) continue;
      const existing = await connection.execute<{ STOP_ID: number }>(
        `SELECT STOP_ID FROM STOP WHERE NAME = :name ORDER BY STOP_ID FETCH FIRST 1 ROW ONLY`,
        { name: stop.name },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      let stopId = existing.rows?.[0]?.STOP_ID;
      if (!stopId) {
        const inserted = await connection.execute<{ STOP_ID: number }>(`
          INSERT INTO STOP (NAME, DESCRIPTION, STATUS)
          VALUES (:name, :description, 1)
          RETURNING STOP_ID INTO :stopId
        `, {
          name: stop.name,
          description: stop.description,
          stopId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        });
        stopId = Number((inserted.outBinds as { stopId: number[] }).stopId[0]);
      }
      stopIds.set(stop.name, Number(stopId));
    }

    const routeIds = new Map<string, number>();
    for (const schedule of schedules) {
      const found = await connection.execute<{ ROUTE_ID: number }>(
        `SELECT ROUTE_ID FROM ROUTE WHERE NAME = :name ORDER BY ROUTE_ID FETCH FIRST 1 ROW ONLY`,
        { name: schedule.name },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      let routeId = found.rows?.[0]?.ROUTE_ID;
      if (!routeId) {
        const inserted = await connection.execute<{ ROUTE_ID: number }>(`
          INSERT INTO ROUTE (NAME, STATUS, TOTAL_TIME) VALUES (:name, 1, 0)
          RETURNING ROUTE_ID INTO :routeId
        `, {
          name: schedule.name,
          routeId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        });
        routeId = Number((inserted.outBinds as { routeId: number[] }).routeId[0]);
      } else {
        await connection.execute(`UPDATE ROUTE SET STATUS = 1 WHERE ROUTE_ID = :routeId`, { routeId });
      }
      routeIds.set(schedule.name, Number(routeId));

      for (const [index, stop] of schedule.stops.entries()) {
        await connection.execute(`
          MERGE INTO ROUTE_STOP target
          USING (SELECT :routeId AS ROUTE_ID, :stopId AS STOP_ID,
                        :stopOrder AS STOP_ORDER, :minutes AS MINUTES_FROM_PREV FROM DUAL) source
          ON (target.ROUTE_ID = source.ROUTE_ID AND target.STOP_ORDER = source.STOP_ORDER)
          WHEN MATCHED THEN UPDATE SET
            target.STOP_ID = source.STOP_ID,
            target.MINUTES_FROM_PREV = source.MINUTES_FROM_PREV
          WHEN NOT MATCHED THEN INSERT (ROUTE_ID, STOP_ID, STOP_ORDER, MINUTES_FROM_PREV)
            VALUES (source.ROUTE_ID, source.STOP_ID, source.STOP_ORDER, source.MINUTES_FROM_PREV)
        `, {
          routeId,
          stopId: stopIds.get(stop.name),
          stopOrder: index + 1,
          minutes: stop.minutes,
        });
      }
    }

    let removedOutOfRangeTrips = 0;
    for (const routeId of routeIds.values()) {
      const cleanup = await connection.execute(`
        DELETE FROM TRIP T
        WHERE T.ROUTE_ID = :routeId
          AND T.DEPARTURE_AT >= TO_TIMESTAMP(:endDate, 'YYYY-MM-DD') + 1
          AND NOT EXISTS (
            SELECT 1 FROM BOOKING_DETAIL BD WHERE BD.TRIP_ID = T.TRIP_ID
          )
      `, { routeId, endDate });
      removedOutOfRangeTrips += cleanup.rowsAffected ?? 0;
    }

    let insertedTrips = 0;
    let skippedConflictTrips = 0;
    let existingTrips = 0;
    const current = new Date(`${startDate}T00:00:00Z`);
    const last = new Date(`${endDate}T00:00:00Z`);
    while (current <= last) {
      const serviceDate = current.toISOString().slice(0, 10);
      for (const schedule of schedules) {
        const routeId = routeIds.get(schedule.name)!;
        for (const departure of schedule.departures) {
          const departureAt = `${serviceDate} ${departure}`;
          const existing = await connection.execute(`
            SELECT TRIP_ID FROM TRIP
            WHERE ROUTE_ID = :routeId
              AND DRIVER_ID = :driverId
              AND VEHICLE_ID = :vehicleId
              AND DEPARTURE_AT = TO_TIMESTAMP(:departureAt, 'YYYY-MM-DD HH24:MI:SS')
          `, { routeId, driverId, vehicleId, departureAt });
          if (existing.rows?.length) {
            existingTrips++;
            continue;
          }

          const inFuture = await connection.execute(`
            SELECT 1 FROM DUAL
            WHERE TO_TIMESTAMP(:departureAt, 'YYYY-MM-DD HH24:MI:SS') > CURRENT_TIMESTAMP + NUMTODSINTERVAL(20, 'MINUTE')
          `, { departureAt });
          if (!inFuture.rows?.length) continue;

          const conflict = await connection.execute(`
            SELECT TRIP_ID FROM TRIP
            WHERE STATUS IN (1, 2)
              AND (DRIVER_ID = :driverId OR VEHICLE_ID = :vehicleId)
              AND DEPARTURE_AT > TO_TIMESTAMP(:departureAt, 'YYYY-MM-DD HH24:MI:SS') - NUMTODSINTERVAL(45, 'MINUTE')
              AND DEPARTURE_AT < TO_TIMESTAMP(:departureAt, 'YYYY-MM-DD HH24:MI:SS') + NUMTODSINTERVAL(45, 'MINUTE')
            FETCH FIRST 1 ROW ONLY
          `, { driverId, vehicleId, departureAt });
          if (conflict.rows?.length) {
            skippedConflictTrips++;
            continue;
          }

          await connection.execute(`
            INSERT INTO TRIP (ROUTE_ID, DRIVER_ID, VEHICLE_ID, DEPARTURE_AT, STATUS)
            VALUES (:routeId, :driverId, :vehicleId,
                    TO_TIMESTAMP(:departureAt, 'YYYY-MM-DD HH24:MI:SS'), 1)
          `, { routeId, driverId, vehicleId, departureAt });
          insertedTrips++;
        }
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }

    await connection.commit();
    console.log(JSON.stringify({
      status: 'seeded',
      synthetic: true,
      startDate,
      endDate,
      routes: schedules.length,
      driverId,
      vehicleId,
      insertedTrips,
      existingTrips,
      skippedConflictTrips,
      removedOutOfRangeTrips,
    }));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.close();
  }
} finally {
  await pool.close(10);
}
