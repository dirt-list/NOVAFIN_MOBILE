import { useState, useEffect } from 'react';
import type { ObjetivoFinanciero } from '../services/types';
import { db } from '../services/database';

export default function Objetivos() {
  const [objetivos, setObjetivos] = useState<ObjetivoFinanciero[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ nombre: '', monto_objetivo: '', monto_actual: '', fecha_limite: '', icono: '🎯' });

  useEffect(() => { loadObjetivos(); }, []);

  async function loadObjetivos() {
    setLoading(true);
    try { setObjetivos(await db.getObjetivos()); } catch (e) { console.error(e); }
    setLoading(false);
  }

  function handleEdit(o: ObjetivoFinanciero) {
    setFormData({ nombre: o.nombre, monto_objetivo: o.monto_objetivo.toString(), monto_actual: o.monto_actual.toString(), fecha_limite: o.fecha_limite, icono: o.icono });
    setEditingId(o.id!);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.nombre || !formData.monto_objetivo || !formData.fecha_limite) return;
    const data = { nombre: formData.nombre, monto_objetivo: Number(formData.monto_objetivo), monto_actual: Number(formData.monto_actual || 0), fecha_limite: formData.fecha_limite, icono: formData.icono, estado: 'activo' as const };
    try {
      if (editingId) await db.updateObjetivo(editingId, data);
      else await db.addObjetivo(data);
      setFormData({ nombre: '', monto_objetivo: '', monto_actual: '', fecha_limite: '', icono: '🎯' });
      setEditingId(null);
      setShowForm(false);
      loadObjetivos();
    } catch (e) { console.error(e); }
  }

  async function handleDelete(id: number) {
    if (confirm('¿Eliminar este objetivo?')) { await db.deleteObjetivo(id); loadObjetivos(); }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Objetivos Financieros</h2>
        <button onClick={() => { setFormData({ nombre: '', monto_objetivo: '', monto_actual: '', fecha_limite: '', icono: '🎯' }); setEditingId(null); setShowForm(true); }}
          className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 transition-colors duration-200">
          <span aria-hidden="true">+</span>
          <span className="hidden sm:inline">Nuevo objetivo</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-6">
          <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-100">{editingId ? 'Editar' : 'Nuevo'} Objetivo</h3>
          <form onSubmit={handleSubmit} className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
              <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Ej: Viaje a Europa" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto objetivo</label>
              <input type="number" value={formData.monto_objetivo} onChange={(e) => setFormData({ ...formData, monto_objetivo: e.target.value })} placeholder="0" min="0" className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ahorrado</label>
              <input type="number" value={formData.monto_actual} onChange={(e) => setFormData({ ...formData, monto_actual: e.target.value })} placeholder="0" min="0" className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha límite</label>
              <input type="date" value={formData.fecha_limite} onChange={(e) => setFormData({ ...formData, fecha_limite: e.target.value })} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ícono</label>
              <select value={formData.icono} onChange={(e) => setFormData({ ...formData, icono: e.target.value })} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                {['🎯', '✈️', '🏠', '🚗', '📱', '🎓', '💊', '💍', '🎁', '🏖️'].map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">{editingId ? 'Actualizar' : 'Guardar'}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
      ) : objetivos.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No tenés objetivos. ¡Creá uno!</p>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {objetivos.map(o => {
            const pct = o.monto_objetivo > 0 ? (o.monto_actual / o.monto_objetivo) * 100 : 0;
            const color = pct >= 100 ? 'bg-green-500' : pct >= 60 ? 'bg-blue-500' : 'bg-yellow-500';
            const restante = o.monto_objetivo - o.monto_actual;
            return (
              <div key={o.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl" aria-hidden="true">{o.icono}</span>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">{o.nombre}</h3>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(o)} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 text-sm" aria-label="Editar">✏️</button>
                    <button onClick={() => handleDelete(o.id!)} className="text-red-500 hover:text-red-700 dark:text-red-400 text-sm" aria-label="Eliminar">🗑️</button>
                  </div>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500 dark:text-gray-400">${o.monto_actual.toLocaleString('es-AR')}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">${o.monto_objetivo.toLocaleString('es-AR')}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${o.nombre}: ${pct.toFixed(0)}%`}>
                  <div className={`h-3 rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs">
                  <span className={pct >= 100 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-500 dark:text-gray-400'}>
                    {pct >= 100 ? '¡Completado!' : `Faltan $${restante.toLocaleString('es-AR')}`}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500">Límite: {o.fecha_limite}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
