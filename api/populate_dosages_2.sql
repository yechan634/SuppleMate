-- Continue populating supplement_dosages table with remaining supplements

-- Calcium
INSERT INTO supplement_dosages (supplement_name, normalized_name, gender, weight_category, min_dosage, max_dosage, unit, description, notes) VALUES
('Calcium', 'calcium', 'male', 'light', 800, 1000, 'mg', 'Light weight male', 'Women may need higher doses, especially post-menopause'),
('Calcium', 'calcium', 'male', 'medium', 1000, 1200, 'mg', 'Medium weight male', 'Women may need higher doses, especially post-menopause'),
('Calcium', 'calcium', 'male', 'heavy', 1200, 1500, 'mg', 'Heavy weight male', 'Women may need higher doses, especially post-menopause'),
('Calcium', 'calcium', 'female', 'light', 900, 1100, 'mg', 'Light weight female', 'Women may need higher doses, especially post-menopause'),
('Calcium', 'calcium', 'female', 'medium', 1100, 1300, 'mg', 'Medium weight female', 'Women may need higher doses, especially post-menopause'),
('Calcium', 'calcium', 'female', 'heavy', 1300, 1600, 'mg', 'Heavy weight female', 'Women may need higher doses, especially post-menopause');

-- Zinc
INSERT INTO supplement_dosages (supplement_name, normalized_name, gender, weight_category, min_dosage, max_dosage, unit, description, notes) VALUES
('Zinc', 'zinc', 'male', 'light', 8, 15, 'mg', 'Light weight male', NULL),
('Zinc', 'zinc', 'male', 'medium', 15, 20, 'mg', 'Medium weight male', NULL),
('Zinc', 'zinc', 'male', 'heavy', 20, 25, 'mg', 'Heavy weight male', NULL),
('Zinc', 'zinc', 'female', 'light', 6, 10, 'mg', 'Light weight female', NULL),
('Zinc', 'zinc', 'female', 'medium', 10, 15, 'mg', 'Medium weight female', NULL),
('Zinc', 'zinc', 'female', 'heavy', 15, 20, 'mg', 'Heavy weight female', NULL);

-- Iron
INSERT INTO supplement_dosages (supplement_name, normalized_name, gender, weight_category, min_dosage, max_dosage, unit, description, notes) VALUES
('Iron', 'iron', 'male', 'light', 8, 15, 'mg', 'Light weight male', 'Women typically need higher doses due to menstruation'),
('Iron', 'iron', 'male', 'medium', 15, 20, 'mg', 'Medium weight male', 'Women typically need higher doses due to menstruation'),
('Iron', 'iron', 'male', 'heavy', 20, 25, 'mg', 'Heavy weight male', 'Women typically need higher doses due to menstruation'),
('Iron', 'iron', 'female', 'light', 15, 25, 'mg', 'Light weight female', 'Women typically need higher doses due to menstruation'),
('Iron', 'iron', 'female', 'medium', 25, 35, 'mg', 'Medium weight female', 'Women typically need higher doses due to menstruation'),
('Iron', 'iron', 'female', 'heavy', 35, 45, 'mg', 'Heavy weight female', 'Women typically need higher doses due to menstruation');

-- Probiotics
INSERT INTO supplement_dosages (supplement_name, normalized_name, gender, weight_category, min_dosage, max_dosage, unit, description, notes) VALUES
('Probiotics', 'probiotics', 'male', 'light', 1, 5, 'billion CFU', 'Light weight male', NULL),
('Probiotics', 'probiotics', 'male', 'medium', 5, 15, 'billion CFU', 'Medium weight male', NULL),
('Probiotics', 'probiotics', 'male', 'heavy', 15, 25, 'billion CFU', 'Heavy weight male', NULL),
('Probiotics', 'probiotics', 'female', 'light', 1, 5, 'billion CFU', 'Light weight female', NULL),
('Probiotics', 'probiotics', 'female', 'medium', 5, 15, 'billion CFU', 'Medium weight female', NULL),
('Probiotics', 'probiotics', 'female', 'heavy', 15, 25, 'billion CFU', 'Heavy weight female', NULL);

-- Turmeric
INSERT INTO supplement_dosages (supplement_name, normalized_name, gender, weight_category, min_dosage, max_dosage, unit, description, notes) VALUES
('Turmeric', 'turmeric', 'male', 'light', 500, 750, 'mg', 'Light weight male', NULL),
('Turmeric', 'turmeric', 'male', 'medium', 750, 1000, 'mg', 'Medium weight male', NULL),
('Turmeric', 'turmeric', 'male', 'heavy', 1000, 1500, 'mg', 'Heavy weight male', NULL),
('Turmeric', 'turmeric', 'female', 'light', 400, 600, 'mg', 'Light weight female', NULL),
('Turmeric', 'turmeric', 'female', 'medium', 600, 800, 'mg', 'Medium weight female', NULL),
('Turmeric', 'turmeric', 'female', 'heavy', 800, 1200, 'mg', 'Heavy weight female', NULL);
