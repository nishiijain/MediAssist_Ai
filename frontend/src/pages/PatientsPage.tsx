import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  UserPlus,
  FileText,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Calendar,
  Phone,
  Trash2,
  Edit2
} from 'lucide-react';
import { api } from '../services/api';
import { Patient } from '../types';
import { PatientFormModal } from '../components/patient/PatientFormModal';

export const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await api.getPatients();
      setPatients(data);
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleCreateOrUpdate = async (payload: Partial<Patient>) => {
    if (editingPatient) {
      await api.updatePatient(editingPatient.id, payload);
    } else {
      await api.createPatient(payload);
    }
    await fetchPatients();
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete patient record for "${name}"? This will delete all attached documents and summaries.`)) {
      await api.deletePatient(id);
      await fetchPatients();
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.mrn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse registered patients, review intake notes, and launch verification workflows.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingPatient(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg shadow-xs transition-all"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by patient name or MRN..."
          className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
        />
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500">Loading patient records...</div>
      ) : filteredPatients.length === 0 ? (
        <div className="p-12 bg-white border border-slate-200 rounded-xl text-center space-y-3">
          <Users className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-base font-semibold text-slate-700">No Patients Found</p>
          <p className="text-xs text-slate-400">
            {searchTerm ? 'No patient records matched your search query.' : 'No patients registered in the system yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPatients.map((patient) => {
            const hasIssues = (patient.verification_issues_count || 0) > 0;
            return (
              <div
                key={patient.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-900 text-base">{patient.name}</h3>
                        {patient.is_demo && (
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded">
                            Demo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">MRN: {patient.mrn}</p>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setEditingPatient(patient);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                        title="Edit Record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(patient.id, patient.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[11px]">DOB / Gender:</span>
                      <span className="font-medium">{patient.date_of_birth || 'Not documented'} ({patient.gender || 'Unknown'})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Documents:</span>
                      <span className="font-medium">{patient.document_count || 0} attached files</span>
                    </div>
                  </div>

                  {/* Reported Allergies */}
                  <div className="mt-3">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Reported Allergies
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {patient.reported_allergies && patient.reported_allergies.length > 0 ? (
                        patient.reported_allergies.map((allergy, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-medium"
                          >
                            {allergy}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">None reported on intake</span>
                      )}
                    </div>
                  </div>

                  {/* Verification Status Pill */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    {hasIssues ? (
                      <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        <ShieldAlert className="w-3.5 h-3.5 mr-1 text-rose-600" />
                        {patient.verification_issues_count} Unresolved Issue(s)
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-emerald-600 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                        Records Verified
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-2">
                  <button
                    onClick={() => navigate(`/history?patientId=${patient.id}`)}
                    className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors text-center"
                  >
                    Timeline & History
                  </button>
                  <button
                    onClick={() => navigate(`/doctor-review?patientId=${patient.id}`)}
                    className="flex-1 py-1.5 px-3 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-lg text-xs font-medium transition-colors text-center"
                  >
                    Doctor Review
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Patient Intake Modal */}
      <PatientFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPatient(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingPatient}
      />
    </div>
  );
};
