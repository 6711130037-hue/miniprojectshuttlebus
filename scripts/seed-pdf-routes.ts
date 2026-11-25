import 'dotenv/config';
import oracledb from 'oracledb';

const { ORACLE_USER: user, ORACLE_PASSWORD: password, ORACLE_CONNECT_STRING: connectString } = process.env;
if (!user || !password || !connectString) throw new Error('Oracle environment configuration is incomplete.');

const definitions: { name: string; stops: ReadonlyArray<readonly [string, number]> }[] = [
  {
    name: 'เส้นทางที่ 1',
    stops: [
      ['มหาวิทยาลัยเทคโนโลยีมหานคร', 0],
      ['โลตัสหนองจอก', 5],
      ['โรงพยาบาลหนองจอก', 3],
      ['Big C หนองจอก', 6],
      ['โรงพยาบาลหนองจอก', 3],
      ['โลตัสหนองจอก', 3],
      ['มหาวิทยาลัยเทคโนโลยีมหานคร', 10],
    ],
  },
  {
    name: 'เส้นทางที่ 2',
    stops: [
      ['มหาวิทยาลัยเทคโนโลยีมหานคร', 0],
      ['โลตัสหนองจอก', 5],
      ['สวนสาธารณะหนองจอก', 3],
      ['ร้านส้มตำบ้านนา', 5],
    ],
  },
  {
    name: 'เส้นทางที่ 3',
    // The PDF heading says 12 minutes, but the segment values shown add up to 15.
    // Keep the segment values as the source of truth; ROUTE.TOTAL_TIME is trigger-derived.
    stops: [
      ['Big C หนองจอก', 0],
      ['โลตัสหนองจอก', 5],
      ['สวนสาธารณะหนองจอก', 3],
      ['ร้านส้มตำบ้านนา', 5],
      ['มหาวิทยาลัยเทคโนโลยีมหานคร', 2],
    ],
  },
];

const pool = await oracledb.createPool({ user, password, connectString, poolMin: 1, poolMax: 2, poolIncrement: 1 });
const connection = await pool.getConnection();
const binds = (data: Record<string, unknown>) => Object.fromEntries(Object.entries(data).map(([key, value]) => [key, { val: value }]));
const execute = (sql: string, values: Record<string, unknown>) => connection.execute(sql, binds(values), { autoCommit: false });
const one = async (sql: string, values: Record<string, unknown>) => {
  const result = await connection.execute<Record<string, unknown>>(sql, binds(values), { outFormat: oracledb.OUT_FORMAT_OBJECT });
  return result.rows?.[0];
};

try {
  const stopIds = new Map<string, number>();
  const stopNames = [...new Set(definitions.flatMap((route) => route.stops.map(([name]) => name)))];
  for (const name of stopNames) {
    await execute(`MERGE INTO STOP s
      USING (SELECT :name AS NAME FROM DUAL) x ON (s.NAME=x.NAME)
      WHEN NOT MATCHED THEN INSERT (NAME,DESCRIPTION,STATUS) VALUES (x.NAME,NULL,1)`, { name });
    const row = await one('SELECT STOP_ID FROM STOP WHERE NAME=:name AND STATUS=1 ORDER BY STOP_ID FETCH FIRST 1 ROW ONLY', { name });
    const stopId = Number(row?.STOP_ID);
    if (!Number.isSafeInteger(stopId) || stopId <= 0) throw new Error(`Could not resolve stop: ${name}`);
    stopIds.set(name, stopId);
  }

  const routeIds = new Map<string, number>();
  for (const route of definitions) {
    await execute(`MERGE INTO ROUTE r
      USING (SELECT :name AS NAME FROM DUAL) x ON (r.NAME=x.NAME)
      WHEN MATCHED THEN UPDATE SET r.STATUS=1
      WHEN NOT MATCHED THEN INSERT (NAME,STATUS) VALUES (x.NAME,1)`, { name: route.name });
    const row = await one('SELECT ROUTE_ID FROM ROUTE WHERE NAME=:name ORDER BY ROUTE_ID FETCH FIRST 1 ROW ONLY', { name: route.name });
    const routeId = Number(row?.ROUTE_ID);
    if (!Number.isSafeInteger(routeId) || routeId <= 0) throw new Error(`Could not resolve route: ${route.name}`);
    routeIds.set(route.name, routeId);

    for (const [index, [stopName, minutes]] of route.stops.entries()) {
      const stopId = stopIds.get(stopName);
      if (!stopId) throw new Error(`Could not resolve stop: ${stopName}`);
      await execute(`MERGE INTO ROUTE_STOP rs
        USING (SELECT :routeId AS ROUTE_ID,:stopOrder AS STOP_ORDER FROM DUAL) x
        ON (rs.ROUTE_ID=x.ROUTE_ID AND rs.STOP_ORDER=x.STOP_ORDER)
        WHEN MATCHED THEN UPDATE SET rs.STOP_ID=:stopId,rs.MINUTES_FROM_PREV=:minutes
        WHEN NOT MATCHED THEN INSERT (ROUTE_ID,STOP_ID,STOP_ORDER,MINUTES_FROM_PREV)
          VALUES (:routeId,:stopId,:stopOrder,:minutes)`, {
        routeId, stopId, stopOrder: index + 1, minutes,
      });
    }
  }

  // Hide the synthetic loop from Passenger route choices while retaining its historical trips/bookings.
  await execute("UPDATE ROUTE SET STATUS=0 WHERE NAME='Development Shuttle Loop' AND STATUS<>0", {});
  await connection.commit();

  const summary = [];
  for (const [name, routeId] of routeIds) {
    const row = await one('SELECT TOTAL_TIME,(SELECT COUNT(*) FROM ROUTE_STOP WHERE ROUTE_ID=:routeId) AS STOP_COUNT FROM ROUTE WHERE ROUTE_ID=:routeId', { routeId });
    summary.push({ route: name, routeId, totalTime: Number(row?.TOTAL_TIME), stopCount: Number(row?.STOP_COUNT) });
  }
  console.log(JSON.stringify({ status: 'seeded', summaries: summary, syntheticRouteHidden: true }));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.close();
  await pool.close(0);
}
