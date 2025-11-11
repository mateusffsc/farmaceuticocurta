export type Pharmacy = {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  created_at: string;
};

export type Client = {
  id: string;
  pharmacy_id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  date_of_birth?: string;
  created_at: string;
};

export type Medication = {
  id: string;
  pharmacy_id: string;
  client_id: string;
  name: string;
  dosage: string;
  schedules: string;
  total_quantity?: number;
  remaining_doses?: number;
  treatment_duration_days: number;
  start_date: string;
  notes?: string;
  created_at: string;
};

export type DoseRecord = {
  id: string;
  medication_id: string;
  pharmacy_id: string;
  client_id: string;
  scheduled_time: string;
  actual_time?: string;
  status: 'pending' | 'taken' | 'skipped';
  has_adverse_event?: boolean;
  has_correction?: boolean;
  created_at: string;
};

export type AdverseEvent = {
  id: string;
  client_id: string;
  medication_id?: string;
  dose_record_id?: string;
  pharmacy_id: string;
  event_type: 'symptom' | 'side_effect' | 'allergic_reaction' | 'other';
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  occurred_at: string;
  created_at: string;
};

export type DoseCorrection = {
  id: string;
  original_dose_id: string;
  client_id: string;
  medication_id: string;
  pharmacy_id: string;
  correction_type: 'double_dose' | 'wrong_medication' | 'wrong_time' | 'missed_then_taken' | 'other';
  description: string;
  created_at: string;
};

export type UserRole = 'pharmacy' | 'client';
