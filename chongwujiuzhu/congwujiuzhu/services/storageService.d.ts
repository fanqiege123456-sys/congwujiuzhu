import { Pet, Coordinates } from '../types';
export declare const calculateDistance: (coord1: Coordinates, coord2: Coordinates) => number;
export declare const getStoredPets: () => Pet[];
export declare const savePet: (pet: Pet) => Pet[];
export declare const updatePet: (updatedPet: Pet) => Pet[];
export declare const seedDummyData: (_center: Coordinates) => void;
export declare const syncPetsFromServer: () => Promise<Pet[]>;
