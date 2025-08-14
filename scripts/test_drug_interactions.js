// Test for the drug interaction checker functionality
// This file tests the checkTwoDrugInteractions function that was implemented

const { normalizeDrugName } = require('../constants/DrugInteractions');

// Test function that mimics the research.tsx implementation
const checkTwoDrugInteractions = (drugName1, drugName2) => {
    const DRUG_INTERACTIONS = [
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
        }
    ];

    const normalizedDrug1 = normalizeDrugName(drugName1);
    const normalizedDrug2 = normalizeDrugName(drugName2);

    const foundInteractions = [];
    let maxSeverity = null;

    // Find interactions between the two drugs
    const interactions = DRUG_INTERACTIONS.filter(interaction =>
        (interaction.drug1 === normalizedDrug1 && interaction.drug2 === normalizedDrug2) ||
        (interaction.drug2 === normalizedDrug1 && interaction.drug1 === normalizedDrug2)
    );

    for (const interaction of interactions) {
        foundInteractions.push({
            conflictingDrug: drugName2,
            severity: interaction.severity,
            description: interaction.description
        });

        // Update max severity (strong > mild)
        if (maxSeverity === null ||
            (interaction.severity === 'strong' && maxSeverity === 'mild')) {
            maxSeverity = interaction.severity;
        }
    }

    return {
        hasInteractions: foundInteractions.length > 0,
        severity: maxSeverity,
        interactions: foundInteractions
    };
};

console.log('Testing Drug Interaction Checker...\n');

// Test cases
const testCases = [
    ['warfarin', 'omega-3'],
    ['warfarin', 'vitamin e'],
    ['iron', 'calcium'],
    ['zinc', 'iron'],
    ['aspirin', 'fish oil'],
    ['vitamin d', 'calcium'], // No interaction
    ['warfarin', 'vitamin c'], // No interaction
];

testCases.forEach(([drug1, drug2]) => {
    const result = checkTwoDrugInteractions(drug1, drug2);
    console.log(`${drug1} + ${drug2}:`);
    console.log(`  Has interactions: ${result.hasInteractions}`);
    if (result.hasInteractions) {
        console.log(`  Severity: ${result.severity}`);
        console.log(`  Description: ${result.interactions[0].description}`);
    } else {
        console.log(`  No interactions found`);
    }
    console.log('');
});
