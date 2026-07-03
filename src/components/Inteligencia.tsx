import { useState, useEffect } from 'react';
import { MESES } from '../services/types';
import { db } from '../services/database';

interface Tendencia {
  categoria: string;
  actual: number;
  anterior: number;
  variacion: number;
}

interface Anomalia {
  fecha: string;
  categoria: string;
  monto: number;
  promedio: number;
  desviacion: number;
}

interface Alerta {
  tipo: 'warning' | 'danger' | 'info' | 'success';
  titulo: string;
  mensaje: string;
}

export default function Inteligencia() {
  const [tendencias, setTendencias] = useState<Tendencia[]>([]);
  const [anomalias, setAnomalias] = useState<Anomalia[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());

  useEffect(() => { analyze(); }, [mes, anio]);

  async function analyze() {
    setLoading(true);
    try {
      const gastos = await db.getGastos(mes, anio);
      const mesAnterior = mes === 1 ? 12 : mes - 1;
      const anioAnterior = mes === 1 ? anio - 1 : anio;
      const gastosAnt = await db.getGastos(mesAnterior, anioAnterior);

      const catActual = new Map<string, number>();
      const catAnterior = new Map<string, number>();
      gastos.forEach(g => catActual.set(g.categoria, (catActual.get(g.categoria) || 0) + g.monto));
      gastosAnt.forEach(g => catAnterior.set(g.categoria, (catAnterior.get(g.categoria) || 0) + g.monto));

      const cats = new Set([...catActual.keys(), ...catAnterior.keys()]);
      const t: Tendencia[] = Array.from(cats).map(cat => {
        const actual = catActual.get(cat) || 0;
        const anterior = catAnterior.get(cat) || 0;
        const variacion = anterior > 0 ? ((actual - anterior) / anterior) * 100 : actual > 0 ? 100 : 0;
        return { categoria: cat, actual, anterior, variacion };
      }).sort((a, b) => Math.abs(b.variacion) - Math.abs(a.variacion));
      setTendencias(t);

      const allGastos = await db.getGastos(undefined, undefined);
      const promedioMes = new Map<string, { total: number; count: number }>();
      allGastos.forEach((g: any) => {
        const key = g.categoria;
        const entry = promedioMes.get(key) || { total: 0, count: 0 };
        entry.total += g.monto;
        entry.count++;
        promedioMes.set(key, entry);
      });

      const an: Anomalia[] = [];
      gastos.forEach(g => {
        const stats = promedioMes.get(g.categoria);
        if (stats && stats.count > 0) {
          const promedio = stats.total / stats.count;
          const desviacion = promedio > 0 ? Math.abs(g.monto - promedio) / promedio : 0;
          if (desviacion > 1) {
            an.push({ fecha: g.fecha, categoria: g.categoria, monto: g.monto, promedio: Math.round(promedio), desviacion: Math.round(desviacion * 100) });
          }
        }
      });
      setAnomalias(an.sort((a, b) => b.desviacion - a.desviacion).slice(0, 10));

      const a: Alerta[] = [];
      const totalGastos = gastos.reduce((s, g) => s + g.monto, 0);
      const totalGastosAnt = gastosAnt.reduce((s, g) => s + g.monto, 0);

      if (totalGastosAnt > 0 && totalGastos > totalGastosAnt * 1.2) {
        a.push({ tipo: 'danger', titulo: 'Gasto elevado', mensaje: `Gastaste un ${((totalGastos / totalGastosAnt - 1) * 100).toFixed(0)}% más que el mes pasado` });
      } else if (totalGastosAnt > 0 && totalGastos < totalGastosAnt * 0.8) {
        a.push({ tipo: 'success', titulo: '¡Excelente!', mensaje: `Reduciste un ${((1 - totalGastos / totalGastosAnt) * 100).toFixed(0)}% tu gasto vs el mes pasado` });
      }

      const mayorIncremento = t.find(tend => tend.variacion > 20 && tend.anterior > 0);
      if (mayorIncremento) {
        a.push({ tipo: 'warning', titulo: 'Aumento significativo', mensaje: `${mayorIncremento.categoria} subió un ${mayorIncremento.variacion.toFixed(0)}%` });
      }

      const diasMes = new Date(anio, mes, 0).getDate();
      const hoy = new Date();
      const diasTranscurridos = mes === hoy.getMonth() + 1 && anio === hoy.getFullYear() ? hoy.getDate() : diasMes;
      const gastoDiario = totalGastos / Math.max(diasTranscurridos, 1);
      if (diasTranscurridos >= 15 && gastoDiario > (totalGastosAnt / diasMes) * 1.15) {
        a.push({ tipo: 'warning', titulo: 'Ritmo de gasto alto', mensaje: `Tu gasto diario ($${Math.round(gastoDiario).toLocaleString('es-AR')}) supera el promedio histórico` });
      }

      const ingresos = await db.getIngresos(mes, anio);
      if (ingresos.length === 0 && diasTranscurridos > 10) {
        a.push({ tipo: 'info', titulo: 'Sin ingresos', mensaje: 'No registraste ingresos este mes. ¿Los cargaste?' });
      }

      if (gastos.length > 0) {
        const catsUnicas = new Set(gastos.map(g => g.categoria));
        if (catsUnicas.size <= 2 && gastos.length > 5) {
          a.push({ tipo: 'info', titulo: 'Poca diversificación', mensaje: `Tus gastos se concentran en solo ${catsUnicas.size} categorías` });
        }
      }

      setAlertas(a);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function getAlertIcon(tipo: string) {
    switch (tipo) {
      case 'danger': return '🔴';
      case 'warning': return '🟡';
      case 'success': return '🟢';
      default: return '🔵';
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Inteligencia Financiera</h2>
        <div className="flex gap-2">
          <select value={mes} onChange={(e) => setMes(Number(e.target.value))} aria-label="Mes" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            {MESES.map((n, i) => <option key={i} value={i + 1}>{n}</option>)}
          </select>
          <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} aria-label="Año" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            {[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {loading ? <p className="text-gray-500 dark:text-gray-400">Analizando...</p> : (
        <>
          {alertas.length > 0 && (
            <div className="space-y-3 mb-6">
              {alertas.map((alerta, i) => (
                <div key={i} className={`p-4 rounded-xl shadow-sm border-l-4 ${
                  alerta.tipo === 'danger' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
                  alerta.tipo === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' :
                  alerta.tipo === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-500' :
                  'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-lg" aria-hidden="true">{getAlertIcon(alerta.tipo)}</span>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-100">{alerta.titulo}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{alerta.mensaje}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm mb-6">
            <h3 className="section-title mb-4">Tendencias por categoría</h3>
            {tendencias.length === 0 ? <p className="text-gray-400 text-center py-4">Sin datos comparativos</p> : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Categoría</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">Anterior</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">Actual</th>
                      <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">Variación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {tendencias.map(t => (
                      <tr key={t.categoria} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100">{t.categoria}</td>
                        <td className="px-4 py-2 text-sm text-right text-gray-600 dark:text-gray-400">${t.anterior.toLocaleString('es-AR')}</td>
                        <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-gray-100 font-medium">${t.actual.toLocaleString('es-AR')}</td>
                        <td className={`px-4 py-2 text-sm text-right font-semibold ${t.variacion > 0 ? 'text-red-600 dark:text-red-400' : t.variacion < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                          {t.variacion > 0 ? '+' : ''}{t.variacion.toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm mb-6">
            <h3 className="section-title mb-4">Gastos atípicos detectados</h3>
            {anomalias.length === 0 ? <p className="text-gray-400 text-center py-4">No se detectaron anomalías</p> : (
              <div className="space-y-3">
                {anomalias.map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{a.categoria} — {new Date(a.fecha + 'T12:00:00').toLocaleDateString('es-AR')}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Promedio: ${a.promedio.toLocaleString('es-AR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-orange-600 dark:text-orange-400">${a.monto.toLocaleString('es-AR')}</p>
                      <p className="text-xs text-orange-500">+{a.desviacion}% sobre promedio</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm">
            <h3 className="section-title mb-4">Patrones detectados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tendencias.length > 0 && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-1">📁 Mayor gasto</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{tendencias[0].categoria} con ${tendencias[0].actual.toLocaleString('es-AR')}</p>
                </div>
              )}
              {tendencias.length > 1 && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-1">📈 Mayor incremento</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{tendencias.find(t => t.variacion > 0)?.categoria || 'N/A'} (+{tendencias.find(t => t.variacion > 0)?.variacion.toFixed(0) || 0}%)</p>
                </div>
              )}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-1">🔍 Categorías activas</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{new Set(tendencias.map(t => t.categoria)).size} categorías con gasto</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-1">⚖️ Estabilidad</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{tendencias.filter(t => Math.abs(t.variacion) < 10).length} de {tendencias.length} categorías estables</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
