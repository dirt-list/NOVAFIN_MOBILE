import { useState, useEffect } from 'react';
import { MESES } from '../services/types';
import { db } from '../services/database';

interface DashboardData {
  score: number;
  gastoDiario: number;
  gastoPromedio: number;
  variacion: number;
  ingresos: number;
  gastos: number;
  ahorro: number;
  tasaAhorro: number;
  deudaTotal: number;
  proyeccionMensual: number;
  gastosPorCategoria: { nombre: string; monto: number; porcentaje: number }[];
  tendencia: number[];
}

export default function DashboardEjecutivo() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());

  useEffect(() => { loadData(); }, [mes, anio]);

  async function loadData() {
    setLoading(true);
    try {
      const [gastos, ingresos, deudas] = await Promise.all([
        db.getGastos(mes, anio),
        db.getIngresos(mes, anio),
        db.getDeudas()
      ]);

      const gastosActivos = gastos.filter(g => g.estado !== 'cancelado');
      const totalGastos = gastosActivos.reduce((s, g) => s + g.monto, 0);
      const totalIngresos = ingresos.reduce((s, i) => s + i.monto, 0);
      const ahorro = totalIngresos - totalGastos;
      const tasaAhorro = totalIngresos > 0 ? (ahorro / totalIngresos) * 100 : 0;

      const hoy = new Date();
      const diasMes = new Date(anio, mes, 0).getDate();
      const diasTranscurridos = mes === hoy.getMonth() + 1 && anio === hoy.getFullYear() ? hoy.getDate() : diasMes;
      const gastoDiario = totalGastos / Math.max(diasTranscurridos, 1);
      const gastoPromedio = totalGastos / Math.max(diasMes, 1);

      const mesAnterior = mes === 1 ? 12 : mes - 1;
      const anioAnterior = mes === 1 ? anio - 1 : anio;
      const gastosAnteriores = await db.getGastos(mesAnterior, anioAnterior);
      const totalAnterior = gastosAnteriores.filter(g => g.estado !== 'cancelado').reduce((s, g) => s + g.monto, 0);
      const variacion = totalAnterior > 0 ? ((totalGastos - totalAnterior) / totalAnterior) * 100 : 0;

      const deudaTotal = deudas
        .filter((d: any) => d.estado !== 'pagada')
        .reduce((s: number, d: any) => s + (d.monto_total - (d.monto_total / d.cuotas_totales) * d.cuotas_pagadas), 0);

      const proyeccionMensual = diasMes > 0 ? (totalGastos / diasTranscurridos) * diasMes : totalGastos;

      const catMap = new Map<string, number>();
      gastosActivos.forEach(g => catMap.set(g.categoria, (catMap.get(g.categoria) || 0) + g.monto));
      const gastosPorCategoria = Array.from(catMap.entries())
        .map(([nombre, monto]) => ({ nombre, monto, porcentaje: totalGastos > 0 ? (monto / totalGastos) * 100 : 0 }))
        .sort((a, b) => b.monto - a.monto)
        .slice(0, 5);

      const tendencia: number[] = [];
      for (let i = 5; i >= 0; i--) {
        const m = ((mes - 1 - i + 12) % 12) + 1;
        const a = mes - 1 - i < 0 ? anio - 1 : anio;
        const gs = await db.getGastos(m, a);
        tendencia.push(gs.filter(g => g.estado !== 'cancelado').reduce((s, g) => s + g.monto, 0));
      }

      let score = 50;
      if (tasaAhorro > 20) score += 20;
      else if (tasaAhorro > 0) score += 10;
      else if (tasaAhorro < -10) score -= 20;
      if (variacion < -5) score += 10;
      else if (variacion > 15) score -= 10;
      if (deudaTotal === 0) score += 10;
      if (gastosActivos.length > 0) score += 5;
      if (ingresos.length > 0) score += 5;
      score = Math.max(0, Math.min(100, score));

      setData({
        score, gastoDiario, gastoPromedio, variacion, ingresos: totalIngresos,
        gastos: totalGastos, ahorro, tasaAhorro, deudaTotal, proyeccionMensual,
        gastosPorCategoria, tendencia
      });
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function getScoreColor(s: number) {
    if (s >= 70) return 'text-green-600 dark:text-green-400';
    if (s >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  }

  function getScoreLabel(s: number) {
    if (s >= 80) return 'Excelente';
    if (s >= 70) return 'Bueno';
    if (s >= 50) return 'Regular';
    if (s >= 30) return 'Preocupante';
    return 'Crítico';
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard Ejecutivo</h2>
        <div className="flex gap-2">
          <select value={mes} onChange={(e) => setMes(Number(e.target.value))} aria-label="Mes" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            {MESES.map((n, i) => <option key={i} value={i + 1}>{n}</option>)}
          </select>
          <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} aria-label="Año" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            {[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {loading ? <p className="text-gray-500 dark:text-gray-400">Cargando...</p> : data && (
        <>
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm mb-6">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                <svg className="w-16 h-16 sm:w-20 sm:h-20 transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.5" fill="none" className={`stroke-current ${getScoreColor(data.score)}`} strokeWidth="3"
                    strokeDasharray={`${data.score} 100`} strokeLinecap="round" />
                </svg>
                <span className={`absolute inset-0 flex items-center justify-center text-lg sm:text-xl font-bold ${getScoreColor(data.score)}`}>{data.score}</span>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Salud financiera</p>
                <p className={`text-base sm:text-lg font-semibold ${getScoreColor(data.score)}`}>{getScoreLabel(data.score)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">Gasto diario</p>
              <p className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">${Math.round(data.gastoDiario).toLocaleString('es-AR')}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">Proyección mensual</p>
              <p className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">${Math.round(data.proyeccionMensual).toLocaleString('es-AR')}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">Tasa de ahorro</p>
              <p className={`text-lg sm:text-xl font-bold ${data.tasaAhorro >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {data.tasaAhorro.toFixed(1)}%
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">Variación mensual</p>
              <p className={`text-lg sm:text-xl font-bold ${data.variacion <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {data.variacion > 0 ? '+' : ''}{data.variacion.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm">
              <h3 className="section-title mb-4">Resumen del mes</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Ingresos</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">${data.ingresos.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Gastos</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">${data.gastos.toLocaleString('es-AR')}</span>
                </div>
                <hr className="dark:border-gray-700" />
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Ahorro</span>
                  <span className={`font-semibold ${data.ahorro >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    ${data.ahorro.toLocaleString('es-AR')}
                  </span>
                </div>
                {data.deudaTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Deuda pendiente</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">${data.deudaTotal.toLocaleString('es-AR')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm">
              <h3 className="section-title mb-4">Top categorías</h3>
              {data.gastosPorCategoria.length === 0 ? <p className="text-gray-400 text-center py-4">Sin datos</p> : (
                <div className="space-y-3">
                  {data.gastosPorCategoria.map(c => (
                    <div key={c.nombre}>
                      <div className="flex justify-between text-sm mb-0.5">
                        <span className="text-gray-600 dark:text-gray-400">{c.nombre}</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">${c.monto.toLocaleString('es-AR')} ({c.porcentaje.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                        <div className="h-2 bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${c.porcentaje}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <h3 className="section-title mb-4">Tendencia últimos 6 meses</h3>
            {data.tendencia.every(v => v === 0) ? <p className="text-gray-400 text-center py-4">Sin datos suficientes</p> : (
              <div className="flex items-end justify-between h-40 gap-2">
                {data.tendencia.map((valor, idx) => {
                  const max = Math.max(...data.tendencia.filter(v => v > 0), 1);
                  const altura = (valor / max) * 100;
                  const mesesAtras = 5 - idx;
                  const m = ((mes - 1 - mesesAtras + 12) % 12) + 1;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">${(valor / 1000).toFixed(0)}k</span>
                      <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-t" style={{ height: `${Math.max(altura, 2)}%` }}>
                        <div className="w-full h-full bg-blue-500 rounded-t transition-all duration-500" />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{MESES[m - 1].substring(0, 3)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
