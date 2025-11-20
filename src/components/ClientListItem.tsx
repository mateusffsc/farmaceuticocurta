import { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Pill, TrendingUp, Eye } from 'lucide-react';
import { Client, Medication, DoseRecord } from '../lib/types';
import { supabase } from '../lib/supabase';

type ClientListItemProps = {
  client: Client;
  pharmacyId: string;
  onUpdate: () => void;
  onViewDetails: (client: Client) => void;
};

export default function ClientListItem({ client, pharmacyId: _pharmacyId, onViewDetails }: ClientListItemProps) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [doseRecords, setDoseRecords] = useState<DoseRecord[]>([]);
  const [adherence, setAdherence] = useState(0);

  useEffect(() => {
    loadClientData();
  }, [client.id]);

  const loadClientData = async () => {
    try {
      const { data: medsData } = await supabase
        .from('medications')
        .select('*')
        .eq('client_id', client.id);

      if (medsData) setMedications(medsData);

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const { data: dosesData } = await supabase
        .from('dose_records')
        .select('*')
        .eq('client_id', client.id)
        .gte('scheduled_time', sevenDaysAgo.toISOString());

      if (dosesData) {
        setDoseRecords(dosesData);
        const taken = dosesData.filter(d => d.status === 'taken').length;
        const total = dosesData.length;
        setAdherence(total > 0 ? Math.round((taken / total) * 100) : 0);
      }
    } catch (error) {
      console.error('Error loading client data:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não informado';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="bg-white rounded-2xl shadow-md active:shadow-lg transition p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="bg-[#0F3C4C] p-2.5 rounded-full">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0F3C4C]">
              {client.name}
            </h3>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
          adherence >= 80 ? 'bg-green-100 text-green-700' :
          adherence >= 60 ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {adherence}%
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{client.email}</span>
        </div>

        {client.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span>{client.phone}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span>Nascimento: {formatDate(client.date_of_birth)}</span>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-3 text-center mb-3">
          <div className="bg-gray-50 rounded-xl p-2.5">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Pill className="w-4 h-4 text-[#0F3C4C]" />
              <span className="text-xl font-bold text-[#0F3C4C]">
                {medications.length}
              </span>
            </div>
            <p className="text-xs text-gray-600 font-medium">Medicamentos</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-[#0F3C4C]" />
              <span className="text-xl font-bold text-[#0F3C4C]">
                {doseRecords.filter(d => d.status === 'taken').length}
              </span>
            </div>
            <p className="text-xs text-gray-600 font-medium">Doses Tomadas</p>
          </div>
        </div>

        <button
          onClick={() => onViewDetails(client)}
          className="w-full flex items-center justify-center gap-2 bg-[#0F3C4C] text-white py-3 rounded-xl active:bg-[#0d3340] transition text-sm font-semibold active:scale-95"
        >
          <Eye className="w-4 h-4" />
          Ver Detalhes
        </button>
      </div>
    </div>
  );
}
