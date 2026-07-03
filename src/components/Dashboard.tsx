import { useState, useEffect, useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import type { Gasto, FiltrosGastos } from '../services/types';
import { MESES, FILTROS_GASTOS_DEFAULT } from '../services/types';
import { db } from '../services/database';
import { exportService } from '../services/exportService';
import { FilterBarGastos } from './FilterBar';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface DashboardProps {
  mes: number;
  anio: number;
  onMesChange: (mes: number) => void;
  onAnioChange: (anio: number) => void;
}

const COLORES = [
  '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#6366f1'
];

export default function Dashboard({ mes, anio, onMesChange, onAnioChange }: DashboardProps) {
  const [gastosMes, setGastosMes] = useState<Gasto[]>([]);
  const [gastosAnio, setGastosAnio] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<FiltrosGastos>(FILTROS_GASTOS_DEFAULT);

  useEffect(() => {
    loadData();
  }, [mes, anio]);

  async function loadData() {
    setLoading(true);
    try {
      const [gMes, gAnio] = await Promise.all([
        db.getGastos(mes, anio),
        db.getGastos(undefined, anio)
      ]);
      setGastosMes(gMes);
      setGastosAnio(gAnio);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
    setLoading(false);
  }

  const gastosMesFiltrados = useMemo(() => {
    let resultado = [...gastosMes];
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
    if (filtros.fechaInicio) resultado = resultado.filter(g => g.fecha >= filtros.fechaInicio);
    if (filtros.fechaFin) resultado = resultado.filter(g => g.fecha <= filtros.fechaFin);
    return resultado;
  }, [gastosMes, filtros]);

  const gastosAnioFiltrados = useMemo(() => {
    let resultado = [...gastosAnio];
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
  }, [gastosAnio, filtros]);

  const totalMesFiltrado = useMemo(() => gastosMesFiltrados.reduce((sum, g) => sum + g.monto, 0), [gastosMesFiltrados]);
  const totalAnioFiltrado = useMemo(() => gastosAnioFiltrados.reduce((sum, g) => sum + g.monto, 0), [gastosAnioFiltrados]);
  const cantidadGastosMes = gastosMesFiltrados.length;
  const promedioMensual = totalAnioFiltrado / 12;

  const porCategoriaMes = useMemo(() => {
    const map = new Map<string, number>();
    gastosMesFiltrados.forEach(g => map.set(g.categoria, (map.get(g.categoria) || 0) + g.monto));
    return Array.from(map.entries())
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total);
  }, [gastosMesFiltrados]);

  const porMesAnio = useMemo(() => {
    const map = new Map<number, number>();
    for (let m = 1; m <= 12; m++) map.set(m, 0);
    gastosAnioFiltrados.forEach(g => map.set(g.mes, (map.get(g.mes) || 0) + g.monto));
    return Array.from(map.entries())
      .map(([mes, total]) => ({ mes, total }))
      .sort((a, b) => a.mes - b.mes);
  }, [gastosAnioFiltrados]);

  const hayFiltros = filtros.busqueda || filtros.categoria || filtros.estado ||
    filtros.montoMin !== null || filtros.montoMax !== null || filtros.fechaInicio || filtros.fechaFin;

  async function handleExportarCSV() {
    const headers = ['Fecha', 'Descripción', 'Categoría', 'Estado', 'Monto'];
    const rows = gastosMesFiltrados.map(g => [
      g.fecha, g.descripcion, g.categoria, g.estado || 'pendiente', g.monto.toString()
    ]);
    const contenido = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    await exportService.exportCSV(contenido, `dashboard_${MESES[mes - 1]}_${anio}`);
  }

  const pieData = porCategoriaMes.length ? {
    labels: porCategoriaMes.map(c => c.categoria),
    datasets: [{
      data: porCategoriaMes.map(c => c.total),
      backgroundColor: COLORES.slice(0, porCategoriaMes.length)
    }]
  } : null;

  const barData = porMesAnio.some(m => m.total > 0) ? {
    labels: porMesAnio.map(m => MESES[m.mes - 1].substring(0, 3)),
    datasets: [{
      label: 'Gastos',
      data: porMesAnio.map(m => m.total),
      backgroundColor: '#0ea5e9'
    }]
  } : null;

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">Cargando...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h2>

        <div className="flex flex-wrap gap-2">
          <select
            value={mes}
            onChange={(e) => onMesChange(Number(e.target.value))}
            aria-label="Mes"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {MESES.map((nombre, i) => (
              <option key={i} value={i + 1}>{nombre}</option>
            ))}
          </select>

          <select
            value={anio}
            onChange={(e) => onAnioChange(Number(e.target.value))}
            aria-label="Año"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {[2024, 2025, 2026, 2027].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <button
            onClick={handleExportarCSV}
            disabled={gastosMesFiltrados.length === 0}
            aria-label="Exportar dashboard a CSV"
            className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span aria-hidden="true">📥</span> Exportar CSV
          </button>
        </div>
      </div>

      <FilterBarGastos
        filtros={filtros}
        onFiltrosChange={setFiltros}
        totalOriginal={gastosMes.length}
        totalFiltrado={gastosMesFiltrados.length}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Gastado este mes{hayFiltros ? ' (filtrado)' : ''}</p>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
            ${totalMesFiltrado.toLocaleString('es-AR')}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Gastado este año{hayFiltros ? ' (filtrado)' : ''}</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
            ${totalAnioFiltrado.toLocaleString('es-AR')}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Promedio mensual{hayFiltros ? ' (filtrado)' : ''}</p>
          <p className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
            ${promedioMensual.toLocaleString('es-AR')}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Gastos este mes{hayFiltros ? ' (filtrado)' : ''}</p>
          <p className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
            {cantidadGastosMes}
          </p>
        </div>
      </div>

      {porCategoriaMes.length > 0 && hayFiltros && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Desglose por categoría (filtrado):</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {porCategoriaMes.map(c => (
              <span key={c.categoria}>
                <span className="font-medium text-gray-700 dark:text-gray-300">{c.categoria}:</span>{' '}
                <span className="text-blue-600 dark:text-blue-400">${c.total.toLocaleString('es-AR')}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Gastos por categoría</h3>
          {pieData ? (
            <div className="h-48 sm:h-64">
              <Pie data={pieData} options={{ maintainAspectRatio: false }} />
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Sin datos este mes</p>
          )}
          {porCategoriaMes.length > 0 && (
            <table className="sr-only" aria-label="Datos de gastos por categoría">
              <thead><tr><th>Categoría</th><th>Monto</th></tr></thead>
              <tbody>
                {porCategoriaMes.map(c => (
                  <tr key={c.categoria}><td>{c.categoria}</td><td>${c.total.toLocaleString('es-AR')}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Tendencia anual</h3>
          {barData ? (
            <div className="h-48 sm:h-64">
              <Bar data={barData} options={{ maintainAspectRatio: false }} />
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Sin datos este año</p>
          )}
          {porMesAnio.some(m => m.total > 0) && (
            <table className="sr-only" aria-label="Datos de tendencia anual">
              <thead><tr><th>Mes</th><th>Gastos</th></tr></thead>
              <tbody>
                {porMesAnio.filter(m => m.total > 0).map(m => (
                  <tr key={m.mes}><td>{MESES[m.mes - 1]}</td><td>${m.total.toLocaleString('es-AR')}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
