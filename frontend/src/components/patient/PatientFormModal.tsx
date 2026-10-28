import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Patient } from '../../types';
import { Plus, Trash2, User, AlertCircle } from 'lucide-react';

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Patient>) => Promise<void>;
  initialData?: Patient | null;
}

export const PatientFormModal: React.FC<PatientFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [dob, setDob] = useState(initialData?.date_of_birth || '');
  const [gender, setGender] = useState(initialData?.gender || 'Male');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [contactNotes, setContactNotes] = useState(initialData?.contact_notes || '');
  const [clinicalNotes, setClinicalNotes] = useState(initialData?.clinical_notes || '');

  // Tag lists for patient-reported intake
  const [conditionInput, setConditionInput] = useState('');
  const [reportedConditions, setReportedConditions] = useState<string[]>(
    initialData?.reported_conditions || []
  );

  const [allergyInput, setAllergyInput] = useState('');
  const [reportedAllergies, setReportedAllergies] = useState<string[]>(
    initialData?.reported_allergies || []
  );

  const [medInput, setMedInput] = useState('');
  const [reportedMeds, setReportedMeds] = useState<string[]>(
    initialData?.reported_medications || []
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddCondition = () => {
    if (conditionInput.trim()) {
      setReportedConditions([...reportedConditions, conditionInput.trim()]);
      setConditionInput('');
    }
  };

  const handleAddAllergy = () => {
    if (allergyInput.trim()) {
      setReportedAllergies([...reportedAllergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const handleAddMed = () => {
    if (medInput.trim()) {
      setReportedMeds([...reportedMeds, medInput.trim()]);
      setMedInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Patient name is required.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        name,
        date_of_birth: dob,
        gender,
        phone,
        contact_notes: contactNotes,
        reported_conditions: reportedConditions,
        reported_allergies: reportedAllergies,
        reported_medications: reportedMeds,
        clinical_notes: clinicalNotes,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Patient Record' : 'Register New Patient (Intake Form)'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Eleanor Vance"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other / Non-Binary</option>
              <option value="Unknown">Not Disclosed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contact Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1-555-0100"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Patient-Reported Intake Sections */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Patient-Reported Intake (Verbal or Form Disclosure)
          </p>

          {/* Reported Conditions */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Reported Conditions
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={conditionInput}
                onChange={(e) => setConditionInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCondition())}
                placeholder="e.g. Type 2 Diabetes, Hypertension"
                className="flex-1 px-2.5 py-1.5 text-xs rounded-md border border-slate-300"
              />
              <button
                type="button"
                onClick={handleAddCondition}
                className="px-2.5 py-1.5 text-xs bg-slate-200 hover:bg-slate-300 rounded-md font-medium"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {reportedConditions.map((cond, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200"
                >
                  {cond}
                  <button
                    type="button"
                    onClick={() =>
                      setReportedConditions(reportedConditions.filter((_, i) => i !== idx))
                    }
                    className="ml-1 text-blue-500 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Reported Allergies */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Known Allergies (Do not assume absence if unmentioned)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergy())}
                placeholder="e.g. Penicillin, Sulfa, Latex"
                className="flex-1 px-2.5 py-1.5 text-xs rounded-md border border-slate-300"
              />
              <button
                type="button"
                onClick={handleAddAllergy}
                className="px-2.5 py-1.5 text-xs bg-slate-200 hover:bg-slate-300 rounded-md font-medium"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {reportedAllergies.map((allergy, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200"
                >
                  {allergy}
                  <button
                    type="button"
                    onClick={() =>
                      setReportedAllergies(reportedAllergies.filter((_, i) => i !== idx))
                    }
                    className="ml-1 text-rose-500 hover:text-rose-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Reported Medications */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Current Medications
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={medInput}
                onChange={(e) => setMedInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMed())}
                placeholder="e.g. Metformin 500mg BID"
                className="flex-1 px-2.5 py-1.5 text-xs rounded-md border border-slate-300"
              />
              <button
                type="button"
                onClick={handleAddMed}
                className="px-2.5 py-1.5 text-xs bg-slate-200 hover:bg-slate-300 rounded-md font-medium"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {reportedMeds.map((med, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  {med}
                  <button
                    type="button"
                    onClick={() =>
                      setReportedMeds(reportedMeds.filter((_, i) => i !== idx))
                    }
                    className="ml-1 text-emerald-500 hover:text-emerald-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Clinical / Intake Notes
          </label>
          <textarea
            rows={2}
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            placeholder="Additional notes from patient conversation or caregiver intake..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-xs disabled:opacity-50"
          >
            {loading ? 'Saving...' : initialData ? 'Save Changes' : 'Register Patient'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
