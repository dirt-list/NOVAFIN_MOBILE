import { useState, useEffect, useMemo } from 'react';
import type { Activo } from '../services/types';
import { db } from '../services/database';

const TIPOS = [
  { value: 'efectivo', label: 'Efectivo', icon: '💵' },
  { value: 'inversion', label: 'Inversión', icon: '📈' },
  { value: 'propiedad', label: 'Propiedad', icon: '🏠' },
  { value: 'vehiculo', label: 'Vehículo', icon: '🚗' },
  { value: 'otro', label: 'Otro', icon: '📦' },
];

export default function Patrimonio() {
  const [activos, setActivos] = useState<Activo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ nombre: '', tipo: 'efectivo', valor: '', fecha: new Date().toISOString().split('T')[0], notas: '' });

  useEffect(() => { loadActivos(); }, []);

  async function loadActivos() {
    setLoading(true);
    try { setActivos(await db.getActivos()); } catch (e) { console.error(e); }
    setLoading(false);
  }

  function handleEdit(a: Activo) {
    setFormData({ nombre: a.nombre, tipo: a.tipo, valor: a.valor.toString(), fecha: a.fecha, notas: a.notas });
    setEditingId(a.id!);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.nombre || !formData.valor) return;
    const data = { nombre: formData.nombre, tipo: formData.tipo as Activo['tipo'], valor: Number(formData.valor), fecha: formData.fecha, notas: formData.notas };
    try {
      if (editingId) await db.updateActivo(editingId, data);
      else await db.addActivo(data);
      setFormData({ nombre: '', tipo: 'efectivo', valor: '', fecha: new Date().toISOString().split('T')[0], notas: '' });
      setEditingId(null);
      setShowForm(false);
      loadActivos();
    } catch (e) { console.error(e); }
  }

  async function handleDelete(id: number) {
    if (confirm('¿Eliminar este activo?')) { await db.deleteActivo(id); loadActivos(); }
  }

  const totalActivos = useMemo(() => activos.reduce((sum, a) => sum + a.valor, 0), [activos]);
  const porTipo = useMemo(() => {
    const map = new Map<string, number>();
    activos.forEach(a => map.set(a.tipo, (map.get(a.tipo) || 0) + a.valor));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [activos]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Patrimonio Neto</h2>
        <button onClick={() => { setFormData({ nombre: '', tipo: 'efectivo', valor: '', fecha: new Date().toISOString().split('T')[0], notas: '' }); setEditingId(null); setShowForm(true); }}
          className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 transition-colors">
          <span aria-hidden="true">+</span>
          <span className="hidden sm:inline">Agregar activo</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total activos</p>
        <p className="text-3xl font-bold text-green-600 dark:text-green-400">${totalActivos.toLocaleString('es-AR')}</p>
        {porTipo.length > 0 && (
          <div className="flex flex-wrap gap-4 mt-3">
            {porTipo.map(([tipo, total]) => {
              const info = TIPOS.find(t => t.value === tipo);
              return (
                <span key={tipo} className="text-sm text-gray-600 dark:text-gray-400">
                  <span aria-hidden="true">{info?.icon} </span>{info?.label}: <span className="font-medium">${total.toLocaleString('es-AR')}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-6">
          <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-100">{editingId ? 'Editar' : 'Nuevo'} Activo</h3>
          <form onSubmit={handleSubmit} className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
              <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Ej: Cuenta banco" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
              <select value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor</label>
              <input type="number" value={formData.valor} onChange={(e) => setFormData({ ...formData, valor: e.target.value })} placeholder="0" min="0" className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
              <input type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">{editingId ? 'Actualizar' : 'Guardar'}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p className="text-gray-500 dark:text-gray-400">Cargando...</p> : activos.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No tenés activos registrados</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Nombre</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Tipo</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">Valor</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {activos.map(a => {
                  const info = TIPOS.find(t => t.value === a.tipo);
                  return (
                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{a.nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{info?.icon} {info?.label}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-green-600 dark:text-green-400">${a.valor.toLocaleString('es-AR')}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleEdit(a)} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 mr-2 transition-colors" aria-label="Editar">✏️</button>
                        <button onClick={() => handleDelete(a.id!)} className="text-red-500 hover:text-red-700 dark:text-red-400 transition-colors" aria-label="Eliminar">🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
