import 'dotenv/config';
import oracledb from 'oracledb';

/**
 * เติมรอบรถตั้งแต่วันพรุ่งนี้ (ตามเวลาฐานข้อมูล) จนถึงวันสิ้นสุด
 * ค่าเริ่มต้นของวันสิ้นสุด = วันที่ 9 ของเดือนปัจจุบัน
 *
 * รูปแบบรอบ (เส้นทาง / เวลาออก / ลำดับคนขับ / ลำดับรถ) คัดลอกจากวันที่มีรอบมากสุดใน 7 วันล่าสุด
 * จึงกระจายรอบให้คนขับชุดเดิมและใช้รถชุดเดิมเท่าเดิม ไม่เพิ่มรถใหม่ และรันซ้ำได้ (รอบที่มีแล้วจะข้าม)
 *
 * ใช้งาน:  npm run seed:trips                                      (จบวันที่ 9 ของเดือนปัจจุบัน)
 *          npx tsx scripts/seed-trip-schedule.ts 2026-10-09         (ระบุวันสิ้นสุดเอง)
 */

const endArg = process.argv[2];
if (endArg && !/^\d{4}-\d{2}-\d{2}$/.test(endArg)) {
  throw new Error('Usage: tsx scripts/seed-trip-schedule.ts [YYYY-MM-DD]');
}

const { ORACLE_USER: user, ORACLE_PASSWORD: password, ORACLE_CONNECT_STRING: connectString } = process.env;
if (!user || !password || !connectString) {
  throw new Error('Oracle environment configuration is incomplete.');
}

// หน้าต่างเช็กคนขับ/รถชนกัน (เส้นทางยาวสุด 30 นาที) และรอบที่หักเวลาน้อยกว่านี้ไม่นับเป็นรอบจองได้
const CONFLICT_MINUTES = 45;
const FUTURE_MINUTES = 20;

const pool = await oracledb.createPool({ user, password, connectString, poolMin: 1, poolMax: 1, poolIncrement: 1 });

const addDays = (date: string, days: number): string => {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

const routeBinds = (routeIds: number[]) => Object.fromEntries(routeIds.map((id, index) => [`route${index}`, id]));
const routeList = (routeIds: number[]) => routeIds.map((_, index) => `:route${index}`).join(', ');

try {
  const connection = await pool.getConnection();
  try {
    const dateResult = await connection.execute<{ CURRENT_DATE: string; DEFAULT_END: string }>(`
      SELECT TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') AS CURRENT_DATE,
             TO_CHAR(TRUNC(CURRENT_DATE, 'MM') + 8, 'YYYY-MM-DD') AS DEFAULT_END
      FROM DUAL
    `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const currentDate = dateResult.rows?.[0]?.CURRENT_DATE;
    const defaultEnd = dateResult.rows?.[0]?.DEFAULT_END;
    if (!currentDate || !defaultEnd) throw new Error('Could not resolve database current date.');
    const endDate = endArg ?? defaultEnd;
    const startDate = addDays(currentDate, 1);
    if (endDate < startDate) {
      console.log(JSON.stringify({ status: 'nothing-to-do', currentDate, startDate, endDate, inserted: 0 }));
      await pool.close(10);
      process.exit(0);
    }

    // วันอ้างอิง = วันที่มีรอบมากสุดใน 7 วันล่าสุด (ได้ตารางรอบที่สมบูรณ์ที่สุด)
    const refResult = await connection.execute<{ REF_DATE: string }>(`
      SELECT TO_CHAR(TRUNC(DEPARTURE_AT), 'YYYY-MM-DD') AS REF_DATE
      FROM TRIP
      WHERE DEPARTURE_AT >= CURRENT_DATE - 7
      GROUP BY TRUNC(DEPARTURE_AT)
      ORDER BY COUNT(*) DESC, TRUNC(DEPARTURE_AT) DESC
      FETCH FIRST 1 ROW ONLY
    `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const refDate = refResult.rows?.[0]?.REF_DATE;
    if (!refDate) throw new Error('No reference trips found. Run npm run seed:booking-demo first.');

    // เส้นทางหลักของวันอ้างอิง = เส้นทางที่มีอย่างน้อย 10 รอบ (ตัดรอบ DEV/DEMO ที่มีรอบเดียวออก)
    const routeResult = await connection.execute<{ ROUTE_ID: number }>(`
      SELECT ROUTE_ID
      FROM TRIP
      WHERE TRUNC(DEPARTURE_AT) = TO_DATE(:refDate, 'YYYY-MM-DD')
      GROUP BY ROUTE_ID
      HAVING COUNT(*) >= 10
      ORDER BY ROUTE_ID
    `, { refDate }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const routeIds = (routeResult.rows ?? []).map((row) => Number(row.ROUTE_ID));
    if (!routeIds.length) throw new Error('Reference day has no repeated routes.');

    // เวลาออกรอบทั้งหมดของวันอ้างอิง เรียงตามเวลาจริง
    const timeResult = await connection.execute<{ DEP_TIME: string }>(`
      SELECT TO_CHAR(DEP_TIME, 'HH24:MI') AS DEP_TIME
      FROM (
        SELECT MIN(DEPARTURE_AT) AS DEP_TIME
        FROM TRIP
        WHERE TRUNC(DEPARTURE_AT) = TO_DATE(:refDate, 'YYYY-MM-DD')
          AND ROUTE_ID IN (${routeList(routeIds)})
        GROUP BY TO_CHAR(DEPARTURE_AT, 'HH24:MI')
      )
      ORDER BY DEP_TIME
    `, { refDate, ...routeBinds(routeIds) }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const departureTimes = (timeResult.rows ?? []).map((row) => row.DEP_TIME);
    if (!departureTimes.length) throw new Error('Reference day has no departure times.');

    // ลำดับคนขับ/รถ = การปรากฏตัวครั้งแรกของแต่ละคน/คัน เรียงตาม (เวลาออก, เส้นทาง)
    // เพื่อให้ลำดับหมุนเวียนเหมือนวันอ้างอิงทุกประการ (คนขับคู่กับคันเดิมเหมือนเดิม)
    const driverCycleResult = await connection.execute<{ DRIVER_ID: string }>(`
      SELECT DRIVER_ID
      FROM (
        SELECT DRIVER_ID, MIN(TRIP_SEQ) AS FIRST_SEQ
        FROM (
          SELECT DRIVER_ID, ROW_NUMBER() OVER (ORDER BY DEPARTURE_AT, ROUTE_ID) AS TRIP_SEQ
          FROM TRIP
          WHERE TRUNC(DEPARTURE_AT) = TO_DATE(:refDate, 'YYYY-MM-DD')
            AND ROUTE_ID IN (${routeList(routeIds)})
        )
        GROUP BY DRIVER_ID
      )
      ORDER BY FIRST_SEQ
    `, { refDate, ...routeBinds(routeIds) }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const driverCycle = (driverCycleResult.rows ?? []).map((row) => row.DRIVER_ID);

    const vehicleCycleResult = await connection.execute<{ VEHICLE_ID: string }>(`
      SELECT VEHICLE_ID
      FROM (
        SELECT VEHICLE_ID, MIN(TRIP_SEQ) AS FIRST_SEQ
        FROM (
          SELECT VEHICLE_ID, ROW_NUMBER() OVER (ORDER BY DEPARTURE_AT, ROUTE_ID) AS TRIP_SEQ
          FROM TRIP
          WHERE TRUNC(DEPARTURE_AT) = TO_DATE(:refDate, 'YYYY-MM-DD')
            AND ROUTE_ID IN (${routeList(routeIds)})
        )
        GROUP BY VEHICLE_ID
      )
      ORDER BY FIRST_SEQ
    `, { refDate, ...routeBinds(routeIds) }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const vehicleCycle = (vehicleCycleResult.rows ?? []).map((row) => row.VEHICLE_ID);
    if (!driverCycle.length || !vehicleCycle.length) {
      throw new Error('Reference day has no driver/vehicle rotation.');
    }

    // ยืนยันว่าคนขับทุกคนยังเปิดใช้งานและรถทุกคันพร้อมใช้ ก่อนเริ่ม insert
    const activeDriverResult = await connection.execute<{ CNT: number }>(`
      SELECT COUNT(*) AS CNT
      FROM EMPLOYEE
      WHERE IS_ACTIVE = 'Y' AND EMPLOYEE_ID IN (${driverCycle.map((_, index) => `:driver${index}`).join(', ')})
    `, Object.fromEntries(driverCycle.map((id, index) => [`driver${index}`, id])), { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const activeDrivers = Number(activeDriverResult.rows?.[0]?.CNT ?? 0);
    if (activeDrivers !== driverCycle.length) {
      throw new Error(`Only ${activeDrivers} of ${driverCycle.length} reference drivers are active.`);
    }

    // ยืนยันว่ารถทุกคันในลำดับหมุนยังพร้อมใช้
    const activeVehicleResult = await connection.execute<{ CNT: number }>(`
      SELECT COUNT(*) AS CNT
      FROM VEHICLE
      WHERE STATUS = 1 AND VEHICLE_ID IN (${vehicleCycle.map((_, index) => `:van${index}`).join(', ')})
    `, Object.fromEntries(vehicleCycle.map((id, index) => [`van${index}`, id])), { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const activeVehicles = Number(activeVehicleResult.rows?.[0]?.CNT ?? 0);
    if (activeVehicles !== vehicleCycle.length) {
      throw new Error(`Only ${activeVehicles} of ${vehicleCycle.length} reference vehicles are available.`);
    }

    const byDate: Record<string, { inserted: number; existing: number; skipped: number }> = {};
    const perDriverInserted: Record<string, number> = {};
    let insertedTotal = 0;
    let existingTotal = 0;
    let skippedTotal = 0;

    let day = startDate;
    while (day <= endDate) {
      const daySummary = { inserted: 0, existing: 0, skipped: 0 };
      for (let slot = 0; slot < departureTimes.length; slot += 1) {
        for (let routeIndex = 0; routeIndex < routeIds.length; routeIndex += 1) {
          const routeId = routeIds[routeIndex];
          const cycleIndex = slot * routeIds.length + routeIndex;
          const driverId = driverCycle[cycleIndex % driverCycle.length];
          const vehicleId = vehicleCycle[cycleIndex % vehicleCycle.length];
          const departureAt = `${day} ${departureTimes[slot]}:00`;

          // รอบเดิม (ไม่ว่าใครขับ) ถือว่ามีอยู่แล้ว รันซ้ำได้โดยไม่insert ซ้ำ
          const existing = await connection.execute(
            `SELECT TRIP_ID FROM TRIP
             WHERE ROUTE_ID = :routeId AND DEPARTURE_AT = TO_TIMESTAMP(:departureAt, 'YYYY-MM-DD HH24:MI:SS')
             FETCH FIRST 1 ROW ONLY`,
            { routeId, departureAt },
          );
          if (existing.rows?.length) {
            daySummary.existing += 1;
            continue;
          }

          const inFuture = await connection.execute(
            `SELECT 1 FROM DUAL
             WHERE TO_TIMESTAMP(:departureAt, 'YYYY-MM-DD HH24:MI:SS') > CURRENT_TIMESTAMP + NUMTODSINTERVAL(${FUTURE_MINUTES}, 'MINUTE')`,
            { departureAt },
          );
          if (!inFuture.rows?.length) continue;

          // คนขับหรือรถคันนี้ต้องไม่มีรอบที่คาบเกี่ยวอยู่
          const conflict = await connection.execute(
            `SELECT TRIP_ID FROM TRIP
             WHERE STATUS IN (1, 2)
               AND (DRIVER_ID = :driverId OR VEHICLE_ID = :vehicleId)
               AND DEPARTURE_AT > TO_TIMESTAMP(:departureAt, 'YYYY-MM-DD HH24:MI:SS') - NUMTODSINTERVAL(${CONFLICT_MINUTES}, 'MINUTE')
               AND DEPARTURE_AT < TO_TIMESTAMP(:departureAt, 'YYYY-MM-DD HH24:MI:SS') + NUMTODSINTERVAL(${CONFLICT_MINUTES}, 'MINUTE')
             FETCH FIRST 1 ROW ONLY`,
            { driverId, vehicleId, departureAt },
          );
          if (conflict.rows?.length) {
            daySummary.skipped += 1;
            continue;
          }

          await connection.execute(
            `INSERT INTO TRIP (ROUTE_ID, DRIVER_ID, VEHICLE_ID, DEPARTURE_AT, STATUS)
             VALUES (:routeId, :driverId, :vehicleId,
                     TO_TIMESTAMP(:departureAt, 'YYYY-MM-DD HH24:MI:SS'), 1)`,
            { routeId, driverId, vehicleId, departureAt },
          );
          daySummary.inserted += 1;
          perDriverInserted[driverId] = (perDriverInserted[driverId] ?? 0) + 1;
        }
      }
      byDate[day] = daySummary;
      insertedTotal += daySummary.inserted;
      existingTotal += daySummary.existing;
      skippedTotal += daySummary.skipped;
      day = addDays(day, 1);
    }

    await connection.commit();

    // สรุปจำนวนรอบต่อคนขับในช่วงวันที่เพิ่ม เพื่อยืนยันว่ากระจายครบและเท่ากัน
    const distributionResult = await connection.execute<{ DRIVER_ID: string; TRIPS: number }>(`
      SELECT DRIVER_ID, COUNT(*) AS TRIPS
      FROM TRIP
      WHERE ROUTE_ID IN (${routeList(routeIds)})
        AND DEPARTURE_AT >= TO_TIMESTAMP(:startDate, 'YYYY-MM-DD')
        AND DEPARTURE_AT < TO_TIMESTAMP(:endDate, 'YYYY-MM-DD') + 1
      GROUP BY DRIVER_ID
      ORDER BY DRIVER_ID
    `, {
      startDate,
      endDate,
      ...routeBinds(routeIds),
    }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const tripsPerDriver = (distributionResult.rows ?? []).map((row) => ({
      driverId: row.DRIVER_ID,
      tripsInRange: Number(row.TRIPS),
      insertedByScript: perDriverInserted[row.DRIVER_ID] ?? 0,
    }));

    const missingDrivers = driverCycle.filter((driverId) => !perDriverInserted[driverId]);

    console.log(JSON.stringify({
      status: 'seeded',
      currentDate,
      startDate,
      endDate,
      referenceDay: refDate,
      routes: routeIds,
      departureTimes: departureTimes.length,
      driversInRotation: driverCycle.length,
      vehiclesInRotation: vehicleCycle.length,
      inserted: insertedTotal,
      existing: existingTotal,
      skippedConflicts: skippedTotal,
      byDate,
      tripsPerDriver,
      driversWithoutNewTrips: missingDrivers,
    }, null, 2));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.close();
  }
} finally {
  await pool.close(10);
}

