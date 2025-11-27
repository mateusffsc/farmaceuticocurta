import { useState } from 'react';
import { X, Activity, Droplet, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

type AddVitalSignModalProps = {
  clientId: string;
  pharmacyId: string;
  onClose: () => void;
  onAdded: () => void;
};

export default function AddVitalSignModal({ clientId, pharmacyId, onClose, onAdded }: AddVitalSignModalProps) {
  const nowLocal = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const defaultDateTime = `${nowLocal.getFullYear()}-${pad(nowLocal.getMonth() + 1)}-${pad(nowLocal.getDate())}T${pad(nowLocal.getHours())}:${pad(nowLocal.getMinutes())}`;

  const [measuredAt, setMeasuredAt] = useState<string>(defaultDateTime);
  const [systolic, setSystolic] = useState<string>('');
  const [diastolic, setDiastolic] = useState<string>('');
  const [glucose, setGlucose] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    const hasBP = systolic.trim() !== '' && diastolic.trim() !== '';
    const hasGlucose = glucose.trim() !== '';
    if (!hasBP && !hasGlucose) {
      e.general = 'Informe pressão arterial ou glicemia';
    }
    if (hasBP) {
      const sys = parseInt(systolic, 10);
      const dia = parseInt(diastolic, 10);
      if (Number.isNaN(sys) || sys < 50 || sys > 300) e.systolic = 'Sistólica entre 50 e 300';
      if (Number.isNaN(dia) || dia < 30 || dia > 200) e.diastolic = 'Diastólica entre 30 e 200';
    }
    if (hasGlucose) {
      const glu = parseInt(glucose, 10);
      if (Number.isNaN(glu) || glu < 20 || glu > 600) e.glucose = 'Glicemia entre 20 e 600';
    }
    if (!measuredAt) e.measuredAt = 'Informe data e hora';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const iso = new Date(measuredAt).toISOString();
      const payload = {
        client_id: clientId,
        pharmacy_id: pharmacyId,
        measured_at: iso,
        systolic: systolic.trim() ? parseInt(systolic, 10) : null,
        diastolic: diastolic.trim() ? parseInt(diastolic, 10) : null,
        glucose: glucose.trim() ? parseInt(glucose, 10) : null,
        notes: notes.trim() || null,
      };
      const { error } = await supabase.from('vital_signs').insert([payload]);
      if (error) throw error;
      onAdded();
      onClose();
    } catch (err: any) {
      setErrors({ general: err.message || 'Erro ao salvar medição' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#0F3C4C]">Registrar Sinais Vitais</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data e Hora</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="datetime-local"
                value={measuredAt}
                onChange={(e) => setMeasuredAt(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F3C4C] focus:border-transparent outline-none"
              />
            </div>
            {errors.measuredAt && <p className="text-red-600 text-sm mt-1">{errors.measuredAt}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2 text-blue-700">
                <Activity className="w-4 h-4" />
                <span className="text-sm font-semibold">Pressão Arterial</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Sistólica"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F3C4C] focus:border-transparent outline-none"
                />
                <input
                  type="number"
                  placeholder="Diastólica"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F3C4C] focus:border-transparent outline-none"
                />
              </div>
              {(errors.systolic || errors.diastolic) && (
                <p className="text-red-600 text-xs mt-1">{errors.systolic || errors.diastolic}</p>
              )}
            </div>

            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2 text-pink-700">
                <Droplet className="w-4 h-4" />
                <span className="text-sm font-semibold">Glicemia (mg/dL)</span>
              </div>
              <input
                type="number"
                placeholder="Ex: 95"
                value={glucose}
                onChange={(e) => setGlucose(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F3C4C] focus:border-transparent outline-none"
              />
              {errors.glucose && <p className="text-red-600 text-xs mt-1">{errors.glucose}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F3C4C] focus:border-transparent outline-none"
              placeholder="Opcional"
            />
          </div>

          {errors.general && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{errors.general}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-[#0F3C4C] text-white rounded-lg hover:bg-[#0d3340] transition font-medium disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
