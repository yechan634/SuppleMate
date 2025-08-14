-- Migration for supplement approval system
-- This migration adds the ability for doctors to approve/reject supplement additions

-- Create supplement_approval_requests table
CREATE TABLE IF NOT EXISTS supplement_approval_requests (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    patient_name VARCHAR(255) NOT NULL,
    supplement_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    first_take TIMESTAMP WITH TIME ZONE NOT NULL,
    supply_amount INTEGER DEFAULT 1,
    type VARCHAR(20) DEFAULT 'supplement' CHECK (type IN ('supplement', 'medication')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    interaction_info JSONB, -- Store interaction details if any
    request_reason VARCHAR(50) NOT NULL CHECK (request_reason IN ('interaction', 'medication')), -- Why approval is needed
    notes TEXT, -- Optional notes from patient
    doctor_response_notes TEXT, -- Optional notes from doctor when responding
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_supplement_approval_requests_patient 
ON supplement_approval_requests(patient_id);

CREATE INDEX IF NOT EXISTS idx_supplement_approval_requests_doctor 
ON supplement_approval_requests(doctor_id);

CREATE INDEX IF NOT EXISTS idx_supplement_approval_requests_status 
ON supplement_approval_requests(status);

-- Add status column to supplements table to track pending/approved supplements
ALTER TABLE supplements 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Create index for supplement approval status
CREATE INDEX IF NOT EXISTS idx_supplements_approval_status 
ON supplements(approval_status);

-- Update interaction_notifications table to include approval request reference
ALTER TABLE interaction_notifications 
ADD COLUMN IF NOT EXISTS approval_request_id INTEGER REFERENCES supplement_approval_requests(id) ON DELETE SET NULL;
