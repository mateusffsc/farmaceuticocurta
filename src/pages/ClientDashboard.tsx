import { useState, useEffect } from 'react';
import { Pill, LogOut, Calendar, TrendingUp, AlertCircle, Plus, Activity, Home } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { Client, Medication, DoseRecord } from '../lib/types';
import MedicationCard from '../components/MedicationCard';
import CareCalendar from '../components/CareCalendar';
import AdherenceCard from '../components/AdherenceCard';
import AdsBanner from '../components/AdsBanner';
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
  const [monitorBp, setMonitorBp] = useState<boolean>(false);
  const [monitorGlucose, setMonitorGlucose] = useState<boolean>(false);

  useEffect(() => {
    loadData();
    loadMonitorFlags();
    updateMissedDoses();

    // Sem Supabase Auth, evitamos subscriptions que dependem de RLS
    return () => {};
  }, [client]);

  useEffect(() => {
    if (!client) return;

    const channel = supabase.channel(`client-realtime-${client.id}`);

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'medications', filter: `client_id=eq.${client.id}` },
      () => {
        loadData();
      }
    );

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'dose_records', filter: `client_id=eq.${client.id}` },
      () => {
        loadData();
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [client]);

  const loadMonitorFlags = async () => {
    if (!client) return;
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('monitor_bp, monitor_glucose')
        .eq('id', client.id)
        .single();
      if (!error && data) {
        setMonitorBp(!!data.monitor_bp);
        setMonitorGlucose(!!data.monitor_glucose);
      }
    } catch (err) {
      console.error('Erro ao carregar flags de monitoramento:', err);
    }
  };

  const saveMonitorFlag = async (field: 'monitor_bp' | 'monitor_glucose', value: boolean) => {
    if (!client) return;
    try {
      const { error } = await supabase
        .from('clients')
        .update({ [field]: value })
        .eq('id', client.id);
      if (error) throw error;
    } catch (err) {
      console.error('Erro ao salvar flag de monitoramento:', err);
      // Revert UI if error
      if (field === 'monitor_bp') setMonitorBp((prev) => !value ? prev : prev);
      if (field === 'monitor_glucose') setMonitorGlucose((prev) => !value ? prev : prev);
    }
  };

  const loadData = async () => {
    if (!client) return;

    try {
      const { data: medsData, error: medsError } = await supabase.rpc('get_client_medications', {
        client_id: client.id,
      });
      if (medsError) throw medsError;
      if (medsData) setMedications(medsData as any);

      const { data: dosesData, error: dosesError } = await supabase.rpc('get_client_dose_records', {
        client_id: client.id,
      });
      if (dosesError) throw dosesError;
      if (dosesData) setDoseRecords(dosesData as any);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const updateMissedDoses = async () => {
    if (!client) return;

    try {
      const { error } = await supabase.rpc('update_missed_doses_for_client', {
        client_id: client.id,
      });
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
      const { error } = await supabase.rpc('update_client_dose_status', {
        client_id: client!.id,
        dose_id: doseId,
        new_status: action,
      });
      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error updating dose:', error);
    }
  };

  const handleDeleteMedication = async (medicationId: string) => {
    if (!client) return;
    
    try {
      const { data: success, error } = await supabase.rpc('delete_client_medication', {
        p_medication_id: medicationId,
        p_client_id: client.id,
      });
      
      if (error) {
        console.error('Error deleting medication:', error);
        alert('Erro ao deletar medicamento: ' + error.message);
        return;
      }
      
      if (success) {
        console.log('✅ Medicamento deletado com sucesso');
        await loadData(); // Recarregar lista de medicamentos
      }
    } catch (error: any) {
      console.error('Error deleting medication:', error);
      alert('Erro ao deletar medicamento: ' + error.message);
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
        {currentView === 'home' && client && (
          <AdsBanner pharmacyId={client.pharmacy_id} />
        )}
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
            <div className="grid grid-cols-1 gap-3 mb-4">
              <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
                <div>
                  <p className="text-sm font-medium text-gray-800">Monitorar Pressão Arterial</p>
                  <p className="text-xs text-gray-600">Habilita registros e médias de PA</p>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={monitorBp}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setMonitorBp(val);
                      saveMonitorFlag('monitor_bp', val);
                    }}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#0F3C4C] transition relative">
                    <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition peer-checked:translate-x-5" />
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
                <div>
                  <p className="text-sm font-medium text-gray-800">Monitorar Glicemia</p>
                  <p className="text-xs text-gray-600">Habilita registros e médias de glicose</p>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={monitorGlucose}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setMonitorGlucose(val);
                      saveMonitorFlag('monitor_glucose', val);
                    }}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#0F3C4C] transition relative">
                    <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition peer-checked:translate-x-5" />
                  </div>
                </label>
              </div>
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
                  onDelete={handleDeleteMedication}
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
