interface SortHeaderProps {
  campo: string;
  label: string;
  ordenActual: string;
  direccion: 'asc' | 'desc';
  onSort: (campo: string) => void;
  align?: 'left' | 'center' | 'right';
}

export default function SortHeader({ campo, label, ordenActual, direccion, onSort, align = 'left' }: SortHeaderProps) {
  const activo = ordenActual === campo;

  const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

  let flecha = '↕';
  if (activo) {
    flecha = direccion === 'asc' ? '↑' : '↓';
  }

  const ariaSort = activo ? (direccion === 'asc' ? 'ascending' : 'descending') : 'none';

  return (
    <th
      className={`px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 ${alignClass}`}
      aria-sort={ariaSort}
    >
      <button
        onClick={() => onSort(campo)}
        className={`inline-flex items-center gap-1 w-full ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''} cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded px-1 py-0.5 -mx-1 -my-0.5`}
      >
        <span>{label}</span>
        <span className={`text-xs ${activo ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} aria-hidden="true">{flecha}</span>
      </button>
    </th>
  );
}
