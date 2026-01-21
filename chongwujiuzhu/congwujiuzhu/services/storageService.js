"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncPetsFromServer = exports.seedDummyData = exports.updatePet = exports.savePet = exports.getStoredPets = exports.calculateDistance = void 0;
const apiService_1 = require("./apiService");
const STORAGE_KEY = 'rescue_paws_pets_v1';
// Haversine formula to calculate distance in km
const calculateDistance = (coord1, coord2) => {
    const R = 6371;
    const dLat = deg2rad(coord2.lat - coord1.lat);
    const dLon = deg2rad(coord2.lng - coord1.lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(coord1.lat)) *
            Math.cos(deg2rad(coord2.lat)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
exports.calculateDistance = calculateDistance;
function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
const getStoredPets = () => {
    try {
        // Use localStorage for web, wx for miniprogram
        const stored = typeof wx !== 'undefined'
            ? wx.getStorageSync(STORAGE_KEY)
            : localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return typeof stored === 'string' ? JSON.parse(stored) : stored;
        }
    }
    catch (e) {
        console.error('Failed to parse pets from storage', e);
    }
    return [];
};
exports.getStoredPets = getStoredPets;
const savePet = (pet) => {
    const pets = (0, exports.getStoredPets)();
    const updatedPets = [pet, ...pets];
    try {
        const data = JSON.stringify(updatedPets);
        if (typeof wx !== 'undefined') {
            wx.setStorageSync(STORAGE_KEY, data);
        }
        else {
            localStorage.setItem(STORAGE_KEY, data);
        }
    }
    catch (e) {
        console.error('Failed to save pets to storage', e);
    }
    return updatedPets;
};
exports.savePet = savePet;
const updatePet = (updatedPet) => {
    const pets = (0, exports.getStoredPets)();
    const index = pets.findIndex(p => p.id === updatedPet.id);
    if (index !== -1) {
        pets[index] = updatedPet;
        try {
            wx.setStorageSync(STORAGE_KEY, JSON.stringify(pets));
        }
        catch (e) {
            console.error('Failed to update pets in storage', e);
        }
    }
    return pets;
};
exports.updatePet = updatePet;
const seedDummyData = (_center) => {
    // No-op: mock data removed
};
exports.seedDummyData = seedDummyData;
const syncPetsFromServer = async () => {
    try {
        const res = await (0, apiService_1.apiGet)('/api/pets');
        const pets = res && res.data ? res.data : [];
        wx.setStorageSync(STORAGE_KEY, JSON.stringify(pets));
        return pets;
    }
    catch (e) {
        console.error('Failed to sync pets from server', e);
        return (0, exports.getStoredPets)();
    }
};
exports.syncPetsFromServer = syncPetsFromServer;
