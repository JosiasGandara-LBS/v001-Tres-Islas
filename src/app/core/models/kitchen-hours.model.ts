export interface KitchenDayHours {
  enabled: boolean;
  start: string; // formato 'HH:mm'
  end: string;   // formato 'HH:mm'
}

export interface KitchenHours {
  // 0: Domingo, 1: Lunes, ..., 6: Sábado
  [day: number]: KitchenDayHours;
}
