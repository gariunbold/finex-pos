<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# front-next — Development Rules & Conventions

Энэ файл нь `front-next` (Next.js 16 / React 19) проектийн AI agent-уудад зориулсан дүрэм.
Бүх agent энэ дүрмүүдийг дагана. **Үргэлж монгол хэлээр хариулна.**

**ЧУХАЛ:** Шинэ чухал дүрэм гарвал энэ AGENTS.md файлд заавал бичнэ. Өмнөх дүрмүүдтэй зөрчилдвөл хэрэглэгчээс асууж, зөв болгож бичнэ.

---

## 1. Ерөнхий Зарчим

### 1.1 Хэл
- UI текст, error message, label бүгд **монгол хэлээр**
- Code comment шаардлагатай бол англиар, богино байна
- Commit message англиар

### 1.2 Clean Architecture
- **Давхардсан код бичихгүй** — нэг логик нэг газарт, бусад газраас import хийнэ
- **Хэт олон файл үүсгэхгүй** — холбоотой ойлголтуудыг нэг файлд багтаана
- **AI agent friendly** — Файлын нэр, export, type бүгд тодорхой, implicit magic байхгүй
- **Шаардлагагүй abstraction хийхгүй** — 3 мөр давхардал нь дутуу abstraction-аас дээр
- **Feature flag, backwards-compat shim хэрэглэхгүй** — шууд код өөрчилнө

### 1.3 Код чанар
- TypeScript strict mode
- `any` type зөвхөн API response-д, дотоод код бүгд typed
- Unused import, variable үлдээхгүй
- Console.log debug-д ашиглаад устгана, commit-д орохгүй

### 1.4 Огнооны формат — `yyyy.MM.dd`
- **Бүх огноо** UI-д **`yyyy.MM.dd`** форматтай харагдана (жишээ: `2026.04.29`)
- Datetime: **`yyyy.MM.dd HH:mm:ss`**
- `lib/format.ts` доторх функцуудыг ашиглана: `dateToStr(date)`, `datetimeToStr(date)`, `today()`, `strToDate(str)`
- HTML `<input type="date">` (ISO `yyyy-MM-dd` форматтай) **хэрэглэхгүй** — Mongolian locale-д тохирохгүй
- Огноо сонгох UI-д `components/ui/date-picker.tsx` (DatePicker) ашиглана — `yyyy.MM.dd` форматаар харуулж буцаана
- State-д огноог `yyyy.MM.dd` string-ээр хадгална. Backend-тэй ярилцахдаа шаардлагатай бол converter-аар шилжүүлнэ

---

## 2. SSR хэрэглэхгүй

- Бүх page `"use client"`
- Static export: `output: 'export'` (next.config.ts)
- `localStorage`, `window`, `document` шууд ашиглаж болно
- SSR-тэй холбоотой workaround, `useEffect`-д wrap хийх шаардлагагүй

---

## 3. Project Бүтэц

```
front-next/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (providers, AppAlert mount)
│   ├── page.tsx                  # Login page (/)
│   ├── globals.css               # Tailwind + CSS variables + AG Grid theme
│   ├── (main)/                   # Layout group (sidebar + auth guard)
│   │   ├── layout.tsx            # Sidebar layout + auth check
│   │   ├── dashboard/page.tsx
│   │   ├── customer/page.tsx
│   │   └── pos/
│   │       ├── store/page.tsx
│   │       ├── menu-group/page.tsx
│   │       ├── menu/page.tsx
│   │       └── ...
│   └── (pos-desktop)/            # POS Desktop module (Tauri app)
│       ├── layout.tsx            # POS layout (overlay-гүй)
│       ├── page.tsx              # Entry redirect
│       ├── login/page.tsx    # Device login
│       ├── cash/page.tsx     # Cash open/close
│       ├── sync/page.tsx     # Download from server
│       ├── sale/page.tsx     # Main sale screen
│       └── upload/page.tsx   # Upload pending sales
│
├── components/
│   ├── app-alert.tsx             # Global alert/confirm/loading modal
│   ├── app-sidebar.tsx           # Sidebar + module switcher + theme
│   ├── crud-page.tsx             # CRUD page (AG Grid + toolbar + dialog)
│   ├── crud-dialog.tsx           # CRUD form dialog (create/edit/view)
│   ├── crud-toolbar.tsx          # Toolbar (search, filter, buttons)
│   ├── field-renderer.tsx        # Dynamic field renderer (type → component)
│   └── ui/                       # Shadcn/ui (auto-generated, өөрчлөхгүй)
│
├── lib/
│   ├── types.ts                  # Бүх TypeScript type (нэг файлд)
│   ├── store.ts                  # Бүх Zustand store (нэг файлд)
│   ├── api.ts                    # Axios instance + api() + apiDownload() + apiUpload()
│   ├── format.ts                 # toMoney, dateToStr, ... format functions
│   └── utils.ts                  # cn(), isEmpty, isEmail, codeName
│
├── src-tauri/                    # Tauri (Rust) files
│   ├── Cargo.toml                # Rust dependencies
│   ├── tauri.conf.json           # Tauri config
│   ├── build.rs                  # Build script
│   └── src/main.rs               # Rust main
│
├── next.config.ts
├── components.json               # Shadcn/ui config
└── AGENTS.md                     # Энэ файл
```

---

## 4. State Management — Zustand

Бүх global state `lib/store.ts` дотор, **нэг файлд**.

| Store | Зориулалт |
|---|---|
| `useAuthStore` | user, branch, token, login(), logout(), check(), restoreAuth() |
| `useThemeStore` | themeId, isDark, THEMES[], setTheme(), toggleDarkMode(), initTheme() |
| `useModuleStore` | currentModuleId, MODULES[], setModule(), initModule() |
| `useAlertStore` | alertError/Warning/Success/Info(), confirm(), prompt(), showLoading(), hideLoading(), toast() |
| `usePosStore` | POS desktop: deviceId, cashSession, syncData, pendingSales, posLogin(), syncFromServer(), uploadPendingSales() |

**Дүрэм:**
- Component дотор: `const { user } = useAuthStore()` (hook)
- Component-аас гадна (api.ts): `useAlertStore.getState().alertError(msg)` (hook-гүй)
- React `useState` зөвхөн local state-д ашиглана
- Шинэ store файл үүсгэхгүй — `store.ts`-д нэмнэ

---

## 5. API Convention

### 5.1 Дүрэм
- **Axios** ашиглана — Next.js `fetch` ашиглахгүй
- Бүх API дуудлага **POST** request
- `api()` function (`lib/api.ts`) — бүх газраас дуудна
- `api()` нь token автомат нэмнэ, loading харуулна, error → `alertError()` + throw
- `api()` throw хийсэн бол CrudDialog хаагдахгүй (алдаа харуулна, хэрэглэгч засна)

### 5.2 Backend Endpoint бүтэц
```
Base URL: /api (next.config.ts rewrites → http://localhost:8080)

POST /login              → { ok: 1, token, user, branch }
POST /login/check        → { ok: 1, user, branch }
POST /login/logout       → { ok: true }

POST /{controller}/list        → { items: [], total, offset, limit }
POST /{controller}/create      → { data: { ...formDefaults } }
POST /{controller}/edit        → { data: { ...item } }
POST /{controller}/item        → { data: { ...item } }
POST /{controller}/save        → { data: { ...savedItem } }
POST /{controller}/delete      → { ok: true }
POST /{controller}/batchDelete → { ok: true }

POST /{controller}/list_combo          → { items: [{ id, code, name }] }
POST /{controller}/list_combo_grouped  → { groups: [{ label, items: [...] }] }
POST /common/{option}                  → { items: [{ value, label }] }
```

### 5.3 Response Format
- Бүх response HTTP 200. Алдааг body-д `{ ok: false, error: "message" }` илэрхийлнэ
- Зөвхөн 401 status → token хүчингүй → logout + redirect

---

## 6. UI Дүрэм

### 6.1 Alert System
- `window.alert()`, `window.confirm()` **хэрэглэхгүй**
- Inline error div **хэрэглэхгүй**
- `useAlertStore` ашиглана:
  - `alertError(title, message?)` — алдааны modal
  - `alertWarning()`, `alertSuccess()`, `alertInfo()` — бусад modal
  - `confirm(title, message?)` → `Promise<boolean>` — баталгаажуулалт
  - `prompt(title, message?, defaultValue?)` → `Promise<string|null>`
  - `showLoading(message?)` / `hideLoading()` — глобал loading overlay (reference counted)
  - `toast()`, `toastSuccess()`, `toastWarning()`, `toastError()` — non-blocking (sonner)

### 6.2 Loading
- Button дотор spinner **ашиглахгүй**
- `showLoading()` / `hideLoading()` ашиглана
- `api()` function автоматаар loading харуулна (opts.showLoading = true default)

### 6.3 Dark/Light Mode
- Hardcoded өнгө (`bg-white`, `text-gray-800`, `#ffffff`) **хэрэглэхгүй**
- CSS variable class ашиглана:
  - `bg-background`, `bg-card`, `bg-muted`, `bg-popover`
  - `text-foreground`, `text-muted-foreground`
  - `border-border`, `border-input`
- Scroll element дээр `slim-scroll` class ашиглана

### 6.4 Button дүрэм
- Default button `h-9` (36px) — `button.tsx` компонентод тохируулсан
- `size="sm"`, `size="xs"` жижиг button **хэрэглэхгүй** — default хэмжээ ашиглана
- `variant="ghost"` (background-гүй, border-гүй, цул бус) button **хэрэглэхгүй**
- Цуцлах/Хаах товчлуурт `variant="outline"` ашиглана
- Гол үйлдлийн товч (Хадгалах, Үүсгэх) `variant="default"` ашиглана
- Dialog footer-д **гол үйлдлийн товч (Тийм / Хадгалах / Төлөх / Хэвлэх г.м.) зүүн талд**, **хаах төрлийн товч (Хаах / Болих / Гарах) баруун талд** байна
- Хаах товчны текст үргэлж "**Хаах**" (Цуцлах / Close хэрэглэхгүй). Icon: `X`. Гол үйлдлийн товчны icon нь үйлдлийн утгад тохирно (Төлөх → `Banknote`, Хэвлэх → `Printer`, Хадгалах → `Save`, г.м.)
- Input, button, context menu, toolbar search зэрэг бүх UI element-ийн текст `text-sm` (14px) нэгдсэн хэмжээтэй. `text-xs` хэрэглэхгүй
- `isActive` field: form label → "Төлөв", grid header → "Төлөв", grid template → "Идэвхтэй"/"Идэвхгүй" (Тийм/Үгүй хэрэглэхгүй)

### 6.5 Dialog / Modal Overlay
- Default-аар бүх dialog, modal **overlay-гүй** (дэвсгэр бараанаар болохгүй)
- `bg-black/...`, `backdrop-blur` зэрэг overlay class **хэрэглэхгүй**
- Loading dialog (`showLoading`) ч мөн overlay-гүй — зөвхөн спиннер + текст харуулна
- CRUD dialog overlay-гүй, persistent modal хэлбэрээр харуулна

### 6.6 Shadcn/ui
- Бүх UI primitive Shadcn/ui-аас (`components/ui/`)
- `ui/` доторх файлуудыг шаардлагагүй бол гараар **өөрчлөхгүй**
- Тохируулсан өөрчлөлтүүд: `button.tsx` default `h-9`, `input.tsx` default `h-9`, `select.tsx` default `h-9` + `alignItemWithTrigger=false`
- Бүх form input (Input, Select, Button) default өндөр `h-9` (36px) — жигд хэмжээтэй
- Icon: `lucide-react`

---

## 7. AG Grid — Data Grid

### 7.1 Зарчим
- **AG Grid Community** (`ag-grid-react`) ашиглана
- Custom data grid component **бичихгүй**
- `crud-page.tsx` дотор AG Grid шууд ашиглана

### 7.2 Features
| Feature | Хэрэгжүүлэлт |
|---|---|
| Server-side sort | `onSortChanged` → API reload |
| Row selection | `rowSelection: 'single'` / `'multiple'` |
| Context menu | Custom portal context menu (AG Grid Community-д enterprise module байхгүй) |
| CSV export | `api.exportDataAsCsv()` |
| Money/qty format | `valueFormatter` |
| Template column | `cellRenderer` (HTML) |
| Footer summary | `pinnedBottomRowData` |
| Keyboard navigation | Arrow keys мөр сонгох, Enter → edit dialog |
| Infinite scroll | `onBodyScroll` → `loadMore()` |

### 7.3 Theme
- Light: `ag-theme-quartz`
- Dark: `ag-theme-quartz-dark`
- `theme="legacy"` prop ашиглана (CSS file theme)
- `globals.css`-д AG Grid CSS variables override:
  - `--ag-header-background-color` → theme-тэй уялдуулна
  - `--ag-row-hover-color`
  - `--ag-font-family`, `--ag-font-size`
  - `--ag-header-height: 35px`, `--ag-row-height: 36px`
  - Border, border-radius хассан

### 7.4 ColumnConfig → ColDef хөрвүүлэлт
```ts
// EntityConfig.columns → AG Grid columnDefs
function toColDefs(columns: ColumnConfig[]): ColDef[] {
  return columns.map(col => ({
    field: col.id,
    headerName: col.header,
    width: col.width ? Number(col.width) : undefined,
    sortable: !!col.sort,
    valueFormatter: col.format === 'money' ? moneyFormatter
                  : col.format === 'qty' ? qtyFormatter
                  : undefined,
    cellRenderer: col.template
      ? (p: any) => col.template!(p.data)
      : undefined,
  }))
}
```

---

## 8. CRUD Page Convention — Config-Driven

### 8.1 Page бичих загвар
```tsx
"use client"
import { CrudPage } from "@/components/crud-page"
import type { EntityConfig } from "@/lib/types"

const config: EntityConfig = {
  controller: "store",
  title: "Салбар",
  windowWidth: 450,
  columns: [
    { id: "code", header: "Код", sort: "string" },
    { id: "name", header: "Нэр", sort: "text" },
  ],
  inputs: [
    { type: "text", name: "code", label: "Код" },
    { type: "text", name: "name", label: "Нэр" },
  ],
  onFormInit(ctx) {
    if (ctx.mode === "create") ctx.setValue("isActive", 1)
  },
}

export default function StorePage() {
  return <CrudPage config={config} />
}
```

### 8.2 Шинэ CRUD page нэмэх алхам
1. Backend controller үүсгэ (list, create, edit, save, delete)
2. Frontend page файл үүсгэ → `EntityConfig` + `<CrudPage>`
3. Module menu-д link нэмэ (`lib/store.ts` → MODULES)
4. Дууслаа. Нэмэлт component шаардлагагүй.

### 8.3 EntityConfig бүтэц
```ts
interface EntityConfig {
  controller: string           // API endpoint prefix
  title: string                // Page/dialog title
  windowWidth?: number         // Dialog width (px)
  formLayout?: { columns?: number; labelWidth?: number; inputWidth?: string }
  columns: ColumnConfig[]      // Grid columns → AG Grid ColDef
  inputs: InputConfig[]        // Form fields
  filterInputs?: InputConfig[] // Toolbar filter fields
  permissions?: CrudPermissions
  params?: Record<string, any> // Default API params
  multiSelect?: boolean
  defaultSort?: { field: string; order: string }

  // Custom UI
  customButtonsLeft?: CustomButton[]
  customButtonsRight?: CustomButton[]
  leftActions?: LeftAction[]
  contextMenuItems?: ContextMenuItem[]

  // Callbacks
  onFormInit?(ctx: FormContext): void
  onFormValuesChange?(ctx: FormContext): void
  onFormValidate?(values, mode): true | false | Record<string, string>
  onBeforeSave?(formData, mode): boolean | void | Promise<boolean | void>
  onAfterSave?(response, mode): void
  onBeforeDelete?(item): boolean | void | Promise<boolean | void>
  onAfterDelete?(response): void
  onDoubleClick?(item): void
  onRowSelect?(item): void
  onLoadAfter?(data): void
  onContextMenuClick?(action, item): void
  transformListParams?(params): void
}
```

---

## 9. Field Types

| Type | Тайлбар | Гол opts |
|---|---|---|
| `text` | Текст оруулах | `placeholder`, `colSpan` |
| `number` | Тоо оруулах | `min`, `max`, `step` |
| `money` | Мөнгөн дүн (formatted) | — |
| `textarea` | Олон мөрт текст | `rows`, `colSpan` |
| `date` | Огноо сонгох | `defaultValue` |
| `combo` | Dropdown select (API load) | `url`, `data`, `params`, `dependsOn`, `grouped` |
| `search` | Хайлтын dialog (том өгөгдөлд) | `controller`, `columns`, `displayField`, `allowCreate` |
| `checkbox` | Checkbox | — |
| `radio` | Radio group | `options: [{value, label}]` |
| `switch` | Toggle switch | — |
| `file` | Файл upload | `accept`, `multiple`, `isImage` |
| `label` | Зөвхөн харуулах (readonly) | — |
| `icon` | Icon сонгох/харуулах | — |

### Dependent Combo (dependsOn)
- `opts.dependsOn: 'parentField'` — parent field өөрчлөгдөхөд child combo reload
- Parent өөрчлөгдөхөд child утгыг автомат цэвэрлэнэ
- FieldRenderer parent-ийн утгыг combo params-д дамжуулна
- Backend `list_combo`-д parent filter params хүлээн авна

---

## 10. FormContext — Form Callback API

`onFormInit`, `onFormValuesChange` callback-д дамжих:

```ts
interface FormContext {
  values: Record<string, any>    // Одоогийн form утгууд
  changedField?: string          // Сүүлд өөрчлөгдсөн field
  changedValue?: any             // Шинэ утга
  mode: 'create' | 'edit'

  setVisible(fieldName: string, visible: boolean): void
  setDisabled(fieldName: string, disabled: boolean): void
  setValue(fieldName: string, value: any): void
  setOptions(fieldName: string, options: Array<{ value: any; label: string }>): void
  setLabel(fieldName: string, text: string): void
  setRequired(fieldName: string, required: boolean): void
  setError(fieldName: string, message: string | null): void
}
```

---

## 11. Нийтлэг Алдаа — Хийхгүй Зүйлс

| Буруу | Зөв |
|---|---|
| `window.alert("Алдаа")` | `alertError("Алдаа")` |
| `window.confirm("Устгах уу?")` | `await confirm("Устгах уу?")` |
| Button дотор `<Spinner>` | `showLoading()` / `hideLoading()` |
| `fetch("/api/...")` | `api("/endpoint", data)` |
| Next.js `fetch` with cache | `api()` (Axios POST) |
| `GET /api/list?page=1` | `POST /api/list` body: `{ offset: 0, limit: 50 }` |
| Hardcoded `bg-white` | `bg-background` (CSS variable) |
| Шинэ CRUD page-д custom component | `EntityConfig` + `<CrudPage>` |
| Custom data grid бичих | AG Grid ашиглах |
| `lib/authStore.ts`, `lib/themeStore.ts` тусдаа | `lib/store.ts` нэг файлд бүгд |
| `types/auth.ts`, `types/crud.ts` тусдаа | `lib/types.ts` нэг файлд бүгд |
| `useEffect` дотор SSR check | SSR унтраасан, шаардлагагүй |
| `"use server"` action | Бүгд client-side, server action байхгүй |
| `<Button size="sm">` жижиг товч | Default хэмжээ ашиглах |
| `<Button variant="ghost">` цул бус товч | `variant="outline"` ашиглах |
| Dialog/modal-д `bg-black/...` overlay | Overlay-гүй, persistent modal |
| POS store тусдаа файлд | `lib/store.ts`-д `usePosStore` нэмэх |

---

## 12. Dependencies

```json
{
  "next": "^16",
  "react": "^19",
  "react-dom": "^19",
  "zustand": "^5",
  "axios": "^1.14",
  "ag-grid-react": "^35",
  "ag-grid-community": "^35",
  "lucide-react": "^1.7",
  "sonner": "^2",
  "@internationalized/date": "^3.12",
  "clsx": "^2.1",
  "tailwind-merge": "^3.5",
  "class-variance-authority": "^0.7",
  "tw-animate-css": "^1.4",
  "@tauri-apps/api": "^2",
  "@tauri-apps/cli": "^2",
  "@tauri-apps/plugin-sql": "^2"
}
```

Shadcn/ui components: button, input, label, dialog, alert-dialog, select, checkbox, radio-group, switch, textarea, popover, calendar, avatar, separator, sonner, card

---

## 13. POS Desktop Module (Tauri)

### 13.1 Зорилго
Next.js + Tauri ашигласан offline POS desktop application. Windows & macOS дээр ажиллана.

### 13.2 Module бүтэц
```
app/(pos-desktop)/
├── layout.tsx        # POS layout (overlay-гүй, auth check)
├── page.tsx          # Entry redirect (login → cash → sale)
├── login/        # Төхөөрөмж нэвтрэх
├── cash/         # Касс нээх/хаах
├── sync/         # Server-ээс өгөгдөл татах
├── sale/         # Борлуулалт бүртгэх (үндсэн screen)
└── upload/       # Pending sales илгээх
```

### 13.3 State: usePosStore
```ts
interface PosState {
  isPaired: boolean               // Device pair хийгдсэн эсэх
  posToken: string | null         // Backend POS_TOKEN (activation хийгдсэн token)
  deviceId: number | null
  deviceCode: string | null
  deviceName: string | null
  storeId: number | null
  storeName: string | null
  posUser: any | null             // Нэвтэрсэн хэрэглэгч
  cashSession: CashSession | null
  syncData: SyncData              // Offline өгөгдөл
  pendingSales: PendingSale[]     // Upload хүлээж буй борлуулалтууд
  
  activateDevice(activationCode): Promise<boolean>  // Device pairing
  unpairDevice(): void                               // Device unpair
  restorePosSession(): void
  
  posLogin(password): Promise<boolean>               // User login (password only)
  posLogout(): void
  
  openCash(openingAmount): Promise<boolean>
  closeCash(closingAmount): Promise<boolean>
  
  syncFromServer(): Promise<boolean>
  addPendingSale(sale): void
  uploadPendingSales(): Promise<boolean>
}
```

### 13.4 Device Pairing System (Activation Code)

**Зорилго:** Вэб админ дээр үүсгэсэн ПОС төхөөрөмжийг desktop app-тай найдвартай холбох.

**Процесс:**

1. **Web Admin:** Шинэ ПОС төхөөрөмж үүсгэхэд систем 6-8 оронтой **Activation Code** үүсгэнэ (жишээ: `FX-8821`)
   - Энэ код нь Backend-д `POS_TOKEN`-той холбогдсон байна
   - Зөвхөн 1 удаа ашиглагдана (one-time use)
   - Хүчинтэй хугацаатай (жишээ: 24 цаг)

2. **Desktop App Анх нээх:**
   - Апп анх ажиллахад `isPaired === false` байна
   - Login screen "Төхөөрөмж баталгаажуулах" горимд орно
   - Хэрэглэгч activation code оруулна

3. **Activation:**
   - `POST /pos/device/activate` { activationCode }
   - Backend код шалгаад `posToken`, `deviceId`, `storeId` зэргийг буцаана
   - Frontend localStorage + tauri-plugin-store-д хадгална

4. **User Login:**
   - Device paired хийгдсэний дараа хэрэглэгч зөвхөн **password** оруулна
   - `POST /pos/user/login` { deviceId, password, posToken }
   - Backend posToken + password шалгаад user мэдээлэл буцаана

**Давуу тал:**
- Хэрэглэгч deviceCode санах шаардлагагүй
- Password сольсон ч device pairing хэвээр байна
- Тухайн төхөөрөмжийг салбар, касс дугаараар автомат таньна
- Аюулгүйн түвшин өндөр (one-time activation code)

**Token хадгалалт:**
```ts
// SQLite database (primary - Tauri mode)
await saveDevice({
  deviceId: 123,
  posToken: "...",
  deviceCode: "POS-001",
  deviceName: "1-р касс",
  storeId: 5,
  storeName: "Төв салбар"
})

// localStorage (fallback - browser mode)
localStorage.setItem('session', JSON.stringify({
  isPaired: true,
  posToken: "...",
  deviceId: 123,
  ...
}))
```

**Unpair Device:**
- "Төхөөрөмж солих" товч (Login screen дээр)
- `unpairDevice()` дуудахад SQLite database + localStorage цэвэрлэгдэнэ
- Шинээр activation code оруулах шаардлагатай болно

### 13.5 Offline функц
- **SQLite** database ашиглан device session, sync data, pending sales хадгална
- **localStorage** fallback (browser mode-д)
- Интернэт холболтгүй үед борлуулалт хийж, SQLite-д хадгална
- Интернэт холбогдсон үед batch upload хийнэ

**SQLite Schema:**
- `device` — Device паiring мэдээлэл (posToken, deviceId, storeId)
- `user_session` — User login болон cash session
- `menus`, `menu_groups`, `prices`, `discounts` — Sync хийсэн өгөгдөл
- `pending_sales` — Offline хийгдсэн, upload хүлээж буй борлуулалтууд

### 13.6 Backend API endpoints
```
POST /pos/device/activate        → { ok: 1, posToken, device: { id, code, name, storeId, storeName } }
POST /pos/user/login             → { ok: 1, user, cashSession? }
POST /pos/cash/open              → { ok: 1, session }
POST /pos/cash/close             → { ok: 1 }
POST /pos/sync/download          → { ok: 1, menus, menuGroups, prices, discounts, rooms, tables }
POST /pos/sync/upload            → { ok: 1 }
```

**Request Examples:**
```ts
// Device Activation (анх удаа)
POST /pos/device/activate
Body: { activationCode: "FX-8821" }
Response: {
  ok: 1,
  posToken: "abcd1234xyz...",
  device: {
    id: 123,
    code: "POS-001",
    name: "1-р касс",
    storeId: 5,
    storeName: "Төв салбар"
  }
}

// User Login (paired device дээр)
POST /pos/user/login
Body: { deviceId: 123, password: "1234", posToken: "abcd..." }
Response: {
  ok: 1,
  user: { id, name, role },
  cashSession: { id, openedAt, openingAmount } | null
}
```

### 13.7 Tauri команд
```bash
npm run tauri:dev      # Development mode
npm run tauri:build    # Production build (Windows/macOS)
```

### 13.8 Дүрэм
- POS module-д **sidebar байхгүй** — full screen app
- Бүх screen `"use client"` (SSR-гүй)
- `usePosStore`-г `lib/store.ts` дотор, бусад store-тай хамт
- Бүх UI монгол хэлээр, CSS variable class ашиглана
- Button default хэмжээ (`h-9`), `size="sm"` хэрэглэхгүй
- **Device Pairing** — Activation Code (one-time use)
- **SQLite Database** — Offline өгөгдөл (device, session, sync data, pending sales)
- **localStorage** — Fallback (browser mode), SQLite primary (Tauri mode)
- **Password-only Login** — Paired device дээр зөвхөн password шаардана
- **Unpair функц** — Хэрэглэгч төхөөрөмж солих боломжтой

### 13.9 Branch Module — Salbar tus burijn modulijn iдэвхжүүлэлт (MUST)

Backend `BranchModule` entity нь branch тус бүрийн module (бүжигчин, караоке, хүргэлт г.м.) идэвхжилтийг тэмдэглэдэг. POS app нь зөвхөн идэвхтэй module-уудтай холбоотой UI/логикийг харуулна.

**Module flag хүлээн авах**:
- Activation үед: `/pos/activate` response дотор `pos.isDancerEnabled` нэмэгдэж ирнэ. Frontend `syncData.isDancerEnabled` болгон хадгална.
- Sync үед: `/pos/syncDownload` response дотор `pos.isDancerEnabled` бас бэрхшээлгүй ирэх ёстой.
- Backend нь `BranchModule.isEnabled(branch, Common.MODULE_DANCER)` шалгалт хийж response дээр оруулдаг.

**POS app дотор хэрэглэлт**:
- `usePosStore.syncData.isDancerEnabled` (0/1) — boolean flag
- App header NAV: Жетон menu зөвхөн `isDancerEnabled === 1` үед `JETON_NAV` нэмэгдэнэ (`app-header.tsx`)
- Sale page жетон mode зөвхөн dancer module идэвхтэй үед

**SQLite-д хадгалалт**:
- `dancers` массив болон `isDancerEnabled` flag нь SQLite-д ХАДГАЛАГДАХГҮЙ — зөвхөн localStorage `sync-data` key
- Restore үед SQLite-аас sync data ачаалаад dancers/isDancerEnabled-ийг hold хийдэг (`set((s) => ({ syncData: { ..., dancers: s.syncData.dancers, isDancerEnabled: s.syncData.isDancerEnabled } }))`)

**Шинэ module нэмэх алхам** (POS-д):
1. Backend Activation/Sync response-д `pos.isXxxEnabled` flag нэмэх
2. `SyncData` interface-д `isXxxEnabled: number` нэмэх
3. `activateDevice`/`syncFromServer` дотор `isXxxEnabled: Number(pos.isXxxEnabled) === 1 ? 1 : 0` оруулах
4. `restorePosSession` дотор localStorage уншихад flag-ыг hold хийх
5. Module-аас хамаарах UI-уудыг conditional render хийх
