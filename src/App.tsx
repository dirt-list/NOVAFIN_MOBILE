import { useState, useEffect } from 'react';
import { useDatabase } from './hooks/useDatabase';
import Dashboard from './components/Dashboard';
import GastosMes from './components/GastosMes';
import Deudas from './components/Deudas';
import Presupuestos from './components/Presupuestos';
import Objetivos from './components/Objetivos';
import Patrimonio from './components/Patrimonio';
import FlujoCaja from './components/FlujoCaja';
import Habitos from './components/Habitos';
import DashboardEjecutivo from './components/DashboardEjecutivo';
import Inteligencia from './components/Inteligencia';
import Reportes from './components/Reportes';
import ResumenAnual from './components/ResumenAnual';
import { LockScreen } from './components/LockScreen';
import { SettingsModal } from './components/SettingsModal';
import './index.css';

const STORAGE_KEY = 'novafin-dark';

const NAV_ITEMS = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'gastos', label: '💳 Gastos' },
  { id: 'deudas', label: '🏦 Deudas' },
  { id: 'presupuestos', label: '📋 Presupuestos' },
  { id: 'objetivos', label: '🎯 Objetivos' },
  { id: 'patrimonio', label: '🏠 Patrimonio' },
  { id: 'flujo', label: '💵 Flujo' },
  { id: 'anual', label: '📅 Anual' },
  { id: 'ejecutivo', label: '📈 Ejecutivo' },
  { id: 'inteligencia', label: '🤖 IA' },
  { id: 'reportes', label: '📄 Reportes' },
  { id: 'habitos', label: '✅ Hábitos' },
];

const SECTIONS: Record<string, { icon: string; color: string }> = {
  dashboard: { icon: '📊', color: 'from-blue-500 to-blue-600' },
  gastos: { icon: '💳', color: 'from-red-500 to-red-600' },
  deudas: { icon: '🏦', color: 'from-yellow-500 to-yellow-600' },
  presupuestos: { icon: '📋', color: 'from-green-500 to-green-600' },
  objetivos: { icon: '🎯', color: 'from-purple-500 to-purple-600' },
  patrimonio: { icon: '🏠', color: 'from-teal-500 to-teal-600' },
  flujo: { icon: '💵', color: 'from-cyan-500 to-cyan-600' },
  anual: { icon: '📅', color: 'from-indigo-500 to-indigo-600' },
  ejecutivo: { icon: '📈', color: 'from-orange-500 to-orange-600' },
  inteligencia: { icon: '🤖', color: 'from-pink-500 to-pink-600' },
  reportes: { icon: '📄', color: 'from-slate-500 to-slate-600' },
  habitos: { icon: '✅', color: 'from-lime-500 to-lime-600' },
};

function renderView(vista: string, mes: number, anio: number, setMes: (m: number) => void, setAnio: (a: number) => void) {
  switch (vista) {
    case 'dashboard': return <Dashboard mes={mes} anio={anio} onMesChange={setMes} onAnioChange={setAnio} />;
    case 'gastos': return <GastosMes mes={mes} anio={anio} onMesChange={setMes} onAnioChange={setAnio} />;
    case 'deudas': return <Deudas />;
    case 'presupuestos': return <Presupuestos mes={mes} anio={anio} onMesChange={setMes} onAnioChange={setAnio} />;
    case 'objetivos': return <Objetivos />;
    case 'patrimonio': return <Patrimonio />;
    case 'flujo': return <FlujoCaja mes={mes} anio={anio} onMesChange={setMes} onAnioChange={setAnio} />;
    case 'anual': return <ResumenAnual anio={anio} />;
    case 'ejecutivo': return <DashboardEjecutivo />;
    case 'inteligencia': return <Inteligencia />;
    case 'reportes': return <Reportes />;
    case 'habitos': return <Habitos />;
    default: return null;
  }
}

function App() {
  const [vistaActual, setVistaActual] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [locked, setLocked] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const { isReady, error } = useDatabase();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem(STORAGE_KEY, String(darkMode));
  }, [darkMode]);

  function toggleDarkMode() {
    setDarkMode(prev => !prev);
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error de inicialización</h2>
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Inicializando NovaFin AI...</p>
        </div>
      </div>
    );
  }

  if (isReady && locked) {
    return <LockScreen onUnlock={() => setLocked(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-1 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shrink-0"
              aria-label="Menú"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white truncate">NovaFin AI</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-gray-500 dark:text-gray-400">v1.0.0</span>
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-1.5 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
              aria-label="Configuración"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex max-w-7xl mx-auto px-4 pb-2 gap-1 overflow-x-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setVistaActual(item.id)}
              className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
                vistaActual === item.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Mobile menu backdrop */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden fixed top-[52px] left-0 right-0 bg-white dark:bg-gray-800 shadow-lg border-t dark:border-gray-700 z-30">
          <div className="max-w-7xl mx-auto px-4 py-2 grid grid-cols-3 gap-2">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => { setVistaActual(item.id); setMenuOpen(false); }}
                className={`px-2 py-2 text-sm rounded-lg transition-colors ${
                  vistaActual === item.id
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {renderView(vistaActual, mes, anio, setMes, setAnio) ?? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">NovaFin AI</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Seleccioná una sección del menú para comenzar.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(SECTIONS).map(([id, section]) => (
                <button
                  key={id}
                  onClick={() => setVistaActual(id)}
                  className={`p-6 bg-gradient-to-br ${section.color} text-white rounded-xl text-center hover:opacity-90 transition-opacity`}
                >
                  <span className="text-3xl block mb-2">{section.icon}</span>
                  <span className="font-medium text-sm">{id.charAt(0).toUpperCase() + id.slice(1)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
    </div>
  );
}

export default App;
