import { useState, useEffect } from 'react';
import { Building2, LogOut, Users, UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { Pharmacy, Client, Medication, DoseRecord } from '../lib/types';
import ClientListItem from '../components/ClientListItem';
import AddClientModal from '../components/AddClientModal';
import PharmacyOverview from '../components/PharmacyOverview';
import PharmacyReports from '../components/PharmacyReports';
import ClientDetailsModal from '../components/ClientDetailsModal';
import PharmacyAddMedicationModal from '../components/PharmacyAddMedicationModal';

type PharmacyDashboardProps = {
  onLogout: () => void;
};

export default function PharmacyDashboard({ onLogout }: PharmacyDashboardProps) {
  const { user, logout } = useAuthStore();
  const pharmacy = user as Pharmacy;

  const [clients, setClients] = useState<Client[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddMedicationModal, setShowAddMedicationModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'overview' | 'reports' | 'clients'>('clients');

  useEffect(() => {
    loadClients();
  }, [pharmacy]);


  const loadClients = async () => {
    if (!pharmacy) return;

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('pharmacy_id', pharmacy.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  const handleAddClient = async (clientData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    date_of_birth?: string;
    monitor_bp?: boolean;
    monitor_glucose?: boolean;
  }) => {
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: clientData.email,
        password: clientData.password,
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        const { error: insertError } = await supabase
          .from('clients')
          .insert([{ 
            auth_id: authData.user.id,
            pharmacy_id: pharmacy.id,
            name: clientData.name,
            email: clientData.email,
            phone: clientData.phone,
            date_of_birth: clientData.date_of_birth,
            monitor_bp: clientData.monitor_bp ?? false,
            monitor_glucose: clientData.monitor_glucose ?? false,
          }]);

        if (insertError) throw insertError;

        await loadClients();
        setShowAddModal(false);
      }
    } catch (error: any) {
      console.error('Error adding client:', error);
      alert(error.message || 'Erro ao adicionar cliente');
    }
  };

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setShowDetailsModal(true);
  };

  const handleAddMedication = (client: Client) => {
    setSelectedClient(client);
    setShowDetailsModal(false);
    setShowAddMedicationModal(true);
  };

  const handleMedicationAdded = async (medication: Omit<Medication, 'id' | 'created_at'>, clientId: string) => {
    try {
      const { data: newMed, error: medError } = await supabase
        .from('medications')
        .insert([medication])
        .select()
        .single();

      if (medError) throw medError;

      const schedules = medication.schedules.split(',').map(s => s.trim());
      const startDate = new Date(medication.start_date);
      const doses: Omit<DoseRecord, 'id' | 'created_at'>[] = [];

      for (let day = 0; day < medication.treatment_duration_days; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + day);

        for (const schedule of schedules) {
          const [hours, minutes] = schedule.split(':');
          const scheduledTime = new Date(currentDate);
          scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          doses.push({
            medication_id: newMed.id,
            pharmacy_id: medication.pharmacy_id,
            client_id: medication.client_id,
            scheduled_time: scheduledTime.toISOString(),
            status: 'pending',
          });
        }
      }

      const { error: doseError } = await supabase
        .from('dose_records')
        .insert(doses);

      if (doseError) throw doseError;

      setShowAddMedicationModal(false);
      if (selectedClient) {
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error adding medication:', error);
      alert('Erro ao adicionar medicamento');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-50 safe-top">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-[#0F3C4C] p-2 rounded-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#0F3C4C]">
                  {pharmacy.name}
                </h1>
                <p className="text-xs text-gray-600">Painel de Gerenciamento</p>
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
        </div>
        {/* Navegação entre páginas do painel da farmácia */}
        <div className="px-4 pb-3">
          <nav className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setCurrentView('overview')}
              className={`flex flex-col items-center justify-center py-3 rounded-xl transition active:scale-95 ${
                currentView === 'overview'
                  ? 'bg-[#0F3C4C] text-white shadow-lg'
                  : 'bg-white text-gray-600 border-2 border-gray-200'
              }`}
            >
              <span className="text-xs font-semibold">Visão Geral</span>
            </button>
            <button
              onClick={() => setCurrentView('reports')}
              className={`flex flex-col items-center justify-center py-3 rounded-xl transition active:scale-95 ${
                currentView === 'reports'
                  ? 'bg-[#0F3C4C] text-white shadow-lg'
                  : 'bg-white text-gray-600 border-2 border-gray-200'
              }`}
            >
              <span className="text-xs font-semibold">Relatórios</span>
            </button>
            <button
              onClick={() => setCurrentView('clients')}
              className={`flex flex-col items-center justify-center py-3 rounded-xl transition active:scale-95 ${
                currentView === 'clients'
                  ? 'bg-[#0F3C4C] text-white shadow-lg'
                  : 'bg-white text-gray-600 border-2 border-gray-200'
              }`}
            >
              <span className="text-xs font-semibold">Clientes</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="px-4 py-4">
        {currentView === 'overview' && (
          <>
            <div className="bg-gradient-to-br from-[#0F3C4C] to-[#1a5768] rounded-2xl shadow-lg p-5 text-white mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Bem-vindo!</h2>
                  <p className="text-white/90 text-sm">
                    Gerencie seus clientes e acompanhe tratamentos
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl text-center min-w-[70px]">
                  <Users className="w-7 h-7 mx-auto mb-1" />
                  <div className="text-2xl font-bold">{clients.length}</div>
                  <div className="text-xs text-white/90">Clientes</div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <PharmacyOverview pharmacyId={pharmacy.id} />
            </div>
          </>
        )}

        {currentView === 'reports' && (
          <div className="mb-4">
            <PharmacyReports pharmacyId={pharmacy.id} />
          </div>
        )}

        {currentView === 'clients' && (
          <>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Clientes
              </h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-[#0F3C4C] text-white px-4 py-2.5 rounded-xl active:bg-[#0d3340] transition shadow-md active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span className="text-sm font-medium">Adicionar</span>
              </button>
            </div>

            {clients.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md p-8 text-center">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Nenhum cliente cadastrado
                </h3>
                <p className="text-sm text-gray-600 mb-5">
                  Comece adicionando clientes para gerenciar tratamentos
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 bg-[#0F3C4C] text-white px-5 py-3 rounded-xl active:bg-[#0d3340] transition active:scale-95"
                >
                  <UserPlus className="w-5 h-5" />
                  <span className="font-medium">Adicionar Primeiro Cliente</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {clients.map((client) => (
                  <ClientListItem
                    key={client.id}
                    client={client}
                    pharmacyId={pharmacy.id}
                    onUpdate={loadClients}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddClient}
        />
      )}

      {showDetailsModal && selectedClient && (
        <ClientDetailsModal
          client={selectedClient}
          pharmacyId={pharmacy.id}
          onClose={() => setShowDetailsModal(false)}
          onAddMedication={handleAddMedication}
        />
      )}

      {showAddMedicationModal && selectedClient && (
        <PharmacyAddMedicationModal
          onClose={() => {
            setShowAddMedicationModal(false);
            if (selectedClient) {
              setShowDetailsModal(true);
            }
          }}
          onAdd={handleMedicationAdded}
          pharmacyId={pharmacy.id}
        />
      )}
    </div>
  );
}
