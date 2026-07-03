import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import type { Gasto, Deuda, PresupuestoCategoria, PresupuestoDetalle, ObjetivoFinanciero, Activo, Ingreso, Habito, Logro, ResumenMensual, ResumenAnual } from './types';

const DB_NAME = 'novafin_db';

export class DatabaseService {
  private sqliteConn: SQLiteConnection | null = null;
  private db: SQLiteDBConnection | null = null;

  async init(): Promise<void> {
    this.sqliteConn = new SQLiteConnection(CapacitorSQLite);

    if (Capacitor.getPlatform() === 'web') {
      await this.sqliteConn.initWebStore();
    }

    this.db = await this.sqliteConn.createConnection(DB_NAME, false, 'no-encryption', 1, false);
    await this.db.open();
    await this.createTables();
    await this.initCategories();
    await this.initLogros();
  }

  private async execute(sql: string, params?: any[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.run(sql, params);
  }

  private async query(sql: string, params?: any[]): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.query(sql, params);
    return result.values || [];
  }

  private async createTables(): Promise<void> {
    await this.execute(`
      CREATE TABLE IF NOT EXISTS gastos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        categoria TEXT NOT NULL,
        monto REAL NOT NULL,
        mes INTEGER NOT NULL,
        anio INTEGER NOT NULL,
        estado TEXT DEFAULT 'pendiente',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.execute(`
      CREATE TABLE IF NOT EXISTS deudas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        monto_total REAL NOT NULL,
        cuotas_totales INTEGER NOT NULL,
        cuotas_pagadas INTEGER DEFAULT 0,
        fecha_inicio TEXT NOT NULL,
        activa INTEGER DEFAULT 1,
        estado TEXT DEFAULT 'pendiente',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.execute(`
      CREATE TABLE IF NOT EXISTS pagos_deuda (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deuda_id INTEGER NOT NULL,
        fecha TEXT NOT NULL,
        monto_pagado REAL NOT NULL,
        FOREIGN KEY (deuda_id) REFERENCES deudas(id) ON DELETE CASCADE
      )
    `);

    await this.execute(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        icono TEXT
      )
    `);

    await this.execute(`
      CREATE TABLE IF NOT EXISTS presupuestos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        mes INTEGER NOT NULL,
        anio INTEGER NOT NULL,
        monto_total REAL NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.execute(`
      CREATE TABLE IF NOT EXISTS presupuesto_categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        presupuesto_id INTEGER NOT NULL,
        categoria TEXT NOT NULL,
        monto_asignado REAL NOT NULL,
        FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id) ON DELETE CASCADE
      )
    `);

    await this.execute(`
      CREATE TABLE IF NOT EXISTS objetivos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        monto_objetivo REAL NOT NULL,
        monto_actual REAL DEFAULT 0,
        fecha_limite TEXT NOT NULL,
        icono TEXT DEFAULT '🎯',
        estado TEXT DEFAULT 'activo',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.execute(`
      CREATE TABLE IF NOT EXISTS activos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        tipo TEXT NOT NULL,
        valor REAL NOT NULL,
        fecha TEXT NOT NULL,
        notas TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.execute(`
      CREATE TABLE IF NOT EXISTS ingresos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        monto REAL NOT NULL,
        categoria TEXT NOT NULL,
        mes INTEGER NOT NULL,
        anio INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.execute(`
      CREATE TABLE IF NOT EXISTS habitos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        tipo TEXT NOT NULL DEFAULT 'personalizado',
        meta_dias INTEGER NOT NULL DEFAULT 30,
        dias_cumplidos INTEGER DEFAULT 0,
        fecha_inicio TEXT NOT NULL,
        activo INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.execute(`
      CREATE TABLE IF NOT EXISTS logros (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        icono TEXT NOT NULL,
        desbloqueado INTEGER DEFAULT 0,
        fecha_desbloqueo TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.runMigrations();
  }

  private async runMigrations(): Promise<void> {
    try { await this.execute("ALTER TABLE gastos ADD COLUMN estado TEXT DEFAULT 'pendiente'"); } catch { }
    try { await this.execute("ALTER TABLE deudas ADD COLUMN estado TEXT DEFAULT 'pendiente'"); } catch { }
    await this.execute("UPDATE gastos SET estado = 'pendiente' WHERE estado IS NULL OR estado = ''");
    await this.execute("UPDATE deudas SET estado = 'pendiente' WHERE estado IS NULL OR estado = ''");
  }

  private async initCategories(): Promise<void> {
    const result = await this.query('SELECT COUNT(*) as count FROM categorias');
    if (result.length > 0 && Object.values(result[0])[0] === 0) {
      await this.execute(`
        INSERT INTO categorias (nombre, icono) VALUES
          ('Vivienda', '🏠'), ('Alimentación', '🛒'), ('Transporte', '🚗'),
          ('Salud', '💊'), ('Entretenimiento', '🎬'), ('Educación', '📚'),
          ('Ropa', '👕'), ('Servicios', '📱'), ('Otros', '📦')
      `);
    }
  }

  private async initLogros(): Promise<void> {
    const result = await this.query('SELECT COUNT(*) as count FROM logros');
    if (result.length > 0 && Object.values(result[0])[0] === 0) {
      const logrosBase = [
        { nombre: 'Primer gasto', descripcion: 'Registraste tu primer gasto', icono: '🎯' },
        { nombre: 'Mes completo', descripcion: 'Registraste gastos todos los días de un mes', icono: '📅' },
        { nombre: 'Ahorrador', descripcion: 'Ahorraste más de lo planeado un mes', icono: '💰' },
        { nombre: 'Cero deudas', descripcion: 'Pagaste todas tus deudas', icono: '🏆' },
        { nombre: 'Presupuesto maestro', descripcion: 'Cumpliste el presupuesto 3 meses seguidos', icono: '👑' },
        { nombre: 'Inversor', descripcion: 'Registraste tu primera inversión', icono: '📈' },
        { nombre: 'Racha de 7', descripcion: '7 días seguidos registrando gastos', icono: '🔥' },
        { nombre: 'Racha de 30', descripcion: '30 días seguidos registrando gastos', icono: '⚡' },
        { nombre: 'Coleccionista', descripcion: 'Registraste gastos en 5 categorías diferentes', icono: '🎨' },
        { nombre: 'Control total', descripcion: 'Tienes más de 50 gastos registrados', icono: '📊' },
        { nombre: 'Meta cumplida', descripcion: 'Alcanzaste tu primer objetivo de ahorro', icono: '🎯' },
        { nombre: 'Diversificado', descripcion: 'Tienes activos en 3 tipos diferentes', icono: '🏦' },
        { nombre: 'Organizado', descripcion: 'Tienes un presupuesto activo', icono: '📋' },
        { nombre: 'Sin deudas', descripcion: 'No tienes deudas pendientes', icono: '🎉' },
        { nombre: 'Ingresista', descripcion: 'Registraste ingresos por más de $100,000', icono: '💵' },
      ];
      for (const l of logrosBase) {
        await this.execute(
          'INSERT INTO logros (nombre, descripcion, icono, desbloqueado, fecha_desbloqueo) VALUES (?, ?, ?, 0, NULL)',
          [l.nombre, l.descripcion, l.icono]
        );
      }
    }
  }

  async getGastos(mes?: number, anio?: number): Promise<Gasto[]> {
    let sql = 'SELECT * FROM gastos';
    const params: any[] = [];
    if (mes && anio) { sql += ' WHERE mes = ? AND anio = ?'; params.push(mes, anio); }
    sql += ' ORDER BY fecha DESC';
    return await this.query(sql, params);
  }

  async addGasto(gasto: Omit<Gasto, 'id' | 'created_at'>): Promise<Gasto> {
    await this.execute(
      'INSERT INTO gastos (fecha, descripcion, categoria, monto, mes, anio, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [gasto.fecha, gasto.descripcion, gasto.categoria, gasto.monto, gasto.mes, gasto.anio, gasto.estado || 'pendiente']
    );
    const result = await this.query('SELECT last_insert_rowid() as id');
    const id = Object.values(result[0])[0] as number;
    return { ...gasto, id };
  }

  async updateGasto(id: number, gasto: Partial<Gasto>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    if (gasto.fecha !== undefined) { fields.push('fecha = ?'); values.push(gasto.fecha); }
    if (gasto.descripcion !== undefined) { fields.push('descripcion = ?'); values.push(gasto.descripcion); }
    if (gasto.categoria !== undefined) { fields.push('categoria = ?'); values.push(gasto.categoria); }
    if (gasto.monto !== undefined) { fields.push('monto = ?'); values.push(gasto.monto); }
    if (gasto.mes !== undefined) { fields.push('mes = ?'); values.push(gasto.mes); }
    if (gasto.anio !== undefined) { fields.push('anio = ?'); values.push(gasto.anio); }
    if (gasto.estado !== undefined) { fields.push('estado = ?'); values.push(gasto.estado); }
    if (fields.length > 0) {
      values.push(id);
      await this.execute(`UPDATE gastos SET ${fields.join(', ')} WHERE id = ?`, values);
    }
  }

  async deleteGasto(id: number): Promise<void> {
    await this.execute('DELETE FROM gastos WHERE id = ?', [id]);
  }

  async getResumenMensual(mes: number, anio: number): Promise<ResumenMensual> {
    const gastoResult = await this.query(
      "SELECT COALESCE(SUM(monto), 0) as total_gastado, COUNT(*) as cantidad_gastos FROM gastos WHERE mes = ? AND anio = ? AND estado != 'cancelado'",
      [mes, anio]
    );
    const total_gastado = gastoResult.length > 0 ? Object.values(gastoResult[0])[0] as number || 0 : 0;
    const cantidad_gastos = gastoResult.length > 0 ? Object.values(gastoResult[0])[1] as number || 0 : 0;

    const catResult = await this.query(
      "SELECT categoria, SUM(monto) as total FROM gastos WHERE mes = ? AND anio = ? AND estado != 'cancelado' GROUP BY categoria ORDER BY total DESC",
      [mes, anio]
    );
    const por_categoria = catResult.map((row: any) => ({ categoria: row.categoria, total: row.total }));

    return { mes, anio, total_gastado, cantidad_gastos, por_categoria };
  }

  async getResumenAnual(anio: number): Promise<ResumenAnual> {
    const mesResult = await this.query(
      "SELECT mes, SUM(monto) as total FROM gastos WHERE anio = ? AND estado != 'cancelado' GROUP BY mes ORDER BY mes",
      [anio]
    );
    const por_mes = mesResult.map((row: any) => ({ mes: row.mes, total: row.total }));
    const total_anual = por_mes.reduce((sum, m) => sum + m.total, 0);

    const catResult = await this.query(
      "SELECT categoria, SUM(monto) as total FROM gastos WHERE anio = ? AND estado != 'cancelado' GROUP BY categoria ORDER BY total DESC",
      [anio]
    );
    const por_categoria = catResult.map((row: any) => ({ categoria: row.categoria, total: row.total }));

    return { anio, total_anual, promedio_mensual: total_anual / 12, por_mes, por_categoria };
  }

  async getDeudas(): Promise<Deuda[]> {
    return await this.query('SELECT * FROM deudas WHERE activa = 1 ORDER BY created_at DESC');
  }

  async addDeuda(deuda: Omit<Deuda, 'id' | 'cuotas_pagadas' | 'created_at'>): Promise<Deuda> {
    await this.execute(
      'INSERT INTO deudas (nombre, monto_total, cuotas_totales, fecha_inicio) VALUES (?, ?, ?, ?)',
      [deuda.nombre, deuda.monto_total, deuda.cuotas_totales, deuda.fecha_inicio]
    );
    const result = await this.query('SELECT last_insert_rowid() as id');
    const id = Object.values(result[0])[0] as number;
    return { ...deuda, id, cuotas_pagadas: 0, activa: 1, estado: 'pendiente' as const };
  }

  async updateDeuda(id: number, deuda: Partial<Deuda>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    if (deuda.nombre !== undefined) { fields.push('nombre = ?'); values.push(deuda.nombre); }
    if (deuda.monto_total !== undefined) { fields.push('monto_total = ?'); values.push(deuda.monto_total); }
    if (deuda.cuotas_totales !== undefined) { fields.push('cuotas_totales = ?'); values.push(deuda.cuotas_totales); }
    if (deuda.cuotas_pagadas !== undefined) { fields.push('cuotas_pagadas = ?'); values.push(deuda.cuotas_pagadas); }
    if (deuda.activa !== undefined) { fields.push('activa = ?'); values.push(deuda.activa); }
    if (deuda.estado !== undefined) { fields.push('estado = ?'); values.push(deuda.estado); }
    if (fields.length > 0) {
      values.push(id);
      await this.execute(`UPDATE deudas SET ${fields.join(', ')} WHERE id = ?`, values);
    }
  }

  async deleteDeuda(id: number): Promise<void> {
    await this.execute('UPDATE deudas SET activa = 0 WHERE id = ?', [id]);
  }

  async addPagoDeuda(deudaId: number, monto: number): Promise<void> {
    const deudas = await this.query('SELECT * FROM deudas WHERE id = ?', [deudaId]);
    if (!deudas.length) throw new Error('Deuda no encontrada');
    const deuda = deudas[0] as any;
    await this.execute(
      'INSERT INTO pagos_deuda (deuda_id, fecha, monto_pagado) VALUES (?, ?, ?)',
      [deudaId, new Date().toISOString().split('T')[0], monto]
    );
    await this.execute('UPDATE deudas SET cuotas_pagadas = cuotas_pagadas + 1 WHERE id = ?', [deudaId]);
    if ((deuda.cuotas_pagadas + 1) >= deuda.cuotas_totales) {
      await this.execute('UPDATE deudas SET activa = 0 WHERE id = ?', [deudaId]);
    }
  }

  async getPagosDeuda(deudaId: number): Promise<any[]> {
    return await this.query('SELECT * FROM pagos_deuda WHERE deuda_id = ? ORDER BY fecha DESC', [deudaId]);
  }

  async getCategorias(): Promise<{ id: number; nombre: string; icono: string }[]> {
    return await this.query('SELECT * FROM categorias ORDER BY nombre');
  }

  async getPresupuestos(mes?: number, anio?: number): Promise<import('./types').Presupuesto[]> {
    let sql = 'SELECT * FROM presupuestos';
    const params: any[] = [];
    if (mes && anio) { sql += ' WHERE mes = ? AND anio = ?'; params.push(mes, anio); }
    sql += ' ORDER BY anio DESC, mes DESC, created_at DESC';
    return await this.query(sql, params);
  }

  async getPresupuestoById(id: number): Promise<PresupuestoDetalle | null> {
    const result = await this.query('SELECT * FROM presupuestos WHERE id = ?', [id]);
    if (!result.length) return null;
    const presupuesto = result[0] as any;

    const catResult = await this.query(
      'SELECT categoria, monto_asignado FROM presupuesto_categorias WHERE presupuesto_id = ?',
      [id]
    );
    const categorias: PresupuestoCategoria[] = catResult.map((row: any) => ({
      categoria: row.categoria,
      monto_asignado: row.monto_asignado,
    }));

    const gastoResult = await this.query(
      "SELECT categoria, SUM(monto) as total FROM gastos WHERE mes = ? AND anio = ? AND estado != 'cancelado' GROUP BY categoria",
      [presupuesto.mes, presupuesto.anio]
    );
    const gastosPorCategoria = new Map<string, number>();
    gastoResult.forEach((row: any) => gastosPorCategoria.set(row.categoria, row.total));

    let total_gastado = 0;
    const detalle_por_categoria = categorias.map(cat => {
      const gastado = gastosPorCategoria.get(cat.categoria) || 0;
      total_gastado += gastado;
      const porcentaje = cat.monto_asignado > 0 ? (gastado / cat.monto_asignado) * 100 : 0;
      let estado: 'bajo' | 'alerta' | 'excedido' = 'bajo';
      if (porcentaje >= 100) estado = 'excedido';
      else if (porcentaje >= 80) estado = 'alerta';
      return { categoria: cat.categoria, asignado: cat.monto_asignado, gastado, porcentaje, estado };
    });

    return { ...presupuesto, categorias, total_gastado, detalle_por_categoria };
  }

  async addPresupuesto(presupuesto: Omit<import('./types').Presupuesto, 'id' | 'created_at'>, categorias: PresupuestoCategoria[]): Promise<import('./types').Presupuesto> {
    await this.execute(
      'INSERT INTO presupuestos (nombre, mes, anio, monto_total) VALUES (?, ?, ?, ?)',
      [presupuesto.nombre, presupuesto.mes, presupuesto.anio, presupuesto.monto_total]
    );
    const result = await this.query('SELECT last_insert_rowid() as id');
    const id = Object.values(result[0])[0] as number;
    for (const cat of categorias) {
      await this.execute(
        'INSERT INTO presupuesto_categorias (presupuesto_id, categoria, monto_asignado) VALUES (?, ?, ?)',
        [id, cat.categoria, cat.monto_asignado]
      );
    }
    return { ...presupuesto, id };
  }

  async updatePresupuesto(id: number, presupuesto: Partial<import('./types').Presupuesto>, categorias?: PresupuestoCategoria[]): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    if (presupuesto.nombre !== undefined) { fields.push('nombre = ?'); values.push(presupuesto.nombre); }
    if (presupuesto.mes !== undefined) { fields.push('mes = ?'); values.push(presupuesto.mes); }
    if (presupuesto.anio !== undefined) { fields.push('anio = ?'); values.push(presupuesto.anio); }
    if (presupuesto.monto_total !== undefined) { fields.push('monto_total = ?'); values.push(presupuesto.monto_total); }
    if (fields.length > 0) {
      values.push(id);
      await this.execute(`UPDATE presupuestos SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    if (categorias) {
      await this.execute('DELETE FROM presupuesto_categorias WHERE presupuesto_id = ?', [id]);
      for (const cat of categorias) {
        await this.execute('INSERT INTO presupuesto_categorias (presupuesto_id, categoria, monto_asignado) VALUES (?, ?, ?)', [id, cat.categoria, cat.monto_asignado]);
      }
    }
  }

  async deletePresupuesto(id: number): Promise<void> {
    await this.execute('DELETE FROM presupuesto_categorias WHERE presupuesto_id = ?', [id]);
    await this.execute('DELETE FROM presupuestos WHERE id = ?', [id]);
  }

  async copiarPresupuesto(id: number, nuevoMes: number, nuevoAnio: number): Promise<import('./types').Presupuesto | null> {
    const original = await this.getPresupuestoById(id);
    if (!original) return null;
    return await this.addPresupuesto(
      { nombre: `${original.nombre} (copia)`, mes: nuevoMes, anio: nuevoAnio, monto_total: original.monto_total },
      original.categorias
    );
  }

  async getResumenPresupuestos(mes: number, anio: number): Promise<PresupuestoDetalle[]> {
    const presupuestos = await this.getPresupuestos(mes, anio);
    const detalles: PresupuestoDetalle[] = [];
    for (const p of presupuestos) {
      const detalle = await this.getPresupuestoById(p.id!);
      if (detalle) detalles.push(detalle);
    }
    return detalles;
  }

  exportToCSV(gastos: Gasto[]): string {
    const headers = ['Fecha', 'Descripción', 'Categoría', 'Estado', 'Monto'];
    const rows = gastos.map(g => [g.fecha, g.descripcion, g.categoria, g.estado || 'pendiente', g.monto.toString()]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  async importarCSV(contenido: string): Promise<number> {
    const lineas = contenido.split('\n').filter(l => l.trim());
    if (lineas.length < 2) return 0;
    const headers = lineas[0].split(',').map(h => h.trim().toLowerCase());
    const fechaIdx = headers.findIndex(h => h === 'fecha');
    const descIdx = headers.findIndex(h => h === 'descripcion' || h === 'descripción');
    const catIdx = headers.findIndex(h => h === 'categoria' || h === 'categoría');
    const montoIdx = headers.findIndex(h => h === 'monto');
    const estadoIdx = headers.findIndex(h => h === 'estado');
    if (fechaIdx === -1 || descIdx === -1 || montoIdx === -1) return 0;
    let importados = 0;
    for (let i = 1; i < lineas.length; i++) {
      const cols = lineas[i].split(',').map(c => c.trim());
      if (cols.length < 3) continue;
      const fecha = cols[fechaIdx];
      const partesFecha = fecha.split('-');
      if (partesFecha.length !== 3) continue;
      await this.execute(
        'INSERT INTO gastos (fecha, descripcion, categoria, monto, mes, anio, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [fecha, cols[descIdx] || 'Importado', cols[catIdx] || 'Otros', parseFloat(cols[montoIdx]) || 0, parseInt(partesFecha[1]), parseInt(partesFecha[0]), cols[estadoIdx] || 'pendiente']
      );
      importados++;
    }
    return importados;
  }

  async getObjetivos(): Promise<ObjetivoFinanciero[]> {
    return await this.query('SELECT * FROM objetivos ORDER BY created_at DESC');
  }

  async addObjetivo(objetivo: Omit<ObjetivoFinanciero, 'id' | 'created_at'>): Promise<ObjetivoFinanciero> {
    await this.execute(
      'INSERT INTO objetivos (nombre, monto_objetivo, monto_actual, fecha_limite, icono, estado) VALUES (?, ?, ?, ?, ?, ?)',
      [objetivo.nombre, objetivo.monto_objetivo, objetivo.monto_actual, objetivo.fecha_limite, objetivo.icono || '🎯', objetivo.estado || 'activo']
    );
    const result = await this.query('SELECT last_insert_rowid() as id');
    const id = Object.values(result[0])[0] as number;
    return { ...objetivo, id };
  }

  async updateObjetivo(id: number, objetivo: Partial<ObjetivoFinanciero>): Promise<void> {
    const fields: string[] = []; const values: any[] = [];
    if (objetivo.nombre !== undefined) { fields.push('nombre = ?'); values.push(objetivo.nombre); }
    if (objetivo.monto_objetivo !== undefined) { fields.push('monto_objetivo = ?'); values.push(objetivo.monto_objetivo); }
    if (objetivo.monto_actual !== undefined) { fields.push('monto_actual = ?'); values.push(objetivo.monto_actual); }
    if (objetivo.fecha_limite !== undefined) { fields.push('fecha_limite = ?'); values.push(objetivo.fecha_limite); }
    if (objetivo.icono !== undefined) { fields.push('icono = ?'); values.push(objetivo.icono); }
    if (objetivo.estado !== undefined) { fields.push('estado = ?'); values.push(objetivo.estado); }
    if (fields.length > 0) { values.push(id); await this.execute(`UPDATE objetivos SET ${fields.join(', ')} WHERE id = ?`, values); }
  }

  async deleteObjetivo(id: number): Promise<void> {
    await this.execute('DELETE FROM objetivos WHERE id = ?', [id]);
  }

  async getActivos(): Promise<Activo[]> {
    return await this.query('SELECT * FROM activos ORDER BY created_at DESC');
  }

  async addActivo(activo: Omit<Activo, 'id' | 'created_at'>): Promise<Activo> {
    await this.execute(
      'INSERT INTO activos (nombre, tipo, valor, fecha, notas) VALUES (?, ?, ?, ?, ?)',
      [activo.nombre, activo.tipo, activo.valor, activo.fecha, activo.notas || '']
    );
    const result = await this.query('SELECT last_insert_rowid() as id');
    const id = Object.values(result[0])[0] as number;
    return { ...activo, id };
  }

  async updateActivo(id: number, activo: Partial<Activo>): Promise<void> {
    const fields: string[] = []; const values: any[] = [];
    if (activo.nombre !== undefined) { fields.push('nombre = ?'); values.push(activo.nombre); }
    if (activo.tipo !== undefined) { fields.push('tipo = ?'); values.push(activo.tipo); }
    if (activo.valor !== undefined) { fields.push('valor = ?'); values.push(activo.valor); }
    if (activo.fecha !== undefined) { fields.push('fecha = ?'); values.push(activo.fecha); }
    if (activo.notas !== undefined) { fields.push('notas = ?'); values.push(activo.notas); }
    if (fields.length > 0) { values.push(id); await this.execute(`UPDATE activos SET ${fields.join(', ')} WHERE id = ?`, values); }
  }

  async deleteActivo(id: number): Promise<void> {
    await this.execute('DELETE FROM activos WHERE id = ?', [id]);
  }

  async getIngresos(mes?: number, anio?: number): Promise<Ingreso[]> {
    let sql = 'SELECT * FROM ingresos';
    const params: any[] = [];
    if (mes && anio) { sql += ' WHERE mes = ? AND anio = ?'; params.push(mes, anio); }
    sql += ' ORDER BY fecha DESC';
    return await this.query(sql, params);
  }

  async addIngreso(ingreso: Omit<Ingreso, 'id' | 'created_at'>): Promise<Ingreso> {
    await this.execute(
      'INSERT INTO ingresos (fecha, descripcion, monto, categoria, mes, anio) VALUES (?, ?, ?, ?, ?, ?)',
      [ingreso.fecha, ingreso.descripcion, ingreso.monto, ingreso.categoria, ingreso.mes, ingreso.anio]
    );
    const result = await this.query('SELECT last_insert_rowid() as id');
    const id = Object.values(result[0])[0] as number;
    return { ...ingreso, id };
  }

  async deleteIngreso(id: number): Promise<void> {
    await this.execute('DELETE FROM ingresos WHERE id = ?', [id]);
  }

  async getHabitos(): Promise<Habito[]> {
    return await this.query('SELECT * FROM habitos WHERE activo = 1 ORDER BY created_at DESC');
  }

  async addHabito(habito: Omit<Habito, 'id' | 'created_at'>): Promise<Habito> {
    await this.execute(
      'INSERT INTO habitos (nombre, tipo, meta_dias, dias_cumplidos, fecha_inicio, activo) VALUES (?, ?, ?, ?, ?, ?)',
      [habito.nombre, habito.tipo, habito.meta_dias, habito.dias_cumplidos || 0, habito.fecha_inicio, habito.activo ?? 1]
    );
    const result = await this.query('SELECT last_insert_rowid() as id');
    const id = Object.values(result[0])[0] as number;
    return { ...habito, id };
  }

  async updateHabito(id: number, habito: Partial<Habito>): Promise<void> {
    const fields: string[] = []; const values: any[] = [];
    if (habito.nombre !== undefined) { fields.push('nombre = ?'); values.push(habito.nombre); }
    if (habito.tipo !== undefined) { fields.push('tipo = ?'); values.push(habito.tipo); }
    if (habito.meta_dias !== undefined) { fields.push('meta_dias = ?'); values.push(habito.meta_dias); }
    if (habito.dias_cumplidos !== undefined) { fields.push('dias_cumplidos = ?'); values.push(habito.dias_cumplidos); }
    if (habito.activo !== undefined) { fields.push('activo = ?'); values.push(habito.activo); }
    if (fields.length > 0) { values.push(id); await this.execute(`UPDATE habitos SET ${fields.join(', ')} WHERE id = ?`, values); }
  }

  async deleteHabito(id: number): Promise<void> {
    await this.execute('DELETE FROM habitos WHERE id = ?', [id]);
  }

  async getLogros(): Promise<Logro[]> {
    return await this.query('SELECT * FROM logros ORDER BY desbloqueado DESC, nombre');
  }

  async verificarLogros(): Promise<string[]> {
    const desbloqueados: string[] = [];
    const logros = await this.getLogros();
    const gastos = await this.getGastos();
    const objetivos = await this.getObjetivos();
    const activos = await this.getActivos();
    const deudas = await this.getDeudas();
    const ingresos = await this.getIngresos();

    if (gastos.length >= 1 && !logros.find(l => l.nombre === 'Primer gasto' && l.desbloqueado)) {
      await this.desbloquearLogro('Primer gasto'); desbloqueados.push('Primer gasto');
    }
    if (gastos.length >= 50 && !logros.find(l => l.nombre === 'Control total' && l.desbloqueado)) {
      await this.desbloquearLogro('Control total'); desbloqueados.push('Control total');
    }
    const categoriasUsadas = new Set(gastos.map(g => g.categoria));
    if (categoriasUsadas.size >= 5 && !logros.find(l => l.nombre === 'Coleccionista' && l.desbloqueado)) {
      await this.desbloquearLogro('Coleccionista'); desbloqueados.push('Coleccionista');
    }
    const deudasPendientes = deudas.filter(d => d.estado === 'pendiente');
    if (deudas.length > 0 && deudasPendientes.length === 0 && !logros.find(l => l.nombre === 'Cero deudas' && l.desbloqueado)) {
      await this.desbloquearLogro('Cero deudas'); desbloqueados.push('Cero deudas');
    }
    if (deudasPendientes.length === 0 && !logros.find(l => l.nombre === 'Sin deudas' && l.desbloqueado)) {
      await this.desbloquearLogro('Sin deudas'); desbloqueados.push('Sin deudas');
    }
    const objetivosCompletados = objetivos.filter(o => o.estado === 'completado' || o.monto_actual >= o.monto_objetivo);
    if (objetivosCompletados.length > 0 && !logros.find(l => l.nombre === 'Meta cumplida' && l.desbloqueado)) {
      await this.desbloquearLogro('Meta cumplida'); desbloqueados.push('Meta cumplida');
    }
    if (new Set(activos.map(a => a.tipo)).size >= 3 && !logros.find(l => l.nombre === 'Diversificado' && l.desbloqueado)) {
      await this.desbloquearLogro('Diversificado'); desbloqueados.push('Diversificado');
    }
    if (ingresos.reduce((sum, i) => sum + i.monto, 0) >= 100000 && !logros.find(l => l.nombre === 'Ingresista' && l.desbloqueado)) {
      await this.desbloquearLogro('Ingresista'); desbloqueados.push('Ingresista');
    }

    if (gastos.length > 0) {
      const fechasGastos = new Set(gastos.map(g => g.fecha));
      const hoy = new Date();
      let racha = 0;
      for (let i = 0; i < 30; i++) {
        const fecha = new Date(hoy);
        fecha.setDate(fecha.getDate() - i);
        if (fechasGastos.has(fecha.toISOString().split('T')[0])) racha++; else break;
      }
      const logrosActuales = await this.getLogros();
      if (racha >= 7 && !logrosActuales.find(l => l.nombre === 'Racha de 7' && l.desbloqueado)) {
        await this.desbloquearLogro('Racha de 7'); desbloqueados.push('Racha de 7');
      }
      if (racha >= 30 && !logrosActuales.find(l => l.nombre === 'Racha de 30' && l.desbloqueado)) {
        await this.desbloquearLogro('Racha de 30'); desbloqueados.push('Racha de 30');
      }
    }
    return desbloqueados;
  }

  private async desbloquearLogro(nombre: string): Promise<void> {
    await this.execute(
      'UPDATE logros SET desbloqueado = 1, fecha_desbloqueo = ? WHERE nombre = ? AND desbloqueado = 0',
      [new Date().toISOString(), nombre]
    );
  }

  private async hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    const useSalt = salt || Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('');
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-512', encoder.encode(password + useSalt));
    const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    return { hash, salt: useSalt };
  }

  async setPassword(password: string): Promise<boolean> {
    try {
      const { hash, salt } = await this.hashPassword(password);
      await Preferences.set({ key: 'security', value: JSON.stringify({ passwordHash: hash, salt, createdAt: new Date().toISOString() }) });
      return true;
    } catch { return false; }
  }

  async verifyPassword(password: string): Promise<boolean> {
    try {
      const { value } = await Preferences.get({ key: 'security' });
      if (!value) return true;
      const config = JSON.parse(value);
      const { hash } = await this.hashPassword(password, config.salt);
      return hash === config.passwordHash;
    } catch { return true; }
  }

  async hasPassword(): Promise<boolean> {
    try {
      const { value } = await Preferences.get({ key: 'security' });
      return value !== null;
    } catch { return false; }
  }

  async removePassword(): Promise<boolean> {
    try { await Preferences.remove({ key: 'security' }); return true; }
    catch { return false; }
  }

  async getPredicciones(): Promise<{
    promedioMensual: number;
    proyeccionProximoMes: number;
    tendenciaGasto: number;
    porCategoria: { categoria: string; promedio: number; proyeccion: number }[];
    mesesHistorial: number;
  }> {
    const ahora = new Date();
    const meses: { mes: number; anio: number; total: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const fecha = new Date(); fecha.setMonth(fecha.getMonth() - i);
      const m = fecha.getMonth() + 1; const a = fecha.getFullYear();
      const result = await this.query(
        "SELECT COALESCE(SUM(monto), 0) as total FROM gastos WHERE mes = ? AND anio = ? AND estado != 'cancelado'", [m, a]
      );
      meses.push({ mes: m, anio: a, total: result.length > 0 ? Object.values(result[0])[0] as number || 0 : 0 });
    }
    const mesesConGastos = meses.filter(m => m.total > 0);
    const promedioMensual = mesesConGastos.length > 0 ? mesesConGastos.reduce((sum, m) => sum + m.total, 0) / mesesConGastos.length : 0;
    const recientes = meses.slice(0, 3).filter(m => m.total > 0);
    const proyeccionProximoMes = recientes.length > 0 ? recientes.reduce((sum, m) => sum + m.total, 0) / recientes.length : promedioMensual;
    const mesActual = meses[0]?.total || 0;
    const mesAnterior = meses[1]?.total || 0;
    const tendenciaGasto = mesAnterior > 0 ? ((mesActual - mesAnterior) / mesAnterior) * 100 : 0;

    const catResult = await this.query(
      `SELECT categoria, AVG(total) as promedio FROM (SELECT categoria, mes, anio, SUM(monto) as total FROM gastos WHERE (anio > ? OR (anio = ? AND mes >= ?)) AND estado != 'cancelado' GROUP BY categoria, mes, anio) GROUP BY categoria`,
      [ahora.getFullYear() - 1, ahora.getFullYear() - 1, Math.max(1, ahora.getMonth() - 5)]
    );
    const porCategoria = catResult.map((row: any) => ({ categoria: row.categoria, promedio: row.promedio, proyeccion: row.promedio * (1 + tendenciaGasto / 100) }));
    return { promedioMensual, proyeccionProximoMes, tendenciaGasto, porCategoria, mesesHistorial: mesesConGastos.length };
  }

  async getProyeccionAhorro(): Promise<{
    ahorroMensualPromedio: number;
    ahorroActual: number;
    mesesParaObjetivos: { nombre: string; mesesRestantes: number; fechaEstimada: string }[];
  }> {
    const ahora = new Date();
    let totalIngresos = 0, totalGastos = 0, mesesConDatos = 0;
    for (let i = 0; i < 6; i++) {
      const fecha = new Date(); fecha.setMonth(fecha.getMonth() - i);
      const m = fecha.getMonth() + 1; const a = fecha.getFullYear();
      const ing = await this.query('SELECT COALESCE(SUM(monto), 0) as total FROM ingresos WHERE mes = ? AND anio = ?', [m, a]);
      const gas = await this.query("SELECT COALESCE(SUM(monto), 0) as total FROM gastos WHERE mes = ? AND anio = ? AND estado != 'cancelado'", [m, a]);
      const ingTotal = ing.length > 0 ? Object.values(ing[0])[0] as number || 0 : 0;
      const gasTotal = gas.length > 0 ? Object.values(gas[0])[0] as number || 0 : 0;
      if (ingTotal > 0 || gasTotal > 0) { totalIngresos += ingTotal; totalGastos += gasTotal; mesesConDatos++; }
    }
    const ahorroMensualPromedio = mesesConDatos > 0 ? (totalIngresos - totalGastos) / mesesConDatos : 0;
    const objetivos = (await this.getObjetivos()).filter(o => o.estado === 'activo');
    const mesesParaObjetivos = objetivos.map(obj => {
      const restante = obj.monto_objetivo - obj.monto_actual;
      const mesesRestantes = ahorroMensualPromedio > 0 ? Math.ceil(restante / ahorroMensualPromedio) : Infinity;
      const fechaEstimada = new Date(ahora);
      fechaEstimada.setMonth(fechaEstimada.getMonth() + (mesesRestantes === Infinity ? 120 : mesesRestantes));
      return { nombre: obj.nombre, mesesRestantes: mesesRestantes === Infinity ? -1 : mesesRestantes, fechaEstimada: mesesRestantes === Infinity ? 'N/A' : fechaEstimada.toISOString().split('T')[0] };
    });
    return { ahorroMensualPromedio, ahorroActual: totalIngresos - totalGastos, mesesParaObjetivos };
  }

  async procesarConsulta(consulta: string): Promise<string> {
    const q = consulta.toLowerCase().trim();
    const mesActual = new Date().getMonth() + 1;
    const anioActual = new Date().getFullYear();

    if (q.includes('gaste') || q.includes('gasto') || q.includes('gasté')) {
      const gastos = (await this.getGastos(mesActual, anioActual)).filter(g => g.estado !== 'cancelado');
      const total = gastos.reduce((sum, g) => sum + g.monto, 0);
      return `Este mes has gastado $${total.toLocaleString('es-AR')} en ${gastos.length} registros.`;
    }
    if (q.includes('ahorro') || q.includes('ahorré') || q.includes('ahorrar')) {
      const proyeccion = await this.getProyeccionAhorro();
      if (proyeccion.ahorroMensualPromedio > 0) return `Tu ahorro mensual promedio es $${proyeccion.ahorroMensualPromedio.toLocaleString('es-AR')}.`;
      return `En promedio no estás generando ahorro mensual.`;
    }
    if (q.includes('deuda') || q.includes('deudas') || q.includes('debo')) {
      const pendientes = (await this.getDeudas()).filter(d => d.estado === 'pendiente');
      if (pendientes.length === 0) return `¡No tienes deudas pendientes! 🎉`;
      return `Tienes ${pendientes.length} deuda(s) pendiente(s).`;
    }
    if (q.includes('resumen') || q.includes('estado')) {
      const gastos = (await this.getGastos(mesActual, anioActual)).filter(g => g.estado !== 'cancelado');
      const ingresos = await this.getIngresos(mesActual, anioActual);
      return `Resumen:\n• Gastos: $${gastos.reduce((s, g) => s + g.monto, 0).toLocaleString('es-AR')}\n• Ingresos: $${ingresos.reduce((s, i) => s + i.monto, 0).toLocaleString('es-AR')}`;
    }
    return `Puedo ayudarte con:\n• "¿Cuánto gasté este mes?"\n• "¿Cómo va mi ahorro?"\n• "¿Cuánto debo?"\n• "¿Cómo voy?"`;
  }

  async close(): Promise<void> {
    if (this.db) { await this.db.close(); this.db = null; }
  }

  // BACKUP
  async exportBackup(): Promise<string> {
    if (!this.db) throw new Error('Not initialized');
    const res = await this.db.exportToJson('novafin_db');
    return JSON.stringify(res);
  }

  async importBackup(jsonStr: string): Promise<void> {
    if (!this.sqliteConn) throw new Error('Not initialized');
    if (this.db) { await this.db.close(); this.db = null; }
    let formatted = jsonStr;
    try {
      const obj = JSON.parse(jsonStr);
      // Strip claves no reconocidas por el plugin Capacitor SQLite
      delete obj.preferencias;
      delete obj.origen;
      delete obj.fecha;
      formatted = JSON.stringify(obj);
    } catch { /* keep original */ }
    await this.sqliteConn.importFromJson(formatted);
    const conn = await this.sqliteConn.isConnection(DB_NAME, false);
    if (conn.result) {
      this.db = await this.sqliteConn.retrieveConnection(DB_NAME, false);
    } else {
      this.db = await this.sqliteConn.createConnection(DB_NAME, false, 'no-encryption', 1, false);
      await this.db.open();
    }
  }
}

export const db = new DatabaseService();
