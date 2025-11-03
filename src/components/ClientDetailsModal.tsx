import { useState, useEffect } from 'react';
import { X, User, Pill, Plus, AlertCircle } from 'lucide-react';
import { Client, Medication, DoseRecord } from '../lib/types';
import { supabase } from '../lib/supabase';
import MedicationCard from './MedicationCard';
import ClientEventsModal from './ClientEventsModal';

type ClientDetailsModalProps = {
  client: Client;
  pharmacyId: string;
  onClose: () => void;
  onAddMedication: (client: Client) => void;
};

export default function ClientDetailsModal({
  client,
  pharmacyId,
  onClose,
  onAddMedication,
}: ClientDetailsModalProps) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [doseRecords, setDoseRecords] = useState<DoseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventsModal, setShowEventsModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [client.id]);

  const loadData = async () => {
    try {
      const { data: medsData } = await supabase
        .from('medications')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (medsData) setMedications(medsData);

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const { data: dosesData } = await supabase
        .from('dose_records')
        .select('*')
        .eq('client_id', client.id)
        .gte('scheduled_time', sevenDaysAgo.toISOString())
        .order('scheduled_time', { ascending: true });

      if (dosesData) setDoseRecords(dosesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#0F3C4C] p-2 rounded-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#0F3C4C]">
                {client.name}
              </h2>
              <p className="text-sm text-gray-600">{client.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              Medicamentos
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowEventsModal(true)}
                className="flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-lg hover:bg-orange-200 transition text-sm font-medium"
              >
                <AlertCircle className="w-4 h-4" />
                Ver Relatórios
              </button>
              <button
                onClick={() => onAddMedication(client)}
                className="flex items-center gap-2 bg-[#0F3C4C] text-white px-4 py-2 rounded-lg hover:bg-[#0d3340] transition text-sm"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600">Carregando...</div>
            </div>
          ) : medications.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-12 text-center">
              <div className="bg-gray-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Pill className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Nenhum medicamento cadastrado
              </h4>
              <p className="text-gray-600 mb-4">
                Adicione medicamentos para este cliente
              </p>
              <button
                onClick={() => onAddMedication(client)}
                className="inline-flex items-center gap-2 bg-[#0F3C4C] text-white px-6 py-2 rounded-lg hover:bg-[#0d3340] transition"
              >
                <Plus className="w-4 h-4" />
                Adicionar Primeiro Medicamento
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    pharmacyId={pharmacyId}
                    onDoseAction={handleDoseAction}
                    onIssueReported={loadData}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showEventsModal && (
        <ClientEventsModal
          client={client}
          onClose={() => setShowEventsModal(false)}
        />
      )}
    </div>
  );
}
