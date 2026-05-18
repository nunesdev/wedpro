export interface MasterGuest {
  id: string;
  name: string;
  table?: string;
  partySize: number;
  checkedInAt: number | null;
}

export interface CheckinSnapshot {
  guests: MasterGuest[];
}
