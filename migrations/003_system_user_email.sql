-- One-time Oracle migration to add required email addresses to SYSTEM_USER.
-- Existing rows are backfilled from USERNAME; replace those values with the
-- users' actual email addresses before making the column NOT NULL if needed.
-- Run once in SQL Developer against an existing schema.

ALTER TABLE SYSTEM_USER ADD (
    EMAIL VARCHAR2(100 CHAR)
);

UPDATE SYSTEM_USER
SET EMAIL = USERNAME
WHERE EMAIL IS NULL;

ALTER TABLE SYSTEM_USER MODIFY (
    EMAIL VARCHAR2(100 CHAR) NOT NULL
);

COMMIT;
