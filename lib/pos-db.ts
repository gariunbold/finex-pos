/**
 * POS Desktop SQLite Database
 * Offline режимд өгөгдөл хадгалах
 * Backend response бүтэцтэй нийцсэн (sid-based)
 */

import Database from '@tauri-apps/plugin-sql'

let db: Database | null = null

export async function initPosDatabase(): Promise<Database> {
  if (db) return db
  db = await Database.load('sqlite:pos.db')
  await createTables()
  return db
}

export async function getDb(): Promise<Database> {
  if (!db) {
    return await initPosDatabase()
  }
  return db
}

async function createTables() {
  const database = await getDb()

  // Device мэдээлэл (1 мөр л байна)
  await database.execute(`
    CREATE TABLE IF NOT EXISTS device (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      device_id INTEGER NOT NULL,
      pos_token TEXT NOT NULL,
      device_code TEXT NOT NULL,
      device_name TEXT NOT NULL,
      store_id INTEGER NOT NULL,
      store_name TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)

  // User session
  await database.execute(`
    CREATE TABLE IF NOT EXISTS user_session (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      user_sid TEXT,
      user_name TEXT,
      cash_session_id INTEGER,
      cash_opened_at TEXT,
      cash_opening_amount REAL,
      updated_at TEXT NOT NULL
    )
  `)

  // Sync data: Menu Groups (sid-based)
  await database.execute(`
    CREATE TABLE IF NOT EXISTS menu_groups (
      sid TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      icon_name TEXT,
      is_active INTEGER DEFAULT 1,
      synced_at TEXT NOT NULL
    )
  `)

  // Sync data: Menus (sid-based)
  await database.execute(`
    CREATE TABLE IF NOT EXISTS menus (
      sid TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      group_sid TEXT,
      price REAL DEFAULT 0,
      description TEXT,
      prep_time INTEGER,
      calories INTEGER,
      is_paid_service INTEGER DEFAULT 0,
      employee_percent REAL,
      product_sid TEXT,
      product_quantity REAL,
      is_featured INTEGER DEFAULT 0,
      is_spicy INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      synced_at TEXT NOT NULL
    )
  `)

  // Sync data: Menu Prices (store-specific prices)
  await database.execute(`
    CREATE TABLE IF NOT EXISTS menu_prices (
      sid TEXT PRIMARY KEY,
      menu_sid TEXT NOT NULL,
      store_sid TEXT,
      price REAL NOT NULL,
      start_date TEXT,
      synced_at TEXT NOT NULL
    )
  `)

  // Sync data: Menu Recipes
  await database.execute(`
    CREATE TABLE IF NOT EXISTS menu_recipes (
      sid TEXT PRIMARY KEY,
      menu_sid TEXT NOT NULL,
      product_sid TEXT,
      quantity REAL,
      unit_sid TEXT,
      synced_at TEXT NOT NULL
    )
  `)

  // Sync data: Rooms
  await database.execute(`
    CREATE TABLE IF NOT EXISTS rooms (
      sid TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      store_sid TEXT,
      is_active INTEGER DEFAULT 1,
      synced_at TEXT NOT NULL
    )
  `)

  // Sync data: Tables
  await database.execute(`
    CREATE TABLE IF NOT EXISTS tables (
      sid TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      store_sid TEXT,
      room_sid TEXT,
      is_active INTEGER DEFAULT 1,
      synced_at TEXT NOT NULL
    )
  `)

  // Sync data: Discounts
  await database.execute(`
    CREATE TABLE IF NOT EXISTS discounts (
      sid TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      discount_type TEXT NOT NULL,
      value REAL NOT NULL,
      start_date TEXT,
      end_date TEXT,
      min_amount REAL,
      max_use_count INTEGER,
      used_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      synced_at TEXT NOT NULL
    )
  `)

  // POS Users (offline login-д ашиглах)
  await database.execute(`
    CREATE TABLE IF NOT EXISTS pos_users (
      sid TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      employee_sid TEXT,
      employee_code TEXT,
      employee_name TEXT,
      password TEXT NOT NULL,
      role INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      synced_at TEXT NOT NULL
    )
  `)

  // Pending sales (offline хийгдсэн, upload хүлээж буй)
  await database.execute(`
    CREATE TABLE IF NOT EXISTS pending_sales (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      total REAL NOT NULL,
      items_json TEXT NOT NULL,
      uploaded INTEGER DEFAULT 0
    )
  `)

  // Indexes
  await database.execute('CREATE INDEX IF NOT EXISTS idx_menus_group ON menus(group_sid)')
  await database.execute('CREATE INDEX IF NOT EXISTS idx_menu_prices_menu ON menu_prices(menu_sid)')
  await database.execute('CREATE INDEX IF NOT EXISTS idx_menu_recipes_menu ON menu_recipes(menu_sid)')
  await database.execute('CREATE INDEX IF NOT EXISTS idx_tables_room ON tables(room_sid)')
  await database.execute('CREATE INDEX IF NOT EXISTS idx_pos_users_code ON pos_users(code)')
  await database.execute('CREATE INDEX IF NOT EXISTS idx_pending_sales_uploaded ON pending_sales(uploaded)')
}

// ═══════════════════════════════════════════════════════════
// DEVICE операцууд
// ═══════════════════════════════════════════════════════════

export async function saveDevice(data: {
  deviceId: number
  posToken: string
  deviceCode: string
  deviceName: string
  storeId: number
  storeName: string
}) {
  const database = await getDb()
  await database.execute(
    `INSERT OR REPLACE INTO device (id, device_id, pos_token, device_code, device_name, store_id, store_name, updated_at)
     VALUES (1, $1, $2, $3, $4, $5, $6, datetime('now'))`,
    [data.deviceId, data.posToken, data.deviceCode, data.deviceName, data.storeId, data.storeName]
  )
}

export async function getDevice(): Promise<any | null> {
  const database = await getDb()
  const result = await database.select<any[]>('SELECT * FROM device WHERE id = 1')
  return result.length > 0 ? result[0] : null
}

export async function clearDevice() {
  const database = await getDb()
  await database.execute('DELETE FROM device WHERE id = 1')
}

// ═══════════════════════════════════════════════════════════
// USER SESSION операцууд
// ═══════════════════════════════════════════════════════════

export async function saveUserSession(data: {
  userSid?: string | null
  userName?: string | null
  cashSessionId?: number | null
  cashOpenedAt?: string | null
  cashOpeningAmount?: number | null
}) {
  const database = await getDb()
  await database.execute(
    `INSERT OR REPLACE INTO user_session (id, user_sid, user_name, cash_session_id, cash_opened_at, cash_opening_amount, updated_at)
     VALUES (1, $1, $2, $3, $4, $5, datetime('now'))`,
    [
      data.userSid || null,
      data.userName || null,
      data.cashSessionId || null,
      data.cashOpenedAt || null,
      data.cashOpeningAmount || null,
    ]
  )
}

export async function getUserSession(): Promise<any | null> {
  const database = await getDb()
  const result = await database.select<any[]>('SELECT * FROM user_session WHERE id = 1')
  return result.length > 0 ? result[0] : null
}

export async function clearUserSession() {
  const database = await getDb()
  await database.execute('DELETE FROM user_session WHERE id = 1')
}

// ═══════════════════════════════════════════════════════════
// SYNC DATA операцууд (backend response бүтэцтэй нийцсэн)
// ═══════════════════════════════════════════════════════════

export async function saveSyncData(data: {
  menus: any[]
  menuGroups: any[]
  menuPrices: any[]
  discounts: any[]
  rooms: any[]
  tables: any[]
  menuRecipes?: any[]
}) {
  const database = await getDb()
  const syncedAt = new Date().toISOString()

  // Clear old data
  await database.execute('DELETE FROM menus')
  await database.execute('DELETE FROM menu_groups')
  await database.execute('DELETE FROM menu_prices')
  await database.execute('DELETE FROM menu_recipes')
  await database.execute('DELETE FROM rooms')
  await database.execute('DELETE FROM tables')
  await database.execute('DELETE FROM discounts')

  // Menu groups
  for (const g of data.menuGroups) {
    await database.execute(
      'INSERT INTO menu_groups (sid, code, name, icon_name, is_active, synced_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [g.sid, g.code, g.name, g.iconName || null, g.isActive ?? 1, syncedAt]
    )
  }

  // Menus (price already merged from menuPrices in syncFromServer)
  for (const m of data.menus) {
    await database.execute(
      `INSERT INTO menus (sid, code, name, group_sid, price, description, prep_time, calories,
        is_paid_service, employee_percent, product_sid, product_quantity, is_featured, is_spicy, is_active, synced_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        m.sid, m.code, m.name, m.groupSid || null, m.price || 0,
        m.description || null, m.prepTime || null, m.calories || null,
        m.isPaidService || 0, m.employeePercent || null,
        m.productSid || null, m.productQuantity || null,
        m.isFeatured || 0, m.isSpicy || 0, m.isActive ?? 1, syncedAt,
      ]
    )
  }

  // Menu prices
  for (const mp of data.menuPrices) {
    await database.execute(
      'INSERT INTO menu_prices (sid, menu_sid, store_sid, price, start_date, synced_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [mp.sid, mp.menuSid, mp.storeSid || null, mp.price, mp.startDate || null, syncedAt]
    )
  }

  // Menu recipes
  for (const r of (data.menuRecipes || [])) {
    await database.execute(
      'INSERT INTO menu_recipes (sid, menu_sid, product_sid, quantity, unit_sid, synced_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [r.sid, r.menuSid, r.productSid || null, r.quantity || null, r.unitSid || null, syncedAt]
    )
  }

  // Rooms
  for (const r of data.rooms) {
    await database.execute(
      'INSERT INTO rooms (sid, code, name, store_sid, is_active, synced_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [r.sid, r.code, r.name, r.storeSid || null, r.isActive ?? 1, syncedAt]
    )
  }

  // Tables
  for (const t of data.tables) {
    await database.execute(
      'INSERT INTO tables (sid, code, name, store_sid, room_sid, is_active, synced_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [t.sid, t.code, t.name, t.storeSid || null, t.roomSid || null, t.isActive ?? 1, syncedAt]
    )
  }

  // Discounts
  for (const d of data.discounts) {
    await database.execute(
      `INSERT INTO discounts (sid, code, name, discount_type, value, start_date, end_date,
        min_amount, max_use_count, used_count, is_active, synced_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        d.sid, d.code, d.name, d.discountType, d.value,
        d.startDate || null, d.endDate || null,
        d.minAmount || null, d.maxUseCount || null, d.usedCount || 0,
        d.isActive ?? 1, syncedAt,
      ]
    )
  }
}

export async function getMenus(): Promise<any[]> {
  const database = await getDb()
  return await database.select('SELECT * FROM menus WHERE is_active = 1 ORDER BY name')
}

export async function getMenuGroups(): Promise<any[]> {
  const database = await getDb()
  return await database.select('SELECT * FROM menu_groups WHERE is_active = 1 ORDER BY name')
}

export async function getMenuPrices(): Promise<any[]> {
  const database = await getDb()
  return await database.select('SELECT * FROM menu_prices')
}

export async function getMenuRecipes(): Promise<any[]> {
  const database = await getDb()
  return await database.select('SELECT * FROM menu_recipes')
}

export async function getRooms(): Promise<any[]> {
  const database = await getDb()
  return await database.select('SELECT * FROM rooms WHERE is_active = 1 ORDER BY name')
}

export async function getTables(): Promise<any[]> {
  const database = await getDb()
  return await database.select('SELECT * FROM tables WHERE is_active = 1 ORDER BY name')
}

export async function getDiscounts(): Promise<any[]> {
  const database = await getDb()
  return await database.select('SELECT * FROM discounts WHERE is_active = 1')
}

export async function getLastSyncTime(): Promise<string | null> {
  const database = await getDb()
  const result = await database.select<any[]>('SELECT synced_at FROM menus LIMIT 1')
  return result.length > 0 ? result[0].synced_at : null
}

// ═══════════════════════════════════════════════════════════
// POS USERS операцууд (offline login)
// ═══════════════════════════════════════════════════════════

export async function savePosUsers(users: any[]) {
  const database = await getDb()
  const syncedAt = new Date().toISOString()

  await database.execute('DELETE FROM pos_users')

  for (const user of users) {
    await database.execute(
      `INSERT INTO pos_users (sid, code, name, employee_sid, employee_code, employee_name, password, role, is_active, synced_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        user.sid, user.code, user.name,
        user.employeeSid || null, user.employeeCode || null, user.employeeName || null,
        user.password,
        user.role || 1, user.isActive ?? 1, syncedAt,
      ]
    )
  }
}

export async function getPosUsers(): Promise<any[]> {
  const database = await getDb()
  return await database.select('SELECT * FROM pos_users WHERE is_active = 1 ORDER BY name')
}

export async function getPosUserByCode(code: string): Promise<any | null> {
  const database = await getDb()
  const result = await database.select<any[]>('SELECT * FROM pos_users WHERE code = $1 AND is_active = 1', [code])
  return result.length > 0 ? result[0] : null
}

// ═══════════════════════════════════════════════════════════
// PENDING SALES операцууд
// ═══════════════════════════════════════════════════════════

export async function addPendingSale(sale: {
  id: string
  createdAt: string
  total: number
  items: any[]
}) {
  const database = await getDb()
  await database.execute(
    'INSERT INTO pending_sales (id, created_at, total, items_json, uploaded) VALUES ($1, $2, $3, $4, 0)',
    [sale.id, sale.createdAt, sale.total, JSON.stringify(sale.items)]
  )
}

export async function getPendingSales(): Promise<any[]> {
  const database = await getDb()
  const rows = await database.select<any[]>('SELECT * FROM pending_sales WHERE uploaded = 0 ORDER BY created_at')
  return rows.map(row => ({
    id: row.id,
    createdAt: row.created_at,
    total: row.total,
    items: JSON.parse(row.items_json),
    uploaded: false,
  }))
}

export async function markSalesUploaded(saleIds: string[]) {
  const database = await getDb()
  for (const id of saleIds) {
    await database.execute('UPDATE pending_sales SET uploaded = 1 WHERE id = $1', [id])
  }
}

export async function clearUploadedSales() {
  const database = await getDb()
  await database.execute('DELETE FROM pending_sales WHERE uploaded = 1')
}
