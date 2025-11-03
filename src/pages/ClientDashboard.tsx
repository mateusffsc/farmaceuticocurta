import { useState, useEffect } from 'react';
import { Pill, LogOut, Calendar, TrendingUp, AlertCircle, Plus, Activity, Home } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { Client, Medication, DoseRecord } from '../lib/types';
import MedicationCard from '../components/MedicationCard';
import CareCalendar from '../components/CareCalendar';
import AdherenceCard from '../components/AdherenceCard';
import ProgressView from '../components/ProgressView';
import AdverseEventsView from '../components/AdverseEventsView';
import ClientAddMedicationModal from '../components/ClientAddMedicationModal';
import AddVitalSignsModal from '../components/AddVitalSignsModal';
import VitalSignsHistoryView from '../components/VitalSignsHistoryView';

type ClientDashboardProps = {
  onLogout: () => void;
};

export default function ClientDashboard({ onLogout }: ClientDashboardProps) {
  const { user, logout } = useAuthStore();
  const client = user as Client;

  const [medications, setMedications] = useState<Medication[]>([]);
  const [doseRecords, setDoseRecords] = useState<DoseRecord[]>([]);
  const [currentView, setCurrentView] = useState<'home' | 'calendar' | 'progress' | 'reports' | 'vitals'>('home');
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [showAddVitalSigns, setShowAddVitalSigns] = useState(false);

  useEffect(() => {
    loadData();
    updateMissedDoses();
  }, [client]);

  const loadData = async () => {
    if (!client) return;

    try {
      const { data: medsData } = await supabase
        .from('medications')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (medsData) setMedications(medsData);

      const { data: dosesData } = await supabase
        .from('dose_records')
        .select('*')
        .eq('client_id', client.id)
        .order('scheduled_time', { ascending: true });

      if (dosesData) setDoseRecords(dosesData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const updateMissedDoses = async () => {
    if (!client) return;

    try {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999);

      const { error } = await supabase
        .from('dose_records')
        .update({ status: 'skipped' })
        .eq('client_id', client.id)
        .eq('status', 'pending')
        .lt('scheduled_time', yesterday.toISOString());

      if (error) {
        console.error('Error updating missed doses:', error);
      }
    } catch (error) {
      console.error('Error in updateMissedDoses:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  const handleDoseAction = async (doseId: string, action: 'taken' | 'skipped') => {
    try {
      const { error } = await supabase
        .from('dose_records')
        .update({
          status: action,
          actual_time: action === 'taken' ? new Date().toISOString() : null,
        })
        .eq('id', doseId);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error updating dose:', error);
    }
  };

  const getTodayDoses = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return doseRecords.filter(dose => {
      const doseDate = new Date(dose.scheduled_time);
      return doseDate >= today && doseDate < tomorrow;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-50 safe-top">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-[#0F3C4C] p-2 rounded-lg">
                <Pill className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#0F3C4C]">
                  Farmacêutico Online
                </h1>
                <p className="text-xs text-gray-600">Olá, {client?.name}!</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-red-600 border border-red-600 rounded-lg active:bg-red-600 active:text-white transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Sair</span>
            </button>
          </div>
          <nav className="grid grid-cols-5 gap-2">
            <button
              onClick={() => setCurrentView('home')}
              className={`flex flex-col items-center justify-center py-3 rounded-xl transition active:scale-95 ${
                currentView === 'home'
                  ? 'bg-[#0F3C4C] text-white shadow-lg'
                  : 'bg-white text-gray-600 border-2 border-gray-200'
              }`}
            >
              <Home className="w-6 h-6 mb-1" />
              <span className="text-xs font-semibold">Início</span>
            </button>
            <button
              onClick={() => setCurrentView('calendar')}
              className={`flex flex-col items-center justify-center py-3 rounded-xl transition active:scale-95 ${
                currentView === 'calendar'
                  ? 'bg-[#0F3C4C] text-white shadow-lg'
                  : 'bg-white text-gray-600 border-2 border-gray-200'
              }`}
            >
              <Calendar className="w-6 h-6 mb-1" />
              <span className="text-xs font-semibold">Agenda</span>
            </button>
            <button
              onClick={() => setCurrentView('vitals')}
              className={`flex flex-col items-center justify-center py-3 rounded-xl transition active:scale-95 ${
                currentView === 'vitals'
                  ? 'bg-[#0F3C4C] text-white shadow-lg'
                  : 'bg-white text-gray-600 border-2 border-gray-200'
              }`}
            >
              <Activity className="w-6 h-6 mb-1" />
              <span className="text-xs font-semibold">Saúde</span>
            </button>
            <button
              onClick={() => setCurrentView('progress')}
              className={`flex flex-col items-center justify-center py-3 rounded-xl transition active:scale-95 ${
                currentView === 'progress'
                  ? 'bg-[#0F3C4C] text-white shadow-lg'
                  : 'bg-white text-gray-600 border-2 border-gray-200'
              }`}
            >
              <TrendingUp className="w-6 h-6 mb-1" />
              <span className="text-xs font-semibold">Evolução</span>
            </button>
            <button
              onClick={() => setCurrentView('reports')}
              className={`flex flex-col items-center justify-center py-3 rounded-xl transition active:scale-95 ${
                currentView === 'reports'
                  ? 'bg-[#0F3C4C] text-white shadow-lg'
                  : 'bg-white text-gray-600 border-2 border-gray-200'
              }`}
            >
              <AlertCircle className="w-6 h-6 mb-1" />
              <span className="text-xs font-semibold">Avisos</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="px-4 py-4">
        {currentView === 'home' && (
          <div className="mb-4">
            <AdherenceCard doseRecords={doseRecords} />
          </div>
        )}

        {currentView === 'progress' && (
          <div className="mb-4">
            <ProgressView
              doseRecords={doseRecords}
              medications={medications}
            />
          </div>
        )}

        {currentView === 'calendar' && (
          <div className="mb-4">
            <CareCalendar
              medications={medications}
              doseRecords={doseRecords}
            />
          </div>
        )}

        {currentView === 'reports' && (
          <div className="mb-4">
            <AdverseEventsView clientId={client.id} />
          </div>
        )}

        {currentView === 'vitals' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Sinais Vitais</h2>
              <button
                onClick={() => setShowAddVitalSigns(true)}
                className="flex items-center gap-2 bg-[#0F3C4C] text-white px-4 py-2 rounded-lg active:bg-[#0d3340] transition text-sm font-medium active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Registrar
              </button>
            </div>
            <VitalSignsHistoryView clientId={client.id} />
          </div>
        )}

        {currentView === 'home' && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              Meus Medicamentos
            </h2>
            <button
              onClick={() => setShowAddMedication(true)}
              className="flex items-center gap-2 bg-[#0F3C4C] text-white px-4 py-2 rounded-lg active:bg-[#0d3340] transition text-sm font-medium active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
          </div>
        )}

        {currentView === 'home' && medications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <Pill className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Nenhum medicamento cadastrado
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Adicione seus medicamentos para começar o acompanhamento
            </p>
            <button
              onClick={() => setShowAddMedication(true)}
              className="inline-flex items-center gap-2 bg-[#0F3C4C] text-white px-6 py-3 rounded-lg active:bg-[#0d3340] transition font-medium active:scale-95"
            >
              <Plus className="w-5 h-5" />
              Adicionar Primeiro Medicamento
            </button>
          </div>
        ) : currentView === 'home' && (
          <div className="space-y-4">
            {medications.map((medication) => {
              const medDoses = getTodayDoses().filter(
                dose => dose.medication_id === medication.id
              );
              return (
                <MedicationCard
                  key={medication.id}
                  medication={medication}
                  doses={medDoses}
                  clientId={client.id}
                  pharmacyId={client.pharmacy_id}
                  onDoseAction={handleDoseAction}
                  onIssueReported={loadData}
                />
              );
            })}
          </div>
        )}
      </main>

      {showAddMedication && (
        <ClientAddMedicationModal
          clientId={client.id}
          pharmacyId={client.pharmacy_id}
          onClose={() => setShowAddMedication(false)}
          onAdded={loadData}
        />
      )}

      {showAddVitalSigns && (
        <AddVitalSignsModal
          clientId={client.id}
          pharmacyId={client.pharmacy_id}
          onClose={() => setShowAddVitalSigns(false)}
          onAdded={() => {
            setShowAddVitalSigns(false);
          }}
        />
      )}
    </div>
  );
}
