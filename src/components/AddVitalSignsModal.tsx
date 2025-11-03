import { useState } from 'react';
import { X, Activity, Droplet } from 'lucide-react';
import { supabase } from '../lib/supabase';

type AddVitalSignsModalProps = {
  clientId: string;
  pharmacyId: string;
  onClose: () => void;
  onAdded: () => void;
};

export default function AddVitalSignsModal({
  clientId,
  pharmacyId,
  onClose,
  onAdded,
}: AddVitalSignsModalProps) {
  const [formData, setFormData] = useState({
    systolic: '',
    diastolic: '',
    glucose: '',
    notes: '',
    measured_at: new Date().toISOString().slice(0, 16),
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const systolic = formData.systolic ? parseInt(formData.systolic) : null;
    const diastolic = formData.diastolic ? parseInt(formData.diastolic) : null;
    const glucose = formData.glucose ? parseInt(formData.glucose) : null;

    if (!systolic && !diastolic && !glucose) {
      alert('Por favor, preencha pelo menos uma medição (PA ou Glicemia)');
      return;
    }

    if ((systolic && !diastolic) || (!systolic && diastolic)) {
      alert('Para pressão arterial, informe tanto sistólica quanto diastólica');
      return;
    }

    if (systolic && (systolic < 50 || systolic > 300)) {
      alert('Pressão sistólica deve estar entre 50 e 300 mmHg');
      return;
    }

    if (diastolic && (diastolic < 30 || diastolic > 200)) {
      alert('Pressão diastólica deve estar entre 30 e 200 mmHg');
      return;
    }

    if (glucose && (glucose < 20 || glucose > 600)) {
      alert('Glicemia deve estar entre 20 e 600 mg/dL');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('vital_signs').insert([
        {
          client_id: clientId,
          pharmacy_id: pharmacyId,
          measured_at: formData.measured_at,
          systolic,
          diastolic,
          glucose,
          notes: formData.notes.trim() || null,
        },
      ]);

      if (error) throw error;

      onAdded();
      onClose();
    } catch (error) {
      console.error('Error adding vital signs:', error);
      alert('Erro ao registrar sinais vitais. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getBPStatus = () => {
    const sys = parseInt(formData.systolic);
    const dia = parseInt(formData.diastolic);

    if (!sys || !dia) return null;

    if (sys < 120 && dia < 80) return { text: 'Normal', color: 'text-green-600' };
    if (sys < 130 && dia < 80) return { text: 'Elevada', color: 'text-yellow-600' };
    if (sys < 140 || dia < 90) return { text: 'Hipertensão Estágio 1', color: 'text-orange-600' };
    if (sys < 180 || dia < 120) return { text: 'Hipertensão Estágio 2', color: 'text-red-600' };
    return { text: 'Crise Hipertensiva', color: 'text-red-700' };
  };

  const getGlucoseStatus = () => {
    const gluc = parseInt(formData.glucose);

    if (!gluc) return null;

    if (gluc < 70) return { text: 'Hipoglicemia', color: 'text-red-600' };
    if (gluc <= 99) return { text: 'Normal (Jejum)', color: 'text-green-600' };
    if (gluc <= 125) return { text: 'Pré-diabetes', color: 'text-yellow-600' };
    if (gluc <= 199) return { text: 'Diabetes', color: 'text-orange-600' };
    return { text: 'Hiperglicemia Severa', color: 'text-red-700' };
  };

  const bpStatus = getBPStatus();
  const glucoseStatus = getGlucoseStatus();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto safe-bottom">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Registrar Sinais Vitais</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-5">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-gray-800">Pressão Arterial (PA)</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Sistólica (mmHg)
                </label>
                <input
                  type="number"
                  value={formData.systolic}
                  onChange={(e) => setFormData({ ...formData, systolic: e.target.value })}
                  placeholder="120"
                  min="50"
                  max="300"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center text-lg font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Diastólica (mmHg)
                </label>
                <input
                  type="number"
                  value={formData.diastolic}
                  onChange={(e) => setFormData({ ...formData, diastolic: e.target.value })}
                  placeholder="80"
                  min="30"
                  max="200"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center text-lg font-semibold"
                />
              </div>
            </div>
            {bpStatus && (
              <div className={`mt-3 text-center text-sm font-semibold ${bpStatus.color}`}>
                {bpStatus.text}
              </div>
            )}
          </div>

          <div className="bg-pink-50 border-2 border-pink-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Droplet className="w-5 h-5 text-pink-600" />
              <h3 className="font-bold text-gray-800">Glicemia</h3>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Glicose (mg/dL)
              </label>
              <input
                type="number"
                value={formData.glucose}
                onChange={(e) => setFormData({ ...formData, glucose: e.target.value })}
                placeholder="100"
                min="20"
                max="600"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none text-center text-lg font-semibold"
              />
            </div>
            {glucoseStatus && (
              <div className={`mt-3 text-center text-sm font-semibold ${glucoseStatus.color}`}>
                {glucoseStatus.text}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Data e Hora da Medição
            </label>
            <input
              type="datetime-local"
              value={formData.measured_at}
              onChange={(e) => setFormData({ ...formData, measured_at: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0F3C4C] focus:border-[#0F3C4C] outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ex: Medido após exercício, em jejum, etc."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0F3C4C] focus:border-[#0F3C4C] outline-none resize-none"
              rows={3}
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
            <p className="text-xs text-gray-700">
              <strong>Dica:</strong> Preencha pelo menos uma medição. Você pode registrar apenas PA, apenas glicemia, ou ambos.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold active:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-[#0F3C4C] text-white rounded-xl font-semibold active:bg-[#0d3340] transition disabled:opacity-50 active:scale-95"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
