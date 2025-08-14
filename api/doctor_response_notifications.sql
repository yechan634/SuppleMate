-- Migration for doctor response notifications
-- This migration adds the ability for patients to receive notifications when doctors respond to approval requests

-- Create doctor_response_notifications table
CREATE TABLE IF NOT EXISTS doctor_response_notifications (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approval_request_id INTEGER NOT NULL REFERENCES supplement_approval_requests(id) ON DELETE CASCADE,
    doctor_name VARCHAR(255) NOT NULL,
    supplement_name VARCHAR(255) NOT NULL,
    response_type VARCHAR(20) NOT NULL CHECK (response_type IN ('approved', 'rejected')),
    doctor_notes TEXT, -- Optional notes from doctor
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_doctor_response_notifications_patient 
ON doctor_response_notifications(patient_id);

CREATE INDEX IF NOT EXISTS idx_doctor_response_notifications_doctor 
ON doctor_response_notifications(doctor_id);

CREATE INDEX IF NOT EXISTS idx_doctor_response_notifications_approval_request 
ON doctor_response_notifications(approval_request_id);
