-- Create supplement_dosages table for storing personalized dosage recommendations
CREATE TABLE IF NOT EXISTS supplement_dosages (
    id SERIAL PRIMARY KEY,
    supplement_name VARCHAR(255) NOT NULL,
    normalized_name VARCHAR(255) NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('male', 'female')),
    weight_category VARCHAR(20) NOT NULL CHECK (weight_category IN ('light', 'medium', 'heavy')),
    min_dosage DECIMAL(10,2) NOT NULL,
    max_dosage DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    description TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on normalized_name and gender/weight_category for faster searching
CREATE INDEX IF NOT EXISTS idx_supplement_dosages_normalized_name ON supplement_dosages(normalized_name);
CREATE INDEX IF NOT EXISTS idx_supplement_dosages_lookup ON supplement_dosages(normalized_name, gender, weight_category);

-- Insert dosage data for all supplements

-- Vitamin D
INSERT INTO supplement_dosages (supplement_name, normalized_name, gender, weight_category, min_dosage, max_dosage, unit, description, notes) VALUES
('Vitamin D', 'vitamin d', 'male', 'light', 1000, 2000, 'IU', 'Light weight male', 'Higher doses may be needed in winter or for deficiency'),
('Vitamin D', 'vitamin d', 'male', 'medium', 2000, 3000, 'IU', 'Medium weight male', 'Higher doses may be needed in winter or for deficiency'),
('Vitamin D', 'vitamin d', 'male', 'heavy', 3000, 4000, 'IU', 'Heavy weight male', 'Higher doses may be needed in winter or for deficiency'),
('Vitamin D', 'vitamin d', 'female', 'light', 800, 1500, 'IU', 'Light weight female', 'Higher doses may be needed in winter or for deficiency'),
('Vitamin D', 'vitamin d', 'female', 'medium', 1500, 2500, 'IU', 'Medium weight female', 'Higher doses may be needed in winter or for deficiency'),
('Vitamin D', 'vitamin d', 'female', 'heavy', 2500, 3500, 'IU', 'Heavy weight female', 'Higher doses may be needed in winter or for deficiency'),

-- Vitamin C
('Vitamin C', 'vitamin c', 'male', 'light', 500, 1000, 'mg', 'Light weight male', NULL),
('Vitamin C', 'vitamin c', 'male', 'medium', 1000, 1500, 'mg', 'Medium weight male', NULL),
('Vitamin C', 'vitamin c', 'male', 'heavy', 1500, 2000, 'mg', 'Heavy weight male', NULL),
('Vitamin C', 'vitamin c', 'female', 'light', 400, 800, 'mg', 'Light weight female', NULL),
('Vitamin C', 'vitamin c', 'female', 'medium', 800, 1200, 'mg', 'Medium weight female', NULL),
('Vitamin C', 'vitamin c', 'female', 'heavy', 1200, 1600, 'mg', 'Heavy weight female', NULL),

-- Vitamin B12
('Vitamin B12', 'vitamin b12', 'male', 'light', 50, 100, 'mcg', 'Light weight male', NULL),
('Vitamin B12', 'vitamin b12', 'male', 'medium', 100, 250, 'mcg', 'Medium weight male', NULL),
('Vitamin B12', 'vitamin b12', 'male', 'heavy', 250, 500, 'mcg', 'Heavy weight male', NULL),
('Vitamin B12', 'vitamin b12', 'female', 'light', 25, 100, 'mcg', 'Light weight female', NULL),
('Vitamin B12', 'vitamin b12', 'female', 'medium', 100, 200, 'mcg', 'Medium weight female', NULL),
('Vitamin B12', 'vitamin b12', 'female', 'heavy', 200, 400, 'mcg', 'Heavy weight female', NULL),

-- Omega-3
('Omega-3', 'omega-3', 'male', 'light', 1000, 1500, 'mg', 'Light weight male', NULL),
('Omega-3', 'omega-3', 'male', 'medium', 1500, 2500, 'mg', 'Medium weight male', NULL),
('Omega-3', 'omega-3', 'male', 'heavy', 2500, 3500, 'mg', 'Heavy weight male', NULL),
('Omega-3', 'omega-3', 'female', 'light', 800, 1200, 'mg', 'Light weight female', NULL),
('Omega-3', 'omega-3', 'female', 'medium', 1200, 2000, 'mg', 'Medium weight female', NULL),
('Omega-3', 'omega-3', 'female', 'heavy', 2000, 3000, 'mg', 'Heavy weight female', NULL),

-- Magnesium
('Magnesium', 'magnesium', 'male', 'light', 300, 400, 'mg', 'Light weight male', NULL),
('Magnesium', 'magnesium', 'male', 'medium', 400, 500, 'mg', 'Medium weight male', NULL),
('Magnesium', 'magnesium', 'male', 'heavy', 500, 600, 'mg', 'Heavy weight male', NULL),
('Magnesium', 'magnesium', 'female', 'light', 250, 300, 'mg', 'Light weight female', NULL),
('Magnesium', 'magnesium', 'female', 'medium', 300, 400, 'mg', 'Medium weight female', NULL),
('Magnesium', 'magnesium', 'female', 'heavy', 400, 500, 'mg', 'Heavy weight female', NULL),

-- Calcium
('Calcium', 'calcium', 'male', 'light', 800, 1000, 'mg', 'Light weight male', 'Women may need higher doses, especially post-menopause'),
('Calcium', 'calcium', 'male', 'medium', 1000, 1200, 'mg', 'Medium weight male', 'Women may need higher doses, especially post-menopause'),
('Calcium', 'calcium', 'male', 'heavy', 1200, 1500, 'mg', 'Heavy weight male', 'Women may need higher doses, especially post-menopause'),
('Calcium', 'calcium', 'female', 'light', 900, 1100, 'mg', 'Light weight female', 'Women may need higher doses, especially post-menopause'),
('Calcium', 'calcium', 'female', 'medium', 1100, 1300, 'mg', 'Medium weight female', 'Women may need higher doses, especially post-menopause'),
('Calcium', 'calcium', 'female', 'heavy', 1300, 1600, 'mg', 'Heavy weight female', 'Women may need higher doses, especially post-menopause'),

-- Zinc
('Zinc', 'zinc', 'male', 'light', 8, 15, 'mg', 'Light weight male', NULL),
('Zinc', 'zinc', 'male', 'medium', 15, 20, 'mg', 'Medium weight male', NULL),
('Zinc', 'zinc', 'male', 'heavy', 20, 25, 'mg', 'Heavy weight male', NULL),
('Zinc', 'zinc', 'female', 'light', 6, 10, 'mg', 'Light weight female', NULL),
('Zinc', 'zinc', 'female', 'medium', 10, 15, 'mg', 'Medium weight female', NULL),
('Zinc', 'zinc', 'female', 'heavy', 15, 20, 'mg', 'Heavy weight female', NULL),

-- Iron
('Iron', 'iron', 'male', 'light', 8, 15, 'mg', 'Light weight male', 'Women typically need higher doses due to menstruation'),
('Iron', 'iron', 'male', 'medium', 15, 20, 'mg', 'Medium weight male', 'Women typically need higher doses due to menstruation'),
('Iron', 'iron', 'male', 'heavy', 20, 25, 'mg', 'Heavy weight male', 'Women typically need higher doses due to menstruation'),
('Iron', 'iron', 'female', 'light', 15, 25, 'mg', 'Light weight female', 'Women typically need higher doses due to menstruation'),
('Iron', 'iron', 'female', 'medium', 25, 35, 'mg', 'Medium weight female', 'Women typically need higher doses due to menstruation'),
('Iron', 'iron', 'female', 'heavy', 35, 45, 'mg', 'Heavy weight female', 'Women typically need higher doses due to menstruation'),

-- Probiotics
('Probiotics', 'probiotics', 'male', 'light', 1, 5, 'billion CFU', 'Light weight male', NULL),
('Probiotics', 'probiotics', 'male', 'medium', 5, 15, 'billion CFU', 'Medium weight male', NULL),
('Probiotics', 'probiotics', 'male', 'heavy', 15, 25, 'billion CFU', 'Heavy weight male', NULL),
('Probiotics', 'probiotics', 'female', 'light', 1, 5, 'billion CFU', 'Light weight female', NULL),
('Probiotics', 'probiotics', 'female', 'medium', 5, 15, 'billion CFU', 'Medium weight female', NULL),
('Probiotics', 'probiotics', 'female', 'heavy', 15, 25, 'billion CFU', 'Heavy weight female', NULL),

-- Turmeric
('Turmeric', 'turmeric', 'male', 'light', 500, 750, 'mg', 'Light weight male', NULL),
('Turmeric', 'turmeric', 'male', 'medium', 750, 1000, 'mg', 'Medium weight male', NULL),
('Turmeric', 'turmeric', 'male', 'heavy', 1000, 1500, 'mg', 'Heavy weight male', NULL),
('Turmeric', 'turmeric', 'female', 'light', 400, 600, 'mg', 'Light weight female', NULL),
('Turmeric', 'turmeric', 'female', 'medium', 600, 800, 'mg', 'Medium weight female', NULL),
('Turmeric', 'turmeric', 'female', 'heavy', 800, 1200, 'mg', 'Heavy weight female', NULL)

ON CONFLICT DO NOTHING;
