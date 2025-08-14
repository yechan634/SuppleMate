import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gender, PersonalInfo } from './DosageCalculator';

export interface UserData {
  id: string;
  fullName: string;
  email: string;
  dateOfBirth?: string;
  weight?: number;
  height?: number;
  gender?: Gender;
  alcohol?: string;
  smoking?: string;
  createdAt?: string;
  lastLogin?: string;
}

// Get user's personal info for dosage calculations
export const getUserPersonalInfo = async (): Promise<PersonalInfo | null> => {
  try {
    const userData = await AsyncStorage.getItem('user');
    if (!userData) {
      return null;
    }

    const user: UserData = JSON.parse(userData);
    
    // Check if we have the required data
    if (!user.gender || !user.weight) {
      return null;
    }

    return {
      gender: user.gender,
      weight: user.weight
    };
  } catch (error) {
    console.error('Error fetching user personal info:', error);
    return null;
  }
};

// Check if user has completed their profile with required info
export const hasRequiredPersonalInfo = async (): Promise<boolean> => {
  const personalInfo = await getUserPersonalInfo();
  return personalInfo !== null;
};
