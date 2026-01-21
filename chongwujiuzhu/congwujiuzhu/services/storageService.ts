import { Pet, Coordinates } from '../types';
import { apiGet } from './apiService';

const STORAGE_KEY = 'rescue_paws_pets_v1';

// Haversine formula to calculate distance in km
export const calculateDistance = (coord1: Coordinates, coord2: Coordinates): number => {
  const R = 6371;
  const dLat = deg2rad(coord2.lat - coord1.lat);
  const dLon = deg2rad(coord2.lng - coord1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(coord1.lat)) *
      Math.cos(deg2rad(coord2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export const getStoredPets = (): Pet[] => {
  try {
    // Use localStorage for web, wx for miniprogram
    const stored = typeof wx !== 'undefined' 
      ? wx.getStorageSync(STORAGE_KEY)
      : localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return typeof stored === 'string' ? JSON.parse(stored) : stored;
    }
  } catch (e) {
    console.error('Failed to parse pets from storage', e);
  }
  return [];
};

export const savePet = (pet: Pet): Pet[] => {
  const pets = getStoredPets();
  const updatedPets = [pet, ...pets];
  try {
    const data = JSON.stringify(updatedPets);
    if (typeof wx !== 'undefined') {
      wx.setStorageSync(STORAGE_KEY, data);
    } else {
      localStorage.setItem(STORAGE_KEY, data);
    }
  } catch (e) {
    console.error('Failed to save pets to storage', e);
  }
  return updatedPets;
};

export const updatePet = (updatedPet: Pet): Pet[] => {
  const pets = getStoredPets();
  const index = pets.findIndex(p => p.id === updatedPet.id);
  if (index !== -1) {
    pets[index] = updatedPet;
    try {
      wx.setStorageSync(STORAGE_KEY, JSON.stringify(pets));
    } catch (e) {
      console.error('Failed to update pets in storage', e);
    }
  }
  return pets;
};

export const seedDummyData = (_center: Coordinates) => {
  // No-op: mock data removed
};

export const syncPetsFromServer = async (): Promise<Pet[]> => {
  try {
    const res = await apiGet('/api/pets');
    const pets = res && res.data ? res.data : [];
    wx.setStorageSync(STORAGE_KEY, JSON.stringify(pets));
    return pets;
  } catch (e) {
    console.error('Failed to sync pets from server', e);
    return getStoredPets();
  }
};
