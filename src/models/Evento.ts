
export interface Evento {
  id: number;
  nombre: string;
  descripcion?: string | null;
  fecha: string; // Formato YYYY-MM-DD
  hora: string; // Formato HH:MM:SS
  activo: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}
