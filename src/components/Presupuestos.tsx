import { useState, useEffect, useMemo } from 'react';
import type { PresupuestoDetalle, PresupuestoCategoria, FiltrosPresupuestos } from '../services/types';
import { CATEGORIAS_DEFAULT, MESES, FILTROS_PRESUPUESTOS_DEFAULT } from '../services/types';
import { db } from '../services/database';
import { FilterBarPresupuestos } from './FilterBar';

interface PresupuestosProps {
  mes: number;
  anio: number;
  onMesChange: (mes: number) => void;
  onAnioChange: (anio: number) => void;
}

export default function Presupuestos({ mes, anio, onMesChange, onAnioChange }: PresupuestosProps) {
  const [presupuestos, setPresupuestos] = useState<PresupuestoDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filtros, setFiltros] = useState<FiltrosPresupuestos>(FILTROS_PRESUPUESTOS_DEFAULT);
  const [formData, setFormData] = useState({
    nombre: '',
    monto_total: '',
    categorias: CATEGORIAS_DEFAULT.map(c => ({ categoria: c, monto_asignado: '' }))
  });

  useEffect(() => {
    loadPresupuestos();
  }, [mes, anio]);

  async function loadPresupuestos() {
    setLoading(true);
    try {
      const data = await db.getResumenPresupuestos(mes, anio);
      setPresupuestos(data);
    } catch (error) {
      console.error('Error loading presupuestos:', error);
    }
    setLoading(false);
  }

  function resetForm() {
    setFormData({
      nombre: `${MESES[mes - 1]} ${anio}`,
      monto_total: '',
      categorias: CATEGORIAS_DEFAULT.map(c => ({ categoria: c, monto_asignado: '' }))
    });
    setEditingId(null);
  }

  function handleEdit(presupuesto: PresupuestoDetalle) {
    setFormData({
      nombre: presupuesto.nombre,
      monto_total: presupuesto.monto_total.toString(),
      categorias: presupuesto.categorias.length > 0
        ? presupuesto.categorias.map(c => ({ categoria: c.categoria, monto_asignado: c.monto_asignado.toString() }))
        : CATEGORIAS_DEFAULT.map(c => ({ categoria: c, monto_asignado: presupuesto.monto_total.toString() }))
    });
    setEditingId(presupuesto.id!);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.nombre || !formData.monto_total) return;

    const categoriasPresupuesto: PresupuestoCategoria[] = formData.categorias
      .filter(c => c.monto_asignado !== '')
      .map(c => ({ categoria: c.categoria, monto_asignado: Number(c.monto_asignado) }));

    const monto_total = Number(formData.monto_total);

    try {
      if (editingId) {
        await db.updatePresupuesto(editingId, {
          nombre: formData.nombre,
          mes,
          anio,
          monto_total
        }, categoriasPresupuesto);
      } else {
        await db.addPresupuesto({
          nombre: formData.nombre,
          mes,
          anio,
          monto_total
        }, categoriasPresupuesto);
      }

      resetForm();
      setShowForm(false);
      loadPresupuestos();
    } catch (error) {
      console.error('Error saving presupuesto:', error);
    }
  }

  async function handleDelete(id: number) {
    if (confirm('¿Eliminar este presupuesto?')) {
      await db.deletePresupuesto(id);
      loadPresupuestos();
    }
  }

  async function handleCopiarPresupuesto(id: number) {
    const nuevoMes = mes === 12 ? 1 : mes + 1;
    const nuevoAnio = mes === 12 ? anio + 1 : anio;
    await db.copiarPresupuesto(id, nuevoMes, nuevoAnio);
    loadPresupuestos();
  }

  const presupuestosFiltrados = useMemo(() => {
    let resultado = [...presupuestos];
    if (filtros.busqueda) {
      const term = filtros.busqueda.toLowerCase();
      resultado = resultado.filter(p => p.nombre.toLowerCase().includes(term));
    }
    return resultado;
  }, [presupuestos, filtros]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Presupuestos</h2>

        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 transition-colors"
        >
          <span aria-hidden="true">+</span>
          <span className="hidden sm:inline">Nuevo presupuesto</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-6" role="dialog" aria-modal="true" aria-labelledby="form-presupuesto-title">
          <h3 id="form-presupuesto-title" className="font-semibold mb-4 text-gray-800 dark:text-gray-100">
            {editingId ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="flex gap-4 items-end flex-wrap mb-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Presupuesto mensual"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto total</label>
                <input
                  type="number"
                  value={formData.monto_total}
                  onChange={(e) => setFormData({ ...formData, monto_total: e.target.value })}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
            </div>

            <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Asignación por categoría (opcional)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {formData.categorias.map((cat, i) => (
                <div key={cat.categoria}>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{cat.categoria}</label>
                  <input
                    type="number"
                    value={cat.monto_asignado}
                    onChange={(e) => {
                      const newCategorias = [...formData.categorias];
                      newCategorias[i] = { ...newCategorias[i], monto_asignado: e.target.value };
                      setFormData({ ...formData, categorias: newCategorias });
                    }}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                {editingId ? 'Actualizar' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => { resetForm(); setShowForm(false); }}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <FilterBarPresupuestos
        filtros={filtros}
        onFiltrosChange={setFiltros}
        anioActual={anio}
        onAnioChange={onAnioChange}
        mesActual={mes}
        onMesChange={onMesChange}
        totalOriginal={presupuestos.length}
        totalFiltrado={presupuestosFiltrados.length}
      />

      {loading ? (
        <div className="text-gray-500 dark:text-gray-400">Cargando...</div>
      ) : presupuestosFiltrados.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          {presupuestos.length === 0 
            ? `No hay presupuestos para ${MESES[mes - 1]} ${anio}. ¡Crea uno!` 
            : 'No se encontraron presupuestos con este filtro.'}
        </p>
      ) : (
        <div className="grid gap-6">
          {presupuestosFiltrados.map(p => {
            const restante = p.monto_total - p.total_gastado;
            const porcentajeGlobal = p.monto_total > 0 ? (p.total_gastado / p.monto_total) * 100 : 0;
            const colorGlobal = porcentajeGlobal >= 100 ? 'bg-red-500' : porcentajeGlobal >= 80 ? 'bg-yellow-500' : 'bg-green-500';

            return (
              <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{p.nombre}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {MESES[mes - 1]} {anio} | <span className={restante >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          ${restante.toLocaleString('es-AR')} {restante >= 0 ? 'restantes' : 'excedido'}
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(p)}
                        aria-label={`Editar ${p.nombre}`}
                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors rounded px-2 py-1 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleCopiarPresupuesto(p.id!)}
                        aria-label={`Copiar ${p.nombre}`}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded px-2 py-1 text-sm"
                      >
                        Copiar
                      </button>
                      <button
                        onClick={() => handleDelete(p.id!)}
                        aria-label={`Eliminar ${p.nombre}`}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors rounded px-2 py-1 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Total: ${p.monto_total.toLocaleString('es-AR')}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        ${p.total_gastado.toLocaleString('es-AR')} gastado ({porcentajeGlobal.toFixed(1)}%)
                      </span>
                    </div>
                    <div
                      className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3"
                      role="progressbar"
                      aria-valuenow={porcentajeGlobal}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Progreso general: ${porcentajeGlobal.toFixed(1)}%`}
                    >
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${colorGlobal}`}
                        style={{ width: `${Math.min(porcentajeGlobal, 100)}%` }}
                      />
                    </div>
                  </div>

                  {p.detalle_por_categoria.length > 0 && (
                    <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                      {p.detalle_por_categoria.map(det => {
                        const colorBar = det.estado === 'bajo' ? 'bg-green-500' 
                          : det.estado === 'alerta' ? 'bg-yellow-500' 
                          : 'bg-red-500';

                        return (
                          <div key={det.categoria}>
                            <div className="flex justify-between text-sm mb-0.5">
                              <span className="text-gray-600 dark:text-gray-400">{det.categoria}</span>
                              <span className={`${det.estado === 'excedido' ? 'text-red-600 dark:text-red-400 font-medium' : det.estado === 'alerta' ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                ${det.gastado.toLocaleString('es-AR')} / ${det.asignado.toLocaleString('es-AR')}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${colorBar}`}
                                role="progressbar"
                                aria-valuenow={det.porcentaje}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`${det.categoria}: ${det.porcentaje.toFixed(1)}% usado`}
                                style={{ width: `${Math.min(det.porcentaje, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
