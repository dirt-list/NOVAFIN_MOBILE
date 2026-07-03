import { useState, useEffect, useMemo } from 'react';
import type { Gasto, FiltrosGastos } from '../services/types';
import { MESES, FILTROS_GASTOS_DEFAULT } from '../services/types';
import { db } from '../services/database';
import { FilterBarGastos } from './FilterBar';

interface ResumenAnualProps {
  anio: number;
}

export default function ResumenAnual({ anio }: ResumenAnualProps) {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<FiltrosGastos>(FILTROS_GASTOS_DEFAULT);

  useEffect(() => {
    loadResumen();
  }, [anio]);

  async function loadResumen() {
    setLoading(true);
    try {
      const data = await db.getGastos(undefined, anio);
      setGastos(data);
    } catch (error) {
      console.error('Error loading resumen:', error);
    }
    setLoading(false);
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
    if (filtros.montoMin !== null) resultado = resultado.filter(g => g.monto >= filtros.montoMin!);
    if (filtros.montoMax !== null) resultado = resultado.filter(g => g.monto <= filtros.montoMax!);
    return resultado;
  }, [gastos, filtros]);

  const totalAnual = useMemo(() => gastosFiltrados.reduce((sum, g) => sum + g.monto, 0), [gastosFiltrados]);
  const promedioMensual = totalAnual / 12;

  const porMes = useMemo(() => {
    const map = new Map<number, number>();
    for (let m = 1; m <= 12; m++) map.set(m, 0);
    gastosFiltrados.forEach(g => map.set(g.mes, (map.get(g.mes) || 0) + g.monto));
    return Array.from(map.entries())
      .map(([mes, total]) => ({ mes, total }))
      .sort((a, b) => a.mes - b.mes);
  }, [gastosFiltrados]);

  const mesMax = useMemo(() => {
    if (!porMes.length) return null;
    return porMes.reduce((max, m) => m.total > max.total ? m : max);
  }, [porMes]);

  const porCategoria = useMemo(() => {
    const map = new Map<string, number>();
    gastosFiltrados.forEach(g => map.set(g.categoria, (map.get(g.categoria) || 0) + g.monto));
    return Array.from(map.entries())
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total);
  }, [gastosFiltrados]);

  const maxGasto = Math.max(...porMes.map(m => m.total), 1);

  const hayFiltros = filtros.busqueda || filtros.categoria || filtros.estado ||
    filtros.montoMin !== null || filtros.montoMax !== null;

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">Cargando...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Resumen Anual {anio}</h2>
      </div>

      <FilterBarGastos
        filtros={filtros}
        onFiltrosChange={setFiltros}
        totalOriginal={gastos.length}
        totalFiltrado={gastosFiltrados.length}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total anual{hayFiltros ? ' (filtrado)' : ''}</p>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
            ${totalAnual.toLocaleString('es-AR')}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Promedio mensual{hayFiltros ? ' (filtrado)' : ''}</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
            ${promedioMensual.toLocaleString('es-AR')}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Mes con más gasto{hayFiltros ? ' (filtrado)' : ''}</p>
          <p className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
            {mesMax && mesMax.total > 0 ? MESES[mesMax.mes - 1] : '-'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Gastos por mes{hayFiltros ? ' (filtrado)' : ''}</h3>
        <div className="space-y-3">
          {porMes.map(({ mes, total }) => {
            const porcentaje = maxGasto > 0 ? (total / maxGasto) * 100 : 0;
            
            return (
              <div key={mes} className="flex items-center gap-4">
                <span className="w-20 text-sm text-gray-600 dark:text-gray-400">{MESES[mes - 1].substring(0, 3)}</span>
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-500 flex items-center justify-end pr-2"
                    role="progressbar"
                    aria-valuenow={porcentaje}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${MESES[mes - 1]}: $${total.toLocaleString('es-AR')}`}
                    style={{ width: `${porcentaje}%` }}
                  >
                    {total > 0 && (
                      <span className="text-xs text-white font-medium">
                        ${total.toLocaleString('es-AR')}
                      </span>
                    )}
                  </div>
                </div>
                <span className="w-24 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                  ${total.toLocaleString('es-AR')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {porCategoria.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Top categorías del año{hayFiltros ? ' (filtrado)' : ''}</h3>
          <div className="space-y-3">
            {porCategoria.slice(0, 5).map((cat, i) => {
              const porcentaje = totalAnual > 0 ? (cat.total / totalAnual) * 100 : 0;
              
              return (
                <div key={i} className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-gray-800 dark:text-gray-200">{cat.categoria}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{porcentaje.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        role="progressbar"
                        aria-valuenow={porcentaje}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${cat.categoria}: ${porcentaje.toFixed(1)}% del total anual`}
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    ${cat.total.toLocaleString('es-AR')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
