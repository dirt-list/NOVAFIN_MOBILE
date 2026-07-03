import { LocalNotifications } from '@capacitor/local-notifications';

export class NotificationService {
  async requestPermissions(): Promise<boolean> {
    try {
      const perm = await LocalNotifications.requestPermissions();
      return perm.display === 'granted';
    } catch {
      return false;
    }
  }

  async schedulePagoRecordatorio(gastoId: number, descripcion: string, monto: number, fechaVencimiento: Date): Promise<void> {
    const granted = await this.requestPermissions();
    if (!granted) return;

    await LocalNotifications.schedule({
      notifications: [{
        title: 'Recordatorio de pago',
        body: `${descripcion} - $${monto.toLocaleString('es-AR')}`,
        id: gastoId,
        schedule: { at: fechaVencimiento },
        sound: undefined,
        attachments: undefined,
        actionTypeId: '',
        extra: { gastoId },
      }],
    });
  }

  async cancelRecordatorio(gastoId: number): Promise<void> {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: gastoId }] });
    } catch { }
  }

  async scheduleResumenSemanal(): Promise<void> {
    const granted = await this.requestPermissions();
    if (!granted) return;

    const ahora = new Date();
    const siguienteDomingo = new Date(ahora);
    siguienteDomingo.setDate(ahora.getDate() + ((7 - ahora.getDay()) % 7 || 7));
    siguienteDomingo.setHours(10, 0, 0, 0);

    await LocalNotifications.schedule({
      notifications: [{
        title: 'Resumen Semanal',
        body: 'Revisá tus gastos de la semana',
        id: 9999,
        schedule: {
          at: siguienteDomingo,
          repeats: true,
        },
        sound: undefined,
        attachments: undefined,
        actionTypeId: '',
        extra: { type: 'weekly' },
      }],
    });
  }
}

export const notificaciones = new NotificationService();
