// Drug Interaction Database
// This contains common drug-drug and drug-supplement interactions

export type InteractionSeverity = 'mild' | 'strong';

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: InteractionSeverity;
  description: string;
}

// Normalize drug names for matching (lowercase, remove spaces, common abbreviations)
export const normalizeDrugName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[-_]/g, '')
    .replace(/vitamin\s*d3?/g, 'vitd')
    .replace(/vitamin\s*d/g, 'vitd')
    .replace(/vitamin\s*e/g, 'vitamine')
    .replace(/vitamin\s*c/g, 'vitc')
    .replace(/vitamin\s*b12/g, 'vitb12')
    .replace(/vitamin\s*b6/g, 'vitb6')
    .replace(/vitamin\s*b/g, 'vitb')
    .replace(/vitamin/g, 'vit')
    .replace(/omega[\s-]*3/g, 'omega3')
    .replace(/coq[\s-]*10/g, 'coenzyme q10')
    .replace(/coenzyme[\s]*q[\s]*10/g, 'coenzyme q10')
    .replace(/b[\s-]*12/g, 'vitb12')
    .replace(/d[\s-]*3/g, 'vitd')
    .replace(/magnesium/g, 'mg')
    .replace(/calcium/g, 'ca')
    .replace(/potassium/g, 'potassium')
    .replace(/iron/g, 'iron')
    .replace(/zinc/g, 'zinc')
    .replace(/fish[\s]*oil/g, 'omega3')
    .replace(/st\.?\s*john'?s\s*wort/g, 'stjohnswort')
    .replace(/milk[\s]*thistle/g, 'milkthistle')
    .replace(/ginkgo[\s]*biloba/g, 'ginkgo')
    .replace(/turmeric/g, 'turmeric')
    .replace(/curcumin/g, 'turmeric')
    .replace(/garlic/g, 'garlic')
    .replace(/ginger/g, 'ginger')
    .replace(/ginseng/g, 'ginseng')
    .replace(/echinacea/g, 'echinacea')
    .replace(/biotin/g, 'biotin')
    .replace(/chromium/g, 'chromium')
    .replace(/niacin/g, 'niacin')
    .replace(/tryptophan/g, 'tryptophan');
};

// Drug interaction database
export const DRUG_INTERACTIONS: DrugInteraction[] = [
  // Blood thinners (Warfarin) interactions
  {
    drug1: 'warfarin',
    drug2: 'omega3',
    severity: 'mild',
    description: 'Omega-3 may increase bleeding risk when taken with warfarin'
  },
  {
    drug1: 'warfarin',
    drug2: 'vitamine',
    severity: 'strong',
    description: 'Vitamin E can significantly increase bleeding risk with warfarin'
  },

  {
    drug1: 'iron',
    drug2: 'ca',
    severity: 'mild',
    description: 'Calcium can reduce iron absorption, take separately'
  },
  {
    drug1: 'zinc',
    drug2: 'ca',
    severity: 'mild',
    description: 'Calcium can reduce zinc absorption, take separately'
  },
  {
    drug1: 'zinc',
    drug2: 'iron',
    severity: 'mild',
    description: 'Iron and zinc can compete for absorption, take separately'
  },

  {
    drug1: 'ibuprofen',
    drug2: 'omega3',
    severity: 'mild',
    description: 'Omega-3 may increase bleeding risk with NSAIDs'
  },
  
  {
    drug1: 'aspirin',
    drug2: 'omega3',
    severity: 'mild',
    description: 'Omega-3 may increase bleeding risk with aspirin'
  },
];

export interface InteractionResult {
  hasInteractions: boolean;
  severity: InteractionSeverity | null;
  interactions: {
    conflictingDrug: string;
    severity: InteractionSeverity;
    description: string;
  }[];
}

export const checkDrugInteractions = (
  newDrugName: string, 
  existingDrugs: string[]
): InteractionResult => {
  const normalizedNewDrug = normalizeDrugName(newDrugName);
  const normalizedExistingDrugs = existingDrugs.map(normalizeDrugName);
  
  const foundInteractions: {
    conflictingDrug: string;
    severity: InteractionSeverity;
    description: string;
  }[] = [];

  let maxSeverity: InteractionSeverity | null = null;

  // Check each existing drug against the new drug
  for (let i = 0; i < existingDrugs.length; i++) {
    const existingDrug = normalizedExistingDrugs[i];
    const originalExistingDrug = existingDrugs[i];

    // Find interactions in both directions (drug1 -> drug2 and drug2 -> drug1)
    const interactions = DRUG_INTERACTIONS.filter(interaction => 
      (interaction.drug1 === normalizedNewDrug && interaction.drug2 === existingDrug) ||
      (interaction.drug2 === normalizedNewDrug && interaction.drug1 === existingDrug)
    );

    for (const interaction of interactions) {
      foundInteractions.push({
        conflictingDrug: originalExistingDrug,
        severity: interaction.severity,
        description: interaction.description
      });

      // Update max severity (strong > mild)
      if (maxSeverity === null || 
          (interaction.severity === 'strong' && maxSeverity === 'mild')) {
        maxSeverity = interaction.severity;
      }
    }
  }

  return {
    hasInteractions: foundInteractions.length > 0,
    severity: maxSeverity,
    interactions: foundInteractions
  };
};
