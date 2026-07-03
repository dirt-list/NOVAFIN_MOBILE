export type EstadoGasto = 'pendiente' | 'pagado' | 'cancelado';

export interface Gasto {
  id?: number;
  fecha: string;
  descripcion: string;
  categoria: string;
  monto: number;
  mes: number;
  anio: number;
  estado: EstadoGasto;
  created_at?: string;
}

export type EstadoDeuda = 'pendiente' | 'pagada' | 'cancelada';

export interface Deuda {
  id?: number;
  nombre: string;
  monto_total: number;
  cuotas_totales: number;
  cuotas_pagadas: number;
  fecha_inicio: string;
  activa: number;
  estado: EstadoDeuda;
  created_at?: string;
}

export interface PagoDeuda {
  id?: number;
  deuda_id: number;
  fecha: string;
  monto_pagado: number;
}

export interface Categoria {
  id: number;
  nombre: string;
  icono: string;
}

export interface ResumenMensual {
  mes: number;
  anio: number;
  total_gastado: number;
  cantidad_gastos: number;
  por_categoria: { categoria: string; total: number }[];
}

export interface ResumenAnual {
  anio: number;
  total_anual: number;
  promedio_mensual: number;
  por_mes: { mes: number; total: number }[];
  por_categoria: { categoria: string; total: number }[];
}

export interface GastoFormData {
  fecha: string;
  descripcion: string;
  categoria: string;
  monto: number | string;
}

export interface DeudaFormData {
  nombre: string;
  monto_total: number | string;
  cuotas_totales: number | string;
  fecha_inicio: string;
}

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const CATEGORIAS_DEFAULT = [
  'Vivienda', 'Alimentación', 'Transporte', 'Salud',
  'Entretenimiento', 'Educación', 'Ropa', 'Servicios', 'Otros'
];

export interface FiltrosGastos {
  busqueda: string;
  categoria: string;
  estado: EstadoGasto | '';
  montoMin: number | null;
  montoMax: number | null;
  fechaInicio: string;
  fechaFin: string;
  ordenarPor: 'fecha' | 'descripcion' | 'categoria' | 'monto' | 'estado';
  direccion: 'asc' | 'desc';
}

export interface FiltrosDeudas {
  busqueda: string;
  estado: EstadoDeuda | '';
  montoMin: number | null;
  montoMax: number | null;
  ordenarPor: 'nombre' | 'monto_total' | 'cuotas_pagadas' | 'cuotas_totales' | 'estado' | 'created_at';
  direccion: 'asc' | 'desc';
}

export const FILTROS_GASTOS_DEFAULT: FiltrosGastos = {
  busqueda: '',
  categoria: '',
  estado: '',
  montoMin: null,
  montoMax: null,
  fechaInicio: '',
  fechaFin: '',
  ordenarPor: 'fecha',
  direccion: 'desc'
};

export const FILTROS_DEUDAS_DEFAULT: FiltrosDeudas = {
  busqueda: '',
  estado: '',
  montoMin: null,
  montoMax: null,
  ordenarPor: 'created_at',
  direccion: 'desc'
};

export interface PresupuestoCategoria {
  categoria: string;
  monto_asignado: number;
}

export interface Presupuesto {
  id?: number;
  nombre: string;
  mes: number;
  anio: number;
  monto_total: number;
  created_at?: string;
}

export interface PresupuestoDetalle extends Presupuesto {
  categorias: PresupuestoCategoria[];
  total_gastado: number;
  detalle_por_categoria: {
    categoria: string;
    asignado: number;
    gastado: number;
    porcentaje: number;
    estado: 'bajo' | 'alerta' | 'excedido';
  }[];
}

export interface FiltrosPresupuestos {
  busqueda: string;
  mes: number | '';
  anio: number | '';
  ordenarPor: 'nombre' | 'mes' | 'anio' | 'monto_total' | 'created_at';
  direccion: 'asc' | 'desc';
}

export const FILTROS_PRESUPUESTOS_DEFAULT: FiltrosPresupuestos = {
  busqueda: '',
  mes: '',
  anio: '',
  ordenarPor: 'created_at',
  direccion: 'desc'
};

export interface ObjetivoFinanciero {
  id?: number;
  nombre: string;
  monto_objetivo: number;
  monto_actual: number;
  fecha_limite: string;
  icono: string;
  estado: 'activo' | 'completado' | 'cancelado';
  created_at?: string;
}

export interface Activo {
  id?: number;
  nombre: string;
  tipo: 'efectivo' | 'inversion' | 'propiedad' | 'vehiculo' | 'otro';
  valor: number;
  fecha: string;
  notas: string;
  created_at?: string;
}

export interface Ingreso {
  id?: number;
  fecha: string;
  descripcion: string;
  monto: number;
  categoria: string;
  mes: number;
  anio: number;
  created_at?: string;
}

export interface Habito {
  id?: number;
  nombre: string;
  tipo: 'ahorro' | 'gasto_cero' | 'presupuesto' | 'personalizado';
  meta_dias: number;
  dias_cumplidos: number;
  fecha_inicio: string;
  activo: number;
  created_at?: string;
}

export interface Logro {
  id?: number;
  nombre: string;
  descripcion: string;
  icono: string;
  desbloqueado: number;
  fecha_desbloqueo: string | null;
  created_at?: string;
}
