import { useState } from 'react';
import type { FiltrosGastos, FiltrosDeudas, FiltrosPresupuestos } from '../services/types';
import { CATEGORIAS_DEFAULT, MESES } from '../services/types';

interface FilterBarGastosProps {
  filtros: FiltrosGastos;
  onFiltrosChange: (f: FiltrosGastos) => void;
  totalOriginal: number;
  totalFiltrado: number;
}

export function FilterBarGastos({ filtros, onFiltrosChange, totalOriginal, totalFiltrado }: FilterBarGastosProps) {
  const [expanded, setExpanded] = useState(false);

  const update = (partial: Partial<FiltrosGastos>) => {
    onFiltrosChange({ ...filtros, ...partial });
  };

  const hayFiltros = filtros.busqueda || filtros.categoria || filtros.estado ||
    filtros.montoMin !== null || filtros.montoMax !== null || filtros.fechaInicio || filtros.fechaFin;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 mb-4">
      <button
        className="md:hidden w-full flex items-center justify-between p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => setExpanded(!expanded)}
      >
        <span>🔍 Filtros</span>
        <span>{expanded ? '▲' : '▼'}</span>
      </button>

      <div className={`${expanded ? 'block' : 'hidden'} md:block grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-2 md:mt-0`}>
        <div className="relative min-w-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" aria-hidden="true">🔍</span>
          <input
            type="text"
            value={filtros.busqueda}
            onChange={(e) => update({ busqueda: e.target.value })}
            placeholder="Buscar en descripción..."
            aria-label="Buscar en descripción"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        <select
          value={filtros.categoria}
          onChange={(e) => update({ categoria: e.target.value })}
          aria-label="Categoría"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS_DEFAULT.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={filtros.estado}
          onChange={(e) => update({ estado: e.target.value as FiltrosGastos['estado'] })}
          aria-label="Estado"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="pagado">Pagado</option>
          <option value="cancelado">Cancelado</option>
        </select>

        <input
          type="number"
          value={filtros.montoMin ?? ''}
          onChange={(e) => update({ montoMin: e.target.value ? Number(e.target.value) : null })}
          placeholder="Monto mín"
          aria-label="Monto mínimo"
          min="0"
          className="w-full sm:w-28 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        />

        <input
          type="number"
          value={filtros.montoMax ?? ''}
          onChange={(e) => update({ montoMax: e.target.value ? Number(e.target.value) : null })}
          placeholder="Monto máx"
          aria-label="Monto máximo"
          min="0"
          className="w-full sm:w-28 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        />

        <input
          type="date"
          value={filtros.fechaInicio}
          onChange={(e) => update({ fechaInicio: e.target.value })}
          aria-label="Fecha desde"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />

        <input
          type="date"
          value={filtros.fechaFin}
          onChange={(e) => update({ fechaFin: e.target.value })}
          aria-label="Fecha hasta"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />

        {hayFiltros && (
          <button
            onClick={() => onFiltrosChange({
              busqueda: '', categoria: '', estado: '', montoMin: null, montoMax: null,
              fechaInicio: '', fechaFin: '', ordenarPor: filtros.ordenarPor, direccion: filtros.direccion
            })}
            aria-label="Limpiar filtros"
            className="w-full sm:w-auto px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            ✕ Limpiar
          </button>
        )}
      </div>

      {hayFiltros && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Mostrando {totalFiltrado} de {totalOriginal} gastos
        </p>
      )}
    </div>
  );
}

interface FilterBarDeudasProps {
  filtros: FiltrosDeudas;
  onFiltrosChange: (f: FiltrosDeudas) => void;
  totalOriginal: number;
  totalFiltrado: number;
}

export function FilterBarDeudas({ filtros, onFiltrosChange, totalOriginal, totalFiltrado }: FilterBarDeudasProps) {
  const [expanded, setExpanded] = useState(false);

  const update = (partial: Partial<FiltrosDeudas>) => {
    onFiltrosChange({ ...filtros, ...partial });
  };

  const hayFiltros = filtros.busqueda || filtros.estado || filtros.montoMin !== null || filtros.montoMax !== null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 mb-4">
      <button
        className="md:hidden w-full flex items-center justify-between p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => setExpanded(!expanded)}
      >
        <span>🔍 Filtros</span>
        <span>{expanded ? '▲' : '▼'}</span>
      </button>

      <div className={`${expanded ? 'block' : 'hidden'} md:block grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-2 md:mt-0`}>
        <div className="relative min-w-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" aria-hidden="true">🔍</span>
          <input
            type="text"
            value={filtros.busqueda}
            onChange={(e) => update({ busqueda: e.target.value })}
            placeholder="Buscar por nombre..."
            aria-label="Buscar por nombre"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        <select
          value={filtros.estado}
          onChange={(e) => update({ estado: e.target.value as FiltrosDeudas['estado'] })}
          aria-label="Estado"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="">Todas las estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="pagada">Pagada</option>
          <option value="cancelada">Cancelada</option>
        </select>

        <input
          type="number"
          value={filtros.montoMin ?? ''}
          onChange={(e) => update({ montoMin: e.target.value ? Number(e.target.value) : null })}
          placeholder="Monto mín"
          aria-label="Monto mínimo"
          min="0"
          className="w-full sm:w-28 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        />

        <input
          type="number"
          value={filtros.montoMax ?? ''}
          onChange={(e) => update({ montoMax: e.target.value ? Number(e.target.value) : null })}
          placeholder="Monto máx"
          aria-label="Monto máximo"
          min="0"
          className="w-full sm:w-28 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        />

        <select
          value={filtros.ordenarPor}
          onChange={(e) => update({ ordenarPor: e.target.value as FiltrosDeudas['ordenarPor'] })}
          aria-label="Ordenar por"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="created_at">Orden: Recientes</option>
          <option value="nombre">Orden: Nombre</option>
          <option value="monto_total">Orden: Monto</option>
          <option value="cuotas_pagadas">Orden: Cuotas pagadas</option>
          <option value="estado">Orden: Estado</option>
        </select>

        <button
          onClick={() => update({ direccion: filtros.direccion === 'asc' ? 'desc' : 'asc' })}
          aria-label={filtros.direccion === 'asc' ? 'Cambiar a orden descendente' : 'Cambiar a orden ascendente'}
          className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          {filtros.direccion === 'asc' ? '↑ Asc' : '↓ Desc'}
        </button>

        {hayFiltros && (
          <button
            onClick={() => onFiltrosChange({
              busqueda: '', estado: '', montoMin: null, montoMax: null,
              ordenarPor: 'created_at', direccion: 'desc'
            })}
            aria-label="Limpiar filtros"
            className="w-full sm:w-auto px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            ✕ Limpiar
          </button>
        )}
      </div>

      {hayFiltros && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Mostrando {totalFiltrado} de {totalOriginal} deudas
        </p>
      )}
    </div>
  );
}

interface FilterBarPresupuestosProps {
  filtros: FiltrosPresupuestos;
  onFiltrosChange: (f: FiltrosPresupuestos) => void;
  anioActual: number;
  onAnioChange: (anio: number) => void;
  mesActual: number;
  onMesChange: (mes: number) => void;
  totalOriginal: number;
  totalFiltrado: number;
}

export function FilterBarPresupuestos({ filtros, onFiltrosChange, anioActual, onAnioChange, mesActual, onMesChange, totalOriginal, totalFiltrado }: FilterBarPresupuestosProps) {
  const [expanded, setExpanded] = useState(false);

  const update = (partial: Partial<FiltrosPresupuestos>) => {
    onFiltrosChange({ ...filtros, ...partial });
  };

  const hayFiltros = filtros.busqueda;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 mb-4">
      <button
        className="md:hidden w-full flex items-center justify-between p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={() => setExpanded(!expanded)}
      >
        <span>🔍 Filtros</span>
        <span>{expanded ? '▲' : '▼'}</span>
      </button>

      <div className={`${expanded ? 'block' : 'hidden'} md:block grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-2 md:mt-0`}>
        <div className="relative min-w-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" aria-hidden="true">🔍</span>
          <input
            type="text"
            value={filtros.busqueda}
            onChange={(e) => update({ busqueda: e.target.value })}
            placeholder="Buscar presupuesto..."
            aria-label="Buscar presupuesto"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        <select
          value={mesActual}
          onChange={(e) => onMesChange(Number(e.target.value))}
          aria-label="Mes"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          {MESES.map((nombre, i) => (
            <option key={i} value={i + 1}>{nombre}</option>
          ))}
        </select>

        <select
          value={anioActual}
          onChange={(e) => onAnioChange(Number(e.target.value))}
          aria-label="Año"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          {[2024, 2025, 2026, 2027].map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        {hayFiltros && (
          <button
            onClick={() => onFiltrosChange({
              busqueda: '', mes: '', anio: '', ordenarPor: filtros.ordenarPor, direccion: filtros.direccion
            })}
            aria-label="Limpiar filtros"
            className="w-full sm:w-auto px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            ✕ Limpiar
          </button>
        )}
      </div>

      {hayFiltros && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Mostrando {totalFiltrado} de {totalOriginal} presupuestos
        </p>
      )}
    </div>
  );
}
