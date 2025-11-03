import { useState } from 'react';
import { X, Plus, Trash2, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

type ClientAddMedicationModalProps = {
  clientId: string;
  pharmacyId: string;
  onClose: () => void;
  onAdded: () => void;
};

export default function ClientAddMedicationModal({
  clientId,
  pharmacyId,
  onClose,
  onAdded,
}: ClientAddMedicationModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    treatment_duration_days: '30',
    start_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [schedules, setSchedules] = useState<string[]>(['08:00']);
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
      const dosageValue = formData.dosage.trim();
      const dosageWithUnit = dosageValue.match(/mg|g|ml|comprimido|cápsula/i)
        ? dosageValue
        : `${dosageValue}mg`;

      const { data: medication, error: medError } = await supabase
        .from('medications')
        .insert([{
          pharmacy_id: pharmacyId,
          client_id: clientId,
          name: formData.name.trim(),
          dosage: dosageWithUnit,
          schedules: validSchedules.join(', '),
          treatment_duration_days: parseInt(formData.treatment_duration_days),
          start_date: formData.start_date,
          notes: formData.notes.trim() || null,
          is_active: true,
        }])
        .select()
        .single();

      if (medError) throw medError;

      const startDate = new Date(formData.start_date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + parseInt(formData.treatment_duration_days));

      const doseRecords = [];
      const currentDate = new Date(startDate);

      while (currentDate < endDate) {
        for (const schedule of validSchedules) {
          const [hours, minutes] = schedule.split(':');
          const scheduledTime = new Date(currentDate);
          scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          doseRecords.push({
            medication_id: medication.id,
            pharmacy_id: pharmacyId,
            client_id: clientId,
            scheduled_time: scheduledTime.toISOString(),
            status: 'pending',
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const { error: doseError } = await supabase
        .from('dose_records')
        .insert(doseRecords);

      if (doseError) throw doseError;

      onAdded();
      onClose();
    } catch (error) {
      console.error('Error adding medication:', error);
      alert('Erro ao adicionar medicamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto safe-bottom">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Adicionar Medicamento</h2>
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
            <input
              type="text"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              placeholder="Ex: 500mg ou 1 comprimido"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0F3C4C] focus:border-[#0F3C4C] outline-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Digite com a unidade (mg, g, ml, comprimido, cápsula)
            </p>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Data de Início *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0F3C4C] focus:border-[#0F3C4C] outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Duração (dias) *
              </label>
              <input
                type="number"
                min="1"
                value={formData.treatment_duration_days}
                onChange={(e) => setFormData({ ...formData, treatment_duration_days: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0F3C4C] focus:border-[#0F3C4C] outline-none"
                required
              />
            </div>
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
              {loading ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
