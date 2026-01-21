export declare enum PetStatus {
    NEEDS_RESCUE = "NEEDS_RESCUE",// Red Icon
    RESCUED = "RESCUED"
}
export interface Coordinates {
    lat: number;
    lng: number;
}
export interface AuditLog {
    id: string;
    userId: string;
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
    address?: string;
    status: PetStatus;
    auditStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
    reporterAvatar?: string;
    images: string[];
    videoUrl?: string;
    timestamp: number;
    reporterName: string;
    reporterOpenId?: string;
    rescueDetails?: string;
    audits: AuditLog[];
    aiAnalysis?: string;
}
export interface MapViewProps {
    userLocation: Coordinates | null;
    pets: Pet[];
    onPetClick: (pet: Pet) => void;
    onMapClick?: (coords: Coordinates) => void;
}
