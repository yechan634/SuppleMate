-- Create supplement_info table for storing supplement information
CREATE TABLE IF NOT EXISTS supplement_info (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    normalized_name VARCHAR(255) NOT NULL,
    side_effects TEXT[], -- Array of side effects
    common_dosage VARCHAR(255),
    warnings TEXT[], -- Array of warnings
    interactions TEXT[], -- Array of interactions
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on normalized_name for faster searching
CREATE INDEX IF NOT EXISTS idx_supplement_info_normalized_name ON supplement_info(normalized_name);

-- Insert supplement information data
INSERT INTO supplement_info (name, normalized_name, side_effects, common_dosage, warnings, interactions) VALUES
(
    'Vitamin D',
    'vitamin d',
    ARRAY[
        'Nausea and vomiting',
        'Weakness',
        'Kidney damage (with very high doses)',
        'Hypercalcemia (elevated blood calcium)',
        'Constipation',
        'Confusion',
        'Heart rhythm abnormalities'
    ],
    '1000-4000 IU daily',
    ARRAY[
        'Do not exceed 4000 IU daily without medical supervision',
        'Monitor blood calcium levels with high doses'
    ],
    ARRAY[
        'May increase absorption of aluminum',
        'Can enhance digitalis toxicity'
    ]
),
(
    'Vitamin C',
    'vitamin c',
    ARRAY[
        'Nausea',
        'Diarrhea',
        'Stomach cramps',
        'Heartburn',
        'Headache',
        'Kidney stones (with very high doses)'
    ],
    '500-1000 mg daily',
    ARRAY[
        'Doses above 2000 mg may cause digestive upset',
        'Reduce dose if experiencing stomach issues'
    ],
    ARRAY[
        'May enhance iron absorption',
        'Can affect certain laboratory tests'
    ]
),
(
    'Vitamin B12',
    'vitamin b12',
    ARRAY[
        'Mild diarrhea',
        'Skin rash',
        'Dizziness',
        'Headache',
        'Nausea',
        'Injection site pain (for injections)'
    ],
    '100-1000 mcg daily',
    ARRAY[
        'Generally well tolerated',
        'Consult doctor if you have kidney problems'
    ],
    ARRAY[
        'May interact with metformin',
        'Chloramphenicol may reduce effectiveness'
    ]
),
(
    'Omega-3 Fish Oil',
    'omega-3',
    ARRAY[
        'Fishy aftertaste',
        'Bad breath',
        'Nausea',
        'Loose stools',
        'Upset stomach',
        'Increased bleeding risk (high doses)'
    ],
    '1000-3000 mg daily',
    ARRAY[
        'Take with meals to reduce stomach upset',
        'Consult doctor if taking blood thinners'
    ],
    ARRAY[
        'May increase bleeding risk with warfarin',
        'Can enhance effects of blood pressure medications'
    ]
),
(
    'Magnesium',
    'magnesium',
    ARRAY[
        'Diarrhea',
        'Nausea',
        'Stomach cramps',
        'Low blood pressure (high doses)',
        'Muscle weakness',
        'Lethargy'
    ],
    '200-400 mg daily',
    ARRAY[
        'Start with lower doses to assess tolerance',
        'Reduce dose if experiencing diarrhea'
    ],
    ARRAY[
        'May interfere with certain antibiotics',
        'Can affect absorption of some medications'
    ]
),
(
    'Calcium',
    'calcium',
    ARRAY[
        'Constipation',
        'Bloating',
        'Gas',
        'Kidney stones (high doses)',
        'Interference with iron absorption'
    ],
    '500-1200 mg daily',
    ARRAY[
        'Do not exceed 2500 mg daily',
        'Take with vitamin D for better absorption'
    ],
    ARRAY[
        'May interfere with iron and zinc absorption',
        'Can affect certain heart medications'
    ]
),
(
    'Zinc',
    'zinc',
    ARRAY[
        'Nausea',
        'Stomach upset',
        'Metallic taste',
        'Headache',
        'Loss of appetite',
        'Copper deficiency (long-term high doses)'
    ],
    '8-15 mg daily',
    ARRAY[
        'Take on empty stomach or with food if upset occurs',
        'Do not exceed 40 mg daily'
    ],
    ARRAY[
        'May interfere with copper absorption',
        'Can affect certain antibiotics'
    ]
),
(
    'Iron',
    'iron',
    ARRAY[
        'Constipation',
        'Nausea',
        'Stomach upset',
        'Dark stools',
        'Diarrhea',
        'Heartburn'
    ],
    '15-25 mg daily',
    ARRAY[
        'Take on empty stomach for better absorption',
        'Can be taken with vitamin C to enhance absorption'
    ],
    ARRAY[
        'Coffee and tea can reduce absorption',
        'May interfere with certain antibiotics'
    ]
),
(
    'Probiotics',
    'probiotics',
    ARRAY[
        'Mild digestive discomfort initially',
        'Gas',
        'Bloating',
        'Changes in bowel movements',
        'Rare risk of infection in immunocompromised'
    ],
    '1-10 billion CFU daily',
    ARRAY[
        'Start with lower doses',
        'Consult doctor if immunocompromised'
    ],
    ARRAY[
        'Antibiotics may reduce effectiveness',
        'Generally safe with most medications'
    ]
),
(
    'Turmeric/Curcumin',
    'turmeric',
    ARRAY[
        'Stomach upset',
        'Nausea',
        'Dizziness',
        'Diarrhea',
        'Increased bleeding risk',
        'Iron deficiency (high doses)'
    ],
    '500-1000 mg daily',
    ARRAY[
        'May increase bleeding risk',
        'Avoid before surgery'
    ],
    ARRAY[
        'May enhance blood thinning medications',
        'Can interfere with chemotherapy drugs'
    ]
)
ON CONFLICT (name) DO UPDATE SET
    normalized_name = EXCLUDED.normalized_name,
    side_effects = EXCLUDED.side_effects,
    common_dosage = EXCLUDED.common_dosage,
    warnings = EXCLUDED.warnings,
    interactions = EXCLUDED.interactions,
    updated_at = CURRENT_TIMESTAMP;

-- Add some common name variations for better search
INSERT INTO supplement_info (name, normalized_name, side_effects, common_dosage, warnings, interactions) VALUES
(
    'Fish Oil',
    'fish oil',
    ARRAY[
        'Fishy aftertaste',
        'Bad breath',
        'Nausea',
        'Loose stools',
        'Upset stomach',
        'Increased bleeding risk (high doses)'
    ],
    '1000-3000 mg daily',
    ARRAY[
        'Take with meals to reduce stomach upset',
        'Consult doctor if taking blood thinners'
    ],
    ARRAY[
        'May increase bleeding risk with warfarin',
        'Can enhance effects of blood pressure medications'
    ]
),
(
    'Curcumin',
    'curcumin',
    ARRAY[
        'Stomach upset',
        'Nausea',
        'Dizziness',
        'Diarrhea',
        'Increased bleeding risk',
        'Iron deficiency (high doses)'
    ],
    '500-1000 mg daily',
    ARRAY[
        'May increase bleeding risk',
        'Avoid before surgery'
    ],
    ARRAY[
        'May enhance blood thinning medications',
        'Can interfere with chemotherapy drugs'
    ]
),
(
    'Vitamin D3',
    'vitamin d3',
    ARRAY[
        'Nausea and vomiting',
        'Weakness',
        'Kidney damage (with very high doses)',
        'Hypercalcemia (elevated blood calcium)',
        'Constipation',
        'Confusion',
        'Heart rhythm abnormalities'
    ],
    '1000-4000 IU daily',
    ARRAY[
        'Do not exceed 4000 IU daily without medical supervision',
        'Monitor blood calcium levels with high doses'
    ],
    ARRAY[
        'May increase absorption of aluminum',
        'Can enhance digitalis toxicity'
    ]
),
(
    'B12',
    'b12',
    ARRAY[
        'Mild diarrhea',
        'Skin rash',
        'Dizziness',
        'Headache',
        'Nausea',
        'Injection site pain (for injections)'
    ],
    '100-1000 mcg daily',
    ARRAY[
        'Generally well tolerated',
        'Consult doctor if you have kidney problems'
    ],
    ARRAY[
        'May interact with metformin',
        'Chloramphenicol may reduce effectiveness'
    ]
)
ON CONFLICT (name) DO NOTHING;
