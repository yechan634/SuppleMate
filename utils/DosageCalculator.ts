// Dosage recommendation utility based on gender and weight
export type Gender = 'male' | 'female' | 'other' | 'prefer-not-to-say';

export interface PersonalInfo {
  gender: Gender;
  weight: number; // in kg
}

export interface DosageRange {
  min: number;
  max: number;
  unit: string;
  description: string;
}

export interface SupplementDosageInfo {
  name: string;
  male: {
    light: DosageRange;    // < 70kg
    medium: DosageRange;   // 70-90kg
    heavy: DosageRange;    // > 90kg
  };
  female: {
    light: DosageRange;    // < 60kg
    medium: DosageRange;   // 60-80kg
    heavy: DosageRange;    // > 80kg
  };
  notes?: string;
}

// Comprehensive dosage database for common supplements
export const SUPPLEMENT_DOSAGES: { [key: string]: SupplementDosageInfo } = {
  'vitamin d': {
    name: 'Vitamin D',
    male: {
      light: { min: 1000, max: 2000, unit: 'IU', description: 'Light weight male' },
      medium: { min: 2000, max: 3000, unit: 'IU', description: 'Medium weight male' },
      heavy: { min: 3000, max: 4000, unit: 'IU', description: 'Heavy weight male' }
    },
    female: {
      light: { min: 800, max: 1500, unit: 'IU', description: 'Light weight female' },
      medium: { min: 1500, max: 2500, unit: 'IU', description: 'Medium weight female' },
      heavy: { min: 2500, max: 3500, unit: 'IU', description: 'Heavy weight female' }
    },
    notes: 'Higher doses may be needed in winter or for deficiency'
  },
  'vitamin c': {
    name: 'Vitamin C',
    male: {
      light: { min: 500, max: 1000, unit: 'mg', description: 'Light weight male' },
      medium: { min: 1000, max: 1500, unit: 'mg', description: 'Medium weight male' },
      heavy: { min: 1500, max: 2000, unit: 'mg', description: 'Heavy weight male' }
    },
    female: {
      light: { min: 400, max: 800, unit: 'mg', description: 'Light weight female' },
      medium: { min: 800, max: 1200, unit: 'mg', description: 'Medium weight female' },
      heavy: { min: 1200, max: 1600, unit: 'mg', description: 'Heavy weight female' }
    }
  },
  'vitamin b12': {
    name: 'Vitamin B12',
    male: {
      light: { min: 50, max: 100, unit: 'mcg', description: 'Light weight male' },
      medium: { min: 100, max: 250, unit: 'mcg', description: 'Medium weight male' },
      heavy: { min: 250, max: 500, unit: 'mcg', description: 'Heavy weight male' }
    },
    female: {
      light: { min: 25, max: 100, unit: 'mcg', description: 'Light weight female' },
      medium: { min: 100, max: 200, unit: 'mcg', description: 'Medium weight female' },
      heavy: { min: 200, max: 400, unit: 'mcg', description: 'Heavy weight female' }
    }
  },
  'omega-3': {
    name: 'Omega-3',
    male: {
      light: { min: 1000, max: 1500, unit: 'mg', description: 'Light weight male' },
      medium: { min: 1500, max: 2500, unit: 'mg', description: 'Medium weight male' },
      heavy: { min: 2500, max: 3500, unit: 'mg', description: 'Heavy weight male' }
    },
    female: {
      light: { min: 800, max: 1200, unit: 'mg', description: 'Light weight female' },
      medium: { min: 1200, max: 2000, unit: 'mg', description: 'Medium weight female' },
      heavy: { min: 2000, max: 3000, unit: 'mg', description: 'Heavy weight female' }
    }
  },
  'magnesium': {
    name: 'Magnesium',
    male: {
      light: { min: 300, max: 400, unit: 'mg', description: 'Light weight male' },
      medium: { min: 400, max: 500, unit: 'mg', description: 'Medium weight male' },
      heavy: { min: 500, max: 600, unit: 'mg', description: 'Heavy weight male' }
    },
    female: {
      light: { min: 250, max: 300, unit: 'mg', description: 'Light weight female' },
      medium: { min: 300, max: 400, unit: 'mg', description: 'Medium weight female' },
      heavy: { min: 400, max: 500, unit: 'mg', description: 'Heavy weight female' }
    }
  },
  'calcium': {
    name: 'Calcium',
    male: {
      light: { min: 800, max: 1000, unit: 'mg', description: 'Light weight male' },
      medium: { min: 1000, max: 1200, unit: 'mg', description: 'Medium weight male' },
      heavy: { min: 1200, max: 1500, unit: 'mg', description: 'Heavy weight male' }
    },
    female: {
      light: { min: 900, max: 1100, unit: 'mg', description: 'Light weight female' },
      medium: { min: 1100, max: 1300, unit: 'mg', description: 'Medium weight female' },
      heavy: { min: 1300, max: 1600, unit: 'mg', description: 'Heavy weight female' }
    },
    notes: 'Women may need higher doses, especially post-menopause'
  },
  'zinc': {
    name: 'Zinc',
    male: {
      light: { min: 8, max: 15, unit: 'mg', description: 'Light weight male' },
      medium: { min: 15, max: 20, unit: 'mg', description: 'Medium weight male' },
      heavy: { min: 20, max: 25, unit: 'mg', description: 'Heavy weight male' }
    },
    female: {
      light: { min: 6, max: 10, unit: 'mg', description: 'Light weight female' },
      medium: { min: 10, max: 15, unit: 'mg', description: 'Medium weight female' },
      heavy: { min: 15, max: 20, unit: 'mg', description: 'Heavy weight female' }
    }
  },
  'iron': {
    name: 'Iron',
    male: {
      light: { min: 8, max: 15, unit: 'mg', description: 'Light weight male' },
      medium: { min: 15, max: 20, unit: 'mg', description: 'Medium weight male' },
      heavy: { min: 20, max: 25, unit: 'mg', description: 'Heavy weight male' }
    },
    female: {
      light: { min: 15, max: 25, unit: 'mg', description: 'Light weight female' },
      medium: { min: 25, max: 35, unit: 'mg', description: 'Medium weight female' },
      heavy: { min: 35, max: 45, unit: 'mg', description: 'Heavy weight female' }
    },
    notes: 'Women typically need higher doses due to menstruation'
  },
  'probiotics': {
    name: 'Probiotics',
    male: {
      light: { min: 1, max: 5, unit: 'billion CFU', description: 'Light weight male' },
      medium: { min: 5, max: 15, unit: 'billion CFU', description: 'Medium weight male' },
      heavy: { min: 15, max: 25, unit: 'billion CFU', description: 'Heavy weight male' }
    },
    female: {
      light: { min: 1, max: 5, unit: 'billion CFU', description: 'Light weight female' },
      medium: { min: 5, max: 15, unit: 'billion CFU', description: 'Medium weight female' },
      heavy: { min: 15, max: 25, unit: 'billion CFU', description: 'Heavy weight female' }
    }
  },
  'turmeric': {
    name: 'Turmeric',
    male: {
      light: { min: 500, max: 750, unit: 'mg', description: 'Light weight male' },
      medium: { min: 750, max: 1000, unit: 'mg', description: 'Medium weight male' },
      heavy: { min: 1000, max: 1500, unit: 'mg', description: 'Heavy weight male' }
    },
    female: {
      light: { min: 400, max: 600, unit: 'mg', description: 'Light weight female' },
      medium: { min: 600, max: 800, unit: 'mg', description: 'Medium weight female' },
      heavy: { min: 800, max: 1200, unit: 'mg', description: 'Heavy weight female' }
    }
  }
};

// Normalize supplement names for matching
export const normalizeSupplementName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[-_]/g, '')
    .replace(/vitamin\s*d3?/g, 'vitamin d')
    .replace(/vitamin\s*c/g, 'vitamin c')
    .replace(/vitamin\s*b12/g, 'vitamin b12')
    .replace(/omega[\s-]*3/g, 'omega-3')
    .replace(/fish[\s]*oil/g, 'omega-3')
    .replace(/curcumin/g, 'turmeric')
    .replace(/ascorbic\s*acid/g, 'vitamin c')
    .replace(/cobalamin/g, 'vitamin b12')
    .replace(/cholecalciferol/g, 'vitamin d')
    .replace(/ergocalciferol/g, 'vitamin d');
};

// Get weight category based on gender and weight
export const getWeightCategory = (gender: Gender, weight: number): 'light' | 'medium' | 'heavy' => {
  if (gender === 'male') {
    if (weight < 70) return 'light';
    if (weight <= 90) return 'medium';
    return 'heavy';
  } else {
    // For female, other, or prefer-not-to-say, use female ranges as default
    if (weight < 60) return 'light';
    if (weight <= 80) return 'medium';
    return 'heavy';
  }
};

// Calculate recommended dosage for a supplement
export const calculateRecommendedDosage = (
  supplementName: string,
  personalInfo: PersonalInfo
): { dosage: string; range: DosageRange; notes?: string } | null => {
  const normalizedName = normalizeSupplementName(supplementName);
  const supplementInfo = SUPPLEMENT_DOSAGES[normalizedName];
  
  if (!supplementInfo) {
    return null; // No dosage info available for this supplement
  }

  const genderData = personalInfo.gender === 'male' ? supplementInfo.male : supplementInfo.female;
  const weightCategory = getWeightCategory(personalInfo.gender, personalInfo.weight);
  const range = genderData[weightCategory];

  // Calculate a specific dosage (midpoint of the range)
  const midpoint = Math.round((range.min + range.max) / 2);
  const dosage = `${midpoint} ${range.unit}`;

  return {
    dosage,
    range,
    notes: supplementInfo.notes
  };
};

// Get all available dosage ranges for a supplement (for showing options)
export const getSupplementDosageRanges = (supplementName: string): SupplementDosageInfo | null => {
  const normalizedName = normalizeSupplementName(supplementName);
  return SUPPLEMENT_DOSAGES[normalizedName] || null;
};

// Dosage validation utilities
export interface DosageValidationResult {
  isValid: boolean;
  isAboveRange: boolean;
  isBelowRange: boolean;
  enteredValue: number;
  recommendedRange: DosageRange;
  supplementInfo: SupplementDosageInfo;
}

// Parse dosage string to extract numeric value and unit
export const parseDosage = (dosageString: string): { value: number; unit: string } | null => {
  if (!dosageString || typeof dosageString !== 'string') {
    return null;
  }

  // Remove extra spaces and convert to lowercase for easier parsing
  const cleaned = dosageString.trim().toLowerCase();
  
  // Match patterns like "1000 mg", "2000IU", "5 billion CFU", etc.
  const patterns = [
    /^(\d+(?:\.\d+)?)\s*(billion\s+cfu|million\s+cfu|cfu|mg|mcg|g|iu|units?)$/i,
    /^(\d+(?:\.\d+)?)\s*(mg|mcg|g|iu)$/i,
    /^(\d+(?:\.\d+)?)$/  // Just number, assume default unit
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2] || '';
      
      // Normalize units
      let normalizedUnit = unit.toLowerCase();
      if (normalizedUnit.includes('billion') && normalizedUnit.includes('cfu')) {
        normalizedUnit = 'billion CFU';
      } else if (normalizedUnit.includes('million') && normalizedUnit.includes('cfu')) {
        normalizedUnit = 'million CFU';
      } else if (normalizedUnit === 'units' || normalizedUnit === 'unit') {
        normalizedUnit = 'IU'; // Assume IU for generic units
      }
      
      return { value, unit: normalizedUnit };
    }
  }

  return null;
};

// Check if entered dosage is within recommended range
export const validateDosageRange = (
  enteredDosage: string,
  supplementName: string,
  personalInfo: PersonalInfo
): DosageValidationResult | null => {
  // Get supplement info
  const supplementInfo = getSupplementDosageRanges(supplementName);
  if (!supplementInfo) {
    return null; // No dosage info available for this supplement
  }

  // Parse entered dosage
  const parsedDosage = parseDosage(enteredDosage);
  if (!parsedDosage) {
    return null; // Unable to parse dosage
  }

  // Get recommended range for user's profile
  const genderData = personalInfo.gender === 'male' ? supplementInfo.male : supplementInfo.female;
  const weightCategory = getWeightCategory(personalInfo.gender, personalInfo.weight);
  const recommendedRange = genderData[weightCategory];

  // Convert units if necessary (basic unit conversion)
  let enteredValue = parsedDosage.value;
  const enteredUnit = parsedDosage.unit.toLowerCase();
  const recommendedUnit = recommendedRange.unit.toLowerCase();

  // Handle unit conversions
  if (enteredUnit !== recommendedUnit) {
    // Convert between mg and g
    if (enteredUnit === 'g' && recommendedUnit === 'mg') {
      enteredValue = enteredValue * 1000;
    } else if (enteredUnit === 'mg' && recommendedUnit === 'g') {
      enteredValue = enteredValue / 1000;
    }
    // Convert between mcg and mg
    else if (enteredUnit === 'mcg' && recommendedUnit === 'mg') {
      enteredValue = enteredValue / 1000;
    } else if (enteredUnit === 'mg' && recommendedUnit === 'mcg') {
      enteredValue = enteredValue * 1000;
    }
    // Convert million CFU to billion CFU
    else if (enteredUnit === 'million cfu' && recommendedUnit === 'billion cfu') {
      enteredValue = enteredValue / 1000;
    } else if (enteredUnit === 'billion cfu' && recommendedUnit === 'million cfu') {
      enteredValue = enteredValue * 1000;
    }
    // If units don't match and can't convert, assume they're different supplements or return null
    else if (enteredUnit !== recommendedUnit) {
      return null;
    }
  }

  // Check if dosage is within range
  const isAboveRange = enteredValue > recommendedRange.max;
  const isBelowRange = enteredValue < recommendedRange.min;
  const isValid = !isAboveRange && !isBelowRange;

  return {
    isValid,
    isAboveRange,
    isBelowRange,
    enteredValue,
    recommendedRange,
    supplementInfo
  };
};
