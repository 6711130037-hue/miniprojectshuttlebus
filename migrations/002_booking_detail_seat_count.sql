-- One-time Oracle migration from individually numbered seats to seat quantities.
-- Existing details with matching booking, trip, route segment, leg, and status
-- are consolidated. Different check-in states remain separate detail rows.
-- Run once in SQL Developer as a script against the existing schema.

DROP INDEX UX_BD_ACTIVE_SEAT;

ALTER TABLE BOOKING_DETAIL ADD (
    SEAT_COUNT NUMBER(2) DEFAULT 1 NOT NULL
);

MERGE INTO BOOKING_DETAIL target
USING (
    SELECT DETAIL_ID,
           COUNT(*) OVER (
               PARTITION BY BOOKING_ID, TRIP_ID, ROUTE_ID,
                            PICKUP_ROUTE_STOP_ID, DROPOFF_ROUTE_STOP_ID,
                            LEG_TYPE, STATUS_CODE, CHECKED_IN_AT,
                            CHECKED_IN_BY_EMPLOYEE_ID
           ) AS SEAT_COUNT
    FROM BOOKING_DETAIL
) source
ON (target.DETAIL_ID = source.DETAIL_ID)
WHEN MATCHED THEN UPDATE SET target.SEAT_COUNT = source.SEAT_COUNT;

DELETE FROM BOOKING_DETAIL
WHERE DETAIL_ID IN (
    SELECT DETAIL_ID
    FROM (
        SELECT DETAIL_ID,
               ROW_NUMBER() OVER (
                   PARTITION BY BOOKING_ID, TRIP_ID, ROUTE_ID,
                                PICKUP_ROUTE_STOP_ID, DROPOFF_ROUTE_STOP_ID,
                                LEG_TYPE, STATUS_CODE, CHECKED_IN_AT,
                                CHECKED_IN_BY_EMPLOYEE_ID
                   ORDER BY CREATED_AT, DETAIL_ID
               ) AS ROW_NUMBER_IN_GROUP
        FROM BOOKING_DETAIL
    )
    WHERE ROW_NUMBER_IN_GROUP > 1
);

ALTER TABLE BOOKING_DETAIL DROP COLUMN SEAT_NUMBER;

ALTER TABLE BOOKING_DETAIL ADD CONSTRAINT CK_BD_SEAT_COUNT
    CHECK (SEAT_COUNT BETWEEN 1 AND 4);

COMMIT;