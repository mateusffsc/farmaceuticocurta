import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Client, Medication } from '../lib/types';
import { supabase } from '../lib/supabase';

type PharmacyAddMedicationModalProps = {
  onClose: () => void;
  onAdd: (medication: Omit<Medication, 'id' | 'created_at' | 'updated_at'>, clientId: string) => Promise<void>;
  pharmacyId: string;
};

export default function PharmacyAddMedicationModal({ onClose, onAdd, pharmacyId }: PharmacyAddMedicationModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    client_id: '',
    name: '',
    dosage: '',
    treatment_duration_days: '30',
    start_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [schedules, setSchedules] = useState<string[]>(['']);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClients();
  }, [pharmacyId]);

  const loadClients = async () => {
    try {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .order('name');

      if (data) setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.client_id) {
      newErrors.client_id = 'Selecione um cliente';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.dosage.trim()) {
      newErrors.dosage = 'Dosagem é obrigatória';
    } else if (!/^\d+$/.test(formData.dosage)) {
      newErrors.dosage = 'Digite apenas números';
    }

    const validSchedules = schedules.filter(s => s.trim() !== '');
    if (validSchedules.length === 0) {
      newErrors.schedules = 'Adicione pelo menos um horário';
    }

    if (!formData.treatment_duration_days || parseInt(formData.treatment_duration_days) < 1) {
      newErrors.treatment_duration_days = 'Duração deve ser pelo menos 1 dia';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const validSchedules = schedules.filter(s => s.trim() !== '');
      await onAdd({
        pharmacy_id: pharmacyId,
        client_id: formData.client_id,
        name: formData.name.trim(),
        dosage: `${formData.dosage.trim()}mg`,
        schedules: validSchedules.join(', '),
        total_quantity: undefined,
        treatment_duration_days: parseInt(formData.treatment_duration_days),
        start_date: formData.start_date,
        notes: formData.notes.trim() || undefined,
      }, formData.client_id);
    } catch (error: any) {
      setErrors({ general: error.message || 'Erro ao adicionar medicamento' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#0F3C4C]">
            Adicionar Medicamento
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente *
            </label>
            <select
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F3C4C] focus:border-transparent outline-none"
            >
              <option value="">Selecione um cliente</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {errors.client_id && (
              <p className="text-red-600 text-sm mt-1">{errors.client_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Medicamento *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Losartana"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F3C4C] focus:border-transparent outline-none"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dosagem *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.dosage}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, dosage: value });
                }}
                placeholder="Ex: 50"
                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F3C4C] focus:border-transparent outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                mg
              </span>
            </div>
            {errors.dosage && (
              <p className="text-red-600 text-sm mt-1">{errors.dosage}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Horários *
            </label>
            <div className="space-y-2">
              {schedules.map((schedule, index) => (
                <div key={index} className="flex gap-2">
                  <select
                    value={schedule}
                    onChange={(e) => {
                      const newSchedules = [...schedules];
                      newSchedules[index] = e.target.value;
                      setSchedules(newSchedules);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F3C4C] focus:border-transparent outline-none"
                  >
                    <option value="">Selecione um horário</option>
                    <option value="00:00">00:00</option>
                    <option value="01:00">01:00</option>
                    <option value="02:00">02:00</option>
                    <option value="03:00">03:00</option>
                    <option value="04:00">04:00</option>
                    <option value="05:00">05:00</option>
                    <option value="06:00">06:00</option>
                    <option value="07:00">07:00</option>
                    <option value="08:00">08:00</option>
                    <option value="09:00">09:00</option>
                    <option value="10:00">10:00</option>
                    <option value="11:00">11:00</option>
                    <option value="12:00">12:00</option>
                    <option value="13:00">13:00</option>
                    <option value="14:00">14:00</option>
                    <option value="15:00">15:00</option>
                    <option value="16:00">16:00</option>
                    <option value="17:00">17:00</option>
                    <option value="18:00">18:00</option>
                    <option value="19:00">19:00</option>
                    <option value="20:00">20:00</option>
                    <option value="21:00">21:00</option>
                    <option value="22:00">22:00</option>
                    <option value="23:00">23:00</option>
                  </select>
                  {schedules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setSchedules(schedules.filter((_, i) => i !== index))}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSchedules([...schedules, ''])}
                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-[#0F3C4C] hover:text-[#0F3C4C] transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar horário
              </button>
            </div>
            {errors.schedules && (
              <p className="text-red-600 text-sm mt-1">{errors.schedules}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duração do Tratamento (dias) *
            </label>
            <input
              type="number"
              value={formData.treatment_duration_days}
              onChange={(e) => setFormData({ ...formData, treatment_duration_days: e.target.value })}
              placeholder="Ex: 30"
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F3C4C] focus:border-transparent outline-none"
            />
            {errors.treatment_duration_days && (
              <p className="text-red-600 text-sm mt-1">{errors.treatment_duration_days}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Início *
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F3C4C] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Instruções especiais, observações..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F3C4C] focus:border-transparent outline-none resize-none"
            />
          </div>

          {errors.general && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {errors.general}
            </div>
          )}

          <div className="flex gap-3 pt-4">
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
              {loading ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
