import { useState } from 'react';
import { X, Plus, Trash2, Clock } from 'lucide-react';
import { Medication } from '../lib/types';
import { supabase } from '../lib/supabase';

type EditMedicationModalProps = {
  medication: Medication;
  onClose: () => void;
  onUpdated: () => void;
};

export default function EditMedicationModal({
  medication,
  onClose,
  onUpdated,
}: EditMedicationModalProps) {
  const [formData, setFormData] = useState({
    name: medication.name,
    dosage: medication.dosage.replace(/mg|g|ml|comprimido|cápsula/gi, '').trim(),
    unit: medication.dosage.match(/mg|g|ml|comprimido|cápsula/i)?.[0] || 'mg',
    notes: medication.notes || '',
  });
  const [schedules, setSchedules] = useState<string[]>(
    medication.schedules.split(',').map(s => s.trim())
  );
  const [loading, setLoading] = useState(false);

  const addSchedule = () => {
    setSchedules([...schedules, '']);
  };

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const updateSchedule = (index: number, value: string) => {
    const newSchedules = [...schedules];
    newSchedules[index] = value;
    setSchedules(newSchedules);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Por favor, digite o nome do medicamento');
      return;
    }

    if (!formData.dosage.trim()) {
      alert('Por favor, digite a dosagem');
      return;
    }

    const validSchedules = schedules.filter(s => s.trim() !== '');
    if (validSchedules.length === 0) {
      alert('Por favor, adicione pelo menos um horário');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('medications')
        .update({
          name: formData.name.trim(),
          dosage: `${formData.dosage.trim()}${formData.unit}`,
          schedules: validSchedules.join(', '),
          notes: formData.notes.trim() || null,
        })
        .eq('id', medication.id);

      if (error) throw error;

      onUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating medication:', error);
      alert('Erro ao atualizar medicamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('Tem certeza que deseja desativar este medicamento?')) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('medications')
        .update({ is_active: false })
        .eq('id', medication.id);

      if (error) throw error;

      onUpdated();
      onClose();
    } catch (error) {
      console.error('Error deactivating medication:', error);
      alert('Erro ao desativar medicamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto safe-bottom">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Editar Medicamento</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nome do Medicamento *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Paracetamol"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0F3C4C] focus:border-[#0F3C4C] outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Dosagem *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                placeholder="Ex: 500"
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0F3C4C] focus:border-[#0F3C4C] outline-none"
                required
              />
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0F3C4C] focus:border-[#0F3C4C] outline-none bg-white"
              >
                <option value="mg">mg</option>
                <option value="g">g</option>
                <option value="ml">ml</option>
                <option value="comprimido">comprimido</option>
                <option value="cápsula">cápsula</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Horários *
            </label>
            <div className="space-y-2">
              {schedules.map((schedule, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1 relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="time"
                      value={schedule}
                      onChange={(e) => updateSchedule(index, e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0F3C4C] focus:border-[#0F3C4C] outline-none"
                      required
                    />
                  </div>
                  {schedules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSchedule(index)}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addSchedule}
              className="mt-2 flex items-center gap-2 text-[#0F3C4C] text-sm font-semibold active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              Adicionar Horário
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ex: Tomar após as refeições"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0F3C4C] focus:border-[#0F3C4C] outline-none resize-none"
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <div className="flex gap-3">
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
            <button
              type="button"
              onClick={handleDeactivate}
              disabled={loading}
              className="w-full py-3 border-2 border-red-600 text-red-600 rounded-xl font-semibold active:bg-red-50 transition disabled:opacity-50"
            >
              Desativar Medicamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
