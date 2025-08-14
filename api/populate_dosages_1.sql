-- Populate supplement_dosages table with all supplement data

-- Vitamin D (remaining records)
INSERT INTO supplement_dosages (supplement_name, normalized_name, gender, weight_category, min_dosage, max_dosage, unit, description, notes) VALUES
('Vitamin D', 'vitamin d', 'male', 'medium', 2000, 3000, 'IU', 'Medium weight male', 'Higher doses may be needed in winter or for deficiency'),
('Vitamin D', 'vitamin d', 'male', 'heavy', 3000, 4000, 'IU', 'Heavy weight male', 'Higher doses may be needed in winter or for deficiency'),
('Vitamin D', 'vitamin d', 'female', 'light', 800, 1500, 'IU', 'Light weight female', 'Higher doses may be needed in winter or for deficiency'),
('Vitamin D', 'vitamin d', 'female', 'medium', 1500, 2500, 'IU', 'Medium weight female', 'Higher doses may be needed in winter or for deficiency'),
('Vitamin D', 'vitamin d', 'female', 'heavy', 2500, 3500, 'IU', 'Heavy weight female', 'Higher doses may be needed in winter or for deficiency');

-- Vitamin C
INSERT INTO supplement_dosages (supplement_name, normalized_name, gender, weight_category, min_dosage, max_dosage, unit, description, notes) VALUES
('Vitamin C', 'vitamin c', 'male', 'light', 500, 1000, 'mg', 'Light weight male', NULL),
('Vitamin C', 'vitamin c', 'male', 'medium', 1000, 1500, 'mg', 'Medium weight male', NULL),
('Vitamin C', 'vitamin c', 'male', 'heavy', 1500, 2000, 'mg', 'Heavy weight male', NULL),
('Vitamin C', 'vitamin c', 'female', 'light', 400, 800, 'mg', 'Light weight female', NULL),
('Vitamin C', 'vitamin c', 'female', 'medium', 800, 1200, 'mg', 'Medium weight female', NULL),
('Vitamin C', 'vitamin c', 'female', 'heavy', 1200, 1600, 'mg', 'Heavy weight female', NULL);

-- Vitamin B12
INSERT INTO supplement_dosages (supplement_name, normalized_name, gender, weight_category, min_dosage, max_dosage, unit, description, notes) VALUES
('Vitamin B12', 'vitamin b12', 'male', 'light', 50, 100, 'mcg', 'Light weight male', NULL),
('Vitamin B12', 'vitamin b12', 'male', 'medium', 100, 250, 'mcg', 'Medium weight male', NULL),
('Vitamin B12', 'vitamin b12', 'male', 'heavy', 250, 500, 'mcg', 'Heavy weight male', NULL),
('Vitamin B12', 'vitamin b12', 'female', 'light', 25, 100, 'mcg', 'Light weight female', NULL),
('Vitamin B12', 'vitamin b12', 'female', 'medium', 100, 200, 'mcg', 'Medium weight female', NULL),
('Vitamin B12', 'vitamin b12', 'female', 'heavy', 200, 400, 'mcg', 'Heavy weight female', NULL);

-- Omega-3
INSERT INTO supplement_dosages (supplement_name, normalized_name, gender, weight_category, min_dosage, max_dosage, unit, description, notes) VALUES
('Omega-3', 'omega-3', 'male', 'light', 1000, 1500, 'mg', 'Light weight male', NULL),
('Omega-3', 'omega-3', 'male', 'medium', 1500, 2500, 'mg', 'Medium weight male', NULL),
('Omega-3', 'omega-3', 'male', 'heavy', 2500, 3500, 'mg', 'Heavy weight male', NULL),
('Omega-3', 'omega-3', 'female', 'light', 800, 1200, 'mg', 'Light weight female', NULL),
('Omega-3', 'omega-3', 'female', 'medium', 1200, 2000, 'mg', 'Medium weight female', NULL),
('Omega-3', 'omega-3', 'female', 'heavy', 2000, 3000, 'mg', 'Heavy weight female', NULL);

-- Magnesium
INSERT INTO supplement_dosages (supplement_name, normalized_name, gender, weight_category, min_dosage, max_dosage, unit, description, notes) VALUES
('Magnesium', 'magnesium', 'male', 'light', 300, 400, 'mg', 'Light weight male', NULL),
('Magnesium', 'magnesium', 'male', 'medium', 400, 500, 'mg', 'Medium weight male', NULL),
('Magnesium', 'magnesium', 'male', 'heavy', 500, 600, 'mg', 'Heavy weight male', NULL),
('Magnesium', 'magnesium', 'female', 'light', 250, 300, 'mg', 'Light weight female', NULL),
('Magnesium', 'magnesium', 'female', 'medium', 300, 400, 'mg', 'Medium weight female', NULL),
('Magnesium', 'magnesium', 'female', 'heavy', 400, 500, 'mg', 'Heavy weight female', NULL);
