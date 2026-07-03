import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

export class ExportService {
  async exportCSV(csvContent: string, filename: string): Promise<boolean> {
    try {
      const basePath = await Filesystem.getUri({ directory: Directory.Cache, path: '' });
      const filePath = `${filename}.csv`;

      await Filesystem.writeFile({
        path: filePath,
        data: csvContent,
        directory: Directory.Cache,
      });

      const fileUri = `${basePath.uri}/${filePath}`;

      await Share.share({
        title: 'Exportar Gastos',
        text: 'Reporte de gastos NovaFin AI',
        files: [fileUri],
        dialogTitle: 'Compartir reporte',
      });

      return true;
    } catch {
      return false;
    }
  }

  async importCSV(): Promise<string | null> {
    try {
      await Share.share({
        title: 'Importar CSV',
        text: 'La importación de CSV requiere seleccionar archivo manualmente',
      });
      return null;
    } catch {
      return null;
    }
  }

  async exportBackup(dbContent: string): Promise<boolean> {
    try {
      const basePath = await Filesystem.getUri({ directory: Directory.Cache, path: '' });
      const fecha = new Date().toISOString().slice(0, 10);
      const filePath = `novafin-backup-${fecha}.json`;

      const backup = JSON.parse(dbContent);
      const contenido = JSON.stringify(backup);

      await Filesystem.writeFile({
        path: filePath,
        data: contenido,
        directory: Directory.Cache,
      });

      const fileUri = `${basePath.uri}/${filePath}`;

      await Share.share({
        title: 'Copia de seguridad NovaFin AI',
        files: [fileUri],
        dialogTitle: 'Compartir copia de seguridad',
      });

      return true;
    } catch {
      return false;
    }
  }
}

export const exportService = new ExportService();
