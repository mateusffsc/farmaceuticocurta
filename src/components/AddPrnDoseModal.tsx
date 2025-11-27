import { useState } from 'react';
import { X, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Medication } from '../lib/types';

type AddPrnDoseModalProps = {
  medication: Medication;
  clientId: string;
  pharmacyId: string;
  onClose: () => void;
  onAdded: () => void;
};

export default function AddPrnDoseModal({ medication, clientId, pharmacyId, onClose, onAdded }: AddPrnDoseModalProps) {
  const now = new Date();
  const toLocalInput = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [when, setWhen] = useState<string>(toLocalInput(now));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const ts = new Date(when).toISOString();
      const { error } = await supabase
        .from('dose_records')
        .insert([{
          medication_id: medication.id,
          pharmacy_id: pharmacyId,
          client_id: clientId,
          scheduled_time: ts,
          actual_time: ts,
          status: 'taken',
        }]);
      if (error) throw error;
      onAdded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar dose');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl overflow-hidden">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Registrar uso (PRN)</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Data e hora do uso</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0F3C4C] focus:border-[#0F3C4C] outline-none"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold active:bg-gray-50 transition"
              disabled={loading}
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
