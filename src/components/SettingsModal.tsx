import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { db } from '../services/database';
import { exportService } from '../services/exportService';
import { Dialog } from '@capacitor/dialog';
import { SyncService } from '../services/syncService';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export function SettingsModal({ open, onClose, darkMode, onToggleDarkMode }: SettingsModalProps) {
  const [hasPassword, setHasPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [backupLoading, setBackupLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [syncIP, setSyncIP] = useState(() => localStorage.getItem('novafin-sync-ip') || '');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [syncLoading, setSyncLoading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      db.hasPassword().then(setHasPassword);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
    }
  }, [open]);

  if (!open) return null;

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (hasPassword && oldPassword) {
      const ok = await db.verifyPassword(oldPassword);
      if (!ok) { setError('Clave actual incorrecta'); return; }
    }

    if (newPassword.length < 4) {
      setError('La clave debe tener al menos 4 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las claves no coinciden');
      return;
    }

    await db.setPassword(newPassword);
    setHasPassword(true);
    setSuccess('Clave guardada correctamente');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }

  async function handleRemovePassword() {
    if (!oldPassword) { setError('Ingresá tu clave actual'); return; }
    const ok = await db.verifyPassword(oldPassword);
    if (!ok) { setError('Clave incorrecta'); return; }
    await db.removePassword();
    setHasPassword(false);
    setSuccess('Clave eliminada');
    setOldPassword('');
  }

  async function handleExportBackup() {
    setBackupLoading(true);
    setError('');
    try {
      const json = await db.exportBackup();
      await exportService.exportBackup(json);
      setSuccess('Copia de seguridad exportada');
    } catch {
      setError('Error al exportar la copia');
    }
    setBackupLoading(false);
  }

  async function handleImportBackup() {
    setError('');
    setSuccess('');
    try {
      const confirm = await Dialog.confirm({
        title: 'Importar copia de seguridad',
        message: 'Esto reemplazará TODOS los datos actuales. ¿Continuar?',
        okButtonTitle: 'Importar',
        cancelButtonTitle: 'Cancelar',
      });
      if (!confirm.value) return;
      setImportLoading(true);
      fileInputRef.current?.click();
    } catch {
      setError('Error al preparar la importación');
      setImportLoading(false);
    }
  }

  async function handleFileImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) { setImportLoading(false); return; }
    setError('');
    setSuccess('');
    try {
      const text = await file.text();
      await db.importBackup(text);
      setSuccess('Copia importada correctamente. Reiniciá la app.');
    } catch (err) {
      setError(`Error al importar: ${err instanceof Error ? err.message : 'formato inválido'}`);
    }
    setImportLoading(false);
    e.target.value = '';
  }

  async function handleTestSync() {
    if (!syncIP.trim()) { setError('Ingresá la IP del escritorio'); return; }
    setSyncStatus('testing');
    setError('');
    setSuccess('');
    const sync = new SyncService(syncIP.trim());
    const ok = await sync.testConnection();
    if (ok) {
      setSyncStatus('connected');
      localStorage.setItem('novafin-sync-ip', syncIP.trim());
      setSuccess('Conectado al escritorio');
    } else {
      setSyncStatus('error');
      setError('No se pudo conectar. Verificá la IP y que NovaFin esté abierto en el escritorio.');
    }
  }

  async function handleSyncPull() {
    if (!syncIP.trim()) { setError('Ingresá la IP del escritorio'); return; }
    const confirm = await Dialog.confirm({
      title: 'Descargar datos del escritorio',
      message: 'Esto reemplazará TODOS los datos actuales del celular. ¿Continuar?',
      okButtonTitle: 'Descargar',
      cancelButtonTitle: 'Cancelar',
    });
    if (!confirm.value) return;
    setSyncLoading(true);
    setError('');
    setSuccess('');
    try {
      const sync = new SyncService(syncIP.trim());
      const json = await sync.pullBackup();
      if (!json) { setError('Error al descargar backup'); setSyncLoading(false); return; }
      await db.importBackup(json);
      setSuccess('Datos descargados correctamente. Reiniciá la app.');
    } catch {
      setError('Error durante la sincronización');
    }
    setSyncLoading(false);
  }

  async function handleSyncPush() {
    if (!syncIP.trim()) { setError('Ingresá la IP del escritorio'); return; }
    const confirm = await Dialog.confirm({
      title: 'Subir datos al escritorio',
      message: 'Esto reemplazará TODOS los datos del escritorio. ¿Continuar?',
      okButtonTitle: 'Subir',
      cancelButtonTitle: 'Cancelar',
    });
    if (!confirm.value) return;
    setSyncLoading(true);
    setError('');
    setSuccess('');
    try {
      const json = await db.exportBackup();
      const backup = JSON.parse(json);
      const sync = new SyncService(syncIP.trim());
      const ok = await sync.pushBackup(backup);
      if (ok) {
        setSuccess('Datos subidos correctamente al escritorio');
      } else {
        setError('Error al subir datos');
      }
    } catch {
      setError('Error durante la sincronización');
    }
    setSyncLoading(false);
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-4 sm:px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Configuración</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-lg text-sm">{success}</div>
          )}

          <section>
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
              🔒 Seguridad
            </h3>
            <form onSubmit={handleSetPassword} className="space-y-3">
              {hasPassword && (
                <input
                  type="password"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm"
                  placeholder="Clave actual"
                />
              )}
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm"
                placeholder={hasPassword ? 'Nueva clave' : 'Nueva clave (mín. 4 caracteres)'}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm"
                placeholder="Confirmar clave"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
                >
                  {hasPassword ? 'Cambiar clave' : 'Establecer clave'}
                </button>
                {hasPassword && (
                  <button
                    type="button"
                    onClick={handleRemovePassword}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
                  >
                    Eliminar clave
                  </button>
                )}
              </div>
            </form>
          </section>

          <hr className="dark:border-gray-700" />

          <section>
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
              🎨 Apariencia
            </h3>
            <button
              onClick={onToggleDarkMode}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="text-sm text-gray-800 dark:text-gray-100">
                {darkMode ? '🌙 Modo oscuro' : '☀️ Modo claro'}
              </span>
              <div className={`relative w-10 h-5 rounded-full transition-colors ${darkMode ? 'bg-blue-500' : 'bg-gray-300'}`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-5' : ''}`} />
              </div>
            </button>
          </section>

          <hr className="dark:border-gray-700" />

          <section>
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
              💾 Copia de seguridad
            </h3>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              className="hidden"
              onChange={handleFileImport}
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportBackup}
                disabled={backupLoading}
                className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50"
              >
                {backupLoading ? 'Exportando...' : 'Exportar copia'}
              </button>
              <button
                onClick={handleImportBackup}
                disabled={importLoading}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50"
              >
                {importLoading ? 'Importando...' : 'Importar copia'}
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Archivo .json exportado desde NovaFin (escritorio o celular)
            </p>
          </section>

          <hr className="dark:border-gray-700" />

          <section>
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
              🔄 Sincronizar con escritorio
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={syncIP}
                  onChange={e => setSyncIP(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm"
                  placeholder="IP del escritorio (ej: 192.168.1.100)"
                />
                <button
                  onClick={handleTestSync}
                  disabled={syncStatus === 'testing'}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
                >
                  {syncStatus === 'testing' ? '...' : 'Probar'}
                </button>
              </div>
              {syncStatus === 'connected' && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  Conectado al escritorio (puerto 3030)
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleSyncPull}
                  disabled={syncLoading || syncStatus !== 'connected'}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 disabled:opacity-50"
                >
                  {syncLoading ? 'Sincronizando...' : '⬇ Descargar del escritorio'}
                </button>
                <button
                  onClick={handleSyncPush}
                  disabled={syncLoading || syncStatus !== 'connected'}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 disabled:opacity-50"
                >
                  {syncLoading ? 'Sincronizando...' : '⬆ Subir al escritorio'}
                </button>
              </div>
            </div>
          </section>

          <hr className="dark:border-gray-700" />

          <section>
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">ℹ️ Acerca de</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              NovaFin AI v1.0.0<br />
              App de finanzas personales con IA<br />
              Datos almacenados localmente en el dispositivo
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
