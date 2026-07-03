import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Deuda, EstadoDeuda, FiltrosDeudas } from '../services/types';
import { FILTROS_DEUDAS_DEFAULT } from '../services/types';
import { db } from '../services/database';
import { FilterBarDeudas } from './FilterBar';

export default function Deudas() {
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [pagoModal, setPagoModal] = useState<Deuda | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    monto_total: '',
    cuotas_totales: '',
    fecha_inicio: new Date().toISOString().split('T')[0]
  });
  const [montoPago, setMontoPago] = useState('');
  const [filtros, setFiltros] = useState<FiltrosDeudas>(FILTROS_DEUDAS_DEFAULT);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const closeModal = useCallback(() => {
    setPagoModal(null);
    setMontoPago('');
    previousFocusRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!pagoModal) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    const timer = setTimeout(() => {
      const input = modalRef.current?.querySelector('input') as HTMLElement;
      input?.focus();
    }, 100);

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeModal();
        return;
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [pagoModal, closeModal]);

  useEffect(() => {
    loadDeudas();
  }, []);

  async function loadDeudas() {
    setLoading(true);
    try {
      const data = await db.getDeudas();
      setDeudas(data);
    } catch (error) {
      console.error('Error loading deudas:', error);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.nombre || !formData.monto_total || !formData.cuotas_totales) return;

    try {
      await db.addDeuda({
        nombre: formData.nombre,
        monto_total: Number(formData.monto_total),
        cuotas_totales: Number(formData.cuotas_totales),
        fecha_inicio: formData.fecha_inicio,
        estado: 'pendiente',
        activa: 1
      });

      setFormData({
        nombre: '',
        monto_total: '',
        cuotas_totales: '',
        fecha_inicio: new Date().toISOString().split('T')[0]
      });
      setShowForm(false);
      loadDeudas();
    } catch (error) {
      console.error('Error saving deuda:', error);
    }
  }

  async function handlePago(deuda: Deuda) {
    if (!montoPago || Number(montoPago) <= 0) return;

    try {
      await db.addPagoDeuda(deuda.id!, Number(montoPago));
      setPagoModal(null);
      setMontoPago('');
      loadDeudas();
    } catch (error) {
      console.error('Error registering pago:', error);
    }
  }

  async function handleDelete(id: number) {
    if (confirm('¿Eliminar esta deuda?')) {
      await db.deleteDeuda(id);
      loadDeudas();
    }
  }

  const cuotaMensual = (deuda: Deuda) => {
    return Math.ceil(deuda.monto_total / deuda.cuotas_totales);
  };

  const montoPendiente = (deuda: Deuda) => {
    return deuda.monto_total - (cuotaMensual(deuda) * deuda.cuotas_pagadas);
  };

  async function handleEstadoChange(id: number, estado: EstadoDeuda) {
    try {
      await db.updateDeuda(id, { estado });
      loadDeudas();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  }

  const deudasFiltradas = useMemo(() => {
    let resultado = [...deudas];

    if (filtros.busqueda) {
      const term = filtros.busqueda.toLowerCase();
      resultado = resultado.filter(d => d.nombre.toLowerCase().includes(term));
    }
    if (filtros.estado) {
      resultado = resultado.filter(d => (d.estado || 'pendiente') === filtros.estado);
    }
    if (filtros.montoMin !== null) {
      resultado = resultado.filter(d => d.monto_total >= filtros.montoMin!);
    }
    if (filtros.montoMax !== null) {
      resultado = resultado.filter(d => d.monto_total <= filtros.montoMax!);
    }

    resultado.sort((a, b) => {
      let cmp = 0;
      switch (filtros.ordenarPor) {
        case 'nombre': cmp = a.nombre.localeCompare(b.nombre); break;
        case 'monto_total': cmp = a.monto_total - b.monto_total; break;
        case 'cuotas_pagadas': cmp = a.cuotas_pagadas - b.cuotas_pagadas; break;
        case 'cuotas_totales': cmp = a.cuotas_totales - b.cuotas_totales; break;
        case 'estado': cmp = (a.estado || 'pendiente').localeCompare(b.estado || 'pendiente'); break;
        case 'created_at': cmp = (a.created_at || '').localeCompare(b.created_at || ''); break;
      }
      return filtros.direccion === 'asc' ? cmp : -cmp;
    });

    return resultado;
  }, [deudas, filtros]);

  const totalDeudasFiltradas = useMemo(
    () => deudasFiltradas.reduce((sum, d) => sum + montoPendiente(d), 0),
    [deudasFiltradas]
  );

  const totalOriginal = useMemo(
    () => deudas.reduce((sum, d) => sum + montoPendiente(d), 0),
    [deudas]
  );

  const totalCuotasPagadas = useMemo(
    () => deudasFiltradas.reduce((sum, d) => sum + d.cuotas_pagadas, 0),
    [deudasFiltradas]
  );

  const totalCuotas = useMemo(
    () => deudasFiltradas.reduce((sum, d) => sum + d.cuotas_totales, 0),
    [deudasFiltradas]
  );

  const porcentajePagado = totalCuotas > 0 ? (totalCuotasPagadas / totalCuotas) * 100 : 0;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Deudas</h2>
        <button
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
        >
          <span>+</span>
          <span className="hidden sm:inline">Nueva deuda</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Deuda total pendiente
            {filtros.busqueda || filtros.estado || filtros.montoMin !== null || filtros.montoMax !== null
              ? ' (filtrado)'
              : ''}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {deudasFiltradas.length} de {deudas.length} deudas
          </p>
        </div>
        <p className="text-3xl font-bold text-red-600 dark:text-red-400">
          ${totalDeudasFiltradas.toLocaleString('es-AR')}
        </p>
        {totalDeudasFiltradas !== totalOriginal && (
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Total sin filtros: ${totalOriginal.toLocaleString('es-AR')}
          </p>
        )}
        {totalCuotas > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-500 dark:text-gray-400">Progreso global:</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{totalCuotasPagadas} / {totalCuotas} cuotas ({porcentajePagado.toFixed(1)}%)</span>
              </div>
              <div
                className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"
                role="progressbar"
                aria-valuenow={porcentajePagado}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progreso global: ${porcentajePagado.toFixed(1)}% pagado`}
              >
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${porcentajePagado}%` }}
                />
              </div>
            </div>
        )}
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-6">
          <h3 className="font-semibold mb-4 text-gray-800 dark:text-gray-100">Nueva Deuda</h3>
          <form onSubmit={handleSubmit} className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Tarjeta de crédito"
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
                className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cuotas</label>
              <input
                type="number"
                value={formData.cuotas_totales}
                onChange={(e) => setFormData({ ...formData, cuotas_totales: e.target.value })}
                placeholder="12"
                min="1"
                className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha inicio</label>
              <input
                type="date"
                value={formData.fecha_inicio}
                onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <FilterBarDeudas
        filtros={filtros}
        onFiltrosChange={setFiltros}
        totalOriginal={deudas.length}
        totalFiltrado={deudasFiltradas.length}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
        ) : deudasFiltradas.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 col-span-full text-center py-8">
            {deudas.length === 0 ? 'No tenés deudas registradas' : 'No se encontraron deudas con estos filtros.'}
          </p>
        ) : (
          deudasFiltradas.map((deuda) => (
            <div key={deuda.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-red-500">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">{deuda.nombre}</h3>
                <div className="flex items-center gap-2">
                  <select
                    value={deuda.estado || 'pendiente'}
                    onChange={(e) => handleEstadoChange(deuda.id!, e.target.value as EstadoDeuda)}
                    aria-label={`Estado de ${deuda.nombre}`}
                    className={`px-2 py-1 text-xs rounded-full border-0 font-medium cursor-pointer transition-colors ${
                      (deuda.estado || 'pendiente') === 'pagada' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                      (deuda.estado || 'pendiente') === 'cancelada' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                    }`}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="pagada">Pagada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                  <button
                    onClick={() => handleDelete(deuda.id!)}
                    aria-label={`Eliminar ${deuda.nombre}`}
                    className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Cuota mensual:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    ${cuotaMensual(deuda).toLocaleString('es-AR')}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Progreso:</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {deuda.cuotas_pagadas} / {deuda.cuotas_totales} cuotas
                  </span>
                </div>
                
                <div
                  className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"
                  role="progressbar"
                  aria-valuenow={(deuda.cuotas_pagadas / deuda.cuotas_totales) * 100}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progreso: ${deuda.cuotas_pagadas} de ${deuda.cuotas_totales} cuotas pagadas`}
                >
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(deuda.cuotas_pagadas / deuda.cuotas_totales) * 100}%` }}
                  />
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Pendiente:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    ${montoPendiente(deuda).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => setPagoModal(deuda)}
                className="w-full mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm transition-colors"
              >
                Registrar pago
              </button>
            </div>
          ))
        )}
      </div>

      {pagoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="modal-title-pago">
          <div ref={modalRef} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
            <h3 id="modal-title-pago" className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
              Registrar pago - {pagoModal.nombre}
            </h3>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Cuota mensual: ${cuotaMensual(pagoModal).toLocaleString('es-AR')}
            </p>

            <div className="mb-4">
              <label htmlFor="monto-pago" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto a pagar</label>
              <input
                id="monto-pago"
                type="number"
                value={montoPago}
                onChange={(e) => setMontoPago(e.target.value)}
                placeholder={cuotaMensual(pagoModal).toString()}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handlePago(pagoModal)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
