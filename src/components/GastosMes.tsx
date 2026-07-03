import { useState, useEffect, useMemo } from 'react';
import type { Gasto, EstadoGasto, FiltrosGastos } from '../services/types';
import { MESES, CATEGORIAS_DEFAULT, FILTROS_GASTOS_DEFAULT } from '../services/types';
import { db } from '../services/database';
import { exportService } from '../services/exportService';
import { FilterBarGastos } from './FilterBar';
import SortHeader from './SortHeader';

interface GastosMesProps {
  mes: number;
  anio: number;
  onMesChange: (mes: number) => void;
  onAnioChange: (anio: number) => void;
}

export default function GastosMes({ mes, anio, onMesChange, onAnioChange }: GastosMesProps) {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    categoria: 'Otros',
    monto: '',
    estado: 'pendiente' as EstadoGasto
  });
  const [filtros, setFiltros] = useState<FiltrosGastos>(FILTROS_GASTOS_DEFAULT);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadGastos();
    setSeleccionados(new Set());
  }, [mes, anio]);

  async function loadGastos() {
    setLoading(true);
    try {
      const data = await db.getGastos(mes, anio);
      setGastos(data);
    } catch (error) {
      console.error('Error loading gastos:', error);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.descripcion || !formData.monto) return;

    try {
      const gasto = {
        fecha: formData.fecha,
        descripcion: formData.descripcion,
        categoria: formData.categoria,
        monto: Number(formData.monto),
        mes,
        anio,
        estado: formData.estado
      };

      if (editingId) {
        await db.updateGasto(editingId, gasto);
      } else {
        await db.addGasto(gasto);
      }

      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        descripcion: '',
        categoria: 'Otros',
        monto: '',
        estado: 'pendiente'
      });
      setEditingId(null);
      setShowForm(false);
      loadGastos();
    } catch (error) {
      console.error('Error saving gasto:', error);
    }
  }

  async function handleDelete(id: number) {
    if (confirm('¿Eliminar este gasto?')) {
      await db.deleteGasto(id);
      loadGastos();
    }
  }

  function handleEdit(gasto: Gasto) {
    setFormData({
      fecha: gasto.fecha,
      descripcion: gasto.descripcion,
      categoria: gasto.categoria,
      monto: gasto.monto.toString(),
      estado: gasto.estado
    });
    setEditingId(gasto.id!);
    setShowForm(true);
  }

  function handleCancel() {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      descripcion: '',
      categoria: 'Otros',
      monto: '',
      estado: 'pendiente'
    });
    setEditingId(null);
    setShowForm(false);
  }

  async function handleEstadoChange(id: number, estado: EstadoGasto) {
    try {
      await db.updateGasto(id, { estado });
      loadGastos();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  }

  function handleSort(campo: string) {
    const campoActual = filtros.ordenarPor;
    const nuevaDireccion = campoActual === campo && filtros.direccion === 'asc' ? 'desc' : 'asc';
    setFiltros({ ...filtros, ordenarPor: campo as FiltrosGastos['ordenarPor'], direccion: nuevaDireccion });
  }

  async function handleExportarCSV() {
    const headers = ['Fecha', 'Descripción', 'Categoría', 'Estado', 'Monto'];
    const rows = gastosFiltrados.map(g => [
      g.fecha, g.descripcion, g.categoria, g.estado || 'pendiente', g.monto.toString()
    ]);
    const contenido = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    await exportService.exportCSV(contenido, `gastos_${MESES[mes - 1]}_${anio}`);
  }

  function toggleSeleccion(id: number) {
    setSeleccionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSeleccionarTodos() {
    const todosSeleccionados = gastosFiltrados.every(g => seleccionados.has(g.id!));

    if (todosSeleccionados) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(gastosFiltrados.map(g => g.id!)));
    }
  }

  async function handlePasarAlMesSiguiente() {
    const nuevoMes = mes === 12 ? 1 : mes + 1;
    const nuevoAnio = mes === 12 ? anio + 1 : anio;
    const cantidad = seleccionados.size;

    if (!confirm(`¿Pasar ${cantidad} gasto(s) a ${MESES[nuevoMes - 1]} ${nuevoAnio}? Los gastos quedarán como pendientes.`)) return;

    try {
      for (const id of seleccionados) {
        await db.updateGasto(id, {
          mes: nuevoMes,
          anio: nuevoAnio,
          estado: 'pendiente'
        });
      }
      setSeleccionados(new Set());
      loadGastos();
    } catch (error) {
      console.error('Error al pasar gastos al mes siguiente:', error);
    }
  }

  async function handleCopiarAlMesSiguiente() {
    const nuevoMes = mes === 12 ? 1 : mes + 1;
    const nuevoAnio = mes === 12 ? anio + 1 : anio;
    const cantidad = seleccionados.size;

    if (!confirm(`¿Copiar ${cantidad} gasto(s) a ${MESES[nuevoMes - 1]} ${nuevoAnio}? Los originales se mantienen.`)) return;

    try {
      for (const id of seleccionados) {
        const gasto = gastos.find(g => g.id === id);
        if (!gasto) continue;
        await db.addGasto({
          fecha: gasto.fecha,
          descripcion: gasto.descripcion,
          categoria: gasto.categoria,
          monto: gasto.monto,
          mes: nuevoMes,
          anio: nuevoAnio,
          estado: 'pendiente'
        });
      }
      setSeleccionados(new Set());
      loadGastos();
    } catch (error) {
      console.error('Error al copiar gastos al mes siguiente:', error);
    }
  }

  const gastosFiltrados = useMemo(() => {
    let resultado = [...gastos];

    if (filtros.busqueda) {
      const term = filtros.busqueda.toLowerCase();
      resultado = resultado.filter(g => g.descripcion.toLowerCase().includes(term));
    }
    if (filtros.categoria) {
      resultado = resultado.filter(g => g.categoria === filtros.categoria);
    }
    if (filtros.estado) {
      resultado = resultado.filter(g => g.estado === filtros.estado);
    }
    if (filtros.montoMin !== null) {
      resultado = resultado.filter(g => g.monto >= filtros.montoMin!);
    }
    if (filtros.montoMax !== null) {
      resultado = resultado.filter(g => g.monto <= filtros.montoMax!);
    }
    if (filtros.fechaInicio) {
      resultado = resultado.filter(g => g.fecha >= filtros.fechaInicio);
    }
    if (filtros.fechaFin) {
      resultado = resultado.filter(g => g.fecha <= filtros.fechaFin);
    }

    resultado.sort((a, b) => {
      let cmp = 0;
      switch (filtros.ordenarPor) {
        case 'fecha': cmp = a.fecha.localeCompare(b.fecha); break;
        case 'descripcion': cmp = a.descripcion.localeCompare(b.descripcion); break;
        case 'categoria': cmp = a.categoria.localeCompare(b.categoria); break;
        case 'monto': cmp = a.monto - b.monto; break;
        case 'estado': cmp = a.estado.localeCompare(b.estado); break;
      }
      return filtros.direccion === 'asc' ? cmp : -cmp;
    });

    return resultado;
  }, [gastos, filtros]);

  const totalFiltrado = useMemo(() => gastosFiltrados.reduce((sum, g) => sum + g.monto, 0), [gastosFiltrados]);

  const subtotalesPorCategoria = useMemo(() => {
    const map = new Map<string, number>();
    gastosFiltrados.forEach(g => {
      map.set(g.categoria, (map.get(g.categoria) || 0) + g.monto);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [gastosFiltrados]);

  const todosSeleccionados = gastosFiltrados.length > 0 && gastosFiltrados.every(g => seleccionados.has(g.id!));

  return (
    <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 truncate">Gastos del Mes</h2>

        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={mes}
              onChange={(e) => onMesChange(Number(e.target.value))}
              aria-label="Mes"
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {MESES.map((nombre, i) => (
                <option key={i} value={i + 1}>{nombre}</option>
              ))}
            </select>

            <select
              value={anio}
              onChange={(e) => onAnioChange(Number(e.target.value))}
              aria-label="Año"
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {[2024, 2025, 2026, 2027].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 transition-colors"
          >
            <span aria-hidden="true">+</span>
            <span className="hidden sm:inline">Agregar gasto</span>
          </button>

          <button
            onClick={handleExportarCSV}
            disabled={gastosFiltrados.length === 0}
            aria-label="Exportar gastos a CSV"
            className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span aria-hidden="true">📥</span>
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          {seleccionados.size > 0 && (
            <>
              <button
                onClick={handleCopiarAlMesSiguiente}
                className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 transition-colors"
              >
                <span aria-hidden="true">📋</span>
                <span className="hidden sm:inline">Copiar {seleccionados.size} gasto(s) al mes siguiente</span>
                <span className="sm:hidden">Copiar ({seleccionados.size})</span>
              </button>
              <button
                onClick={handlePasarAlMesSiguiente}
                className="w-full sm:w-auto px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2 transition-colors"
              >
                <span aria-hidden="true">📅</span>
                <span className="hidden sm:inline">Pasar {seleccionados.size} gasto(s) al mes siguiente</span>
                <span className="sm:hidden">Pasar ({seleccionados.size})</span>
              </button>
            </>
          )}
        </div>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm mb-6">
          <form onSubmit={handleSubmit} className="flex gap-4 items-end flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
              <input
                type="text"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Ej: Supermercado"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {CATEGORIAS_DEFAULT.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto</label>
              <input
                type="number"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value as EstadoGasto })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="pendiente">Pendiente</option>
                <option value="pagado">Pagado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                {editingId ? 'Actualizar' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <FilterBarGastos
        filtros={filtros}
        onFiltrosChange={setFiltros}
        totalOriginal={gastos.length}
        totalFiltrado={gastosFiltrados.length}
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={todosSeleccionados}
                  onChange={toggleSeleccionarTodos}
                  aria-label="Seleccionar todos los gastos"
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-500 cursor-pointer"
                />
              </th>
              <SortHeader campo="fecha" label="Fecha" ordenActual={filtros.ordenarPor} direccion={filtros.direccion} onSort={handleSort} />
              <SortHeader campo="descripcion" label="Descripción" ordenActual={filtros.ordenarPor} direccion={filtros.direccion} onSort={handleSort} />
              <SortHeader campo="categoria" label="Categoría" ordenActual={filtros.ordenarPor} direccion={filtros.direccion} onSort={handleSort} />
              <SortHeader campo="estado" label="Estado" ordenActual={filtros.ordenarPor} direccion={filtros.direccion} onSort={handleSort} align="center" />
              <SortHeader campo="monto" label="Monto" ordenActual={filtros.ordenarPor} direccion={filtros.direccion} onSort={handleSort} align="right" />
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">Cargando...</td>
              </tr>
            ) : gastosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  {gastos.length === 0 ? 'No hay gastos este mes. ¡Agrega uno!' : 'No se encontraron gastos con estos filtros.'}
                </td>
              </tr>
            ) : (
              gastosFiltrados.map((gasto) => (
                <tr key={gasto.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={seleccionados.has(gasto.id!)}
                      onChange={() => toggleSeleccion(gasto.id!)}
                      aria-label={`Seleccionar ${gasto.descripcion}`}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{gasto.fecha}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{gasto.descripcion}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {gasto.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={gasto.estado || 'pendiente'}
                      onChange={(e) => handleEstadoChange(gasto.id!, e.target.value as EstadoGasto)}
                      aria-label={`Estado de ${gasto.descripcion}`}
                      className={`px-2 py-1 text-xs rounded-full border-0 font-medium cursor-pointer transition-colors ${
                        (gasto.estado || 'pendiente') === 'pagado' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                        (gasto.estado || 'pendiente') === 'cancelado' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                      }`}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="pagado">Pagado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                    ${gasto.monto.toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleEdit(gasto)}
                      aria-label={`Editar ${gasto.descripcion}`}
                      className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mr-2 transition-colors rounded"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(gasto.id!)}
                      aria-label={`Eliminar ${gasto.descripcion}`}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors rounded"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            {subtotalesPorCategoria.length > 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-2">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                    {subtotalesPorCategoria.map(([cat, total]) => (
                      <span key={cat}>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{cat}:</span> ${total.toLocaleString('es-AR')}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={5} className="px-4 py-3 text-sm font-bold text-right text-gray-800 dark:text-gray-200">TOTAL:</td>
              <td className="px-4 py-3 text-lg font-bold text-right text-blue-600 dark:text-blue-400">
                ${totalFiltrado.toLocaleString('es-AR')}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
        </div>
      </div>
    </div>
  );
}
