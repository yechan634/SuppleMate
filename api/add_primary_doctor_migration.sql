-- Add primary_doctor field to doctor_patient_relationships table
-- This migration adds the ability for patients to designate one doctor as their primary doctor

-- Add the is_primary_doctor column to existing relationships
ALTER TABLE doctor_patient_relationships 
ADD COLUMN IF NOT EXISTS is_primary_doctor BOOLEAN DEFAULT FALSE;

-- Create an index for faster primary doctor queries
CREATE INDEX IF NOT EXISTS idx_doctor_patient_relationships_primary 
ON doctor_patient_relationships(patient_id, is_primary_doctor) 
WHERE is_primary_doctor = TRUE;

-- Add a constraint to ensure only one primary doctor per patient
-- First, let's create a function to handle this constraint
CREATE OR REPLACE FUNCTION check_single_primary_doctor()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this relationship as primary, unset any other primary relationships for this patient
    IF NEW.is_primary_doctor = TRUE THEN
        UPDATE doctor_patient_relationships 
        SET is_primary_doctor = FALSE 
        WHERE patient_id = NEW.patient_id 
        AND id != NEW.id 
        AND is_primary_doctor = TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_single_primary_doctor ON doctor_patient_relationships;
CREATE TRIGGER trigger_single_primary_doctor
    BEFORE INSERT OR UPDATE ON doctor_patient_relationships
    FOR EACH ROW
    EXECUTE FUNCTION check_single_primary_doctor();
