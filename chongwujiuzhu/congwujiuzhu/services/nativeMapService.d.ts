import { Coordinates } from '../types';
export declare function wgs84ToGcj02(lat: number, lng: number): {
    lat: number;
    lng: number;
};
export declare function getUserLocation(): Promise<Coordinates>;
export declare function chooseLocation(): Promise<Coordinates & {
    name: string;
    address: string;
}>;
export declare function openMap(latitude: number, longitude: number, name?: string): void;
export declare function calculateDistance(from: Coordinates, to: Coordinates): number;
export declare function formatDistance(meters: number): string;
export declare function isWithinRadius(coord: Coordinates, center: Coordinates, radiusMeters: number): boolean;
export declare function getRecommendedZoomLevel(distanceMeters: number): number;
export declare function createMarker(id: number, coords: Coordinates, title: string, emoji?: string): any;
export declare function calculateViewRegion(coords: Coordinates[]): {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
};
declare const _default: {
    getUserLocation: typeof getUserLocation;
    chooseLocation: typeof chooseLocation;
    openMap: typeof openMap;
    calculateDistance: typeof calculateDistance;
    formatDistance: typeof formatDistance;
    isWithinRadius: typeof isWithinRadius;
    getRecommendedZoomLevel: typeof getRecommendedZoomLevel;
    createMarker: typeof createMarker;
    calculateViewRegion: typeof calculateViewRegion;
};
export default _default;
