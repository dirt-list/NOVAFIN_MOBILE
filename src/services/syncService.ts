export class SyncService {
  private baseUrl: string;

  constructor(ip: string, port = 3030) {
    this.baseUrl = `http://${ip}:${port}`;
  }

  async testConnection(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/info`, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getServerInfo(): Promise<{ app: string; version: string; tables: number } | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/info`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async pullBackup(): Promise<string | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/backup`, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) return null;
      return await res.text();
    } catch {
      return null;
    }
  }

  async pushBackup(backup: object): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backup }),
        signal: AbortSignal.timeout(30000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const SYNC_PORT = 3030;
