import { useState, useEffect } from 'react';
import { MESES } from '../services/types';
import { db } from '../services/database';
import { exportService } from '../services/exportService';

interface Reporte {
  titulo: string;
  contenido: string;
  tipo: 'resumen' | 'recomendacion' | 'comparativa';
}

export default function Reportes() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());

  useEffect(() => { generate(); }, [mes, anio]);

  async function generate() {
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

      const mesAnt = mes === 1 ? 12 : mes - 1;
      const anioAnt = mes === 1 ? anio - 1 : anio;
      const gastosAnt = await db.getGastos(mesAnt, anioAnt);
      const totalAnt = gastosAnt.filter(g => g.estado !== 'cancelado').reduce((s, g) => s + g.monto, 0);
      const variacion = totalAnt > 0 ? ((totalGastos - totalAnt) / totalAnt) * 100 : 0;

      const r: Reporte[] = [];

      r.push({
        titulo: '📊 Resumen del mes',
        tipo: 'resumen',
        contenido: `Período: ${MESES[mes - 1]} ${anio}\n` +
          `Ingresos: $${totalIngresos.toLocaleString('es-AR')}\n` +
          `Gastos: $${totalGastos.toLocaleString('es-AR')}\n` +
          `Ahorro: $${ahorro.toLocaleString('es-AR')} (${tasaAhorro.toFixed(1)}%)\n` +
          `Transacciones: ${gastosActivos.length} gastos, ${ingresos.length} ingresos`
      });

      if (totalAnt > 0) {
        r.push({
          titulo: '📈 Comparativa mensual',
          tipo: 'comparativa',
          contenido: `Gasto ${MESES[mes - 1]}: $${totalGastos.toLocaleString('es-AR')}\n` +
            `Gasto ${MESES[mesAnt - 1]}: $${totalAnt.toLocaleString('es-AR')}\n` +
            `Variación: ${variacion > 0 ? '+' : ''}${variacion.toFixed(1)}%\n` +
            `${variacion > 10 ? '⚠️ El gasto aumentó significativamente' : variacion < -10 ? '✅ ¡Reduciste el gasto!' : '➡️ El gasto se mantuvo estable'}`
        });
      }

      const catMap = new Map<string, number>();
      gastosActivos.forEach(g => catMap.set(g.categoria, (catMap.get(g.categoria) || 0) + g.monto));
      const topCats = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
      if (topCats.length > 0) {
        const lines = topCats.map(([cat, monto]) => {
          const pct = totalGastos > 0 ? (monto / totalGastos) * 100 : 0;
          return `${cat}: $${monto.toLocaleString('es-AR')} (${pct.toFixed(0)}%)`;
        });
        r.push({
          titulo: '🏆 Top categorías de gasto',
          tipo: 'resumen',
          contenido: lines.join('\n')
        });
      }

      const recs: string[] = [];
      if (tasaAhorro < 10 && totalIngresos > 0) {
        recs.push('Tu tasa de ahorro es baja. Intenta reducir gastos no esenciales.');
      }
      if (variacion > 15) {
        recs.push(`El gasto creció ${variacion.toFixed(0)}%. Revisá las categorías con mayor aumento.`);
      }
      topCats.forEach(([cat, monto]) => {
        if (totalGastos > 0 && (monto / totalGastos) > 0.4) {
          recs.push(`"${cat}" concentra el ${(monto / totalGastos * 100).toFixed(0)}% de tus gastos. Considerá diversificar.`);
        }
      });
      const deudaPendiente = deudas.filter((d: any) => d.estado !== 'pagada');
      if (deudaPendiente.length > 0) {
        const totalDeuda = deudaPendiente.reduce((s: number, d: any) => s + (d.monto_total - (d.monto_total / d.cuotas_totales) * d.cuotas_pagadas), 0);
        recs.push(`Tenés $${Math.round(totalDeuda).toLocaleString('es-AR')} en deudas pendientes. Priorizá pagar las de mayor interés.`);
      }
      if (recs.length === 0) {
        recs.push('¡Todo bien! Seguí manteniendo tus hábitos financieros.');
      }
      r.push({
        titulo: '💡 Recomendaciones',
        tipo: 'recomendacion',
        contenido: recs.join('\n')
      });

      setReportes(r);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function exportCSV() {
    const lines = reportes.map(r => `${r.titulo}\n${r.contenido}`);
    const contenido = lines.join('\n\n');
    await exportService.exportCSV(contenido, `reporte_${MESES[mes - 1]}_${anio}`);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Reportes</h2>
        <div className="flex gap-2">
          <select value={mes} onChange={(e) => setMes(Number(e.target.value))} aria-label="Mes" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            {MESES.map((n, i) => <option key={i} value={i + 1}>{n}</option>)}
          </select>
          <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} aria-label="Año" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            {[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={exportCSV} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            Exportar TXT
          </button>
        </div>
      </div>

      {loading ? <p className="text-gray-500 dark:text-gray-400">Generando reportes...</p> : (
        <div className="space-y-4">
          {reportes.map((reporte, i) => (
            <div key={i} className={`bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border-l-4 ${
              reporte.tipo === 'resumen' ? 'border-blue-500' :
              reporte.tipo === 'recomendacion' ? 'border-green-500' :
              'border-purple-500'
            }`}>
              <h3 className="section-title mb-3">{reporte.titulo}</h3>
              <div className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {reporte.contenido}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
