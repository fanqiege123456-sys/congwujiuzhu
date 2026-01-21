import { Pet } from '../types';
export declare const analyzePetReport: (description: string, imageBase64?: string) => Promise<string>;
export declare const auditRescueReport: (pet: Pet) => Promise<string>;
