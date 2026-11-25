# คู่มือซ้อมตอบอาจารย์
## ระบบจองตั๋วรถโดยสาร MUT Shuttle Bus System

เอกสารนี้เป็น "คู่มือซ้อมตอบ" สำหรับสอบปากเปล่า/ตอบคำถามอาจารย์ ทุกคำตอบสร้างจาก**โค้ดจริงของโปรเจกต์นี้เท่านั้น** ไม่ได้เดา และไม่ได้สร้างชื่อ File / Function / API / Table / Column ขึ้นเอง ชื่อ code ทั้งหมดเป็นภาษาอังกฤษตามโค้ด ส่วนคำอธิบายเป็นภาษาไทย

**วิธีใช้:** อ่านหัวข้อ "ภาพรวม" ให้เข้าใจก่อน แล้วซ้อมตอบในส่วน "คำถาม–คำตอบ" โดยพูดตอบด้วยประโยคในช่อง "คำตอบแบบพูดตอบอาจารย์" และยิงหลักฐานด้วย "หลักฐานในโค้ด" ถ้าอาจารย์ถามต่อ ให้ใช้ "คำถามต่อยอด–คำตอบต่อยอด"

### สารบัญ

| หัวข้อ | เรื่อง | คะแนนตอบคำถาม |
|---|---|---:|
| 1 | Login / Logout ตามสิทธิ์ที่กำหนด | 2 |
| 2 | จัดการสิทธิ์แบบ dynamic เพิ่ม–ลบ–แก้ไข–ค้นหา | 3 |
| 3 | จัดการพนักงาน เพิ่ม–ลบ–แก้ไข–ค้นหา | 3 |
| 4 | ระบบการจอง + ตรวจสอบเงื่อนไขในการจอง | 5 |
| 5 | ระบบการจอง + Gen QR Code และดูรอบที่จะมาถึง | 1 |
| 6 | ระบบการจอง + ยกเลิกตามเงื่อนไขและคืนที่นั่ง | 3 |
| 7 | ระบบคนขับ + แสดงตารางงานรายวัน | 1 |
| 8 | ระบบคนขับ + เริ่มงานและดูผู้โดยสารตามจุดจอด | 1 |
| 9 | ระบบคนขับ + เช็ค QR Code ของผู้โดยสาร | 1 |
| 10 | ระบบคนขับ + แสดง/สแกน QR ผู้โดยสารที่มาใช้จริง | 3 |

### โครงสร้างไฟล์ระบบที่ต้องรู้จัก

| ส่วน | ไฟล์หลัก |
|---|---|
| Backend (Express + Oracle) | `server/app.ts`, `server/routes/*.ts`, `server/auth/*.ts`, `server/middleware/*.ts` |
| Frontend (React + TypeScript) | `src/App.tsx`, `src/context/BusContext.tsx`, `src/api/client.ts`, `src/components/**` |
| ฐานข้อมูล | `database.sql`, `migrations/*.sql` |

การติดตั้ง route ใน `server/app.ts` (บรรทัด 16–22):

```ts
app.use('/api/auth', createAuthRouter(pool));
app.use('/api/admin', createAdminRouter(pool));
app.use('/api', createCatalogRouter(pool));
app.use('/api/bookings', createBookingsRouter(pool));
app.use('/api/driver', createDriverRouter(pool));
app.use('/api', createHealthRouter(pool));
app.use(errorHandler);
```

> หมายเหตุ: ระบบมี 2 โหมดคือ **API mode** (ข้อมูลจริงจาก Oracle) และ **โหมดจำลอง/ออกแบบ** (ข้อมูลใน `src/data/mockDatabase.ts`) คำตอบทั้งหมดในเอกสารนี้อ้างอิง**โหมด API** เพราะเป็นส่วนที่เขียนลงฐานข้อมูลจริง


# หัวข้อ 1: Login / Logout ตามสิทธิ์ที่กำหนด (2 คะแนน)

## ภาพรวม

ระบบแยกปลายทางล็อกอินออกเป็น 3 endpoint ตามบทบาท คือผู้โดยสาร คนขับ และผู้ดูแลระบบ ทุกเคสอ่านบัญชีจาก Oracle แล้วตรวจรหัสผ่านด้วย `verifyPassword` (scrypt) ก่อนสร้าง session แบบ Bearer token คนขับและแอดมินจะต้องมีสิทธิ์หน้าจอในตาราง `ROLE_PERMISSION` ด้วย จึงจะล็อกอินผ่าน ฝั่งเว็บเก็บ token ไว้ใน `sessionStorage` แนบทุกคำขอ และ logout คือการลบ session ฝั่งเซิร์ฟเวอร์ + ล้าง token ฝั่งเว็บ

## จุดสำคัญในโค้ด

| เรื่อง | ไฟล์ | Function / Route | บรรทัด |
|---|---|---|---|
| ติดตั้ง router | `server/app.ts` | `app.use('/api/auth', ...)` | 16 |
| เช็ก body | `server/routes/auth.ts` | `credentials()` | 12–24 |
| ล็อกอินผู้โดยสาร | `server/routes/auth.ts` | `POST /api/auth/passenger/login` | 85–118 |
| ล็อกอินคนขับ | `server/routes/auth.ts` | `POST /api/auth/driver/login` | 120–169 |
| ล็อกอินแอดมิน | `server/routes/auth.ts` | `POST /api/auth/admin/login` | 171–220 |
| สมัครผู้โดยสาร | `server/routes/auth.ts` | `POST /api/auth/passenger/register` | 29–83 |
| ออกจากระบบ | `server/routes/auth.ts` | `POST /api/auth/logout` | 226–230 |
| แฮช/ตรวจรหัสผ่าน | `server/auth/password.ts` | `hashPassword()`, `verifyPassword()` | 24–35, 37–58 |
| เก็บ session | `server/auth/sessions.ts` | `createSession()`, `getSession()`, `deleteSession()` | 18–41 |
| เช็ก token ทุกคำขอ | `server/middleware/requireAuth.ts` | `requireAuth(kind?)` | 9–21 |
| เรียก API ฝั่งเว็บ | `src/api/client.ts` | `apiLogin()`, `api()` | 30–36, 19–28 |
| ฟอร์มล็อกอิน | `src/components/auth/LoginScreen.tsx` | `handleFormSubmit` | 44–96 |
| ล็อกอินแล้วโหลดข้อมูล | `src/context/BusContext.tsx` | `apiLoginComplete`, `apiAdminLoginComplete` | 1390, 1649 |
| logout ฝั่งเว็บ | `src/context/BusContext.tsx` | `logout()` | 1938–1944 |

**Database:** `SYSTEM_USER` (PK `USER_ID`, columns `USERNAME`, `PASSWORD_HASH`, `IS_ACTIVE`), `EMPLOYEE` (PK `EMPLOYEE_ID`, columns `USERNAME`, `PASSWORD_HASH`, `POSITION_ID` FK → `POSITION`, `IS_ACTIVE`), `ROLE_PERMISSION` (PK `PERMISSION_ID`, FK `POSITION_ID`, `SCREEN_ID`), `SCREEN` (PK `SCREEN_ID`, unique `SCREEN_CODE`)

## คำถามและคำตอบ

### ข้อ 1.1 (ระดับ 1) ระบบมี endpoint ล็อกอินอะไรบ้าง และอยู่ไฟล์ไหน?

**คำตอบแบบพูดตอบอาจารย์:** "มี 3 ตัวครับ อยู่ใน `server/routes/auth.ts` ทั้งหมด คือ `POST /api/auth/passenger/login`, `POST /api/auth/driver/login`, และ `POST /api/auth/admin/login` ครับ"

**หลักฐานในโค้ด:** File `server/routes/auth.ts` บรรทัด 85, 120, 171 — ทั้งสาม route อยู่ใน `createAuthRouter(pool)` และ `server/app.ts` บรรทัด 16 mount ไว้ที่ `/api/auth`

**คำถามต่อยอด:** "ทำไมต้องแยก 3 endpoint ไม่ใช้ตัวเดียวแล้วเช็ก role ทีหลัง?"
**คำตอบต่อยอด:** "เพราะแต่ละบทบาทอ่านคนละตารางและมีเงื่อนไขต่างกัน ผู้โดยสารอ่าน `SYSTEM_USER` ส่วนคนขับ/แอดมินอ่าน `EMPLOYEE` และคนขับต้องเช็กสิทธิ์หน้าจอ 8820 แอดมินต้องเช็กหน้าจอ 1101/1102/1103 ครับ"

### ข้อ 1.2 (ระดับ 2) ล็อกอินผู้โดยสารทำงานอย่างไร ทีละขั้น?

**คำตอบแบบพูดตอบอาจารย์:** "ผู้ใช้กรอก username/password ใน `LoginScreen` แล้วฟอร์มเรียก `apiLogin('passenger', ...)` ซึ่งยิง `POST /api/auth/passenger/login` ฝั่งเซิร์ฟเวอร์เช็ก body ด้วย `credentials()` แล้ว SELECT จาก `SYSTEM_USER` เงื่อนไข `USERNAME = :username AND IS_ACTIVE = 'Y'` ถ้าไม่พบหรือรหัสผ่านไม่ผ่านจะได้ 401 ถ้าผ่านก็ `createSession()` แล้วคืน token กลับมา ฝั่งเว็บเก็บ token ลง `sessionStorage` ครับ"

**หลักฐานในโค้ด:**
- File `server/routes/auth.ts` บรรทัด 85–118 — SQL `SELECT USER_ID, NAME, USERNAME, PASSWORD_HASH, USER_TYPE, PHONE FROM SYSTEM_USER WHERE USERNAME = :username AND IS_ACTIVE = 'Y'` (88–92) และ `if (!user || !(await verifyPassword(...))) throw new HttpError(401, ...)` (96–98)
- File `src/api/client.ts` บรรทัด 30–36 — `const result = await api(.../auth/${role}/login...); apiToken.set(result.token)`

**Flow:** `LoginScreen.handleFormSubmit` → `apiLogin()` → `POST /api/auth/passenger/login` → ค้น `SYSTEM_USER` → `verifyPassword` → `createSession` → คืน `token` → `apiToken.set()` เก็บใน `sessionStorage`

**คำถามต่อยอด:** "ถ้าผู้ใช้ถูกปิดบัญชี (`IS_ACTIVE = 'N'`) จะเกิดอะไรขึ้น?"
**คำตอบต่อยอด:** "SELECT มีเงื่อนไข `IS_ACTIVE = 'Y'` ด้วย แถวจะไม่ถูกดึงมาจึงได้ 401 Invalid username or password ครับ"

### ข้อ 1.3 (ระดับ 2) รหัสผ่านถูกเก็บอย่างไร และตรวจอย่างไร?

**คำตอบแบบพูดตอบอาจารย์:** "ไม่เก็บ plaintext ครับ ใช้ `scrypt` N=16384, r=8, p=1, key 64 bytes และ salt สุ่ม 16 byte เก็บในคอลัมน์ `PASSWORD_HASH` รูปแบบ `scrypt$16384$8$1$<salt>$<key>` ตอนตรวจ ฟังก์ชัน `verifyPassword` จะแตก string เป็น 6 ส่วน ตรวจพารามิเตอร์ให้ตรง แล้ว derive key ใหม่จาก salt เดิม แล้วเทียบด้วย `timingSafeEqual` ซึ่งปลอดภัยกว่าการเทียบ string ตรง ๆ ครับ"

**หลักฐานในโค้ด:** File `server/auth/password.ts` — ค่าคงที่บรรทัด 3–7, `hashPassword()` บรรทัด 24–35, `verifyPassword()` บรรทัด 37–58 (คืน `false` ทันทีถ้า salt ยาวไม่ใช่ 16 หรือ key ไม่ใช่ 64 บรรทัด 52 และคืน `timingSafeEqual(actual, expected)` บรรทัด 54)

**คำถามต่อยอด:** "ถ้าข้อมูลในฐานข้อมูลถูกแก้ `PASSWORD_HASH` เป็นค่าอื่น จะเข้าสู่ระบบได้ไหม?"
**คำตอบต่อยอด:** "ถ้าแก้เป็นข้อความธรรมดาจะไม่ผ่าน เพราะ `verifyPassword` เช็กว่ามี 6 ส่วนและขึ้นต้นด้วย `scrypt` พร้อมพารามิเตอร์ตรงเงื่อนไข ไม่ตรงก็คืน `false` แล้วได้ 401 ครับ"


# หัวข้อ 1 (ต่อ): คำถามระดับ 2–3

### ข้อ 1.4 (ระดับ 2) รหัสผ่านถูกต้องแล้ว ทำไมบางคนยังล็อกอินไม่ได้?

**คำตอบแบบพูดตอบอาจารย์:** "สำหรับคนขับ ระบบจะตรวจสิทธิ์หน้าจอต่อครับ — หลัง `verifyPassword` ผ่านแล้ว `POST /driver/login` จะ query `ROLE_PERMISSION JOIN SCREEN` เงื่อนไข `POSITION_ID ของพนักงาน` + `SCREEN_CODE = '8820'` + `CAN_VIEW = 'Y'` ถ้าไม่พบจะได้ 403 พร้อมข้อความบอกว่ารหัสผ่านถูกต้องแต่ยังไม่ได้รับสิทธิ์หน้าจอคนขับ ให้ผู้ดูแลไปกำหนดสิทธิ์ก่อน ครับ ส่วนแอดมินต้องมีสิทธิ์อย่างน้อยหนึ่งใน `1101`, `1102`, `1103` ครับ"

**Relevant Code** (`server/routes/auth.ts` 135–149):

```sql
SELECT 1 AS ALLOWED
FROM ROLE_PERMISSION RP JOIN SCREEN S ON S.SCREEN_ID = RP.SCREEN_ID
WHERE RP.POSITION_ID = :positionId
  AND S.SCREEN_CODE = :screenCode      -- '8820'
  AND RP.CAN_VIEW = 'Y'
```

```ts
if (!hasDriverScreenPermission) {
  throw new HttpError(403, 'ชื่อผู้ใช้และรหัสผ่านถูกต้อง แต่ตำแหน่งนี้ยังไม่ได้รับสิทธิ์หน้าจอคนขับ (8820) ...');
}
```

**คำถามต่อยอด:** ถ้าแอดมินเพิกถอนสิทธิ์ 8820 ของคนขับคนนี้ คนขับที่ล็อกอินค้างอยู่จะเป็นอย่างไร?
**คำตอบต่อยอด:** "session เดิมยังใช้ได้จนหมดอายุ (12 ชั่วโมง) แต่ทุกคำขอใน `driver.ts` มี `requireScreenPermission` ที่ query `ROLE_PERMISSION` ใหม่ทุกครั้ง จึงจะโดน 403 ทันทีในคำขอถัดไปครับ ต่างจากตอนล็อกอินที่เช็กเฉพาะตอนเริ่ม"

### ข้อ 1.5 (ระดับ 2) Token มาจากไหน เก็บที่ไหน หมดอายุเมื่อไหร่?

**คำตอบแบบพูดตอบอาจารย์:** "ตอนล็อกอิน `createSession` สุ่ม `randomBytes(32).toString('base64url')` เป็น token แล้วเก็บใน `Map` ของเซิร์ฟเวอร์พร้อม `expiresAt = Date.now() + 12 ชั่วโมง` (`SESSION_LIFETIME_MS = 12 * 60 * 60 * 1000`) ฝั่งเว็บเก็บใน `sessionStorage` คีย์ `shuttle_api_token` แล้ว `api()` จะแนบ `Authorization: Bearer <token>` ทุกคำขอครับ"

**หลักฐานในโค้ด:** `server/auth/sessions.ts` 15–27 (`SESSION_LIFETIME_MS`, `sessions = new Map()`, `createSession`), 29–37 (`getSession` ลบ token ที่หมดอายุ), `src/api/client.ts` 13–17, 22–23

**คำถามต่อยอด:** ถ้า token หมดอายุ ระบบตอบอย่างไร?
**คำตอบต่อยอด:** "`getSession` คืน `undefined` เมื่อ `expiresAt <= Date.now()` แล้วลบออกจาก Map ทำให้ `requireAuth` คืน 401 'Authentication required' ครับ"

### ข้อ 1.6 (ระดับ 2) ระบบตรวจสอบสิทธิ์ทุกคำขออย่างไร?

**คำตอบแบบพูดตอบอาจารย์:** "ด้วย middleware `requireAuth(kind)` ครับ — ดึง header `authorization` จับด้วย regex `/^Bearer\s+([A-Za-z0-9_-]+)$/i` แล้วเรียก `getSession(token)` ถ้าไม่เจอ session หรือ `kind` ไม่ตรงกับที่ route ต้องการ จะ `next(new HttpError(401))` ถ้าผ่านจะใส่ session ไว้ที่ `response.locals.authSession` ให้ handler เรียกผ่าน `sessionFrom(response)` ครับ"

**Relevant Code** (`server/middleware/requireAuth.ts` 9–21):

```ts
export function requireAuth(kind?: SessionKind): RequestHandler {
  return (request, response, next) => {
    const authorization = request.header('authorization') ?? '';
    const match = /^Bearer\s+([A-Za-z0-9_-]+)$/i.exec(authorization);
    const session = match ? getSession(match[1]) : undefined;
    if (!session || (kind && session.kind !== kind)) {
      next(new HttpError(401, 'Authentication required'));
      return;
    }
    response.locals.authSession = session;
    next();
  };
}
```

**คำถามต่อยอด:** ถ้าแอดมินเอา token ของผู้โดยสารไปใช้?
**คำตอบต่อยอด:** "ไม่ได้ครับ เพราะ `router.use(requireAuth('admin'))` (`admin.ts` 62) และ `requireAuth('passenger')` (`bookings.ts` 27) เช็ก `session.kind` ไม่ตรงกัน → 401"

### ข้อ 1.7 (ระดับ 2) กด Logout เกิดอะไรขึ้นทั้งสองฝั่ง?

**คำตอบแบบพูดตอบอาจารย์:** "ฝั่งเว็บ `logout()` ใน `BusContext` จะยิง `POST /api/auth/logout` ก่อน แล้วล้าง token ด้วย `apiToken.clear()` ตั้ง `setApiMode(false)` รีเซ็ต state เป็นผู้โดยสาร ส่วนเซิร์ฟเวอร์ `POST /logout` เรียก `deleteSession(session.token)` ซึ่งลบออกจาก `Map` ทันที ทำให้ token นั้นใช้ต่อไม่ได้เลยครับ"

**หลักฐานในโค้ด:** `src/context/BusContext.tsx` 1938–1944, `server/routes/auth.ts` 226–230, `server/auth/sessions.ts` 39–41

**คำถามต่อยอด:** ถ้าไม่เรียก API logout แล้วปิด browser เลย?
**คำตอบต่อยอด:** "token ยังอยู่ใน `Map` ฝั่งเซิร์ฟเวอร์จนกว่าจะหมดอายุ 12 ชั่วโมง แต่ `sessionStorage` ของ tab นั้นถูกล้างเมื่อปิด จึงไม่มี token ให้ใช้ต่อ อย่างไรก็ตาม token ที่ถูก copy ไปจะยังใช้ได้จนหมดอายุ ซึ่งเป็นลักษณะของ token ที่ไม่มีกลไกลบฝั่ง client ครับ"

### ข้อ 1.8 (ระดับ 3) ถ้า restart API ระหว่างที่คนใช้งาน จะเกิดอะไรขึ้น?

**คำตอบแบบพูดตอบอาจารย์:** "ผู้ใช้ทุกคนจะถูก logout ออกเพราะ `sessions` เป็น `Map` ในหน่วยความจำของ process พอ process ใหม่เริ่มต้น Map ว่าง คำขอถัดไปจะได้ 401 ครับ ข้อมูลใน Oracle ไม่ได้รับผลกระทบ และ token ที่ client เก็บไว้จะกลายเป็น token ที่ใช้ไม่ได้ ต้องล็อกอินใหม่"

**หลักฐานในโค้ด:** `server/auth/sessions.ts` 16 (`const sessions = new Map<string, AuthSession>();`) — ไม่มีการ persist ลงฐานข้อมูลหรือไฟล์

**คำถามต่อยอด:** ถ้าอยากให้ session อยู่รอดตอน restart ต้องทำอย่างไร?
**คำตอบต่อยอด:** "ต้องย้ายไปเก็บในตาราง Oracle (เช่น ตาราง SESSION ที่มี TOKEN, EXPIRES_AT) แล้วเปลี่ยน `createSession/getSession/deleteSession` ให้ query แทน หรือใช้ JWT ที่ตรวจสอบได้เองโดยไม่ต้องเก็บฝั่งเซิร์ฟเวอร์ ครับ"

## สิ่งที่ต้องจำ (หัวข้อ 1)

1. 3 endpoint ล็อกอินใน `server/routes/auth.ts` (85 / 120 / 171) + `POST /logout` (226) + `GET /me` (222)
2. `verifyPassword` = scrypt + `timingSafeEqual` — ไม่เทียบ plaintext
3. คนขับต้องมี `SCREEN_CODE='8820'` และแอดมินต้องมี `1101/1102/1103` อย่างน้อยหนึ่งตัว (`CAN_VIEW='Y'`) ไม่เช่นนั้น 403
4. Token = `randomBytes(32)` base64url, อายุ 12 ชม., เก็บใน `Map` ฝั่งเซิร์ฟเวอร์ + `sessionStorage` ฝั่งเว็บ (คีย์ `shuttle_api_token`)
5. `requireAuth(kind)` ตรวจ regex Bearer + `session.kind` → 401
6. Logout = `deleteSession()` + `apiToken.clear()`
7. **ข้อจำกัด:** session อยู่ในหน่วยความจำ → restart แล้วหาย


# หัวข้อ 2: จัดการสิทธิ์แบบ dynamic เพิ่ม–ลบ–แก้ไข–ค้นหา (3 คะแนน)

## ภาพรวม

สิทธิ์ถูกกำหนดแบบ **RBAC** คือผูก `EMPLOYEE.POSITION_ID` → `POSITION` → ตารางกลาง `ROLE_PERMISSION` → `SCREEN` โดยแต่ละคู่ (ตำแหน่ง, หน้าจอ) มี `CAN_VIEW` และ `CAN_EDIT` คำว่า "dynamic" หมายถึงผู้ดูแลเพิ่ม/แก้/ลบคู่ตำแหน่ง–หน้าจอได้จากหน้าเว็บโดยไม่ต้องแก้โค้ด ฝั่งเซิร์ฟเวอร์ตรวจสิทธิ์ซ้ำทุกครั้งที่เรียก endpoint ที่มีการแก้ข้อมูล ไม่ได้พึ่งการซ่อนปุ่มอย่างเดียว

## จุดสำคัญในโค้ด

| เรื่อง | ไฟล์ | Function / Route | บรรทัด |
|---|---|---|---|
| หน้าจอทั้งหมด (โค้ดหน้าจอ) | `src/data/mockDatabase.ts` | `initialScreens` | 70–78 |
| ตารางสิทธิ์ตัวอย่าง | `src/data/mockDatabase.ts` | `initialPermissions` | 83–97 |
| เช็กสิทธิ์ฝั่งเว็บ | `src/context/BusContext.tsx` | `canViewScreen()`, `canEditScreen()`, `getPermittedScreens()` | 709–741 |
| เพิ่มสิทธิ์ (เว็บ) | `src/context/BusContext.tsx` | `addPermission()` | 743–798 |
| แก้สิทธิ์ (เว็บ) | `src/context/BusContext.tsx` | `updatePermission()` | 805–837 |
| ลบสิทธิ์ (เว็บ) | `src/context/BusContext.tsx` | `deletePermission()` | 800–803 |
| หน้าจัดการสิทธิ์ | `src/components/live/screens/RbacManagementView.tsx` | `handleAddPermissionSubmit`, ปุ่ม toggle, ค้นหา | 48–64, 255–316, 66–84 |
| เรียก API สิทธิ์ | `src/api/client.ts` | `apiUpsertPermission()`, `apiHideAdminRecord()` | 253–262, 241–245 |
| เพิ่ม/อัปเดตสิทธิ์ (เซิร์ฟ) | `server/routes/admin.ts` | `POST /api/admin/permissions` | 618–661 |
| ซ่อนสิทธิ์ (เซิร์ฟ) | `server/routes/admin.ts` | `POST /api/admin/visibility/hide` | 910–954 |
| ตรวจสิทธิ์ก่อนแก้ข้อมูล | `server/routes/admin.ts` | `requireScreenEdit(pool, screenCode)` | 16–37 |
| ตรวจสิทธิ์คนขับ | `server/routes/driver.ts` | `requireScreenPermission(pool, canEdit)` | 19–39 |

**Database:** `SCREEN` (PK `SCREEN_ID`, unique `SCREEN_CODE`), `ROLE_PERMISSION` (PK `PERMISSION_ID`, FK `POSITION_ID` → `POSITION`, FK `SCREEN_ID` → `SCREEN`, columns `CAN_VIEW`, `CAN_EDIT`), `WEB_HIDDEN_RECORD` (PK `(ENTITY_NAME, RECORD_KEY, OWNER_ID)`)

**Constraint สำคัญใน `database.sql`:** `CK_RP_CAN_VIEW`, `CK_RP_CAN_EDIT`, `CK_RP_EDIT_REQUIRES_VIEW CHECK (CAN_EDIT = 'N' OR CAN_VIEW = 'Y')`, `UQ_RP_POSITION_SCREEN UNIQUE (POSITION_ID, SCREEN_ID)`

### คำถามและคำตอบ

### ข้อ 2.1 (ระดับ 1) ข้อมูลสิทธิ์เก็บอยู่ตารางไหน มีคอลัมน์อะไรบ้าง?

**คำตอบแบบพูดตอบอาจารย์:** "เก็บในตาราง `ROLE_PERMISSION` ครับ คอลัมน์หลักคือ `PERMISSION_ID` (PK), `POSITION_ID` (FK ไป `POSITION`), `SCREEN_ID` (FK ไป `SCREEN`), `CAN_VIEW` และ `CAN_EDIT` ส่วนตาราง `SCREEN` เก็บ `SCREEN_CODE` เป็น string 4 ตัวอักษร เช่น 9102, 8820 ครับ"

**หลักฐานในโค้ด:** `database.sql` — `PK_ROLE_PERMISSION`, `UQ_RP_POSITION_SCREEN`, `CK_RP_CAN_VIEW`, `CK_RP_CAN_EDIT`, `CK_RP_EDIT_REQUIRES_VIEW`, `FK_RP_POSITION`, `FK_RP_SCREEN`

**คำถามต่อยอด:** ถ้าตั้ง `CAN_EDIT='Y'` แต่ `CAN_VIEW='N'` ระบบยอมไหม?
**คำตอบต่อยอด:** "ไม่ยอม 2 ชั้นครับ ที่ฐานข้อมูลมี `CK_RP_EDIT_REQUIRES_VIEW` และที่ API `server/routes/admin.ts` บรรทัด 627 `if (canEdit && !canView) throw new HttpError(400, 'สิทธิ์แก้ไขต้องเปิดสิทธิ์ดูด้วย')`"


# หัวข้อ 2 (ต่อ): คำถามระดับ 2

### ข้อ 2.2 (ระดับ 2) กด "เพิ่มการกำหนดสิทธิ์ใหม่" ในหน้าเว็บ แล้วเกิดอะไรขึ้นบ้าง?

**คำตอบแบบพูดตอบอาจารย์:** "ฟอร์มเรียก `handleAddPermissionSubmit` ใน `RbacManagementView` แล้วส่งต่อให้ `addPermission(positionId, screenId, canView, canEdit)` ใน `BusContext` ซึ่งถ้าเป็น API mode จะแปลง `screen_id` เป็น `screen_code` แล้วเรียก `POST /api/admin/permissions` ฝั่งเซิร์ฟเวอร์ตรวจรูปแบบ `screen_code` ต้องเป็นเลข 4 หลัก ค้น `SCREEN` เอา `SCREEN_ID` แล้ว `MERGE` เข้า `ROLE_PERMISSION` — คู่นี้มีอยู่แล้วจะ UPDATE ไม่มีจะ INSERT แล้วคืนแถวที่บันทึกกลับมาให้หน้าเว็บอัปเดต state ครับ"

**หลักฐานในโค้ด:**
- `src/components/live/screens/RbacManagementView.tsx` 48–64: `await addPermission(newPermPosId, newPermScreenId, newPermCanView, newPermCanEdit)`
- `src/api/client.ts` 253–262: `POST /admin/permissions` body `{ position_id, screen_code, can_view, can_edit }`
- `server/routes/admin.ts` 618–661: ตรวจ input (624–627) → `SELECT SCREEN_ID FROM SCREEN WHERE SCREEN_CODE = :screenCode` (630–633, ไม่พบ → 404) → `MERGE INTO ROLE_PERMISSION` (635–647)

**Relevant Code** (`server/routes/admin.ts` 635–647):

```ts
await connection.execute(`
  MERGE INTO ROLE_PERMISSION target
  USING (SELECT :positionId POSITION_ID, :oracleScreenId SCREEN_ID FROM dual) source
  ON (target.POSITION_ID = source.POSITION_ID AND target.SCREEN_ID = source.SCREEN_ID)
  WHEN MATCHED THEN UPDATE SET target.CAN_VIEW = :canView, target.CAN_EDIT = :canEdit
  WHEN NOT MATCHED THEN INSERT (POSITION_ID, SCREEN_ID, CAN_VIEW, CAN_EDIT)
    VALUES (:positionId, :oracleScreenId, :canView, :canEdit)
`, { positionId, oracleScreenId, canView: canView ? 'Y' : 'N', canEdit: canEdit ? 'Y' : 'N' });
```

**Flow:** ปุ่ม "เพิ่ม" → modal → `handleAddPermissionSubmit` → `addPermission` → `apiUpsertPermission` → `POST /api/admin/permissions` → `requireScreenEdit('9102')` ตรวจ `CAN_EDIT` → `MERGE ROLE_PERMISSION` → คืน `permission` → `setPermissions()` อัปเดตหน้าจอ

**คำถามต่อยอด:** ทำไมใช้ `MERGE` ไม่ใช้ `INSERT` ตรง ๆ?
**คำตอบต่อยอด:** "เพราะ PK ของ `ROLE_PERMISSION` คือ `PERMISSION_ID` ไม่ใช่คู่ (position, screen) ถ้า INSERT ตรง ๆ แล้วคู่เดิมซ้ำจะเกิดแถวซ้ำ หน้าเดียวมีสิทธิ์ 2 แถว `MERGE` เงื่อนไข `ON (POSITION_ID, SCREEN_ID)` ทำให้คู่เดิมถูกอัปเดตแทนครับ"

### ข้อ 2.3 (ระดับ 2) แก้สิทธิ์ด้วยปุ่ม toggle "ดู" / "แก้ไข" ทำอย่างไร?

**คำตอบแบบพูดตอบอาจารย์:** "ปุ่มเรียก `updatePermission(permissionId, 'can_view', ...)` หรือ `'can_edit'` ครับ ตัว function คำนวณค่าใหม่ก่อนว่า ถ้า `can_view` เป็น false จะต้องบังคับ `can_edit = can_edit && can_view` ด้วย ไม่ให้เหลือสิทธิ์แก้ไขโดยไม่มีสิทธิ์ดู แล้วเรียก `POST /api/admin/permissions` ตัวเดียวกับการเพิ่ม (upsert) แล้วอัปเดต state ครับ"

**หลักฐานในโค้ด:** `src/context/BusContext.tsx` 805–837 โดยเฉพาะ:

```ts
const nextCanView = field === 'can_view' ? val : current.can_view;
const nextCanEdit = field === 'can_edit' ? val : current.can_edit && nextCanView;
```

ปุ่มอยู่ที่ `RbacManagementView.tsx` 255–305 และ `disabled={!canEdit}`

**คำถามต่อยอด:** ถ้าผู้ใช้ไม่มีสิทธิ์แก้ (`CAN_EDIT='N'`) ระบบป้องกันอย่างไร?
**คำตอบต่อยอด:** "3 ชั้นครับ (1) หน้าเว็บ `disabled={!canEdit}` กดไม่ได้ (2) `server/routes/admin.ts` endpoint `POST /permissions` มี `requireScreenEdit(pool, RBAC_SCREEN)` ตรวจ `CAN_EDIT='Y'` ใน Oracle → 403 (3) constraint ที่ฐานข้อมูล ถ้าข้ามหน้าเว็บยิง API ตรง ๆ จะโดน 403 ครับ"


# หัวข้อ 2 (ต่อ): คำถามระดับ 2–3

### ข้อ 2.4 (ระดับ 2) "ลบสิทธิ์" ลบแถว `ROLE_PERMISSION` จริงไหม ทำงานอย่างไร?

**คำตอบแบบพูดตอบอาจารย์:** "ไม่ลบครับ ฝั่งเว็บ `deletePermission(permissionId)` เรียก `apiHideAdminRecord('permission', permissionId)` → `POST /api/admin/visibility/hide` ซึ่งจะ `MERGE` เข้า `WEB_HIDDEN_RECORD` ด้วย `ENTITY_NAME='permission'`, `OWNER_ID='*'` แถวสิทธิ์ใน Oracle ยังอยู่ครบ แต่ `GET /admin/masters` จะไม่คืนแถวที่ถูกซ่อน และ `requireScreenEdit` ก็เช็ก `NOT EXISTS` ใน `WEB_HIDDEN_RECORD` ด้วย จึงถือว่าไม่มีสิทธิ์จริงครับ"

**หลักฐานในโค้ด:**
- `src/context/BusContext.tsx` 800–803: `const deletePermission = async (permissionId) => { if (apiMode) await apiHideAdminRecord('permission', permissionId); setPermissions(prev => prev.filter(p => p.permission_id !== permissionId)); }`
- `server/routes/admin.ts` 910–954 (entity `permission` ใช้ screen `9102`, table `ROLE_PERMISSION`) และ 945–951 `MERGE INTO WEB_HIDDEN_RECORD`
- `server/routes/admin.ts` 27–30 ใน `requireScreenEdit`: `AND NOT EXISTS (SELECT 1 FROM WEB_HIDDEN_RECORD H WHERE H.ENTITY_NAME = 'permission' AND H.RECORD_KEY = TO_CHAR(RP.PERMISSION_ID) AND H.OWNER_ID = '*')`

**คำถามต่อยอด:** ถ้ากด "เพิ่มสิทธิ์" คู่เดิมที่เคยลบไปแล้ว ระบบคืนสิทธิ์ไหม?
**คำตอบต่อยอด:** "คืนครับ เพราะ `POST /permissions` มี `DELETE FROM WEB_HIDDEN_RECORD WHERE ENTITY_NAME = 'permission' AND RECORD_KEY = TO_CHAR(:permissionId) AND OWNER_ID = '*'` ที่ `server/routes/admin.ts` 653–656 แปลว่า upsert รอบเดียวก็ยกเลิกการซ่อนให้ด้วย"

### ข้อ 2.5 (ระดับ 2) ค้นหา/กรองสิทธิ์ทำงานอย่างไร?

**คำตอบแบบพูดตอบอาจารย์:** "เป็นการกรองฝั่ง client ใน `RbacManagementView` ครับ มี 2 ตัวกรอง คือ `permFilterPosId` เลือกตำแหน่ง และ `searchQuery` ที่เทียบกับ 3 字段 คือชื่อตำแหน่ง ชื่อหน้าจอ และ `screen_code` ผลลัพธ์ถูกจับกลุ่มตามตำแหน่งด้วย `groupedByPosition` ครับ"

**หลักฐานในโค้ด:** `src/components/live/screens/RbacManagementView.tsx` 66–84:

```ts
const filteredPermissions = permissions.filter((p) => {
  if (permFilterPosId !== 'all' && p.position_id !== permFilterPosId) return false;
  if (!searchQuery) return true;
  const pos = positions.find((x) => x.position_id === p.position_id);
  const scr = screens.find((x) => x.screen_id === p.screen_id);
  const q = searchQuery.toLowerCase();
  return (pos?.name || '').toLowerCase().includes(q)
      || (scr?.name || '').toLowerCase().includes(q)
      || (scr?.code || '').toLowerCase().includes(q);
});
```

**คำถามต่อยอด:** รายการสิทธิ์ที่เอามากรองมาจาก API ตัวไหน?
**คำตอบต่อยอด:** "`GET /api/admin/masters` ครับ คอลัมน์ `permissions` ที่ `server/routes/admin.ts` 89–97 ซึ่ง JOIN `SCREEN` เอา `SCREEN_CODE`, `CAN_VIEW`, `CAN_EDIT` มาด้วย และกรองแถวที่ถูกซ่อนออกแล้ว"

### ข้อ 2.6 (ระดับ 3) ทำไมระบบถึงเรียกว่า "dynamic" ไม่ใช่ hard-code?

**คำตอบแบบพูดตอบอาจารย์:** "เพราะคู่ตำแหน่ง–หน้าจอและค่า `CAN_VIEW`/`CAN_EDIT` เก็บเป็นข้อมูลในตาราง `ROLE_PERMISSION` ไม่ได้เขียนเป็น if ในโค้ดครับ เวลาเพิ่มตำแหน่งใหม่หรือเพิ่มหน้าจอใหม่ แค่เพิ่มแถวในตาราง ระบบก็ทำงานทันที ฝั่งเซิร์ฟเวอร์ก็ตรวจด้วย `SCREEN_CODE` จากฐานข้อมูล ไม่ใช่ค่าคงที่ในโค้ด ยกเว้นจอเฉพาะทาง เช่น 8820 ของคนขับ ที่กำหนดไว้เป็น `DRIVER_SCREEN_CODE` ครับ"

**หลักฐานในโค้ด:** `server/routes/admin.ts` 9–14 ประกาศ `EMPLOYEE_SCREEN='1101'`, `RBAC_SCREEN='9102'`, `TRIP_SCREEN='3456'`, `ROUTE_SCREEN='6794'` แล้วส่งเข้า `requireScreenEdit()` ซึ่ง query `WHERE S.SCREEN_CODE = :screenCode AND RP.CAN_EDIT='Y'` (20–31)

**คำถามต่อยอด:** จุดอ่อนของระบบนี้มีอะไรบ้าง?
**คำตอบต่อยอด:** "(1) หน้าเว็บยังโหลด `initialScreens` จาก `src/data/mockDatabase.ts` (BusContext บรรทัด 300 `useState<ScreenItem[]>(initialScreens)`) จึงต้องให้ `SCREEN_CODE` ตรงกับฐานข้อมูล (2) `canViewScreen` มี fallback `if (targetPosId === 1) return true;` ซึ่งตำแหน่ง 1 ได้สิทธิ์ทุกหน้า (3) session เก็บในหน่วยความจำเซิร์ฟเวอร์ ทำให้สิทธิ์ที่เปลี่ยนระหว่าง login มีผลกับคำขอถัดไปเพราะตรวจจาก DB ทุกครั้ง แต่สิทธิ์ที่ frontend cache ไว้ใน state ต้อง reload ครับ"


# หัวข้อ 3: จัดการพนักงาน เพิ่ม–ลบ–แก้ไข–ค้นหา (3 คะแนน)

## ภาพรวม

หน้า `FleetStaffManagementView` (แท็บ "พนักงาน") ใช้เพิ่ม แก้ไข ค้นหา และซ่อนพนักงาน การเพิ่ม/แก้ไขใน API mode ส่งไป `POST /api/admin/employees` และ `PUT /api/admin/employees/:employeeId` ซึ่งทั้งคู่ถูกป้องกันด้วย `requireScreenEdit('1101')` ส่วนการ "ลบ" ในระบบนี้คือการซ่อนด้วย `WEB_HIDDEN_RECORD` **ไม่ใช่การลบแถว** รหัสผ่านถูกแฮชด้วย `hashPassword` ที่เซิร์ฟเวอร์เสมอ

## จุดสำคัญในโค้ด

| เรื่อง | ไฟล์ | Function / Route | บรรทัด |
|---|---|---|---|
| เพิ่มพนักงาน (เว็บ) | `src/components/live/screens/FleetStaffManagementView.tsx` | `handleCreateEmployee` | 77–100 |
| แก้พนักงาน (เว็บ) | `src/components/live/screens/FleetStaffManagementView.tsx` | `handleUpdateEmployee` | 164–179 |
| ค้นหาพนักงาน (เว็บ) | `src/components/live/screens/FleetStaffManagementView.tsx` | `filteredEmployees` | 181–194 |
| เรียก API | `src/api/client.ts` | `apiCreateEmployee`, `apiUpdateEmployee`, `apiHideEmployee` | 185–197, 199–211, 213–215 |
| เพิ่มพนักงาน (เซิร์ฟ) | `server/routes/admin.ts` | `POST /api/admin/employees` | 130–165 |
| แก้พนักงาน (เซิร์ฟ) | `server/routes/admin.ts` | `PUT /api/admin/employees/:employeeId` | 167–232 |
| ซ่อนพนักงาน (เซิร์ฟ) | `server/routes/admin.ts` | `POST /api/admin/employees/:employeeId/hide` | 234–248 |
| โหลดรายชื่อ | `server/routes/admin.ts` | `GET /api/admin/masters` | 67–74 |
| แปลง error Oracle | `server/routes/admin.ts` | `mapOracleError()` | 51–58 |
| ตรวจนามสกุล | `server/routes/admin.ts` | `textField()` | 39–49 |

**Database:** `EMPLOYEE` — PK `EMPLOYEE_ID`, FK `DEPARTMENT_ID` → `DEPARTMENT`, FK `POSITION_ID` → `POSITION`, columns `FULL_NAME`, `USERNAME` (unique), `PASSWORD_HASH`, `PHONE`, `EMAIL`, `IS_ACTIVE`, `CREATED_AT`, `UPDATED_AT`

## คำถามและคำตอบ

### ข้อ 3.1 (ระดับ 1) โค้ดส่วนเพิ่มพนักงานอยู่ตรงไหน?

**คำตอบแบบพูดตอบอาจารย์:** "ฝั่งหน้าเว็บอยู่ที่ `FleetStaffManagementView.tsx` ฟังก์ชัน `handleCreateEmployee` บรรทัด 77 ส่วน API อยู่ที่ `server/routes/admin.ts` `POST /api/admin/employees` บรรทัด 130 ครับ"

**Flow:** กรอกฟอร์ม → `handleCreateEmployee` (เช็ก `if (!canEdit) return` บรรทัด 79) → `apiCreateEmployee` → `POST /api/admin/employees` → `requireScreenEdit('1101')` → `textField()` validate → `hashPassword` → gen `EMPLOYEE_ID` → `INSERT INTO EMPLOYEE` → `201 { employee }` → ปิด modal

**คำถามต่อยอด:** `employee_id` ตรวจสอบซ้ำตรงไหน?
**คำตอบต่อยอด:** "ที่ `server/routes/admin.ts` 149–154 ครับ สุ่ม `E` + เลข 9 หลัก (`randomInt(0, 1_000_000_000).toString().padStart(9,'0')`) แล้ว `SELECT 1 FROM EMPLOYEE WHERE EMPLOYEE_ID = :candidate` ถ้ามีอยู่แล้วสุ่มใหม่ สูงสุด 5 ครั้ง ถ้าหมดก็คืน HTTP 503 ครับ"

### ข้อ 3.2 (ระดับ 2) Validation อะไรบ้างตอนเพิ่มพนักงาน?

**คำตอบแบบพูดตอบอาจารย์:** "เริ่มจาก `textField()` เช็กเป็น string ไม่เว้นว่างและไม่ยาวเกิน (ชื่อ 150, username 50, โทรศัพท์ 20, อีเมล 100) แล้วเช็ก `department_id`/`position_id` ต้องเป็นจำนวนเต็มบวก รหัสผ่านอย่างน้อย 8 ตัว และรูปแบบอีเมลต้องผ่าน regex ไม่ผ่านจะได้ 400 ก่อนถึงฐานข้อมูลครับ"

**Relevant Code** (`server/routes/admin.ts` 139–145):

```ts
if (!Number.isSafeInteger(departmentId) || departmentId <= 0 ||
    !Number.isSafeInteger(positionId) || positionId <= 0) {
  throw new HttpError(400, 'ฝ่าย/แผนกและตำแหน่งไม่ถูกต้อง');
}
if (password.length < 8) throw new HttpError(400, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'รูปแบบอีเมลไม่ถูกต้อง');
const passwordHash = await hashPassword(password);
```

**คำถามต่อยอด:** ถ้า username ซ้ำจะเกิดอะไรขึ้น?
**คำตอบต่อยอด:** "Oracle คืน errorNum = 1 แล้ว `mapOracleError` (51–58) แปลงเป็น 409 'ข้อมูลซ้ำ กรุณาตรวจสอบรหัสหรือชื่อที่กรอก' ฝั่งเว็บรับ error ที่ `setEmployeeCreateError` บรรทัด 98 ครับ"


# หัวข้อ 3 (ต่อ): คำถามระดับ 2

### ข้อ 3.3 (ระดับ 2) ตอนเพิ่ม/แก้ไข รหัสผ่านถูกบันทึกอย่างไร?

**คำตอบแบบพูดตอบอาจารย์:** "เซิร์ฟเวอร์แฮชก่อน INSERT เสมอด้วย `hashPassword` แล้วเก็บลง `PASSWORD_HASH` ไม่มี plaintext ลง Oracle ส่วนตอนแก้ไข ถ้าผู้ใช้ไม่กรอกรหัสผ่านใหม่ (`password` เป็นค่าว่าง) ระบบจะไม่สร้าง `passwordUpdate` จึงไม่แตะ `PASSWORD_HASH` เลยครับ"

**Relevant Code** (`server/routes/admin.ts` 145, 156–158 และ 191–202):

```ts
const passwordHash = await hashPassword(password);            // ตอนเพิ่ม
INSERT INTO EMPLOYEE (..., PASSWORD_HASH, ...) VALUES (..., :passwordHash, ...)

const passwordHash = password ? await hashPassword(password) : null;   // ตอนแก้
const passwordUpdate = passwordHash ? ', PASSWORD_HASH = :passwordHash' : '';
UPDATE EMPLOYEE SET FULL_NAME = :fullname, ..., UPDATED_AT = SYSTIMESTAMP${passwordUpdate}
WHERE EMPLOYEE_ID = :employeeId
```

**คำถามต่อยอด:** รหัสผ่านตอนแก้ไม่กรอก → ฐานข้อมูลเปลี่ยนไหม?
**คำตอบต่อยอด:** "ไม่เปลี่ยนครับ ตัว `passwordUpdate` จะเป็น string ว่าง ทำให้ SQL ไม่มี `PASSWORD_HASH = :passwordHash` ส่วน frontend ส่ง `editPassword` เฉพาะเมื่อผู้ใช้กรอก (`FleetStaffManagementView.tsx` บรรทัด 171)"

### ข้อ 3.4 (ระดับ 2) ขั้นตอนแก้ไขพนักงานทำงานอย่างไร?

**คำตอบแบบพูดตอบอาจารย์:** "หน้าเว็บเรียก `handleUpdateEmployee` แล้วส่ง `apiUpdateEmployee(editingEmp, editPassword)` → `PUT /api/admin/employees/:employeeId` ฝั่งเซิร์ฟเวอร์อยู่ใน transaction แล้ว `SELECT ... FOR UPDATE` เพื่อล็อกแถวก่อน ถ้าไม่เจอคืน 404 ถ้ามีก็ `UPDATE EMPLOYEE` ครบทุกคอลัมน์ (รวม `UPDATED_AT`) แล้ว SELECT แถวใหม่คืนกลับมาให้หน้าเว็บครับ"

**หลักฐานในโค้ด:** `server/routes/admin.ts` 167–232 — `SELECT EMPLOYEE_ID FROM EMPLOYEE WHERE EMPLOYEE_ID = :employeeId FOR UPDATE` (186–189), `UPDATE EMPLOYEE SET FULL_NAME, USERNAME, PHONE, EMAIL, DEPARTMENT_ID, POSITION_ID, UPDATED_AT = SYSTIMESTAMP${passwordUpdate}` (193–212), คืนค่าจาก SELECT ใหม่ (213–227)

**คำถามต่อยอด:** ทำไมต้อง `FOR UPDATE`?
**คำตอบต่อยอด:** "เพื่อล็อกแถวไม่ให้มีคนแก้พร้อมกันแล้วข้อมูลทับกัน (lost update) และทำให้ 404 กับ UPDATE อยู่ใน transaction เดียวกันครับ"

### ข้อ 3.5 (ระดับ 2) ค้นหาพนักงานทำงานอย่างไร?

**คำตอบแบบพูดตอบอาจารย์:** "เป็นการกรองฝั่ง client ครับ ตัวแปร `empSearchQuery` ถูก lower case แล้วเทียบกับ 7 字段 คือ `employee_id`, `fullname`, `username`, `phone`, `email`, ชื่อตำแหน่ง และ `ฝ่าย {department_id}` ถ้า query ว่างแสดงทั้งหมด รายชื่อมาจาก `GET /api/admin/masters` ซึ่งฝั่งเซิร์ฟเวอร์กรองแล้วว่า `IS_ACTIVE='Y'` และไม่อยู่ใน `WEB_HIDDEN_RECORD` ครับ"

**Relevant Code** (`src/components/live/screens/FleetStaffManagementView.tsx` 181–194):

```ts
const filteredEmployees = employees.filter((emp) => {
  const q = empSearchQuery.toLowerCase().trim();
  if (!q) return true;
  const pos = positions.find((p) => p.position_id === emp.position_id);
  return (
    emp.employee_id.toLowerCase().includes(q) ||
    emp.fullname.toLowerCase().includes(q) ||
    emp.username.toLowerCase().includes(q) ||
    emp.phone.toLowerCase().includes(q) ||
    emp.email.toLowerCase().includes(q) ||
    (pos?.name && pos.name.toLowerCase().includes(q)) ||
    `ฝ่าย ${emp.department_id}`.toLowerCase().includes(q)
  );
});
```

**คำถามต่อยอด:** ฝั่งเซิร์ฟเวอร์มี parameter ค้นหาไหม?
**คำตอบต่อยอด:** "ไม่มีครับ `GET /admin/masters` ดึงทั้งหมดแล้วกรองในเบราว์เซอร์ เหมาะกับข้อมูลปริมาณน้อย ถ้าจะ scale ควรเพิ่ม query parameter ครับ"


# หัวข้อ 3 (ต่อ): คำถามระดับ 3

### ข้อ 3.6 (ระดับ 2) ปุ่ม "ลบ" พนักงาน ลบตารางจริงไหม ทำงานอย่างไร?

**คำตอบแบบพูดตอบอาจารย์:** "ไม่ลบแถวครับ เป็นการซ่อนอย่างเดียว — `POST /api/admin/employees/:employeeId/hide` จะ `MERGE` เข้า `WEB_HIDDEN_RECORD` ด้วย `ENTITY_NAME='employee'`, `RECORD_KEY=EMPLOYEE_ID`, `OWNER_ID='*'` ทำให้ `GET /admin/masters` ไม่คืนแถวนั้นครับ"

**Relevant Code** (`server/routes/admin.ts` 234–248):

```ts
await connection.execute(`
  MERGE INTO WEB_HIDDEN_RECORD target
  USING (SELECT 'employee' ENTITY_NAME, :employeeId RECORD_KEY, '*' OWNER_ID FROM dual) source
  ON (target.ENTITY_NAME = source.ENTITY_NAME AND target.RECORD_KEY = source.RECORD_KEY
      AND target.OWNER_ID = source.OWNER_ID)
  WHEN NOT MATCHED THEN INSERT (ENTITY_NAME, RECORD_KEY, OWNER_ID)
    VALUES (source.ENTITY_NAME, source.RECORD_KEY, source.OWNER_ID)
`, { employeeId });
```

ส่วน query รายชื่อที่ `server/routes/admin.ts` 67–74: `WHERE E.IS_ACTIVE = 'Y' AND NOT EXISTS (SELECT 1 FROM WEB_HIDDEN_RECORD H WHERE H.ENTITY_NAME='employee' AND H.RECORD_KEY = E.EMPLOYEE_ID AND H.OWNER_ID='*')`

**คำถามต่อยอด:** พนักงานที่ถูกซ่อนแล้วยังล็อกอินได้ไหม?
**คำตอบต่อยอด:** "ในโค้ดปัจจุบัน**ยังได้ครับ** เพราะการซ่อนไม่ได้ตั้ง `IS_ACTIVE='N'` และ `POST /driver/login` เช็กเฉพาะ `IS_ACTIVE='Y'` (`server/routes/auth.ts` 126) จุดนี้เป็นข้อจำกัดที่ควรบอกอาจารย์ตรง ๆ ว่า ถ้าเป็นระบบจริงต้องเพิ่มการปิดบัญชีแยกจากการซ่อนรายการครับ"

### ข้อ 3.7 (ระดับ 3) ถ้าอยากให้พนักงานที่ถูก "ลบ" ล็อกอินไม่ได้เลย ต้องแก้ตรงไหน?

**คำตอบแบบพูดตอบอาจารย์:** "มี 2 ทางครับ ทางแรก เพิ่ม `UPDATE EMPLOYEE SET IS_ACTIVE = 'N'` ใน endpoint `/hide` ซึ่ง `IS_ACTIVE` ถูกใช้เป็นเงื่อนไขอยู่แล้วใน query ล็อกอิน ทางสอง คือแยกเป็น endpoint deactivate ต่างหาก เพื่อไม่ให้ "ซ่อนจากหน้าเว็บ" กับ "ปิดบัญชี" เป็นเรื่องเดียวกัน ทั้งสองทางไม่ต้องแก้ schema เพราะ `EMPLOYEE.IS_ACTIVE` มีอยู่แล้วและมี `CK_EMPLOYEE_ACTIVE CHECK (IS_ACTIVE IN ('Y','N'))` ครับ"

**หลักฐานในโค้ด:** `database.sql` `CK_EMPLOYEE_ACTIVE`, `server/routes/auth.ts` 91/126/177 (`AND IS_ACTIVE = 'Y'`), `server/routes/admin.ts` 234–248 (ไม่มี UPDATE `IS_ACTIVE`)

**คำถามต่อยอด:** ถ้าแก้แบบนี้ พนักงานที่มีรอบรถวันนี้จะเกิดอะไรขึ้น?
**คำตอบต่อยอด:** "รอบรถใน `TRIP` มี FK `DRIVER_ID` → `EMPLOYEE` จึงยังอยู่ครบ แต่คนขับจะล็อกอินไม่ได้ ดังนั้นควรยกเลิก/โอนรอบก่อน ซึ่งปัจจุบัน endpoint `/hide` ไม่ได้เช็กว่ามีรอบรถค้างอยู่ (ต่างจาก `visibility/hide` ของ position/department ที่เช็กพนักงานที่ผูกอยู่ บรรทัด 937–944) ครับ"

## สิ่งที่ต้องจำ (หัวข้อ 3)

1. เพิ่ม: `POST /api/admin/employees` (admin.ts 130) → `requireScreenEdit('1101')` → `textField` validate → `hashPassword` → สุ่ม `EMPLOYEE_ID` 5 ครั้ง → `INSERT`
2. แก้: `PUT /api/admin/employees/:employeeId` (admin.ts 167) → `SELECT FOR UPDATE` → `UPDATE` (รหัสผ่านเปลี่ยนเฉพาะตอนกรอก)
3. ค้นหา: ฝั่ง client `filteredEmployees` เทียบ 7 字段 + รายชื่อมาจาก `GET /admin/masters`
4. ลบ = ซ่อน: `WEB_HIDDEN_RECORD` `OWNER_ID='*'` ไม่ลบแถว แต่**ยังล็อกอินได้** (ข้อจำกัด)
5. รหัสผ่านถูกแฮชที่เซิร์ฟเวอร์เสมอ ไม่มี plaintext ในฐานข้อมูล
6. รหัสผ่านซ้ำ/ข้อมูลซ้ำ → `mapOracleError` errorNum 1 → HTTP 409


# หัวข้อ 4: ระบบการจอง — การจองและตรวจสอบเงื่อนไข (5 คะแนน)

## ภาพรวม

การจองทำใน `PassengerPortal` ผู้โดยสารเลือกเส้นทาง → จุดขึ้น/จุดลง → วันที่ → เลือกรอบ → ใส่จำนวนที่นั่ง (1–4) → ยืนยัน ทุกอย่างถูกตรวจที่เซิร์ฟเวอร์ใน `POST /api/bookings` (`server/routes/bookings.ts`) ภายใน transaction เดียวพร้อม **ล็อกแถว `TRIP` ด้วย `FOR UPDATE`** เพื่อป้องกันการจองเกินความจุพร้อมกัน เงื่อนไขที่ตรวจมี 5 กลุ่ม: (1) รอบรถเปิด/วันที่จองได้ (2) จุดขึ้น–จุดลงอยู่บนเส้นทางเดียวกันและลำดับถูกต้อง (3) ต้องจองล่วงหน้าอย่างน้อย 20 นาทีก่อนถึงจุดขึ้น (4) รถใช้งานได้ (5) ที่นั่งในช่วง那段ไม่เกินความจุ

## จุดสำคัญในโค้ด

| เรื่อง | ไฟล์ | Function / Route | บรรทัด |
|---|---|---|---|
| ปุ่มยืนยันจอง (เว็บ) | `src/components/live/PassengerPortal.tsx` | `handleConfirmAllStagedBookings` | 500–542 |
| เรียก API จอง | `src/context/BusContext.tsx` | `apiCreateBooking` | 1894–1901 |
| ตรวจ input | `server/routes/bookings.ts` | `bookingInput()` | 14–23 |
| จอง (เซิร์ฟ) | `server/routes/bookings.ts` | `POST /api/bookings` | 101–230 |
| ที่นั่งว่าง (list) | `server/routes/catalog.ts` | `GET /api/trips` (REMAINING_SEATS) | 92–144 |
| ดูที่นั่งรายรอบ | `server/routes/catalog.ts` | `GET /api/trips/:tripId/seats` | 149+ |

**Database:**
- `BOOKING` — PK `BOOKING_ID`, unique `BOOKING_CODE`, FK `USER_ID` → `SYSTEM_USER`, columns `JOURNEY_TYPE`, `BOOKING_TIME`
- `BOOKING_DETAIL` — PK `DETAIL_ID`, FK `BOOKING_ID`, FK `(TRIP_ID, ROUTE_ID)` → `TRIP`, columns `PICKUP_ROUTE_STOP_ID`, `DROPOFF_ROUTE_STOP_ID`, `SEAT_COUNT`, `STATUS_CODE`
- Constraints: `CK_BD_SEAT_COUNT CHECK (SEAT_COUNT BETWEEN 1 AND 4)`, `CK_BD_STATUS CHECK (STATUS_CODE IN (0,1,2,3,4))`, `CK_BD_DISTINCT_ROUTE_STOPS CHECK (PICKUP <> DROPOFF)`
- `TRIP` — PK `TRIP_ID` (+ unique `(TRIP_ID, ROUTE_ID)`), FK `ROUTE_ID`, `DRIVER_ID` → `EMPLOYEE`, `VEHICLE_ID` → `VEHICLE`, `CK_TRIP_STATUS CHECK (STATUS IN (0,1,2,3))`

## คำถามและคำตอบ

### ข้อ 4.1 (ระดับ 1) ผู้โดยสารกด "ยืนยันการจอง" แล้วข้อมูลไหลไปไหนบ้าง?

**คำตอบแบบพูดตอบอาจารย์:** "เริ่มที่ `PassengerPortal.handleConfirmAllStagedBookings` บรรทัด 500 ซึ่งวนลูปรายการที่เลือกไว้แล้วเรียก `apiCreateBooking(trip_id, pickup_route_stop_id, dropoff_route_stop_id, seat_count)` ฝั่ง `BusContext` จะยิง `POST /api/bookings` พร้อม body 4 ฟิลด์ เซิร์ฟเวอร์ตรวจเงื่อนไขทั้งหมดใน transaction แล้ว INSERT `BOOKING` + `BOOKING_DETAIL` คืน `booking_code` กลับมา หน้าเว็บจะแสดงตั๋วพร้อม QR ครับ"

**หลักฐานในโค้ด:** `PassengerPortal.tsx` 511 (`issued.push(await apiCreateBooking(...))`), `BusContext.tsx` 1898 (`await api<{...}>('/bookings', { method: 'POST', body: JSON.stringify({ trip_id, pickup_route_stop_id, dropoff_route_stop_id, seat_count }) })`), `server/routes/bookings.ts` 101–230

**Flow:** `handleConfirmAllStagedBookings` → `apiCreateBooking` → `POST /api/bookings` → `requireAuth('passenger')` → `bookingInput()` → transaction: `SELECT TRIP FOR UPDATE` → 5 เงื่อนไข → `INSERT BOOKING` → `INSERT BOOKING_DETAIL` → commit → คืน `201 { booking_id, booking_code, qr_payload, ... }` → `apiRefreshBookings()` → แสดง QR

### ข้อ 4.2 (ระดับ 2) เงื่อนไขการจองมีอะไรบ้าง และตรวจที่บรรทัดไหน?

**คำตอบแบบพูดตอบอาจารย์:** "ครบทั้ง 5 กลุ่มครับ ใน `server/routes/bookings.ts`:
1. **รอบรถมีอยู่จริง** — ไม่เจอ → 404 (บรรทัด 122)
2. **สถานะรอบต้องเปิด** `TRIP.STATUS = 1` — ไม่ใช่ → 409 'Trip is not open for booking' (123)
3. **วันที่จองได้เฉพาะวันนี้หรือพรุ่งนี้** ตามเวลา `Asia/Bangkok` (CASE บรรทัด 111–116, ตรวจ 124–126)
4. **จุดขึ้น/จุดลงต้องอยู่บนเส้นทางของรอบนั้น** (128–141) และ **ลำดับจุดขึ้นต้องน้อยกว่าจุดลง** (144–146)
5. **ต้องจองก่อนถึงจุดขึ้นอย่างน้อย 20 นาที** (148–166)
6. **รถต้องสถานะ 1** และ **ที่นั่งช่วงที่ซ้อนกันต้องไม่เกินความจุ** (168–183)"

**หลักฐานในโค้ด:** ดู `Relevant Code` ในข้อ 4.3–4.5

**คำถามต่อยอด:** "ถ้าจองจุดลงก่อนจุดขึ้นระบบว่าอย่างไร?"
**คำตอบต่อยอด:** "`if (pickupOrder >= dropoffOrder) throw new HttpError(400, 'Pickup must be before drop-off on the route')` บรรทัด 144–146 ครับ"

### ข้อ 4.3 (ระดับ 2) สูตรตัดรอบ 20 นาที คำนวณอย่างไร?

**คำตอบแบบพูดตอบอาจารย์:** "ระบบคำนวณ 'เวลาที่รถจะถึงจุดขึ้น' = `DEPARTURE_AT` + ผลรวม `MINUTES_FROM_PREV` ของทุกจุดจอดตั้งแต่ต้นทางจนถึงจุดขึ้น แล้วเทียบว่าต้องมากกว่าหรือเท่ากับ `SYSTIMESTAMP + 20 นาที` ถ้าน้อยกว่าถือว่าเลย cutoff → 409 ครับ"

**Relevant Code** (`server/routes/bookings.ts` 148–166):

```sql
SELECT CASE WHEN T.DEPARTURE_AT + NUMTODSINTERVAL(
  (SELECT NVL(SUM(RS.MINUTES_FROM_PREV), 0) FROM ROUTE_STOP RS
   WHERE RS.ROUTE_ID = T.ROUTE_ID AND RS.STOP_ORDER <= PICKUP.STOP_ORDER), 'MINUTE')
  >= SYSTIMESTAMP + NUMTODSINTERVAL(20, 'MINUTE') THEN 1 ELSE 0 END AS CUTOFF_OK
FROM TRIP T JOIN ROUTE_STOP PICKUP ON ... WHERE T.TRIP_ID = :tripId
```

ถ้า `CUTOFF_OK != 1` → `HttpError(409, 'Booking must be made at least 20 minutes before arrival at pickup')` (บรรทัด 164–166)

**คำถามต่อยอด:** "ถ้าเปลี่ยน 20 เป็น 60 นาที จะเกิดอะไรขึ้น?"
**คำตอบต่อยอด:** "แก้ค่าใน `NUMTODSINTERVAL(20, 'MINUTE')` บรรทัด 155 และข้อความข้อผิดพลาด 165 เท่านั้น ส่วนฝั่งหน้าเว็บที่ disable ปุ่มจองใกล้เวลาก็ต้องแก้ตามเพื่อให้ตรงกันครับ"


# หัวข้อ 4 (ต่อ): คำถามระดับ 2–3

### ข้อ 4.4 (ระดับ 2) ระบบคำนวณ "ที่นั่งว่าง" อย่างไร สูตรคืออะไร?

**คำตอบแบบพูดตอบอาจารย์:** "นับแบบ **ช่วงซ้อนทับ (segment overlap)** ไม่ใช่นับทั้งรอบครับ ระบบ SUM `SEAT_COUNT` ของรายการจองที่ `STATUS_CODE <> 0` และมีช่วงขึ้น–ลงซ้อนกับช่วงที่เรากำลังจอง โดยเทียบด้วย `STOP_ORDER` ถ้าผลรวม + ที่นั่งที่จะจอง > ความจุรถ ก็ไม่ให้จอง 409 ครับ"

**Relevant Code** (`server/routes/bookings.ts` 173–183):

```sql
SELECT NVL(SUM(BD.SEAT_COUNT), 0) AS BOOKED_COUNT
FROM BOOKING_DETAIL BD
JOIN ROUTE_STOP PICK_RS ON PICK_RS.ROUTE_ID = BD.ROUTE_ID AND PICK_RS.ROUTE_STOP_ID = BD.PICKUP_ROUTE_STOP_ID
JOIN ROUTE_STOP DROP_RS ON DROP_RS.ROUTE_ID = BD.ROUTE_ID AND DROP_RS.ROUTE_STOP_ID = BD.DROPOFF_ROUTE_STOP_ID
WHERE BD.TRIP_ID = :tripId AND BD.STATUS_CODE <> 0
  AND PICK_RS.STOP_ORDER < :newDropOrder AND DROP_RS.STOP_ORDER > :newPickupOrder
```

```ts
if (Number(occupancy[0]?.BOOKED_COUNT ?? 0) + seatCount > capacity) {
  throw new HttpError(409, 'Not enough seats remain on this trip');
}
```

`capacity` มาจาก `SELECT CAPACITY FROM VEHICLE WHERE VEHICLE_ID = :vehicleId AND STATUS = 1` (168–172) ถ้ารถถูกปิดใช้งานจะได้ 409 'Assigned vehicle is unavailable'

**Logic สำคัญ:** เงื่อนไข `PICK_ORDER < newDropOrder AND DROP_ORDER > newPickupOrder` คือเกณฑ์ interval overlap แบบ half-open ทำให้ผู้โดยสารที่ขึ้น–ลงคนละช่วงไม่แย่งที่นั่งกัน (เช่น คน A ลงก่อนที่ B จะขึ้น ใช้ที่นั่งเดียวกันได้)

**คำถามต่อยอด:** สูตรเดียวกันใช้แสดงที่นั่งว่างในหน้าเลือกรอบด้วยไหม?
**คำตอบต่อยอด:** "ใช้ครับ `GET /api/trips` ใน `server/routes/catalog.ts` 92–144 คำนวณ `REMAINING_SEATS = V.CAPACITY - SUM(...)` ด้วยเงื่อนไข overlap เดียวกัน ถ้าส่ง `pickupRouteStopId`/`dropoffRouteStopId` มาด้วยจะนับเฉพาะช่วงซ้อน (บรรทัด 111–112) ถ้าไม่ส่งจะนับรวมทั้งรอบเพื่อไม่ให้หน้าเก่าพังครับ"

### ข้อ 4.5 (ระดับ 3) ป้องกันการจองเกินความจุพร้อมกัน (race condition) อย่างไร?

**คำตอบแบบพูดตอบอาจารย์:** "ใช้การล็อกแถว `TRIP` ด้วย `FOR UPDATE` ใน transaction เดียวกับการตรวจความจุครับ — `SELECT ... FROM TRIP WHERE TRIP_ID = :tripId FOR UPDATE` ถ้าผู้ใช้ 2 คนกดพร้อมกัน คำขอที่ 2 จะรอ lock จนคำขอที่ 1 commit แล้วจึงเห็นจำนวนจองล่าสุด ทำให้ตรวจความจุด้วยข้อมูลใหม่ นอกจากนี้ถ้าเกิด errorNum = 1 (ชนกัน) ระบบจะแปลงเป็น 409 'One or more seats were booked concurrently; refresh availability' ครับ"

**หลักฐานในโค้ด:** `server/routes/bookings.ts` — `FOR UPDATE` บรรทัด 109–120, `withTransaction` 108, `catch` + `oracleErrorNumber(error) === 1` 215–220

**Flow:** `withTransaction` เริ่ม → `SELECT TRIP FOR UPDATE` (ล็อก) → ตรวจวันที่/จุดจอด/cutoff/ความจุ → `INSERT BOOKING` → `INSERT BOOKING_DETAIL` → commit (ปล่อยล็อก) → 201

**คำถามต่อยอด:** ถ้าปล่อย lock ไม่ตรงจุด จะเกิดอะไรขึ้น?
**คำตอบต่อยอด:** "ถ้าตรวจความจุโดยไม่ล็อก 2 คำขออาจอ่านค่า `BOOKED_COUNT` เดียวกันแล้วต่างฝ่ายต่าง insert ทำให้ยอดเกินความจุ การล็อก `TRIP` แถวเดียวทำให้การจองรอบนั้น ๆ ขนานกันไม่ได้ครับ ส่วนคนละรอบก็ล็อกคนละแถว ไม่ติดกันครับ"

### ข้อ 4.6 (ระดับ 2) รับมากี่ที่นั่งต่อการจอง และใครเป็นคนบังคับ?

**คำตอบแบบพูดตอบอาจารย์:** "1–4 ที่นั่งต่อ 1 รายการจองครับ บังคับ 2 ชั้น — ฝั่ง API `bookingInput()` เช็ก `if (seatCount > 4) throw new HttpError(400, 'A booking must contain between 1 and 4 seats')` และที่ฐานข้อมูลมี `CK_BD_SEAT_COUNT CHECK (SEAT_COUNT BETWEEN 1 AND 4)` ครับ"

**หลักฐานในโค้ด:** `server/routes/bookings.ts` 14–23 (`positiveId` + เงื่อนไข `seatCount > 4` บรรทัด 21), `database.sql` constraint `CK_BD_SEAT_COUNT`

**คำถามต่อยอด:** ถ้าส่ง `seat_count = 0` หรือติดลบ?
**คำตอบต่อยอด:** "`positiveId()` บรรทัด 8–12 จะคืน 400 `seat_count must be a positive integer` เพราะเช็ก `id <= 0` ครับ ตัวเดียวกับที่ใช้ตรวจ `trip_id`, `pickup_route_stop_id`, `dropoff_route_stop_id`"


# หัวข้อ 4 (ต่อ): คำถามระดับ 2–3 (ต่อ)

### ข้อ 4.7 (ระดับ 1) ระบบตรวจ "สถานะรอบรถ" และ "วันที่" อย่างไร?

**คำตอบแบบพูดตอบอาจารย์:** "ตอน SELECT รอบรถครั้งแรก ระบบจะดึง `STATUS` และ `DEPARTURE_AT` มาพร้อมกันโดย `FOR UPDATE` แล้วเช็ก 2 อย่างครับ 1) `TRIP.STATUS = 1` ถ้าไม่ใช่คืน 409 'Trip is not open for booking' 2) วันที่ของรอบต้องอยู่ระหว่างวันนี้ถึงพรุ่งนี้ตามเวลา `Asia/Bangkok` ไม่เช่นนั้นคืน 409 'Trips can only be booked for today or tomorrow' ครับ"

**Relevant Code** (`server/routes/bookings.ts` 109–126):

```sql
SELECT TRIP_ID, ROUTE_ID, STATUS, DEPARTURE_AT, VEHICLE_ID,
       CASE WHEN TRUNC(DEPARTURE_AT) BETWEEN
         TO_DATE(TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD'), 'YYYY-MM-DD')
         AND TO_DATE(TO_CHAR(SYSTIMESTAMP AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD'), 'YYYY-MM-DD') + 1
       THEN 1 ELSE 0 END AS BOOKING_DATE_OK
FROM TRIP WHERE TRIP_ID = :tripId FOR UPDATE
```

```ts
if (!trip) throw new HttpError(404, 'Trip not found');
if (Number(trip.STATUS) !== 1) throw new HttpError(409, 'Trip is not open for booking');
if (Number(trip.BOOKING_DATE_OK) !== 1) throw new HttpError(409, 'Trips can only be booked for today or tomorrow');
```

**คำถามต่อยอด:** `TRIP.STATUS` แต่ละค่าหมายความว่าอย่างไร?
**คำตอบต่อยอด:** "0 = ยกเลิก, 1 = เปิด/พร้อมจอง, 2 = กำลังเดินทาง, 3 = เสร็จสิ้น ตาม `CK_TRIP_STATUS CHECK (STATUS IN (0,1,2,3))` ใน `database.sql` และมีคอมเมนต์ระบุไว้ที่ `src/components/live/DriverPortal.tsx` บรรทัด 141 ครับ"

### ข้อ 4.8 (ระดับ 2) ระบบตรวจจุดขึ้น–จุดลงอย่างไร ถ้าเลือกลงก่อนขึ้นล่ะ?

**คำตอบแบบพูดตอบอาจารย์:** "SELECT จาก `ROUTE_STOP` สองแถวกรองด้วย `ROUTE_ID` ของรอบรถนั้น ถ้าไม่เจอเลยแปลว่าจุดที่ส่งมาไม่อยู่บนเส้นทางนี้ → 400 'Pickup and drop-off must be stops on the trip route' ถ้าเจอแล้ว `STOP_ORDER` ของจุดขึ้น >= จุดลง → 400 'Pickup must be before drop-off on the route' ครับ"

**หลักฐานในโค้ด:** `server/routes/bookings.ts` 128–146 — query `SELECT PICKUP.STOP_ORDER AS PICKUP_ORDER, DROPOFF.STOP_ORDER AS DROPOFF_ORDER FROM ROUTE_STOP PICKUP JOIN ROUTE_STOP DROPOFF ON DROPOFF.ROUTE_ID = PICKUP.ROUTE_ID WHERE PICKUP.ROUTE_ID = :routeId AND ...` แล้ว `if (pickupOrder >= dropoffOrder) throw new HttpError(400, ...)` (144–146)

**คำถามต่อยอด:** ทำไมต้องใช้ `ROUTE_STOP_ID` ไม่ใช้ `STOP_ID`?
**คำตอบต่อยอด:** "เพราะจุดจอดเดียวกันอาจอยู่ในหลายเส้นทางและอยู่หลายลำดับ `BOOKING_DETAIL` เก็บ `PICKUP_ROUTE_STOP_ID`/`DROPOFF_ROUTE_STOP_ID` ซึ่งเป็น FK ระดับ (route, stop) ทำให้ระบุลำดับบนเส้นทางนั้นได้แม่นยำครับ (ตาม README ที่ระบุว่า repeated stops on a route ต้องไม่กำกวม)"

### ข้อ 4.9 (ระดับ 3) ถ้าจองไม่สำเร็จ ระบบจะรู้ได้อย่างไรว่าเกิดจากเงื่อนไขไหน?

**คำตอบแบบพูดตอบอาจารย์:** "ดูจาก HTTP status และข้อความครับ 400 = รูปแบบข้อมูล/จุดจอดผิด, 404 = ไม่พบรอบรถ, 409 = ติดเงื่อนไขธุรกิจ (รอบปิด, เลยวัน, เลย cutoff, รถใช้ไม่ได้, ที่นั่งเต็ม, จองชนกัน) ทุก error ถูกโยนด้วย `HttpError` แล้วผ่าน `errorHandler` ที่ `server/middleware/errorHandler.ts` (ติดตั้งท้าย `server/app.ts` บรรทัด 22) ฝั่งเว็บรับ `payload.error` ใน `src/api/client.ts` 26 แล้วโยนเป็น `ApiError` จนถึง `PassengerPortal` ที่แสดง `confirmErrorModal` บรรทัด 538 ครับ"

**หลักฐานในโค้ด:** `server/routes/bookings.ts` 122, 123, 125, 141, 145, 165, 171, 182, 217; `src/api/client.ts` 26 `if (!response.ok) throw new ApiError(response.status, payload.error || payload.message || 'API request failed')`

**คำถามต่อยอด:** ถ้า Oracle error ที่ไม่ได้แปลง จะเกิดอะไรขึ้น?
**คำตอบต่อยอด:** "จะถูก `errorHandler` จับแล้วคืน 500 ครับ ส่วน error ที่แปลงแล้วคือ errorNum 1 (ซ้ำ) ใน `bookings.ts` 216–218 และใน `admin.ts` `mapOracleError` 51–58"

### ข้อ 4.10 (ระดับ 3) ทำไมเก็บ `SEAT_COUNT` ไม่เก็บเลขที่นั่งรายตัว?

**คำตอบแบบพูดตอบอาจารย์:** "เพราะเอกสาร schema ระบุไว้ว่าแต่ละแถว `BOOKING_DETAIL` เก็บ 'จำนวนที่นั่ง' ของ 1 รายการจองต่อ 1 เส้นทาง ไม่เก็บเลขที่นั่งรายตัว ข้อดีคือ logic ความจุเป็นการ SUM อย่างเดียว ตรวจสอบง่ายและตรงกับ constraint `CK_BD_SEAT_COUNT` ครับ ตัวอย่างคอมเมนต์ใน `database.sql` ท้ายไฟล์: 'BOOKING_DETAIL stores the requested seat quantity, not individual seat numbers. Capacity is checked transactionally while the associated TRIP row is locked.' ครับ"

**หลักฐานในโค้ด:** `database.sql` คอมเมนต์ท้ายไฟล์, `README.md` ย่อหน้าที่ระบุว่า individual seat numbers are not stored

**คำถามต่อยอด:** แล้วเลขที่นั่งในหน้าเว็บ (A1, B2) ล่ะ?
**คำตอบต่อยอด:** "เป็นการแสดงผลฝั่ง UI สำหรับโหมดจำลองเท่านั้นครับ ส่วน API mode จะส่ง `seat_count` ไป ไม่ได้ส่งเลขที่นั่ง และ backend ไม่ได้เก็บลงฐานข้อมูล"

## สิ่งที่ต้องจำ (หัวข้อ 4)

1. `POST /api/bookings` = `server/routes/bookings.ts` 101–230, ต้อง login เป็น passenger (`router.use(requireAuth('passenger'))` บรรทัด 27)
2. 5 เงื่อนไขหลัก: รอบเปิด (`STATUS=1`) → วันนี้/พรุ่งนี้ → จุดจอดอยู่บนเส้นทาง + ลำดับถูก → ก่อนถึงจุดขึ้น ≥ 20 นาที → ความจุช่วงซ้อน
3. ล็อก `TRIP` ด้วย `FOR UPDATE` เพื่อป้องกันจองเกินพร้อมกัน
4. สูตร cutoff = `DEPARTURE_AT + SUM(MINUTES_FROM_PREV จนถึงจุดขึ้น) >= SYSTIMESTAMP + 20 นาที`
5. สูตรความจุ = `SUM(SEAT_COUNT) WHERE STATUS_CODE<>0 AND overlap` + `seat_count <= capacity`
6. INSERT 2 ตาราง: `BOOKING` (คืน `BOOKING_ID`) → `BOOKING_DETAIL` (`STATUS_CODE = 1`)
7. `seat_count` 1–4 ตรวจทั้ง API และ constraint


# หัวข้อ 5: Gen QR Code หลังจองสำเร็จ และดูรอบที่กำลังจะมาถึง (1 คะแนน)

## ภาพรวม

เมื่อจองสำเร็จ เซิร์ฟเวอร์คืน `booking_code` (รูป `SB-` ตามด้วย hex 32 ตัว) และ `qr_payload` ซึ่งมีค่าเท่ากับ `booking_code` หน้าเว็บนำไปสร้าง QR ด้วยไลบรารี `qrcode` ผ่านคอมโพเนนต์ `QrCodeSvg` ส่วนหน้าตั๋วจะดึงรายการจองของผู้ใช้จาก `GET /api/bookings/me?filter=upcoming` ซึ่งกรองเฉพาะรายการที่ยังไม่ถึงเวลาและรอบยังเปิดอยู่

## จุดสำคัญในโค้ด

| เรื่อง | ไฟล์ | Function / Route | บรรทัด |
|---|---|---|---|
| สร้าง QR | `src/components/common/QrCodeSvg.tsx` | `QrCodeSvg` (`QRCode.toDataURL`) | 11–41 |
| แสดง QR บนตั๋ว | `src/components/live/PassengerPortal.tsx` | `<QrCodeSvg value={booking_code}>` | 1484, 1758 |
| จองสำเร็จคืน code | `server/routes/bookings.ts` | `POST /api/bookings` (response) | 222–229 |
| สุ่ม booking code | `server/routes/bookings.ts` | `randomBytes(16)` | 104 |
| ดูรายการจอง | `server/routes/bookings.ts` | `GET /api/bookings/me` | 29–99 |
| กรอง "กำลังจะมาถึง" | `server/routes/bookings.ts` | `statusFilter` (SQL) | 35–46 |
| รีเฟรชรายการจอง | `src/context/BusContext.tsx` | `apiRefreshBookings()` | 1880–1892 |
| กรองแท็บตั๋ว | `src/components/live/PassengerPortal.tsx` | `filteredBookingGroups`, `ticketStatusFilter` | 360–383, 1606–1640 |

**Database:** `BOOKING.BOOKING_CODE` (unique), `BOOKING_DETAIL.STATUS_CODE` (`0`=ยกเลิก, `1`=จองสำเร็จ, `2`=เช็กอินแล้ว, `3`=เสร็จสิ้น, `4`=ไม่ได้ขึ้นรถ), `TRIP.STATUS`

## คำถามและคำตอบ

### ข้อ 5.1 (ระดับ 1) QR Code ถูกสร้างที่ไหน ด้วยอะไร?

**คำตอบแบบพูดตอบอาจารย์:** "สร้างที่ฝั่งหน้าเว็บครับ ในคอมโพเนนต์ `src/components/common/QrCodeSvg.tsx` โดยเรียก `QRCode.toDataURL(value, { errorCorrectionLevel: 'M', margin: 2, width: size })` แล้วแสดงเป็น `<img>` ครับ"

**Relevant Code** (`src/components/common/QrCodeSvg.tsx` 14–30):

```ts
useEffect(() => {
  let active = true;
  setSource('');
  if (value) {
    void QRCode.toDataURL(value, { errorCorrectionLevel: 'M', margin: 2, width: size,
      color: { dark: '#0f172a', light: '#ffffff' } })
      .then((dataUrl) => { if (active) setSource(dataUrl); })
      .catch(() => { if (active) setSource(''); });
  }
  return () => { active = false; };
}, [value, size]);
```

**คำถามต่อยอด:** ข้างใน QR ใส่อะไร?
**คำตอบต่อยอด:** "ใส่ `booking_code` ครับ ที่ `PassengerPortal.tsx` บรรทัด 1484: `value={apiMode && cur.booking_code ? cur.booking_code : 'MUT-PASS-...'} ` โหมด API ใช้ `booking_code` จริง ส่วนค่า `MUT-PASS-...` เป็นของโหมดจำลอง"

### ข้อ 5.2 (ระดับ 2) `booking_code` มาจากไหน สร้างอย่างไร?

**คำตอบแบบพูดตอบอาจารย์:** "เซิร์ฟเวอร์สุ่มก่อนทำ transaction ครับ `const bookingCode = 'SB-' + randomBytes(16).toString('hex')` ได้ความยาว 34 อักขระ แล้ว INSERT เข้า `BOOKING` ซึ่งมี constraint `UQ_BOOKING_CODE UNIQUE` การันตีไม่ซ้ำ และคืนมาทั้ง `booking_code` กับ `qr_payload` ใน response ครับ"

**หลักฐานในโค้ด:** `server/routes/bookings.ts` 104 (`const bookingCode = \`SB-${randomBytes(16).toString('hex')}\``), 185–191 (INSERT + SELECT คืน `BOOKING_ID`), 222–229 (response), `database.sql` `UQ_BOOKING_CODE`

**คำถามต่อยอด:** ถ้าสุ่มแล้วชน (unique constraint) ระบบจะยังไง?
**คำตอบต่อยอด:** "จะ errorNum = 1 แล้วถูกจับใน `catch` บรรทัด 215–218 คืน 409 ครับ โอกาสเกิดน้อยมากเพราะ entropy 16 bytes"

### ข้อ 5.3 (ระดับ 2) "ดูรอบที่กำลังจะมาถึง" กรองอย่างไร?

**คำตอบแบบพูดตอบอาจารย์:** "หน้าตั๋วเรียก `GET /api/bookings/me?filter=upcoming` แล้วเซิร์ฟเวอร์ต่อเงื่อนไข SQL ว่า `BD.STATUS_CODE IN (1,2)` และ `T.STATUS IN (1,2)` และเวลาถึงจุดขึ้นของผู้โดยสารยังไม่ผ่าน `SYSDATE` ครับ โดยเวลาถึงจุดขึ้นคำนวณจาก `T.DEPARTURE_AT + SUM(MINUTES_FROM_PREV)/1440` ของจุดจอดตั้งแต่ต้นทางถึงจุดขึ้น ครับ"

**Relevant Code** (`server/routes/bookings.ts` 35–46):

```ts
const statusFilter = filter === 'upcoming'
  ? `AND BD.STATUS_CODE IN (1, 2)
     AND T.STATUS IN (1, 2)
     AND T.DEPARTURE_AT + (
       SELECT NVL(SUM(RS.MINUTES_FROM_PREV), 0) / 1440
       FROM ROUTE_STOP RS
       JOIN ROUTE_STOP PICKUP_RS ON PICKUP_RS.ROUTE_ID = BD.ROUTE_ID
         AND PICKUP_RS.ROUTE_STOP_ID = BD.PICKUP_ROUTE_STOP_ID
       WHERE RS.ROUTE_ID = BD.ROUTE_ID AND RS.STOP_ORDER <= PICKUP_RS.STOP_ORDER
     ) > SYSDATE`
  : filter === 'completed' ? 'AND BD.STATUS_CODE IN (3, 4)'
  : filter === 'cancelled' ? 'AND BD.STATUS_CODE = 0' : '';
```

**คำถามต่อยอด:** รายการที่ถูก "ซ่อนตั๋ว" ไป (`WEB_HIDDEN_RECORD`) จะยังแสดงไหม?
**คำตอบต่อยอด:** "ไม่แสดงครับ query มี `AND NOT EXISTS (SELECT 1 FROM WEB_HIDDEN_RECORD H WHERE H.ENTITY_NAME='booking' AND H.RECORD_KEY=TO_CHAR(B.BOOKING_ID) AND H.OWNER_ID=TO_CHAR(B.USER_ID))` บรรทัด 90–95 ซึ่งเป็นการซ่อนเฉพาะผู้โดยสารคนนั้น ข้อมูลการจองยังอยู่ครบครับ"

### ข้อ 5.4 (ระดับ 3) ถ้ายกเลิกการจองไปแล้ว QR ใบนั้นยังใช้ได้ไหม?

**คำตอบแบบพูดตอบอาจารย์:** "ใช้ไม่ได้ครับ เพราะการเช็กอินของคนขับจะ SELECT เฉพาะแถวที่ `BD.STATUS_CODE = 1` เท่านั้น รายการที่ยกเลิกมี `STATUS_CODE = 0` จึงไม่ถูกจับคู่ ระบบคืน 409 'QR booking does not match this trip or is no longer valid' ครับ"

**หลักฐานในโค้ด:** `server/routes/driver.ts` 241–254

## สิ่งที่ต้องจำ (หัวข้อ 5)

1. QR สร้างที่ frontend: `QrCodeSvg.tsx` ใช้ไลบรารี `qrcode` → `toDataURL`
2. Payload = `booking_code` (`SB-` + 32 hex) สุ่มด้วย `randomBytes(16)` ที่เซิร์ฟเวอร์
3. Response คืนทั้ง `booking_code` และ `qr_payload` (ค่าเดียวกัน) ที่ `bookings.ts` 222–229
4. "กำลังจะมาถึง" = `filter=upcoming` → `STATUS_CODE IN (1,2)` + `TRIP STATUS IN (1,2)` + ยังไม่ถึงเวลาถึงจุดขึ้น
5. `STATUS_CODE`: 0 ยกเลิก, 1 จองสำเร็จ, 2 เช็กอิน, 3 เสร็จสิ้น, 4 ไม่ขึ้นรถ
6. ตั๋วที่ซ่อนด้วย `WEB_HIDDEN_RECORD` จะไม่ถูกคืนจาก `/bookings/me`


# หัวข้อ 6: ยกเลิกการจองตามเงื่อนไขและคืนที่นั่ง (3 คะแนน)

## ภาพรวม

ผู้โดยสารกด "ยกเลิก" ในหน้าตั๋ว → modal ยืนยัน → `POST /api/bookings/:bookingId/cancel` ฝั่งเซิร์ฟเวอร์ทำใน transaction: ล็อกใบจอง (ต้องเป็นของตัวเอง) → เช็กทุก `BOOKING_DETAIL` ต้องยัง `STATUS_CODE = 1` → ล็อกทุก `TRIP` และต้องยังเปิดอยู่ (`STATUS = 1`) → `UPDATE BOOKING_DETAIL SET STATUS_CODE = 0` แล้ว**คืนจำนวนที่นั่ง**เป็นผลรวม `SEAT_COUNT` ของแถวที่ยกเลิก ที่นั่งถูก "คืน" โดยอัตโนมัติเพราะการจองใหม่จะนับเฉพาะ `STATUS_CODE <> 0`

## จุดสำคัญในโค้ด

| เรื่อง | ไฟล์ | Function / Route | บรรทัด |
|---|---|---|---|
| ปุ่มยกเลิก + modal | `src/components/live/PassengerPortal.tsx` | `setCancelModalData`, ปุ่มยืนยัน | 786–790, 1811–1849 |
| เรียก API | `src/context/BusContext.tsx` | `apiCancelBooking()` | 1902 |
| ยกเลิก (เซิร์ฟ) | `server/routes/bookings.ts` | `POST /api/bookings/:bookingId/cancel` | 232–272 |
| นับที่นั่งตอนจอง | `server/routes/bookings.ts` | occupancy query (`STATUS_CODE <> 0`) | 178 |
| รีเฟรชยอดจอง | `src/context/BusContext.tsx` | `apiRefreshBookings()` | 1880–1892 |

**Database:** `BOOKING_DETAIL.STATUS_CODE` เปลี่ยน `1 → 0`, คอลัมน์ `SEAT_COUNT` ไม่ถูกแก้ ไม่มีตาราง counter ที่นั่ง — ที่นั่งถูกคำนวณใหม่จาก SUM เสมอ

## คำถามและคำตอบ

### ข้อ 6.1 (ระดับ 1) กด "ยกเลิกการจอง" ในหน้าเว็บ แล้วเกิดอะไรขึ้น?

**คำตอบแบบพูดตอบอาจารย์:** "ปุ่มใน `PassengerPortal` จะเปิด modal เก็บ `bookingId`, `bookingCode`, `seatCount` ไว้ พอผู้ใช้ยืนยันจะเรียก `apiCancelBooking(bookingId)` ใน `BusContext` ซึ่งยิง `POST /api/bookings/:bookingId/cancel` แล้วเรียก `apiRefreshBookings()` เพื่อดึงรายการจองใหม่และคำนวณที่นั่งใหม่ครับ"

**Flow:** ปุ่มยกเลิก (`PassengerPortal.tsx` 786) → `setCancelModalData` → ยืนยัน (1847 `if (apiMode) void apiCancelBooking(...)`) → `api()` → `POST /api/bookings/:id/cancel` → `requireAuth('passenger')` → transaction ในเซิร์ฟเวอร์ → `200 { booking_id, status_code: 0, cancelled_seats }` → `apiRefreshBookings()`

**คำถามต่อยอด:** ฝั่งเว็บมีหน้าที่คิดจำนวนที่นั่งคืนไหม?
**คำตอบต่อยอด:** "ไม่มีครับ ฝั่งเว็บแค่ส่งคำขอ แล้วรีเฟรชข้อมูล ส่วนการ 'คืน' เกิดจากฝั่งฐานข้อมูลโดยเปลี่ยน `STATUS_CODE` เป็น 0 ครับ"

### ข้อ 6.2 (ระดับ 2) Backend ตรวจสอบเงื่อนไขอะไรบ้างก่อนยกเลิก?

**คำตอบแบบพูดตอบอาจารย์:** "4 เงื่อนไขครับ ใน `server/routes/bookings.ts` 232–272:
1. ต้องเจอใบจองที่เป็น **ของผู้ใช้คนนี้** — `WHERE BOOKING_ID = :bookingId AND USER_ID = :userId FOR UPDATE` ไม่เจอ → 404 (236–241)
2. ต้องมี `BOOKING_DETAIL` และ **ทุกแถวต้อง `STATUS_CODE = 1`** — ไม่ใช่ → 409 'Only confirmed booking details can be cancelled' (243–252)
3. ทุก `TRIP` ที่ผูกกับใบจองต้อง **ยัง `STATUS = 1`** (ยังไม่ออกเดินทาง) — ไม่ใช่ → 409 'A booking can only be cancelled while its trip is open' (254–262)
4. ถ้าผ่านหมดจึง `UPDATE BOOKING_DETAIL SET STATUS_CODE = 0 WHERE BOOKING_ID = :bookingId AND STATUS_CODE = 1` (264–268)"

**Relevant Code:**

```ts
if (detailRows.some((row) => Number(row.STATUS_CODE) !== 1)) {
  throw new HttpError(409, 'Only confirmed booking details can be cancelled');
}
// ...
const trips = await queryRows<DbRow>(connection,
  `SELECT TRIP_ID, STATUS FROM TRIP WHERE TRIP_ID = :tripId FOR UPDATE`, { tripId });
if (!trips[0] || Number(trips[0].STATUS) !== 1) {
  throw new HttpError(409, 'A booking can only be cancelled while its trip is open');
}
```

**คำถามต่อยอด:** ยกเลิกหลังรถออกแล้วได้ไหม?
**คำตอบต่อยอด:** "ไม่ได้ครับ เพราะ `TRIP.STATUS` เป็น 2 (กำลังเดินทาง) แล้ว จะติดข้อ 3 แล้วได้ 409 ต้องให้แอดมินแก้สถานะรอบก่อน (มี `POST /api/admin/trips/:tripId/status` ที่อนุญาตเฉพาะ 0/1 และห้ามแก้รอบที่เริ่มแล้ว ที่ `admin.ts` 956–969) ครับ"


# หัวข้อ 6 (ต่อ): คำถามระดับ 2–3

### ข้อ 6.3 (ระดับ 2) "คืนที่นั่ง" คำนวณอย่างไร สูตรคืออะไร?

**คำตอบแบบพูดตอบอาจารย์:** "ระบบไม่ได้เก็บตัวเลขนั่งจองคงเหลือไว้ในตาราง แต่**คำนวณใหม่เสมอจากการ SUM** ครับ ตอนจองจะนับ `SUM(SEAT_COUNT)` เฉพาะที่ `STATUS_CODE <> 0` ดังนั้นการยกเลิกเพียงแค่เปลี่ยน `STATUS_CODE` 1 → 0 แถวของผู้โดยสารคนนั้นก็จะถูกตัดออกจากการนับโดยอัตโนมัติ เท่ากับคืนที่นั่งแล้ว ส่วนจำนวนที่คืนที่รายงานกลับไป คือผลรวม `SEAT_COUNT` ของแถวที่เพิ่งยกเลิกครับ"

**Relevant Code:**

```ts
// ตอนจอง — server/routes/bookings.ts 178
WHERE BD.TRIP_ID = :tripId AND BD.STATUS_CODE <> 0 ...

// ตอนยกเลิก — server/routes/bookings.ts 264–269
const update = await connection.execute(`
  UPDATE BOOKING_DETAIL SET STATUS_CODE = 0
  WHERE BOOKING_ID = :bookingId AND STATUS_CODE = 1
`, { bookingId });
return detailRows.reduce((sum, row) => sum + Number(row.SEAT_COUNT), 0);
```

```ts
// response บรรทัด 271
response.status(200).json({ booking_id: bookingId, status_code: 0, cancelled_seats: cancelled });
```

**Logic สำคัญ:** "คืนที่นั่ง" = ไม่ใช่การบวกค่ากลับ แต่คือ **การเลิกนับรายการนั้น** — สูตรที่นั่งว่างจึงเป็น `capacity - SUM(SEAT_COUNT WHERE STATUS_CODE <> 0 AND overlap)`

**คำถามต่อยอด:** ถ้ามีหลาย `BOOKING_DETAIL` ในใบจองเดียว (หลายรอบ) ยกเลิกหมดพร้อมกันไหม?
**คำตอบต่อยอด:** "ยกเลิกครบทุกแถวใน transaction เดียวครับ เพราะ UPDATE ใช้ `WHERE BOOKING_ID = :bookingId AND STATUS_CODE = 1` ไม่ได้กรองทีละรอบ และผลรวมที่คืนมาจาก `detailRows.reduce(...)` ทุกแถว"

### ข้อ 6.4 (ระดับ 3) ถ้าผู้โดยสารกดยกเลิกซ้ำ 2 ครั้ง ระบบคืนที่นั่งซ้ำหรือไม่?

**คำตอบแบบพูดตอบอาจารย์:** "ไม่ซ้ำครับ ป้องกันด้วย 2 เงื่อนไข — ครั้งที่ 2 แถวมี `STATUS_CODE = 0` แล้วจึงติด `if (detailRows.some((row) => Number(row.STATUS_CODE) !== 1)) throw new HttpError(409, 'Only confirmed booking details can be cancelled')` ทันที และ `UPDATE ... WHERE STATUS_CODE = 1` ก็จะอัปเดต 0 แถว เพราะงั้น `rowsAffected` เป็น 0 แต่ผลรวมที่คืนมาจาก `detailRows` ที่ SELECT ก่อนหน้าซึ่งถูกเช็กไว้แล้ว จึงไม่มีทางคืนที่นั่งซ้ำครับ"

**หลักฐานในโค้ด:** `server/routes/bookings.ts` 250–252 (guard) และ 264–269 (UPDATE + sum)

**คำถามต่อยอด:** ถ้ากดพร้อมกัน 2 อุปกรณ์?
**คำตอบต่อยอด:** "รายการจองถูก `SELECT ... FOR UPDATE` ตั้งแต่บรรทัด 236–240 คำขอที่ 2 ต้องรอ transaction แรก commit เมื่อเสร็จแล้ว `STATUS_CODE` เป็น 0 จึงเข้า guard ข้อ 2 และได้ 409 ครับ"

### ข้อ 6.5 (ระดับ 2) มีการลบแถว `BOOKING` ไหม?

**คำตอบแบบพูดตอบอาจารย์:** "ไม่มีการลบเลยครับ ทั้งการยกเลิกและการซ่อนเป็นการเปลี่ยนสถานะ/เพิ่ม marker เท่านั้น — ยกเลิกเปลี่ยน `BOOKING_DETAIL.STATUS_CODE` 1 → 0 ส่วนการซ่อนตั๋ว (`POST /api/bookings/:bookingId/hide` บรรทัด 274–293) `MERGE` เข้า `WEB_HIDDEN_RECORD` ด้วย `ENTITY_NAME='booking'` และ `OWNER_ID=USER_ID` ของเจ้าของ ทำให้แค่คนนั้นไม่เห็นตั๋วในหน้า `me` ครับ"

**หลักฐานในโค้ด:** `server/routes/bookings.ts` 264–268 (UPDATE สถานะ), 274–293 (hide = MERGE `WEB_HIDDEN_RECORD`), 90–95 (กรอง hidden ออกจาก `/bookings/me`)

**คำถามต่อยอด:** ความต่างระหว่าง "ยกเลิก" กับ "ซ่อนตั๋ว"?
**คำตอบต่อยอด:** "ยกเลิกเปลี่ยนสถานะการจองจริง (`STATUS_CODE = 0`) ปล่อยที่นั่งกลับและอาจารย์/ระบบเห็นประวัติสถานะ 'ยกเลิก' ส่วนซ่อนตั๋วเป็นแค่การแสดงผลบนหน้าผู้โดยสารคนนั้น สถานะการจองไม่เปลี่ยน ครับ"

### ข้อ 6.6 (ระดับ 3) ทำไมต้องใส่ transaction + `FOR UPDATE` ตอนยกเลิก?

**คำตอบแบบพูดตอบอาจารย์:** "เพราะต้องเช็กและเปลี่ยนหลายตารางพร้อมกัน คือ `BOOKING` → `BOOKING_DETAIL` → ทุก `TRIP` ถ้าไม่ล็อก อาจเกิดกรณีที่คนขับกดเริ่มรอบ (`TRIP.STATUS 1→2`) ระหว่างที่เรากำลังเช็กอยู่ ทำให้การยกเลิกเกิดหลังรถออกโดยไม่รู้ตัว การ `FOR UPDATE` ทั้งใบจองและรอบรถ ทำให้สองเหตุการณ์นี้อ่าน/เขียนชนกันไม่ได้ครับ"

**หลักฐานในโค้ด:** `server/routes/bookings.ts` `withTransaction(pool, ...)` 235, `FOR UPDATE` ที่ `BOOKING` (239) และ `TRIP` (257)

**คำถามต่อยอด:** ถ้ามี error กลางทาง ระบบเป็นอย่างไร?
**คำตอบต่อยอด:** "จะ rollback ทั้งหมดเพราะอยู่ใน `withTransaction` (`server/db/query.ts`) ทำให้ไม่มีการเปลี่ยนสถานะบางส่วนครับ"

## สิ่งที่ต้องจำ (หัวข้อ 6)

1. `POST /api/bookings/:bookingId/cancel` = `server/routes/bookings.ts` 232–272
2. เงื่อนไข 4 ข้อ: เป็นเจ้าของ → `STATUS_CODE = 1` ทุกแถว → `TRIP.STATUS = 1` ทุกรอบ → อยู่ใน transaction
3. การคืนที่นั่ง = `UPDATE BOOKING_DETAIL SET STATUS_CODE = 0` (ไม่มี counter ให้บวก)
4. ค่า `cancelled_seats` = `sum(SEAT_COUNT)` ของแถวที่ยกเลิก
5. กดซ้ำ → 409 ที่ guard `STATUS_CODE !== 1` ไม่มีการคืนซ้ำ
6. ไม่มี `DELETE FROM BOOKING` — เก็บประวัติไว้เสมอ
7. ตั๋วที่ "ซ่อน" ≠ "ยกเลิก" (ซ่อนใช้ `WEB_HIDDEN_RECORD`)


# หัวข้อ 7: ระบบคนขับ — แสดงตารางงานรายวัน (1 คะแนน)

## ภาพรวม

คนขับล็อกอินแล้วเห็นแท็บ "วันนี้" และ "พรุ่งนี้" ข้อมูลมาจาก `GET /api/driver/trips` ซึ่ง SELECT เฉพาะรอบที่ `DRIVER_ID = ของตัวเอง` ตามวันที่เลือก หน้าเว็บจะกรองเพิ่มว่ารอบนั้นยังแสดงได้ (ยกเลิก/เวลาออกผ่านไปแล้วไม่แสดง รอบที่กำลังวิ่ง/เสร็จแล้วต้องแสดงเพื่อให้เช็กอินและดูสรุปได้)

## จุดสำคัญในโค้ด

| เรื่อง | ไฟล์ | Function / Route | บรรทัด |
|---|---|---|---|
| รายการรอบของคนขับ (เซิร์ฟ) | `server/routes/driver.ts` | `GET /api/driver/trips` | 107–133 |
| เช็กสิทธิ์หน้าจอคนขับ | `server/routes/driver.ts` | `requireScreenPermission(pool, false)` | 19–39 |
| นับที่นั่งจองแล้ว | `server/routes/driver.ts` |  subquery `BOOKED_SEATS` | 122–123 |
| เลือกวันนี้/พรุ่งนี้ (เว็บ) | `src/components/live/DriverPortal.tsx` | `todayDate`, `tomorrowDate`, `scheduleDay` | 107–123 |
| เงื่อนไขรอบที่แสดง | `src/components/live/DriverPortal.tsx` | `isTripSelectable()`, `getMinutesUntilDeparture()` | 129–148 |
| แบ่งรายการ | `src/components/live/DriverPortal.tsx` | `driverTrips`, `todayTrips`, `tomorrowTrips` | 150–160 |
| โหลดข้อมูลตอนล็อกอิน | `src/context/BusContext.tsx` | `apiLoginComplete` (เรียก `/driver/trips`) | 1419–1422 |

**Database:** `TRIP` (PK `TRIP_ID`, FK `ROUTE_ID`, `DRIVER_ID`, `VEHICLE_ID`, `DEPARTURE_AT`, `STATUS`), `BOOKING_DETAIL` (`TRIP_ID`, `SEAT_COUNT`, `STATUS_CODE`)

## คำถามและคำตอบ

### ข้อ 7.1 (ระดับ 1) หน้าตารางงานคนขับดึงข้อมูลจาก API ตัวไหน อยู่ไฟล์ไหน?

**คำตอบแบบพูดตอบอาจารย์:** "`GET /api/driver/trips` ครับ อยู่ที่ `server/routes/driver.ts` บรรทัด 107 และ mount ที่ `/api/driver` ใน `server/app.ts` บรรทัด 20 ครับ"

**คำถามต่อยอด:** ต้องผ่านอะไรบ้างก่อนถึง query?
**คำตอบต่อยอด:** "2 ชั้นครับ `router.use(requireAuth('driver'))` บรรทัด 94 เช็ก Bearer token ว่าเป็น session ประเภท driver แล้ว `requireScreenPermission(pool, false)` บรรทัด 107 เช็กสิทธิ์หน้าจอ `8820` ใน `ROLE_PERMISSION` แบบ `CAN_VIEW` ถ้าไม่มีจะได้ 403 'Driver screen permission is not assigned' ครับ"

### ข้อ 7.2 (ระดับ 2) SQL กรองรอบอย่างไร?

**คำตอบแบบพูดตอบอาจารย์:** "กรอง 2 อย่างครับ `WHERE T.DRIVER_ID = :employeeId` ซึ่งค่ามาจาก `sessionFrom(response).userId` คือรหัสพนักงานตอนล็อกอิน ไม่ใช่ค่าที่ client ส่งมา และ `(:serviceDate IS NULL OR TRUNC(T.DEPARTURE_AT) = TO_DATE(:serviceDate,'YYYY-MM-DD'))` ถ้าไม่ส่งวันที่จะคืนทุกรอบ แล้ว `ORDER BY T.DEPARTURE_AT` ครับ"

**Relevant Code** (`server/routes/driver.ts` 110–131):

```ts
const trips = await withConnection(pool, (connection) => queryRows(connection, `
  SELECT T.TRIP_ID, T.ROUTE_ID, T.DRIVER_ID, T.VEHICLE_ID,
         TO_CHAR(T.DEPARTURE_AT, 'YYYY-MM-DD') AS SERVICE_DATE,
         TO_CHAR(T.DEPARTURE_AT, 'HH24:MI') AS DEPARTURE_TIME,
         T.STATUS, R.NAME AS ROUTE_NAME, V.LICENSE_PLATE, V.CAPACITY, VT.NAME AS VEHICLE_TYPE,
         (SELECT NVL(SUM(BD.SEAT_COUNT), 0) FROM BOOKING_DETAIL BD
          WHERE BD.TRIP_ID = T.TRIP_ID AND BD.STATUS_CODE <> 0) AS BOOKED_SEATS
  FROM TRIP T
  JOIN ROUTE R ON R.ROUTE_ID = T.ROUTE_ID
  JOIN VEHICLE V ON V.VEHICLE_ID = T.VEHICLE_ID
  JOIN VEHICLE_TYPE VT ON VT.VEHICLE_TYPE_ID = V.VEHICLE_TYPE_ID
  WHERE T.DRIVER_ID = :employeeId
    AND (:serviceDate IS NULL OR TRUNC(T.DEPARTURE_AT) = TO_DATE(:serviceDate, 'YYYY-MM-DD'))
  ORDER BY T.DEPARTURE_AT
`, { employeeId, serviceDate }));
```

**คำถามต่อยอด:** `serviceDate` รูปแบบผิดจะเกิดอะไรขึ้น?
**คำตอบต่อยอด:** "`dateFilter()` บรรทัด 41–51 เช็ก regex `^\d{4}-\d{2}-\d{2}$` และความถูกต้องของวันที่ ผิดจะได้ 400 'serviceDate must use YYYY-MM-DD' หรือ 'serviceDate must be a valid date' ครับ"

### ข้อ 7.3 (ระดับ 2) ฝั่งเว็บแบ่ง "วันนี้/พรุ่งนี้" และเลือกรอบที่จะแสดงอย่างไร?

**คำตอบแบบพูดตอบอาจารย์:** "คำนวณ `todayDate` จากวันที่เครื่องผู้ใช้ (`getLocalDateKey`) และ `tomorrowDate` จากการบวก 1 วัน แล้วแบ่งด้วย `trip.service_date` ส่วนรอบที่จะแสดงใช้ `isTripSelectable` — รอบที่ `status = 0` (ยกเลิก) ไม่แสดง รอบที่ไม่ใช่ 1 (กำลังวิ่ง/เสร็จแล้ว) แสดงเสมอ และรอบ `status = 1` แสดงเฉพาะเมื่อเวลาออกยังไม่ผ่าน (`DRIVER_DEPARTURE_GRACE_MINUTES = 0`) ครับ"

**Relevant Code** (`src/components/live/DriverPortal.tsx` 141–148):

```ts
// TRIP.STATUS: 0 = ยกเลิก, 1 = เปิด/พร้อม, 2 = กำลังเดินทาง, 3 = เสร็จสิ้น (database.sql CK_TRIP_STATUS)
const isTripSelectable = (trip: Trip): boolean => {
  if (trip.status === 0) return false;
  if (trip.status !== 1) return true;
  return getMinutesUntilDeparture(trip) >= DRIVER_DEPARTURE_GRACE_MINUTES;
};
```

**คำถามต่อยอด:** ทำไม status 2/3 ต้องแสดง?
**คำตอบต่อยอด:** "เพื่อให้คนขับยังเห็นรอบเพื่อเช็กอินผู้โดยสารและดูสรุปยอดได้ ถ้าซ่อนจะปิดงานต่อไม่ได้ครับ (มีคอมเมนต์ระบุไว้บรรทัด 142–143)"

### ข้อ 7.4 (ระดับ 3) ตัวเลข "จองแล้ว X ที่นั่ง" ในตารางมาจากไหน?

**คำตอบแบบพูดตอบอาจารย์:** "มาจาก subquery ใน SQL ครับ `SUM(BD.SEAT_COUNT)` เฉพาะ `STATUS_CODE <> 0` ของรอบนั้น ๆ ซึ่งสอดคล้องกับ logic ความจุตอนจอง คือรายการที่ยกเลิก (`STATUS_CODE = 0`) จะไม่ถูกนับด้วยครับ"

**หลักฐานในโค้ด:** `server/routes/driver.ts` 122–123, `server/routes/bookings.ts` 178 (ใช้เกณฑ์เดียวกัน)

## สิ่งที่ต้องจำ (หัวข้อ 7)

1. `GET /api/driver/trips` = `server/routes/driver.ts` 107, ต้องผ่าน `requireAuth('driver')` + `requireScreenPermission('8820')`
2. กรองด้วย `DRIVER_ID = session.userId` (ไม่ใช่ client ส่งมา) + `serviceDate` optional
3. หน้าเว็บแบ่ง `todayTrips` / `tomorrowTrips` และ `isTripSelectable` กรองรอบที่หมดเวลา/ยกเลิก
4. `BOOKED_SEATS` = `SUM(SEAT_COUNT)` ที่ `STATUS_CODE <> 0`
5. `TRIP.STATUS`: 0 ยกเลิก, 1 เปิด, 2 กำลังวิ่ง, 3 เสร็จ


# หัวข้อ 8: ระบบคนขับ — เริ่มงานและดูผู้โดยสารตามจุดจอด (1 คะแนน)

## ภาพรวม

คนขับกด "เริ่มออกรถ" ในหน้าตารางงาน → `POST /api/driver/trips/:tripId/start` เซิร์ฟเวอร์ล็อกแถวนรถ (ต้องเป็นรอบของตัวเอง) เช็กว่ายัง `STATUS = 1` และยังไม่เลยเวลาออก แล้วอัปเดต `STATUS = 2` พร้อมบันทึก `ACTUAL_STARTED_AT` หลังเริ่มแล้วคนขับเปิดหน้าผู้โดยสารได้จาก `GET /api/driver/trips/:tripId/passengers` ซึ่งจัดกลุ่มผู้โดยสารตามจุดจอด (ขึ้น/ลง) พร้อมจำนวนตามแผนและจำนวนที่เช็กอินจริง

## จุดสำคัญในโค้ด

| เรื่อง | ไฟล์ | Function / Route | บรรทัด |
|---|---|---|---|
| ปุ่มเริ่มงาน (เว็บ) | `src/components/live/DriverPortal.tsx` | `onClick` → `apiStartTrip` | 818 |
| เรียก API เริ่ม | `src/context/BusContext.tsx` | `apiStartTrip()` | 1903–1909 |
| เริ่มรอบ (เซิร์ฟ) | `server/routes/driver.ts` | `POST /api/driver/trips/:tripId/start` | 214–227 |
| ล็อกแถวนรถ | `server/routes/driver.ts` | `lockAssignedTrip()` | 53–66 |
| เช็กเวลาก่อนออก | `server/routes/driver.ts` | `requireStartableDeparture()` | 69–90 |
| ผู้โดยสารตามจุดจอด | `server/routes/driver.ts` | `GET /api/driver/trips/:tripId/passengers` | 135–212 |
| แสดงผลฝั่งเว็บ | `src/components/live/DriverPortal.tsx` | กลุ่มขึ้น/ลงต่อป้าย | 376–399 |

**Database:** `TRIP.STATUS` (`1 → 2`), `TRIP.ACTUAL_STARTED_AT`, `BOOKING_DETAIL` (`STATUS_CODE`, `PICKUP_ROUTE_STOP_ID`, `DROPOFF_ROUTE_STOP_ID`, `CHECKED_IN_AT`)

## คำถามและคำตอบ

### ข้อ 8.1 (ระดับ 1) กดปุ่ม "เริ่มออกรถ" แล้วเกิดอะไรขึ้นบ้าง?

**คำตอบแบบพูดตอบอาจารย์:** "หน้าเว็บเรียก `apiStartTrip(trip_id)` → `POST /api/driver/trips/:tripId/start` ฝั่งเซิร์ฟเวอร์เช็กสิทธิ์แก้ไขหน้าจอ 8820 แล้วเข้า transaction ล็อกแถวนรถด้วย `lockAssignedTrip` ซึ่ง `WHERE TRIP_ID = :tripId AND DRIVER_ID = :employeeId FOR UPDATE` ถ้าไม่ใช่รอบตัวเองคืน 404 เช็ก `STATUS = 1` ไม่ใช่ก็ 409 เช็กว่ายังไม่เลยเวลาออก แล้ว `UPDATE TRIP SET STATUS = 2, ACTUAL_STARTED_AT = SYSTIMESTAMP` ครับ"

**Relevant Code** (`server/routes/driver.ts` 214–227):

```ts
router.post('/trips/:tripId/start', requireScreenPermission(pool, true), asyncHandler(async (request, response) => {
  const tripId = positiveId(request.params.tripId);
  const employeeId = String(sessionFrom(response).userId);
  await withTransaction(pool, async (connection) => {
    const trip = await lockAssignedTrip(connection, tripId, employeeId);
    if (Number(trip.STATUS) !== 1) throw new HttpError(409, 'Only an open trip can be started');
    await requireStartableDeparture(connection, trip);
    await connection.execute(`
      UPDATE TRIP SET STATUS = 2, ACTUAL_STARTED_AT = SYSTIMESTAMP
      WHERE TRIP_ID = :tripId AND DRIVER_ID = :employeeId AND STATUS = 1
    `, { tripId, employeeId });
  });
  response.status(200).json({ trip_id: tripId, status: 2 });
}));
```

**คำถามต่อยอด:** กดเริ่มรอบของคนอื่นได้ไหม?
**คำตอบต่อยอด:** "ไม่ได้ครับ `lockAssignedTrip` (53–66) มี `AND DRIVER_ID = :employeeId` ถ้าไม่ตรงได้ 404 'Assigned trip not found' แม้จะรู้ `trip_id` ก็ตาม และ `UPDATE` ก็มี `AND DRIVER_ID = :employeeId` + `AND STATUS = 1` ซ้ำอีกชั้นครับ"


# หัวข้อ 8 (ต่อ): คำถามระดับ 2–3

### ข้อ 8.2 (ระดับ 2) `requireStartableDeparture` ตรวจอะไร ทำไมถึงมี?

**คำตอบแบบพูดตอบอาจารย์:** "ตรวจว่า 'เวลาที่รถถึงจุดจอดแรก' ยังไม่ผ่านไปครับ สูตรคือ `DEPARTURE_AT + SUM(MINUTES_FROM_PREV)` ของทุกป้ายจนถึงป้ายแรก แล้วเทียบกับเวลาปัจจุบัน ถ้า `minutesLeft >= DRIVER_DEPARTURE_GRACE_MINUTES` (ค่า = 0) จึงเริ่มได้ ถ้าเลยแล้วได้ 409 'รอบรถนี้ออกเดินทางไปแล้ว กรุณาติดต่อผู้ดูแลระบบเพื่อปรับสถานะของรอบ' ครับ"

**หลักฐานในโค้ด:** `server/routes/driver.ts` 8–11 (คอมเมนต์อธิบายว่าทำไม **ไม่** ใช้กฎ 20 นาทีของผู้โดยสาร เพราะจะทำให้คนขับกดเริ่มไม่ได้ในช่วงก่อนออก) และ 69–90 (query `FIRST_STOP_AT` + check)

**คำถามต่อยอด:** ถ้าอยากยอมให้เริ่มสาย 5 นาที แก้ตรงไหน?
**คำตอบต่อยอด:** "แก้ `DRIVER_DEPARTURE_GRACE_MINUTES = 0` เป็น `-5` ที่ `server/routes/driver.ts` บรรทัด 11 (ค่าติดลบแปลว่าเลยเวลาได้ 5 นาที) ครับ และต้องแก้ค่าเดียวกันที่ `DriverPortal.tsx` บรรทัด 127 ด้วยไม่งั้นหน้าเว็บกับเซิร์ฟเวอร์ไม่ตรงกัน"

### ข้อ 8.3 (ระดับ 2) แสดงผู้โดยสารตามจุดจอด ข้อมูลมาจาก API ไหน คำนวณอย่างไร?

**คำตอบแบบพูดตอบอาจารย์:** "`GET /api/driver/trips/:tripId/passengers` ครับ ระบบ SELECT จุดจอดทั้งเส้นทาง (`ROUTE_STOP` JOIN `STOP` เรียง `STOP_ORDER`) และผู้โดยสารของรอบ (`BOOKING_DETAIL` ที่ `STATUS_CODE <> 0` JOIN `BOOKING` และ `SYSTEM_USER`) แล้วจัดกลุ่มใน JavaScript — ป้ายไหนมี `pickup_route_stop_id = ป้ายนั้น` เป็นกลุ่มขึ้นรถ ถ้า `dropoff_route_stop_id = ป้ายนั้น` เป็นกลุ่มลงรถ พร้อมนับ 3 ตัวเลขครับ"

**Relevant Code** (`server/routes/driver.ts` 183–199):

```ts
const validPassenger = (p) => [1, 2, 3].includes(p.status_code);
const stops = stopRows.map((row) => {
  const routeStopId = Number(row.ROUTE_STOP_ID);
  const boarding = passengers.filter((p) => p.pickup_route_stop_id === routeStopId && validPassenger(p));
  const alighting = passengers.filter((p) => p.dropoff_route_stop_id === routeStopId && validPassenger(p));
  return {
    route_stop_id: routeStopId, stop_name: ..., stop_order: ...,
    scheduled_boardings: boarding.reduce((sum, p) => sum + p.seat_count, 0),
    checked_in_boardings: boarding.filter((p) => [2, 3].includes(p.status_code))
      .reduce((sum, p) => sum + p.seat_count, 0),
    scheduled_alightings: alighting.reduce((sum, p) => sum + p.seat_count, 0),
    passengers_boarding: boarding, passengers_alighting: alighting,
  };
});
```

**คำถามต่อยอด:** ความต่าง `scheduled_boardings` กับ `checked_in_boardings`?
**คำตอบต่อยอด:** "`scheduled` = ทุกใบที่สถานะ 1/2/3 (จองไว้) ส่วน `checked_in` = เฉพาะสถานะ 2 หรือ 3 (ขึ้นรถแล้ว) ส่วน `STATUS_CODE = 0` (ยกเลิก) ถูกกรองออกตั้งแต่ query บรรทัด 163 ครับ"

### ข้อ 8.4 (ระดับ 3) ป้องกันไม่ให้คนขับคนอื่นดูผู้โดยสารรอบเราได้อย่างไร?

**คำตอบแบบพูดตอบอาจารย์:** "ทั้ง 2 endpoint ใน `driver.ts` มี `WHERE ... AND DRIVER_ID = :employeeId` โดย `employeeId` มาจาก session ไม่ใช่จาก request body ครับ และทุกคำขอผ่าน `requireScreenPermission` หน้าจอ 8820 ดังนั้นถึงรู้ `trip_id` ก็จะได้ 404 'Assigned trip not found' ครับ"

**หลักฐานในโค้ด:** `server/routes/driver.ts` 139–144 (`WHERE T.TRIP_ID = :tripId AND T.DRIVER_ID = :employeeId` → 404), 53–66 (`lockAssignedTrip`), 19–39 (`requireScreenPermission`)

## สิ่งที่ต้องจำ (หัวข้อ 8)

1. เริ่มงาน: `POST /api/driver/trips/:tripId/start` (driver.ts 214) → `requireScreenPermission('8820', edit)` → `lockAssignedTrip` → เช็ก `STATUS=1` → `requireStartableDeparture` → `UPDATE TRIP SET STATUS=2, ACTUAL_STARTED_AT`
2. ผู้โดยสาร: `GET /api/driver/trips/:tripId/passengers` (driver.ts 135) → คืน `trip`, `passengers`, `stops[]` มี `scheduled_boardings`, `checked_in_boardings`, `scheduled_alightings`
3. กรอง `STATUS_CODE <> 0` และ `validPassenger` = สถานะ 1, 2, 3
4. ทุก query ผูกกับ `DRIVER_ID` ของ session
5. `DRIVER_DEPARTURE_GRACE_MINUTES = 0` ต้องตรงกันทั้งเซิร์ฟเวอร์ (driver.ts 11) และเว็บ (DriverPortal.tsx 127)


# หัวข้อ 9: ระบบคนขับ — เช็ค QR Code ของผู้โดยสาร (1 คะแนน)

## ภาพรวม

การเช็กอินทำผ่าน `POST /api/driver/trips/:tripId/check-in` รับ `qr_payload` (ค่าที่อ่านจาก QR = `BOOKING_CODE`) ระบบตรวจว่ารอบนี้เป็นของคนขับคนนี้ สถานะรอบเป็น 2 (กำลังวิ่ง) และหา `BOOKING_DETAIL` ของรอบนี้ที่ยัง `STATUS_CODE = 1` พร้อมล็อกแถว ถ้าเจอจึงเปลี่ยนเป็น 2 พร้อมบันทึกเวลาและรหัสคนขับที่เช็กอิน

## จุดสำคัญในโค้ด

| เรื่อง | ไฟล์ | Function / Route | บรรทัด |
|---|---|---|---|
| เช็กอิน (เซิร์ฟ) | `server/routes/driver.ts` | `POST /api/driver/trips/:tripId/check-in` | 229–272 |
| ล็อกแถวนรถ | `server/routes/driver.ts` | `lockAssignedTrip()` | 53–66 |
| เรียกจากเว็บ | `src/context/BusContext.tsx` | `apiCheckIn(tripId, qrPayload)` | 1910 |
| ปุ่ม/ช่องกรอกรหัส | `src/components/live/DriverPortal.tsx` | `handleScanTicket` | 238–278 |
| หน้าเช็กอิน (โหมดจำลอง) | `src/components/live/screens/CheckInScannerView.tsx` | `handleScanOrSubmit` | 88–107 |

**Database:** `BOOKING_DETAIL.STATUS_CODE` (`1 → 2`), `CHECKED_IN_AT`, `CHECKED_IN_BY_EMPLOYEE_ID` (มี `CK_BD_CHECKIN_PAIR` บังคับให้มาเป็นคู่)

## คำถามและคำตอบ

### ข้อ 9.1 (ระดับ 1) API เช็กอินอยู่ไฟล์ไหน และรับข้อมูลอะไร?

**คำตอบแบบพูดตอบอาจารย์:** "`POST /api/driver/trips/:tripId/check-in` อยู่ที่ `server/routes/driver.ts` บรรทัด 229 รับ `tripId` จาก path และ body 1 ฟิลด์คือ `qr_payload` ครับ"

**Relevant Code** (`server/routes/driver.ts` 232–236):

```ts
const body = typeof request.body === 'object' && request.body !== null
  ? request.body as Record<string, unknown> : {};
const qrPayload = typeof body.qr_payload === 'string' ? body.qr_payload.trim() : '';
if (!qrPayload || qrPayload.length > 50) throw new HttpError(400, 'qr_payload is required');
```

**คำถามต่อยอด:** validation ของ `qr_payload` มีอะไรบ้าง?
**คำตอบต่อยอด:** "ต้องเป็น string, trim แล้วต้องไม่ว่าง และยาวไม่เกิน 50 อักขระ (`BOOKING_CODE` จริงยาว 34) ไม่ผ่านได้ 400 ครับ"

### ข้อ 9.2 (ระดับ 2) ระบบตรวจสอบ QR อย่างไร ว่าเป็นของรอบนี้และยังใช้ได้?

**คำตอบแบบพูดตอบอาจารย์:** "3 ขั้นครับ 1) `lockAssignedTrip` ตรวจว่าเป็นรอบของคนขับคนนี้ (ไม่ใช่ → 404) 2) ต้อง `TRIP.STATUS = 2` (ไม่ใช่ → 409 'Check-in is only available for a running trip') 3) SELECT จาก `BOOKING` JOIN `BOOKING_DETAIL` JOIN `SYSTEM_USER` เงื่อนไข `B.BOOKING_CODE = :bookingCode AND BD.TRIP_ID = :tripId AND BD.STATUS_CODE = 1` พร้อม `FOR UPDATE OF BD.STATUS_CODE` ไม่เจอแถว → 409 'QR booking does not match this trip or is no longer valid' ครับ"

**Relevant Code** (`server/routes/driver.ts` 238–254):

```ts
const trip = await lockAssignedTrip(connection, tripId, employeeId);
if (Number(trip.STATUS) !== 2) throw new HttpError(409, 'Check-in is only available for a running trip');
const details = await queryRows<DbRow>(connection, `
  SELECT BD.DETAIL_ID, BD.SEAT_COUNT, B.BOOKING_ID, B.BOOKING_CODE, U.NAME AS PASSENGER_NAME
  FROM BOOKING B
  JOIN BOOKING_DETAIL BD ON BD.BOOKING_ID = B.BOOKING_ID
  JOIN SYSTEM_USER U ON U.USER_ID = B.USER_ID
  WHERE B.BOOKING_CODE = :bookingCode
    AND BD.TRIP_ID = :tripId
    AND BD.STATUS_CODE = 1
  FOR UPDATE OF BD.STATUS_CODE
`, { bookingCode: qrPayload, tripId });
if (details.length === 0) {
  throw new HttpError(409, 'QR booking does not match this trip or is no longer valid');
}
```

**คำถามต่อยอด:** ทำไมเซิร์ฟเวอร์เทียบ `BOOKING_CODE` ได้เลย ถอดรหัสอะไรเพิ่มไหม?
**คำตอบต่อยอด:** "ไม่ได้ถอดรหัสเพิ่มครับ เพราะ QR ถูกสร้างจาก `booking_code` ตรง ๆ (`PassengerPortal.tsx` 1484) เครื่องอ่านจึงได้ข้อความ `SB-xxxx...` มาส่งเป็น `qr_payload` แล้วเซิร์ฟเวอร์เทียบกับ `BOOKING.BOOKING_CODE` ซึ่งเป็น unique constraint ครับ"


# หัวข้อ 9 (ต่อ): คำถามระดับ 2–3

### ข้อ 9.3 (ระดับ 2) ข้อมูลอะไรบ้างที่เปลี่ยนตอนเช็กอิน?

**คำตอบแบบพูดตอบอาจารย์:** "เปลี่ยน 3 คอลัมน์ใน `BOOKING_DETAIL` ครับ คือ `STATUS_CODE` 1 → 2, `CHECKED_IN_AT = SYSTIMESTAMP`, `CHECKED_IN_BY_EMPLOYEE_ID = :employeeId` โดย `WHERE ... AND STATUS_CODE = 1` ทำให้การกดซ้ำครั้งที่สองอัปเดต 0 แถว และ SELECT รอบแรกก็หาแถวที่ `STATUS_CODE = 1` ไม่เจอแล้ว จึงได้ 409 ครับ"

**Relevant Code** (`server/routes/driver.ts` 255–263):

```ts
await connection.execute(`
  UPDATE BOOKING_DETAIL
  SET STATUS_CODE = 2,
      CHECKED_IN_AT = SYSTIMESTAMP,
      CHECKED_IN_BY_EMPLOYEE_ID = :employeeId
  WHERE TRIP_ID = :tripId
    AND STATUS_CODE = 1
    AND BOOKING_ID = :bookingId
`, { employeeId, tripId, bookingId: Number(details[0].BOOKING_ID) });
```

**คำถามต่อยอด:** constraint อะไรช่วยเรื่องนี้?
**คำตอบต่อยอด:** "`CK_BD_CHECKIN_PAIR` ใน `database.sql` บังคับว่า `CHECKED_IN_AT` กับ `CHECKED_IN_BY_EMPLOYEE_ID` ต้องมีค่าพร้อมกันหรือว่างพร้อมกัน ระบบจึงบันทึกทั้งเวลาและคนกดใน statement เดียวครับ"

### ข้อ 9.4 (ระดับ 3) QR ปลอม/ผิด/ของรอบอื่น/เคยเช็กอินแล้ว จะเกิดอะไรขึ้น?

**คำตอบแบบพูดตอบอาจารย์:** "ทุกกรณีได้ 409 ข้อความเดียวครับ เพราะ query กรองทั้ง `BD.TRIP_ID = :tripId` และ `BD.STATUS_CODE = 1` ถ้าเป็นของรอบอื่น ของรอบที่ยกเลิก (`STATUS_CODE = 0`) เคยเช็กอินแล้ว (`STATUS_CODE = 2`) หรือรหัสไม่มีจริง จะคืน 0 แถว ระบบตอบว่า 'QR booking does not match this trip or is no longer valid' ซึ่งใช้ข้อความเดียวเพื่อไม่ให้ข้อมูลรั่วครับ"

**หลักฐานในโค้ด:** `server/routes/driver.ts` 247–254

**คำถามต่อยอด:** ถ้าคนขับสแกนก่อนกดเริ่มรอบ?
**คำตอบต่อยอด:** "ติด `TRIP.STATUS !== 2` ได้ 409 'Check-in is only available for a running trip' ครับ ลำดับงานจึงบังคับคือ เริ่มรอบ → เช็กอิน → จบเที่ยว"

### ข้อ 9.5 (ระดับ 3) QR ปลอดภัยแค่ไหน ใครสุ่มรหัสได้?

**คำตอบแบบพูดตอบอาจารย์:** "`booking_code` สุ่มด้วย `randomBytes(16)` เป็น hex 32 ตัว จึงเดาได้ยากและมี unique constraint ครับ อย่างไรก็ตาม QR เป็นแค่ตัวพาหะที่เทียบกับฐานข้อมูล ไม่มีลายเซ็นดิจิทัล ถ้ามีคนเห็น QR ของผู้อื่นก็ใช้ได้ แต่ถูกจำกัดด้วยเงื่อนไขว่าต้องเป็นรอบของคนขับคนนี้ รอบต้องกำลังวิ่ง และยังไม่เคยเช็กอิน จึงเป็นจุดที่ควรบอกอาจารย์ว่าระบบจริงควรเพิ่ม เช่น รหัสที่มีวันหมดอายุ ครับ"

**หลักฐานในโค้ด:** `server/routes/bookings.ts` 104 (`randomBytes(16)`), `server/routes/driver.ts` 241–254

## สิ่งที่ต้องจำ (หัวข้อ 9)

1. `POST /api/driver/trips/:tripId/check-in` = `driver.ts` 229–272 ต้องผ่าน `requireScreenPermission(pool, true)`
2. รับ `qr_payload` (ยาวไม่เกิน 50) ซึ่งมีค่า = `BOOKING_CODE`
3. เช็ก 3 ชั้น: รอบของเรา → `TRIP.STATUS = 2` → มี `BOOKING_DETAIL` ของรอบนี้ที่ `STATUS_CODE = 1`
4. เปลี่ยน `STATUS_CODE 1→2` + `CHECKED_IN_AT` + `CHECKED_IN_BY_EMPLOYEE_ID` (lock `FOR UPDATE OF BD.STATUS_CODE`)
5. ผิด/ซ้ำ/ของรอบอื่น → 409 ข้อความเดียว
6. `CK_BD_CHECKIN_PAIR` บังคับเวลา + คนกดต้องมาเป็นคู่


# หัวข้อ 10: ระบบคนขับ — แสดงและสแกน QR ผู้โดยสารที่มาใช้บริการจริง (3 คะแนน)

## ภาพรวม

ผู้โดยสารเห็น QR บนตั๋วใน `PassengerPortal` คนขับเปิดแท็บสแกนใน `DriverPortal` แล้วสแกนด้วยกล้องผ่านไลบรารี `html5-qrcode` (หรือพิมพ์รหัสเองถ้าไม่มีกล้อง) ข้อความที่อ่านได้ถูกส่งเป็น `qr_payload` เข้า `POST /api/driver/trips/:tripId/check-in` เมื่อสำเร็จ ระบบเปลี่ยน `STATUS_CODE` 1 → 2 ซึ่ง "ผู้โดยสารที่มาใช้จริง" คือแถวที่สถานะ 2/3 และเมื่อจบเที่ยว (`finish`) ระบบจะสรุปจำนวนขึ้นรถ/ไม่ขึ้นรถ/ลงแล้วให้

## จุดสำคัญในโค้ด

| เรื่อง | ไฟล์ | Function / Route | บรรทัด |
|---|---|---|---|
| แสดง QR ผู้โดยสาร | `src/components/live/PassengerPortal.tsx` | `<QrCodeSvg value={booking_code}>` | 1484, 1758 |
| สร้าง QR | `src/components/common/QrCodeSvg.tsx` | `QRCode.toDataURL` | 14–30 |
| เปิดกล้องสแกน | `src/components/live/DriverPortal.tsx` | dynamic import `html5-qrcode`, `scanner.start` | 305–331 |
| จัดการผลสแกน | `src/components/live/DriverPortal.tsx` | `handleScanTicket` | 238–278 |
| ช่องพิมพ์รหัส (manual) | `src/components/live/DriverPortal.tsx` | `scanCodeInput` + Enter | 1028–1031 |
| เรียกเช็กอิน | `src/context/BusContext.tsx` | `apiCheckIn()` | 1910 |
| เช็กอิน (เซิร์ฟ) | `server/routes/driver.ts` | `POST /trips/:tripId/check-in` | 229–272 |
| ลงรถ | `server/routes/driver.ts` | `POST /trips/:tripId/alight` | 278–366 |
| จบเที่ยว + สรุปยอด | `server/routes/driver.ts` | `POST /trips/:tripId/finish` | 368–421 |

**Database:** `BOOKING_DETAIL.STATUS_CODE` (`1` จอง → `2` เช็กอิน → `3` จบเที่ยวขึ้นรถ, `4` ไม่ขึ้นรถ), `ALIGHTED_AT`, `ALIGHTED_ROUTE_STOP_ID`, `TRIP.STATUS` (`2 → 3`), `TRIP.ACTUAL_FINISHED_AT`

## คำถามและคำตอบ

### ข้อ 10.1 (ระดับ 1) หน้าคนขับแสดง QR/รายการสแกนอย่างไร?

**คำตอบแบบพูดตอบอาจารย์:** "ผู้โดยสารเห็น QR ในหน้าตั๋วด้วย `<QrCodeSvg value={booking_code}>` ส่วนฝั่งคนขับเปิดแท็บ 'scan' (`useState<DriverTab>('trips' | 'scan' | 'passengers')`) ซึ่งมีทั้งหน้ากล้องสแกนและช่องพิมพ์รหัสสำรองครับ"

**หลักฐานในโค้ด:** `src/components/live/PassengerPortal.tsx` 1484/1758, `src/components/live/DriverPortal.tsx` 37, 963–1031

**คำถามต่อยอด:** ถ้าเปิดกล้องไม่ได้ (ไม่ใช่ localhost/HTTPS) ทำอย่างไร?
**คำตอบต่อยอด:** "มี fallback ครับ `catch` ของ `scanner.start` ตั้ง `scanFeedback` ว่า 'Camera permission or device unavailable. Enter the booking code below instead.' (`DriverPortal.tsx` 330) แล้วให้พิมพ์รหัสเอง ซึ่งได้ผลลัพธ์เดียวกันเพราะส่งเข้า endpoint เดียวกัน"

### ข้อ 10.2 (ระดับ 2) ขั้นตอนตั้งแต่สแกนจนผู้โดยสารถูกนับว่า "มาใช้จริง"?

**คำตอบแบบพูดตอบอาจารย์:** "5 ขั้นครับ 1) กล้องอ่าน QR สำเร็จ → callback รับ `decodedText` 2) กันซ้ำด้วย `scanInProgressRef` 3) เรียก `handleScanTicket(decodedText)` 4) ถ้า API mode เรียก `apiCheckIn(activeTrip.trip_id, qrPayload)` → `POST /driver/trips/:id/check-in` 5) เซิร์ฟเวอร์เปลี่ยน `STATUS_CODE` 1 → 2 พร้อมบันทึกเวลา แล้วหน้าเว็บโหลดข้อมูลผู้โดยสารใหม่เพื่อแสดงเป็น 'เช็กอินแล้ว' ครับ"

**Relevant Code** (`src/components/live/DriverPortal.tsx` 314–319):

```ts
async (decodedText) => {
  if (scanInProgressRef.current) return;
  scanInProgressRef.current = true;
  try { await handleScanTicket(decodedText); }
  finally { scanInProgressRef.current = false; }
}
```

`src/context/BusContext.tsx` 1910:

```ts
const apiCheckIn = async (tripId: number, qrPayload: string) => {
  await api(`/driver/trips/${tripId}/check-in`, { method: 'POST', body: JSON.stringify({ qr_payload: qrPayload }) });
  await apiLoginComplete('driver', { ... });
};
```

**Flow:** กล้อง `html5-qrcode` → `decodedText` → `handleScanTicket` → `apiCheckIn` → `POST /driver/trips/:id/check-in` → `lockAssignedTrip` + `TRIP.STATUS=2` + SELECT `BOOKING_CODE` ที่ `STATUS_CODE=1` (`FOR UPDATE`) → `UPDATE STATUS_CODE=2, CHECKED_IN_AT, CHECKED_IN_BY_EMPLOYEE_ID` → 200 → frontend reload ข้อมูลผู้โดยสาร


# หัวข้อ 10 (ต่อ): คำถามระดับ 2

### ข้อ 10.3 (ระดับ 2) ระบบป้องกันการสแกนซ้ำหรือสแกนผิดรอบอย่างไร?

**คำตอบแบบพูดตอบอาจารย์:** "3 ชั้นครับ 1) ฝั่งเว็บมี `scanInProgressRef` กัน callback เรียกซ้ำขณะกำลัง process 2) เซิร์ฟเวอร์บังคับว่าต้องเป็นรอบของคนขับคนนี้และ `TRIP.STATUS = 2` 3) SELECT กรอง `BD.STATUS_CODE = 1` เฉพาะที่ยังไม่เช็กอิน ถ้าเช็กอินแล้วจะหาไม่เจอ → 409 ทำให้สแกนซ้ำไม่เพิ่มจำนวนครับ"

**หลักฐานในโค้ด:** `src/components/live/DriverPortal.tsx` 183 (`const scanInProgressRef = useRef(false)`), 315–316; `server/routes/driver.ts` 239–254 และ `UPDATE ... WHERE STATUS_CODE = 1` (261)

**คำถามต่อยอด:** ถ้าสแกน QR ของอีกรอบหนึ่งที่ตัวเองขับ?
**คำตอบต่อยอด:** "ไม่เจอแถวเพราะ `AND BD.TRIP_ID = :tripId` ระบุรอบที่กำลังเช็กอินอยู่ ได้ 409 ครับ ระบบไม่ยอมใช้ QR ของรอบอื่นในรอบนี้"

### ข้อ 10.4 (ระดับ 2) "ผู้โดยสารที่มาใช้บริการจริง" แสดงที่ไหน คิดจากอะไร?

**คำตอบแบบพูดตอบอาจารย์:** "คิดจาก `BOOKING_DETAIL.STATUS_CODE` ครับ สถานะ 2 คือขึ้นรถแล้ว เมื่อกด 'จบเที่ยว' ระบบเปลี่ยน 2 → 3 (ขึ้นรถและจบเที่ยว) ส่วนที่ยังเป็น 1 อยู่จะเปลี่ยนเป็น 4 (ไม่ได้ขึ้นรถ) แล้วคืนสรุป `boarded_count`, `no_show_count`, `alighted_count`, `not_alighted_count` ให้หน้าเว็บแสดงครับ"

**Relevant Code** (`server/routes/driver.ts` 374–394):

```ts
UPDATE BOOKING_DETAIL SET STATUS_CODE = 3 WHERE TRIP_ID = :tripId AND STATUS_CODE = 2;
UPDATE BOOKING_DETAIL SET STATUS_CODE = 4 WHERE TRIP_ID = :tripId AND STATUS_CODE = 1;
UPDATE TRIP SET STATUS = 3, ACTUAL_FINISHED_AT = SYSTIMESTAMP
WHERE TRIP_ID = :tripId AND DRIVER_ID = :employeeId AND STATUS = 2;

SELECT SUM(CASE WHEN STATUS_CODE = 3 THEN SEAT_COUNT ELSE 0 END) AS BOARDED_COUNT,
       SUM(CASE WHEN STATUS_CODE = 4 THEN SEAT_COUNT ELSE 0 END) AS NO_SHOW_COUNT,
       SUM(CASE WHEN STATUS_CODE = 3 AND ALIGHTED_AT IS NOT NULL THEN SEAT_COUNT ELSE 0 END) AS ALIGHTED_COUNT,
       SUM(CASE WHEN STATUS_CODE = 3 AND ALIGHTED_AT IS NULL THEN SEAT_COUNT ELSE 0 END) AS NOT_ALIGHTED_COUNT
FROM BOOKING_DETAIL WHERE TRIP_ID = :tripId
```

**คำถามต่อยอด:** ฝั่งเว็บแสดงรายการ no-show จาก state ในเบราว์เซอร์หรือเปล่า?
**คำตอบต่อยอด:** "ไม่ใช่ครับ `apiFinishTrip` ใน `BusContext.tsx` 1917–1935 ใช้ `result.summary.no_shows` ที่เซิร์ฟเวอร์ query จาก Oracle โดยตรง (คอมเมนต์บรรทัด 1920–1921) เพื่อให้ตัวเลขตรงกับที่บันทึกลงฐานข้อมูลเสมอ"

### ข้อ 10.5 (ระดับ 2) การ "ลงรถ" (`alight`) ทำอย่างไร ต่างจากเช็กอินอย่างไร?

**คำตอบแบบพูดตอบอาจารย์:** "ต่างกันตรงที่ใช้ `booking_id` ไม่ใช่ QR และเป็นคนขับกดยืนยันทีละใบจองครับ `POST /api/driver/trips/:tripId/alight` จะล็อกแถว แล้วเช็ก 3 อย่าง: ต้องเป็นรอบที่กำลังวิ่ง (`STATUS=2`) ทุกแถวต้อง `STATUS_CODE = 2` (ขึ้นรถก่อนจึงลงได้) และยังไม่เคยลง (`ALIGHTED_AT IS NULL` → ถ้ามีแล้วได้ 409 'Booking already alighted') แล้ว `UPDATE ALIGHTED_AT = SYSTIMESTAMP, ALIGHTED_ROUTE_STOP_ID = :routeStopId` ครับ"

**หลักฐานในโค้ด:** `server/routes/driver.ts` 278–366 โดยเฉพาะ 297 (`STATUS !== 2` → 409), 311–316 (ต้องขึ้นก่อน/ห้ามลงซ้ำ), 332–343 (เช็กลำดับป้าย: ห้ามลงก่อนถึงป้ายลง — `alightOrder < dropOrder` → 409 'Bus has not reached the drop-off stop yet'), 345–350 (`UPDATE`)

**คำถามต่อยอด:** ถ้าผู้โดยสารลงผิดป้าย (ลงก่อนป้ายที่จอง)?
**คำตอบต่อยอด:** "ระบบเทียบ `STOP_ORDER` ของป้ายที่กดลงกับป้ายที่จอง ถ้าป้ายลงมีลำดับน้อยกว่าป้ายที่จองจะไม่ให้ลง (409) แต่ยอมลงที่ป้ายเลยมาได้ เพื่อรองรับกรณีรถเลยป้าย/ลงช้าครับ ที่บรรทัด 332–343"

### ข้อ 10.6 (ระดับ 3) ทำไมใช้ `booking_code` เป็น QR ไม่ใช่ข้อมูลอื่น เช่น ชื่อหรือเลขที่นั่ง?

**คำตอบแบบพูดตอบอาจารย์:** "เพราะ `booking_code` เป็น unique key ที่เชื่อมกลับ `BOOKING` และ `BOOKING_DETAIL` ได้ทันที ทำให้ query เดียวรู้ทั้งชื่อผู้โดยสาร จำนวนที่นั่ง และสถานะ ส่วนชื่อ/เลขที่นั่งซ้ำกันได้และไม่มีเลขที่นั่งจริงในระบบ (เก็บเป็น `SEAT_COUNT`) จึงใช้ระบุตัวตนไม่ได้ครับ นอกจากนี้ `qr_payload` ยาวไม่เกิน 50 ซึ่งรองรับ `SB-` + 32 hex พอดีครับ"

**หลักฐานในโค้ด:** `server/routes/bookings.ts` 104, 225 (`qr_payload: result.bookingCode`), `server/routes/driver.ts` 236, 241–251, `database.sql` `UQ_BOOKING_CODE`

## สิ่งที่ต้องจำ (หัวข้อ 10)

1. QR แสดงที่ `PassengerPortal` (1484, 1758) สร้างด้วย `QrCodeSvg` (ไลบรารี `qrcode`)
2. สแกนด้วย `html5-qrcode` (dynamic import ที่ `DriverPortal.tsx` 308) + fallback พิมพ์รหัสเอง
3. `apiCheckIn` → `POST /driver/trips/:id/check-in` → `STATUS_CODE 1→2`
4. กันซ้ำ: `scanInProgressRef` + `WHERE STATUS_CODE = 1` + ต้อง `TRIP.STATUS = 2`
5. "มาใช้จริง" = `STATUS_CODE` 2/3; สรุปยอดตอน `finish` เปลี่ยน 2→3, 1→4 แล้วนับ `SEAT_COUNT`
6. `alight` ใช้ `booking_id` + บันทึก `ALIGHTED_AT`/`ALIGHTED_ROUTE_STOP_ID` และเช็กลำดับป้าย
7. `TRIP.STATUS` 2 → 3 ตอนจบเที่ยว พร้อม `ACTUAL_FINISHED_AT`


# ภาคผนวก ก: สรุป File และ Function สำคัญ

## File ฝั่ง Backend

| ไฟล์ | หน้าที่ |
|---|---|
| `server/app.ts` | ติดตั้ง Express + mount router ทั้งหมด (บรรทัด 16–22) + `errorHandler` |
| `server/routes/auth.ts` | สมัคร/ล็อกอิน 3 บทบาท, logout, `/me` |
| `server/routes/catalog.ts` | `GET /routes`, `/routes/:id/stops`, `/trips`, `/trips/:id/seats` |
| `server/routes/bookings.ts` | จอง/ดู/ยกเลิก/ซ่อนตั๋ว |
| `server/routes/driver.ts` | ตารางงาน, เริ่ม/จบเที่ยว, ผู้โดยสาร, เช็กอิน, ลงรถ |
| `server/routes/admin.ts` | master ทั้งหมด + permissions + visibility + trips |
| `server/auth/password.ts` | `hashPassword`, `verifyPassword` (scrypt) |
| `server/auth/sessions.ts` | `createSession`, `getSession`, `deleteSession`, `publicSession` |
| `server/middleware/requireAuth.ts` | `requireAuth(kind)`, `sessionFrom` |
| `server/middleware/errorHandler.ts` | แปลง `HttpError` เป็น response JSON |
| `server/db/query.ts` | `withConnection`, `withTransaction`, `queryRows`, `oracleErrorNumber` |

## File ฝั่ง Frontend

| ไฟล์ | หน้าที่ |
|---|---|
| `src/api/client.ts` | `api()`, `apiLogin`, `apiRegisterPassenger`, `apiUpsertPermission`, `apiCreateEmployee`, `apiHideAdminRecord`, ... |
| `src/context/BusContext.tsx` | state กลาง + ฟังก์ชันทุกอย่าง (`addPermission`, `apiCreateBooking`, `apiCancelBooking`, `apiCheckIn`, `logout`, `canEditScreen`, ...) |
| `src/components/auth/LoginScreen.tsx` | ฟอร์มล็อกอิน/สมัครตามบทบาท |
| `src/components/live/PassengerPortal.tsx` | ค้นรอบ, จอง, ตั๋ว + QR, ยกเลิก |
| `src/components/live/DriverPortal.tsx` | ตารางงาน, สแกน, ผู้โดยสาร, เริ่ม/จบเที่ยว |
| `src/components/live/AdminPortal.tsx` | หน้าแอดมินรวม |
| `src/components/live/screens/FleetStaffManagementView.tsx` | พนักงาน + รถ (เพิ่ม/แก้/ค้นหา) |
| `src/components/live/screens/RbacManagementView.tsx` | กำหนดสิทธิ์ (เพิ่ม/แก้/ลบ/ค้นหา) |
| `src/components/live/screens/PositionManagementView.tsx`, `DepartmentManagementView.tsx` | ตำแหน่ง/ฝ่าย |
| `src/components/common/QrCodeSvg.tsx` | สร้าง QR |
| `src/data/mockDatabase.ts` | `initialScreens` (70–78), `initialPermissions` (83–97), ข้อมูลจำลองโหมด non-API |
| `database.sql` | โครงสร้างตาราง + constraint ทั้งหมด |

## Function สำคัญที่อาจารย์มักถาม

| Function | ไฟล์ | บรรทัด | ทำอะไร |
|---|---|---|---|
| `hashPassword` / `verifyPassword` | `server/auth/password.ts` | 24 / 37 | สร้างและตรวจ `PASSWORD_HASH` |
| `createSession` / `getSession` / `deleteSession` | `server/auth/sessions.ts` | 18 / 29 / 39 | จัดการ token 12 ชั่วโมง |
| `requireAuth(kind)` | `server/middleware/requireAuth.ts` | 9 | ตรวจ Bearer + ประเภท session |
| `requireScreenEdit(pool, code)` | `server/routes/admin.ts` | 16 | ตรวจ `CAN_EDIT` + ไม่ถูกซ่อน |
| `requireScreenPermission(pool, canEdit)` | `server/routes/driver.ts` | 19 | ตรวจสิทธิ์หน้าจอ 8820 ของคนขับ |
| `lockAssignedTrip` | `server/routes/driver.ts` | 53 | ล็อกแถว `TRIP` + ยืนยันเป็นรอบเรา |
| `requireStartableDeparture` | `server/routes/driver.ts` | 69 | เช็กยังไม่เลยเวลาออก |
| `bookingInput` / `positiveId` | `server/routes/bookings.ts` | 14 / 8 | validate body การจอง |
| `mapOracleError` | `server/routes/admin.ts` | 51 | แปลง ORA-1 → 409 |
| `textField` | `server/routes/admin.ts` | 39 | validate ข้อความ/ความยาว |
| `canEditScreen` / `canViewScreen` | `src/context/BusContext.tsx` | 717 / 709 | สิทธิ์ฝั่ง UI |
| `addPermission` / `updatePermission` / `deletePermission` | `src/context/BusContext.tsx` | 743 / 805 / 800 | CRUD สิทธิ์ |
| `apiCreateBooking` / `apiCancelBooking` | `src/context/BusContext.tsx` | 1894 / 1902 | เรียก API จอง/ยกเลิก |
| `apiCheckIn` / `apiStartTrip` / `apiFinishTrip` | `src/context/BusContext.tsx` | 1910 / 1903 / 1917 | งานคนขับ |
| `handleConfirmAllStagedBookings` | `src/components/live/PassengerPortal.tsx` | 500 | ยืนยันจอง |
| `handleScanTicket` | `src/components/live/DriverPortal.tsx` | 238 | จัดการผลสแกน |


# ภาคผนวก ข: สรุป API / Database / Business Logic / Flow

## API ทั้งหมดที่ใช้งานจริง (mount ใน `server/app.ts`)

| Method + Path | ไฟล์ | สิทธิ์ที่ตรวจ | ใช้ที่ไหน |
|---|---|---|---|
| `POST /api/auth/passenger/register` | auth.ts 29 | public | สมัคร |
| `POST /api/auth/passenger/login` | auth.ts 85 | public + `IS_ACTIVE='Y'` | ล็อกอิน |
| `POST /api/auth/driver/login` | auth.ts 120 | + สิทธิ์หน้าจอ 8820 | ล็อกอินคนขับ |
| `POST /api/auth/admin/login` | auth.ts 171 | + สิทธิ์ 1101/1102/1103 | ล็อกอินแอดมิน |
| `GET /api/auth/me`, `POST /api/auth/logout` | auth.ts 222, 226 | session | ดู/ลบ session |
| `GET /api/routes` | catalog.ts 21 | public | เลือกเส้นทาง |
| `GET /api/routes/:routeId/stops` | catalog.ts 37 | public | จุดจอด |
| `GET /api/trips` | catalog.ts 59 | public | รายการรอบ + ที่นั่งว่าง |
| `GET /api/trips/:tripId/seats` | catalog.ts 149 | public | นั่งจองแล้ว |
| `GET /api/bookings/me?filter=...` | bookings.ts 29 | passenger | ตั๋วของฉัน |
| `POST /api/bookings` | bookings.ts 101 | passenger | จอง |
| `POST /api/bookings/:bookingId/cancel` | bookings.ts 232 | passenger (เจ้าของ) | ยกเลิก |
| `POST /api/bookings/:bookingId/hide` | bookings.ts 274 | passenger (เจ้าของ) | ซ่อนตั๋ว |
| `GET /api/driver/me` | driver.ts 96 | driver | โปรไฟล์ |
| `GET /api/driver/trips` | driver.ts 107 | + view 8820 | ตารางงาน |
| `GET /api/driver/trips/:tripId/passengers` | driver.ts 135 | + view 8820 | ผู้โดยสารตามป้าย |
| `POST /api/driver/trips/:tripId/start` | driver.ts 214 | + edit 8820 | เริ่มรอบ |
| `POST /api/driver/trips/:tripId/check-in` | driver.ts 229 | + edit 8820 | เช็กอิน |
| `POST /api/driver/trips/:tripId/alight` | driver.ts 278 | + edit 8820 | ลงรถ |
| `POST /api/driver/trips/:tripId/finish` | driver.ts 368 | + edit 8820 | จบเที่ยว |
| `GET /api/admin/masters` | admin.ts 64 | admin | โหลด master ทั้งหมด |
| `POST/PUT /api/admin/employees[/:id]` | admin.ts 130, 167 | `requireScreenEdit('1101')` | พนักงาน |
| `POST /api/admin/employees/:id/hide` | admin.ts 234 | `1101` | ซ่อนพนักงาน |
| `POST /api/admin/permissions` | admin.ts 618 | `requireScreenEdit('9102')` | upsert สิทธิ์ |
| `POST /api/admin/visibility/hide` | admin.ts 910 | เช็ก `CAN_EDIT` ตาม entity | ซ่อน position/department/permission/employee |
| `POST/PUT/DELETE /api/admin/routes|stops|...` | admin.ts 250+ | `6794` / `3456` / `1101`/`1102`/`1103` | master อื่น |

## ตาราง Database และความสัมพันธ์

| ตาราง | PK | FK / ความสัมพันธ์ | คอลัมน์สำคัญ |
|---|---|---|---|
| `SYSTEM_USER` | `USER_ID` | — | `USERNAME` (unique), `PASSWORD_HASH`, `USER_TYPE`, `IS_ACTIVE` |
| `DEPARTMENT` | `DEPARTMENT_ID` | — | `DEPARTMENT_NAME` |
| `POSITION` | `POSITION_ID` | — | `POSITION_NAME` |
| `EMPLOYEE` | `EMPLOYEE_ID` | FK → `DEPARTMENT`, `POSITION` | `USERNAME` (unique), `PASSWORD_HASH`, `IS_ACTIVE` |
| `SCREEN` | `SCREEN_ID` | — | `SCREEN_CODE` (unique) |
| `ROLE_PERMISSION` | `PERMISSION_ID` | FK → `POSITION`, `SCREEN` | `CAN_VIEW`, `CAN_EDIT` + `UQ_RP_POSITION_SCREEN` |
| `WEB_HIDDEN_RECORD` | `(ENTITY_NAME, RECORD_KEY, OWNER_ID)` | — | `HIDDEN_AT` (`OWNER_ID='*'` = ทุกคน) |
| `ROUTE` / `STOP` / `ROUTE_STOP` | `ROUTE_ID` / `STOP_ID` / `ROUTE_STOP_ID` | FK สาย | `STOP_ORDER`, `MINUTES_FROM_PREV` |
| `VEHICLE` / `VEHICLE_TYPE` | `VEHICLE_ID` | FK → type | `CAPACITY`, `STATUS` |
| `TRIP` | `TRIP_ID` (+unique `TRIP_ID,ROUTE_ID`) | FK → `ROUTE`, `EMPLOYEE`, `VEHICLE` | `DEPARTURE_AT`, `STATUS` (0–3), `ACTUAL_STARTED_AT`, `ACTUAL_FINISHED_AT` |
| `BOOKING` | `BOOKING_ID` | FK → `SYSTEM_USER` | `BOOKING_CODE` (unique), `BOOKING_TIME` |
| `BOOKING_DETAIL` | `DETAIL_ID` | FK → `BOOKING`, `TRIP(TRIP_ID,ROUTE_ID)` | `SEAT_COUNT` (1–4), `STATUS_CODE` (0–4), `PICKUP/DROPOFF_ROUTE_STOP_ID`, `CHECKED_IN_AT`, `ALIGHTED_AT` |

## Business Logic (สูตรและเงื่อนไข)

1. **รหัสผ่าน:** `scrypt(N=16384, r=8, p=1, key=64)` + salt 16 → `scrypt$16384$8$1$salt$key`; เทียบด้วย `timingSafeEqual`
2. **Session:** token = `randomBytes(32)` base64url, อายุ 12 ชั่วโมง, เก็บใน `Map` ของเซิร์ฟเวอร์
3. **cutoff 20 นาที:** `DEPARTURE_AT + SUM(MINUTES_FROM_PREV WHERE STOP_ORDER <= จุดขึ้น) >= SYSTIMESTAMP + 20 นาที`
4. **ความจุ:** `SUM(SEAT_COUNT) WHERE STATUS_CODE <> 0 AND PICK_ORDER < newDrop AND DROP_ORDER > newPick` + `seat_count <= CAPACITY`
5. **คืนที่นั่ง:** `UPDATE BOOKING_DETAIL SET STATUS_CODE = 0` (ไม่แก้ `SEAT_COUNT`)
6. **สถานะการจอง:** `0` ยกเลิก, `1` จอง, `2` เช็กอิน, `3` จบเที่ยว, `4` ไม่ขึ้นรถ
7. **สถานะรอบรถ:** `0` ยกเลิก, `1` เปิด, `2` กำลังวิ่ง, `3` เสร็จ
8. **สรุปยอดจบเที่ยว:** `2→3`, `1→4`, `TRIP 2→3` แล้ว SUM `SEAT_COUNT` แยก CASE
9. **เวลาถึงจุดขึ้น (upcoming):** `DEPARTURE_AT + SUM(MINUTES_FROM_PREV)/1440 > SYSDATE`

## Flow สำคัญ (พูดได้เป็นเรียงความ)

1. **ล็อกอิน:** ฟอร์ม → `apiLogin` → `POST /api/auth/{role}/login` → SELECT ตารางตามบทบาท + `IS_ACTIVE='Y'` → `verifyPassword` → (คนขับ/แอดมินเช็ก `ROLE_PERMISSION`) → `createSession` → token → `sessionStorage` → ทุกคำขอแนบ `Authorization: Bearer`
2. **จอง:** เลือกเส้นทาง/จุด/วัน/รอบ/ที่นั่ง → `POST /api/bookings` → `SELECT TRIP FOR UPDATE` → 5 เงื่อนไข → `INSERT BOOKING` + `INSERT BOOKING_DETAIL(STATUS_CODE=1)` → คืน `booking_code` → แสดง QR
3. **สแกนเช็กอิน:** กล้อง `html5-qrcode` → `qr_payload` → `POST /driver/trips/:id/check-in` → ล็อก + ตรวจรอบ/สถานะ → `UPDATE STATUS_CODE=2` → reload → แสดง "เช็กอินแล้ว"
4. **ยกเลิก:** ปุ่ม → modal → `POST /bookings/:id/cancel` → ล็อก + ตรวจนโยบาย → `STATUS_CODE=0` → คืน `cancelled_seats` → ที่นั่งว่างกลับมาเองเพราะนับจาก `STATUS_CODE<>0`
5. **จบเที่ยว:** `POST /driver/trips/:id/finish` → `2→3`, `1→4`, `TRIP→3` → คืนสรุป (ขึ้นรถ/ไม่ขึ้น/ลงแล้ว)


# ภาคผนวก ค: จุดที่อาจารย์มีโอกาสถามเป็นพิเศษ

## คำถามยอดฮิต + แนวตอบสั้น

**ถาม: ระบบป้องกันไม่ให้คนทั่วไปเรียก API แก้ข้อมูลอย่างไร?**
ตอบ: ทุก endpoint ของแอดมิน/คนขับ/ผู้โดยสารมี `requireAuth(kind)` ตรวจ Bearer token และตรวจสิทธิ์หน้าจอซ้ำที่ `requireScreenEdit` / `requireScreenPermission` ถ้าไม่มีสิทธิ์ได้ 403 ไม่ใช่แค่ซ่อนปุ่มในหน้าเว็บครับ

**ถาม: เก็บรหัสผ่านอย่างไร?**
ตอบ: scrypt + salt เก็บใน `PASSWORD_HASH` เท่านั้น ไม่มี plaintext และเทียบด้วย `timingSafeEqual`

**ถาม: จองเกินความจุพร้อมกันได้ไหม?**
ตอบ: ไม่ได้ เพราะล็อก `TRIP` ด้วย `FOR UPDATE` ใน transaction เดียวกับการตรวจความจุ และมีการจับ error ชนกันเป็น 409

**ถาม: กดยกเลิกซ้ำได้ไหม?**
ตอบ: ไม่ได้ guard `STATUS_CODE = 1` จะคืน 409 ในครั้งที่สอง จึงไม่มีการคืนที่นั่งซ้ำ

**ถาม: "dynamic" ตรงไหน?**
ตอบ: คู่ตำแหน่ง–หน้าจอและ `CAN_VIEW/CAN_EDIT` เป็นข้อมูลในตาราง `ROLE_PERMISSION` เพิ่ม/แก้/ลบได้จากหน้าเว็บ ไม่ต้องแก้โค้ด และเซิร์ฟเวอร์ตรวจจาก `SCREEN_CODE` ในฐานข้อมูล

**ถาม: ทำไมหน้าเว็บมี `screen_id` เป็นเลข (10, 14, 16) แต่เซิร์ฟเวอร์ใช้ `screen_code` (3456, 8820, 9102)?**
ตอบ: หน้าเว็บใช้เลข `screen_id` จาก `initialScreens` ใน `src/data/mockDatabase.ts` ในการแสดงผล ส่วนเซิร์ฟเวอร์ใช้ `SCREEN_CODE` ที่ค้นจากตาราง `SCREEN` เพื่อไม่ผูกกับ id ที่อาจต่างกันในแต่ละ environment ครับ

**ถาม: ถ้า restart API จะเกิดอะไรขึ้น?**
ตอบ: session ทั้งหมดหายเพราะเก็บใน `Map` หน่วยความจำ (`server/auth/sessions.ts` 16) ผู้ใช้ต้องล็อกอินใหม่ แต่ข้อมูลใน Oracle ไม่หาย

**ถาม: QR ต่างจาก booking code อย่างไร?**
ตอบ: ค่าเดียวกัน QR เป็นแค่การเขียน `booking_code` ให้เครื่องอ่านอ่านได้ (`qr_payload = booking_code`)

**ถาม: ระบบมีตารางไหนบ้างที่ไม่มีการ DELETE เลย?**
ตอบ: `EMPLOYEE`, `ROLE_PERMISSION`, `BOOKING` — ใช้ `WEB_HIDDEN_RECORD` (ซ่อน) หรือเปลี่ยนสถานะแทน เพื่อรักษาประวัติครับ

**ถาม: สิทธิ์เปลี่ยนระหว่างที่ user ล็อกอินอยู่ มีผลเมื่อไหร่?**
ตอบ: ฝั่งเซิร์ฟเวอร์มีผลกับคำขอถัดไปทันทีเพราะ query `ROLE_PERMISSION` ทุกครั้ง แต่ฝั่งหน้าเว็บ state `permissions` ต้องโหลดใหม่ (เช่น ล็อกอินใหม่/รีเฟรช) ครับ

**ถาม: ข้อจำกัดที่รู้ตัวของระบบนี้?**
ตอบ: (1) ซ่อนพนักงานไม่ได้ปิด login (2) session อยู่ในหน่วยความจำ (3) รายงานสถิติบางส่วนยังเป็นข้อมูลจำลอง (4) QR ไม่มีลายเซ็น/อายุ (5) การค้นหาเป็น client-side

## ตารางสรุปสถานะที่ใช้บ่อย

| ตาราง | คอลัมน์ | ค่า | ความหมาย | เปลี่ยนที่ |
|---|---|---|---|---|
| `TRIP` | `STATUS` | 0 → ยกเลิก | แอดมิน (`POST /admin/trips/:id/status`) |
| `TRIP` | `STATUS` | 1 → เปิด | ตอนสร้างรอบ |
| `TRIP` | `STATUS` | 1 → 2 | `POST /driver/trips/:id/start` |
| `TRIP` | `STATUS` | 2 → 3 | `POST /driver/trips/:id/finish` |
| `BOOKING_DETAIL` | `STATUS_CODE` | 1 | `POST /bookings` (ตอนจอง) |
| `BOOKING_DETAIL` | `STATUS_CODE` | 1 → 2 | `POST /driver/trips/:id/check-in` |
| `BOOKING_DETAIL` | `STATUS_CODE` | 1 → 0 | `POST /bookings/:id/cancel` |
| `BOOKING_DETAIL` | `STATUS_CODE` | 2 → 3, 1 → 4 | `POST /driver/trips/:id/finish` |

## คำเตือนก่อนเข้าสอบ

1. อย่าบอกว่า "ลบข้อมูล" ถ้าเป็น `WEB_HIDDEN_RECORD` — ให้บอกว่า "ซ่อน ไม่ลบแถว"
2. อย่าบอกว่ารหัสผ่านถูกเข้ารหัส — ให้บอกว่า "แฮชด้วย scrypt ไม่สามารถแปลงกลับได้"
3. ถ้าถูกถามเรื่องที่ไม่มีในโค้ด ให้ตอบตรง ๆ ว่า "ไม่พบในโปรเจกต์" แล้วอธิบายว่าถ้าจะทำต้องเพิ่มส่วนไหน
4. เลขบรรทัดที่อ้างในเอกสารนี้มาจากโค้ดปัจจุบันของโปรเจกต์ ถ้ามีการแก้ไฟล์ภายหลังเลขอาจเปลี่ยน ให้ยึดชื่อ function/route เป็นหลัก
