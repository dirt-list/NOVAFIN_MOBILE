import { useState, useEffect, useMemo } from 'react';
import type { Habito } from '../services/types';
import { db } from '../services/database';

const FRECUENCIAS = ['personalizado', 'ahorro', 'gasto_cero', 'presupuesto'];

export default function Habitos() {
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ nombre: '', tipo: 'personalizado' as Habito['tipo'], meta_dias: '30' });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setHabitos(await db.getHabitos()); } catch (e) { console.error(e); }
    setLoading(false);
  }

  function handleEdit(h: Habito) {
    setFormData({ nombre: h.nombre, tipo: h.tipo, meta_dias: h.meta_dias.toString() });
    setEditingId(h.id!);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.nombre) return;
    const data = { nombre: formData.nombre, tipo: formData.tipo, meta_dias: Number(formData.meta_dias), dias_cumplidos: 0, fecha_inicio: new Date().toISOString().split('T')[0], activo: 1 };
    try {
      if (editingId) await db.updateHabito(editingId, data);
      else await db.addHabito(data);
      resetForm();
      load();
    } catch (e) { console.error(e); }
  }

  async function handleCompletar(id: number) {
    const habito = habitos.find(h => h.id === id);
    if (!habito) return;
    await db.updateHabito(id, { dias_cumplidos: habito.dias_cumplidos + 1 });
    load();
  }

  function resetForm() {
    setFormData({ nombre: '', tipo: 'personalizado', meta_dias: '30' });
    setEditingId(null);
    setShowForm(false);
  }

  async function handleDelete(id: number) {
    if (confirm('¿Eliminar este hábito?')) { await db.deleteHabito(id); load(); }
  }

  const totalRachas = useMemo(() => habitos.reduce((sum, h) => sum + h.dias_cumplidos, 0), [habitos]);
  const mejorRacha = useMemo(() => habitos.length > 0 ? Math.max(...habitos.map(h => h.dias_cumplidos)) : 0, [habitos]);
  const promedioAvance = useMemo(() => {
    if (habitos.length === 0) return 0;
    const total = habitos.reduce((sum, h) => sum + Math.min((h.dias_cumplidos / h.meta_dias) * 100, 100), 0);
    return Math.round(total / habitos.length);
  }, [habitos]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Hábitos</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 transition-colors">
          <span aria-hidden="true">+</span>
          <span className="hidden sm:inline">Nuevo hábito</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Días totales</p>
          <p className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">{totalRachas} días</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Mejor racha</p>
          <p className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">{mejorRacha} días</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Promedio avance</p>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{promedioAvance}%</p>
        </div>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-6">
          <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-100">{editingId ? 'Editar' : 'Nuevo'} Hábito</h3>
          <form onSubmit={handleSubmit} className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
              <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Ej: Ejercicio" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
              <select value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value as Habito['tipo'] })} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                {FRECUENCIAS.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meta (días)</label>
              <input type="number" value={formData.meta_dias} onChange={(e) => setFormData({ ...formData, meta_dias: e.target.value })} min="1" className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">{editingId ? 'Actualizar' : 'Guardar'}</button>
              <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p className="text-gray-500 dark:text-gray-400">Cargando...</p> : habitos.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No tenés hábitos registrados</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habitos.map(h => {
            const avance = h.meta_dias > 0 ? Math.min((h.dias_cumplidos / h.meta_dias) * 100, 100) : 0;
            return (
              <div key={h.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">{h.nombre}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{h.tipo} · Meta: {h.meta_dias} días</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(h)} className="p-1.5 text-blue-500 hover:text-blue-700 dark:text-blue-400 transition-colors" aria-label="Editar">✏️</button>
                    <button onClick={() => handleDelete(h.id!)} className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 transition-colors" aria-label="Eliminar">🗑️</button>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500 dark:text-gray-400">{h.dias_cumplidos}/{h.meta_dias} días</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">{avance.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2" role="progressbar" aria-valuenow={avance} aria-valuemin={0} aria-valuemax={100} aria-label={`${h.nombre}: ${avance.toFixed(0)}%`}>
                    <div className={`h-2 rounded-full transition-all duration-500 ${avance >= 100 ? 'bg-green-500' : avance >= 70 ? 'bg-yellow-500' : 'bg-orange-500'}`} style={{ width: `${avance}%` }} />
                  </div>
                </div>

                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Días: <span className="font-medium text-orange-600 dark:text-orange-400">{h.dias_cumplidos} 🔥</span></span>
                  <span>Inicio: {new Date(h.fecha_inicio + 'T12:00:00').toLocaleDateString('es-AR')}</span>
                </div>

                <button onClick={() => handleCompletar(h.id!)} className="mt-3 w-full px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors">
                  Completar hoy ✓
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
