import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Client, Medication } from '../lib/types';
import { supabase } from '../lib/supabase';

type PharmacyAddMedicationModalProps = {
  onClose: () => void;
  onAdd: (medication: Omit<Medication, 'id' | 'created_at' | 'updated_at'>, clientId: string) => Promise<void>;
  pharmacyId: string;
  client?: Client;
};

export default function PharmacyAddMedicationModal({ onClose, onAdd, pharmacyId, client }: PharmacyAddMedicationModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    client_id: client?.id || '',
    name: '',
    dosage: '',
    unit: 'mg',
    treatment_duration_days: '30',
    start_date: new Date().toISOString().split('T')[0],
    notes: '',
    recurrence_type: 'continuous',
  });
  const [customDates, setCustomDates] = useState<string[]>([]);
  const [schedules, setSchedules] = useState<string[]>(['']);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!client) {
      loadClients();
    }
  }, [pharmacyId, client]);

  useEffect(() => {
    if (client && client.id !== formData.client_id) {
      setFormData(prev => ({ ...prev, client_id: client.id }));
    }
  }, [client]);

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
    const isPRN = formData.recurrence_type === 'custom' && customDates.filter(d => d.trim() !== '').length === 0;
    if (validSchedules.length === 0 && !isPRN) {
      newErrors.schedules = 'Adicione pelo menos um horário';
    }

    // Para PRN (custom sem datas), permitir sem datas

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
        dosage: `${formData.dosage.trim()}${formData.unit}`,
        schedules: validSchedules.join(', '),
        total_quantity: undefined,
        treatment_duration_days: parseInt(formData.treatment_duration_days),
        start_date: formData.start_date,
        notes: formData.notes.trim() || undefined,
        recurrence_type: formData.recurrence_type as any,
        recurrence_custom_dates: formData.recurrence_type === 'custom' ? customDates.filter(d => d).join(', ') : undefined,
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
          {client ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
              <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800">
                {client.name}
              </div>
            </div>
          ) : (
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
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.client_id && (
                <p className="text-red-600 text-sm mt-1">{errors.client_id}</p>
              )}
            </div>
          )}

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
        <label className="block text-sm font-medium text-gray-700 mb-2">Dosagem *</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.dosage}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              setFormData({ ...formData, dosage: value });
            }}
            placeholder="Ex: 10"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F3C4C] focus:border-transparent outline-none"
          />
          <select
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F3C4C] focus:border-transparent outline-none bg-white"
          >
            <option value="mg">mg</option>
            <option value="g">g</option>
            <option value="ml">ml</option>
            <option value="comprimido">comprimido</option>
            <option value="cápsula">cápsula</option>
            <option value="gota">gota</option>
            <option value="gotas">gotas</option>
          </select>
        </div>
        {errors.dosage && (
          <p className="text-red-600 text-sm mt-1">{errors.dosage}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Tratamento</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'continuous', label: 'Contínuo (diário)' },
            { value: 'weekly', label: 'Semanal' },
            { value: 'biweekly', label: 'Quinzenal' },
            { value: 'monthly', label: 'Mensal' },
            { value: 'custom', label: 'Datas específicas' },
          ].map(opt => (
            <label key={opt.value} className={`px-3 py-2 rounded-lg border cursor-pointer ${formData.recurrence_type === opt.value ? 'border-[#0F3C4C] text-[#0F3C4C] font-semibold' : 'border-gray-300 text-gray-700'}`}>
              <input
                type="radio"
                name="recurrence_type"
                value={opt.value}
                checked={formData.recurrence_type === opt.value}
                onChange={(e) => setFormData({ ...formData, recurrence_type: e.target.value })}
                className="mr-2"
              />
              {opt.label}
            </label>
          ))}
        </div>
        {errors.recurrence && (
          <p className="text-red-600 text-sm mt-1">{errors.recurrence}</p>
        )}
      </div>

      {formData.recurrence_type === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Datas específicas</label>
          <div className="space-y-2">
            {customDates.map((d, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="date"
                  value={d}
                  onChange={(e) => {
                    const next = [...customDates];
                    next[idx] = e.target.value;
                    setCustomDates(next);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F3C4C] focus:border-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={() => setCustomDates(customDates.filter((_, i) => i !== idx))}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setCustomDates([...customDates, ''])}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-[#0F3C4C] hover:text-[#0F3C4C] transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar data
            </button>
          </div>
        </div>
      )}

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
