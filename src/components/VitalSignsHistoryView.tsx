import { useState, useEffect } from 'react';
import { Activity, Droplet, Clock, Trash2, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

type VitalSign = {
  id: string;
  measured_at: string;
  systolic: number | null;
  diastolic: number | null;
  glucose: number | null;
  notes: string | null;
  created_at: string;
};

type VitalSignsHistoryViewProps = {
  clientId: string;
};

export default function VitalSignsHistoryView({ clientId }: VitalSignsHistoryViewProps) {
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bp' | 'glucose'>('all');
  const [timeRange, setTimeRange] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    loadVitalSigns();
  }, [clientId]);

  const loadVitalSigns = async () => {
    try {
      const { data, error } = await supabase
        .from('vital_signs')
        .select('*')
        .eq('client_id', clientId)
        .order('measured_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setVitalSigns(data || []);
    } catch (error) {
      console.error('Error loading vital signs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vital_signs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadVitalSigns();
    } catch (error) {
      console.error('Error deleting vital sign:', error);
      alert('Erro ao excluir registro. Tente novamente.');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBPStatus = (systolic: number, diastolic: number) => {
    if (systolic < 120 && diastolic < 80) return { text: 'Normal', color: 'bg-green-100 text-green-700' };
    if (systolic < 130 && diastolic < 80) return { text: 'Elevada', color: 'bg-yellow-100 text-yellow-700' };
    if (systolic < 140 || diastolic < 90) return { text: 'Hipertensão 1', color: 'bg-orange-100 text-orange-700' };
    if (systolic < 180 || diastolic < 120) return { text: 'Hipertensão 2', color: 'bg-red-100 text-red-700' };
    return { text: 'Crise', color: 'bg-red-200 text-red-800' };
  };

  const getGlucoseStatus = (glucose: number) => {
    if (glucose < 70) return { text: 'Baixa', color: 'bg-red-100 text-red-700' };
    if (glucose <= 99) return { text: 'Normal', color: 'bg-green-100 text-green-700' };
    if (glucose <= 125) return { text: 'Pré-diabetes', color: 'bg-yellow-100 text-yellow-700' };
    if (glucose <= 199) return { text: 'Diabetes', color: 'bg-orange-100 text-orange-700' };
    return { text: 'Alta', color: 'bg-red-200 text-red-800' };
  };

  const applyTimeFilter = (signs: VitalSign[]) => {
    if (timeRange === 'all') return signs;
    const now = new Date();
    const start = new Date(now);
    if (timeRange === 'week') {
      start.setDate(now.getDate() - 7);
    } else if (timeRange === 'month') {
      start.setDate(now.getDate() - 30);
    }
    return signs.filter((s) => new Date(s.measured_at) >= start);
  };

  const filteredSigns = applyTimeFilter(vitalSigns).filter((sign) => {
    if (filter === 'bp') return sign.systolic !== null && sign.diastolic !== null;
    if (filter === 'glucose') return sign.glucose !== null;
    return true;
  });

  const calculateAverages = () => {
    const dataset = applyTimeFilter(vitalSigns);
    const bpSigns = dataset.filter(s => s.systolic && s.diastolic);
    const glucoseSigns = dataset.filter(s => s.glucose);

    const avgSystolic = bpSigns.length > 0
      ? Math.round(bpSigns.reduce((sum, s) => sum + (s.systolic || 0), 0) / bpSigns.length)
      : null;
    const avgDiastolic = bpSigns.length > 0
      ? Math.round(bpSigns.reduce((sum, s) => sum + (s.diastolic || 0), 0) / bpSigns.length)
      : null;
    const avgGlucose = glucoseSigns.length > 0
      ? Math.round(glucoseSigns.reduce((sum, s) => sum + (s.glucose || 0), 0) / glucoseSigns.length)
      : null;

    return { avgSystolic, avgDiastolic, avgGlucose, bpCount: bpSigns.length, glucoseCount: glucoseSigns.length };
  };

  const averages = calculateAverages();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Carregando histórico...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {vitalSigns.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {averages.bpCount > 0 && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-gray-700">Média PA {timeRange === 'week' ? '(7 dias)' : timeRange === 'month' ? '(30 dias)' : ''}</span>
              </div>
              <div className="text-lg font-bold text-gray-800">
                {averages.avgSystolic}/{averages.avgDiastolic}
              </div>
              <div className="text-xs text-gray-600">{averages.bpCount} medições</div>
            </div>
          )}
          {averages.glucoseCount > 0 && (
            <div className="bg-pink-50 border-2 border-pink-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Droplet className="w-4 h-4 text-pink-600" />
                <span className="text-xs font-semibold text-gray-700">Média Glicemia {timeRange === 'week' ? '(7 dias)' : timeRange === 'month' ? '(30 dias)' : ''}</span>
              </div>
              <div className="text-lg font-bold text-gray-800">
                {averages.avgGlucose} mg/dL
              </div>
              <div className="text-xs text-gray-600">{averages.glucoseCount} medições</div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
            filter === 'all'
              ? 'bg-[#0F3C4C] text-white'
              : 'bg-gray-100 text-gray-700 active:bg-gray-200'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('bp')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
            filter === 'bp'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 active:bg-gray-200'
          }`}
        >
          Pressão Arterial
        </button>
        <button
          onClick={() => setFilter('glucose')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
            filter === 'glucose'
              ? 'bg-pink-600 text-white'
              : 'bg-gray-100 text-gray-700 active:bg-gray-200'
          }`}
        >
          Glicemia
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setTimeRange('all')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
            timeRange === 'all'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-700 active:bg-gray-200'
          }`}
        >
          Período: Todos
        </button>
        <button
          onClick={() => setTimeRange('week')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
            timeRange === 'week'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 active:bg-gray-200'
          }`}
        >
          Semanal (7 dias)
        </button>
        <button
          onClick={() => setTimeRange('month')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
            timeRange === 'month'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 active:bg-gray-200'
          }`}
        >
          Mensal (30 dias)
        </button>
      </div>

      {filteredSigns.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md p-8 text-center">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
            <Activity className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Nenhum registro encontrado
          </h3>
          <p className="text-sm text-gray-600">
            {filter === 'all'
              ? 'Comece registrando seus sinais vitais'
              : `Nenhum registro de ${filter === 'bp' ? 'pressão arterial' : 'glicemia'} encontrado`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSigns.map((sign) => (
            <div key={sign.id} className="bg-white rounded-xl shadow-md p-4 border-2 border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{formatDateTime(sign.measured_at)}</span>
                </div>
                <button
                  onClick={() => handleDelete(sign.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {sign.systolic && sign.diastolic && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Pressão Arterial</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-800">
                        {sign.systolic}/{sign.diastolic}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        getBPStatus(sign.systolic, sign.diastolic).color
                      }`}>
                        {getBPStatus(sign.systolic, sign.diastolic).text}
                      </span>
                    </div>
                  </div>
                )}

                {sign.glucose && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplet className="w-5 h-5 text-pink-600" />
                      <span className="text-sm font-medium text-gray-700">Glicemia</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-800">
                        {sign.glucose} mg/dL
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        getGlucoseStatus(sign.glucose).color
                      }`}>
                        {getGlucoseStatus(sign.glucose).text}
                      </span>
                    </div>
                  </div>
                )}

                {sign.notes && (
                  <div className="bg-gray-50 rounded-lg p-3 mt-2">
                    <p className="text-xs text-gray-700">{sign.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
