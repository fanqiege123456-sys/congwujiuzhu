export enum PetStatus {
  NEEDS_RESCUE = 'NEEDS_RESCUE', // Red Icon
  RESCUED = 'RESCUED',           // Green Icon
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface AuditLog {
  id: string;
  userId: string; // Simplified for demo
  action: 'VERIFY' | 'FLAG_FAKE';
  comment: string;
  timestamp: number;
}

export interface UserProfile {
  nickname: string;
  avatarUrl: string;
  openId?: string;
  displayId?: string;
}

export interface Pet {
  id: string;
  description: string;
  location: Coordinates;
  address?: string; // Reverse geocoded or user provided
  status: PetStatus;
  auditStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  reporterAvatar?: string;
  images: string[]; // Base64 strings or file paths
  videoUrl?: string; // Object URL, Base64, or temp file path
  timestamp: number;
  reporterName: string;
  reporterOpenId?: string;
  rescueDetails?: string;
  audits: AuditLog[];
  aiAnalysis?: string; // Stores Gemini/AI analysis
}

export interface MapViewProps {
  userLocation: Coordinates | null;
  pets: Pet[];
  onPetClick: (pet: Pet) => void;
  onMapClick?: (coords: Coordinates) => void;
}
