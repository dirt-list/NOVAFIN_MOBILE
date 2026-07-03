import { useState, useEffect, useMemo } from 'react';
import type { Ingreso } from '../services/types';
import { MESES } from '../services/types';
import { db } from '../services/database';

interface FlujoCajaProps {
  mes: number;
  anio: number;
  onMesChange: (mes: number) => void;
  onAnioChange: (anio: number) => void;
}

export default function FlujoCaja({ mes, anio, onMesChange, onAnioChange }: FlujoCajaProps) {
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [gastos, setGastos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ fecha: new Date().toISOString().split('T')[0], descripcion: '', monto: '', categoria: 'Salario' });

  useEffect(() => { loadData(); }, [mes, anio]);

  async function loadData() {
    setLoading(true);
    try {
      const [i, g] = await Promise.all([
        db.getIngresos(mes, anio),
        db.getGastos(mes, anio)
      ]);
      setIngresos(i);
      setGastos(g);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.descripcion || !formData.monto) return;
    const partesFecha = formData.fecha.split('-');
    await db.addIngreso({
      fecha: formData.fecha, descripcion: formData.descripcion, monto: Number(formData.monto),
      categoria: formData.categoria, mes: parseInt(partesFecha[1]), anio: parseInt(partesFecha[0])
    });
    setFormData({ fecha: new Date().toISOString().split('T')[0], descripcion: '', monto: '', categoria: 'Salario' });
    setShowForm(false);
    loadData();
  }

  async function handleDelete(id: number) {
    if (confirm('¿Eliminar este ingreso?')) { await db.deleteIngreso(id); loadData(); }
  }

  const totalIngresos = useMemo(() => ingresos.reduce((sum, i) => sum + i.monto, 0), [ingresos]);
  const totalGastos = useMemo(() => gastos.reduce((sum, g) => sum + g.monto, 0), [gastos]);
  const saldo = totalIngresos - totalGastos;

  const gastosPorCategoria = useMemo(() => {
    const map = new Map<string, number>();
    gastos.forEach(g => map.set(g.categoria, (map.get(g.categoria) || 0) + g.monto));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [gastos]);

  const ingresosPorCategoria = useMemo(() => {
    const map = new Map<string, number>();
    ingresos.forEach(i => map.set(i.categoria, (map.get(i.categoria) || 0) + i.monto));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [ingresos]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Flujo de Caja</h2>
        <div className="flex gap-2">
          <select value={mes} onChange={(e) => onMesChange(Number(e.target.value))} aria-label="Mes" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            {MESES.map((n, i) => <option key={i} value={i + 1}>{n}</option>)}
          </select>
          <select value={anio} onChange={(e) => onAnioChange(Number(e.target.value))} aria-label="Año" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            {[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={() => setShowForm(true)} className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 transition-colors">
            <span aria-hidden="true">+</span>
            <span className="hidden sm:inline">Ingreso</span>
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-6">
          <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-100">Nuevo Ingreso</h3>
          <form onSubmit={handleSubmit} className="flex gap-4 items-end flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
              <input type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
              <input type="text" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} placeholder="Ej: Salario" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
              <select value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                {['Salario', 'Freelance', 'Inversiones', 'Otros'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto</label>
              <input type="number" value={formData.monto} onChange={(e) => setFormData({ ...formData, monto: e.target.value })} placeholder="0" min="0" className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">Guardar</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p className="text-gray-500 dark:text-gray-400">Cargando...</p> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Ingresos</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">${totalIngresos.toLocaleString('es-AR')}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Gastos</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">${totalGastos.toLocaleString('es-AR')}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Saldo</p>
              <p className={`text-2xl sm:text-3xl font-bold ${saldo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>${saldo.toLocaleString('es-AR')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm">
              <h3 className="section-title mb-4">Ingresos por categoría</h3>
              {ingresosPorCategoria.length === 0 ? <p className="text-gray-400 dark:text-gray-500 text-center py-4">Sin ingresos</p> : (
                <div className="space-y-3">
                  {ingresosPorCategoria.map(([cat, total]) => {
                    const pct = totalIngresos > 0 ? (total / totalIngresos) * 100 : 0;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-sm mb-0.5">
                          <span className="text-gray-600 dark:text-gray-400">{cat}</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">${total.toLocaleString('es-AR')} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                          <div className="h-2 bg-green-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm">
              <h3 className="section-title mb-4">Gastos por categoría</h3>
              {gastosPorCategoria.length === 0 ? <p className="text-gray-400 dark:text-gray-500 text-center py-4">Sin gastos</p> : (
                <div className="space-y-3">
                  {gastosPorCategoria.map(([cat, total]) => {
                    const pct = totalGastos > 0 ? (total / totalGastos) * 100 : 0;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-sm mb-0.5">
                          <span className="text-gray-600 dark:text-gray-400">{cat}</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">${total.toLocaleString('es-AR')} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                          <div className="h-2 bg-red-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {ingresos.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Fecha</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Descripción</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Categoría</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">Monto</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {ingresos.map(i => (
                      <tr key={i.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{i.fecha}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{i.descripcion}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{i.categoria}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-600 dark:text-green-400">${i.monto.toLocaleString('es-AR')}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => handleDelete(i.id!)} className="text-red-500 hover:text-red-700 dark:text-red-400 transition-colors" aria-label="Eliminar">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
