# FinEx POS Desktop

Next.js 16 + Tauri 2.0 ашигласан POS desktop application.

## Технологи

- **Frontend:** Next.js 16, React 19, TypeScript
- **Desktop:** Tauri 2.0 (Rust)
- **UI:** Shadcn/ui, Tailwind CSS
- **State Management:** Zustand
- **API:** Axios

## Суулгах

```bash
# Dependencies суулгах
npm install
```

## Ажиллуулах

### Web mode (Next.js only)
```bash
npm run dev
```
http://localhost:3000 дээр нээгдэнэ

### Desktop mode (Tauri)
```bash
npm run tauri:dev
```

Анхны ажиллуулалтын үед Rust dependencies татах тул удаан байж болно.

## Build хийх

### Web build
```bash
npm run build
```

### Desktop build (Windows & macOS)
```bash
npm run tauri:build
```

Build хийгдсэн файл: `src-tauri/target/release/` фолдерт үүснэ.

---

## Device Pairing System (Activation Code)

### Процесс

1. **Web Admin:**
   - ПОС Төхөөрөмж цэс → Шинэ төхөөрөмж үүсгэх
   - Систем 6-8 оронтой Activation Code үүсгэнэ (жишээ: `FX-8821`)
   - Энэ код 24 цагийн турш хүчинтэй

2. **Desktop App Анх нээх:**
   - "Төхөөрөмж баталгаажуулах" цонх харагдана
   - Activation Code оруулна

3. **Activation:**
   - Backend код валидаци хийнэ
   - Амжилттай бол `POS_TOKEN`, device мэдээлэл буцаана
   - LocalStorage + Tauri Store-д хадгалагдана

4. **User Login:**
   - Paired device дээр зөвхөн **password** оруулна
   - Device автоматаар таньна (device code санах шаардлагагүй)

### Unpair төхөөрөмж

Login screen дээр "Төхөөрөмж солих" товч дарж unpair хийж болно. Үүний дараа шинээр activation code оруулах шаардлагатай.

---

## Модулийн бүтэц

### Routes

- `/login` - Төхөөрөмж баталгаажуулах / User нэвтрэх
- `/cash` - Касс нээх/хаах
- `/sync` - Server-ээс өгөгдөл татах
- `/sale` - Борлуулалт бүртгэх (үндсэн screen)
- `/upload` - Offline хийсэн борлуулалтыг server луу илгээх

### State Management (Zustand)

**usePosStore** - POS desktop state:
- `isPaired` - Device pair хийгдсэн эсэх
- `posToken` - Backend POS_TOKEN
- `deviceId`, `deviceCode`, `deviceName` - Төхөөрөмжийн мэдээлэл
- `posUser` - Нэвтэрсэн хэрэглэгч
- `cashSession` - Касс session (нээгдсэн эсэх)
- `syncData` - Sync хийсэн өгөгдөл (menu, price, discount гэх мэт)
- `pendingSales` - Offline хийгдсэн борлуулалтууд

### Үндсэн функцууд

1. **Device Pairing** — Activation Code ашиглан төхөөрөмж баталгаажуулах
2. **User Login** — Password-ээр нэвтрэх (paired device дээр)
3. **Cash Session** — Касс нээх, хаах
4. **Sync** — Server-ээс өгөгдөл татах
5. **Sale** — Offline билл үүсгэх, төлөлт хийх
6. **Upload** — Pending sales-г server луу batch илгээх

## Backend API endpoints

```
POST /pos/device/activate        → Device activation (one-time code)
POST /pos/user/login             → User login (password only)
POST /pos/cash/open              → Касс нээх
POST /pos/cash/close             → Касс хаах
POST /pos/sync/download          → Өгөгдөл татах
POST /pos/sync/upload            → Борлуулалт илгээх
```

## Offline функц

- **SQLite Database** — Device session, sync data, pending sales хадгална
- **localStorage** — Fallback (browser mode)
- Интернэт холболтгүй үед борлуулалт хийж болно
- Интернэт холбогдсон үед "Өгөгдөл илгээх" товч дарж sync хийнэ

**SQLite Tables:**
- `device` — Device паiring мэдээлэл
- `user_session` — User login + cash session
- `menus`, `menu_groups`, `prices`, `discounts` — Sync хийсэн өгөгдөл
- `pending_sales` — Upload хүлээж буй борлуулалтууд

## Тайлбар

- Бүх UI текст **монгол хэлээр**
- Dark/Light mode дэмжинэ (AGENTS.md дүрмийн дагуу)
- Зөвхөн **client-side** (SSR унтраасан, `output: 'export'`)
- Hardcoded өнгө үгүй - CSS variable class ашигласан
- Device Pairing — One-time activation code системтэй
