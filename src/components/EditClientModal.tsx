import { useState } from 'react';
import { X, User, Mail, Phone, Calendar, Key } from 'lucide-react';
import { Client } from '../lib/types';
import { supabase } from '../lib/supabase';
import { isValidPhone } from '../lib/authUtils';

type EditClientModalProps = {
  client: Client;
  onClose: () => void;
  onUpdated: () => void;
};

export default function EditClientModal({ client, onClose, onUpdated }: EditClientModalProps) {
  const [formData, setFormData] = useState({
    name: client.name,
    email: client.email || '',
    phone: client.phone || '',
    date_of_birth: client.date_of_birth || '',
    monitor_bp: client.monitor_bp || false,
    monitor_glucose: client.monitor_glucose || false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (!isValidPhone(formData.phone)) {
      newErrors.phone = 'Telefone inválido. Use formato: (11) 99999-9999';
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const phoneDigits = (() => {
        const d = formData.phone.replace(/\D/g, '');
        return d.startsWith('55') && d.length === 13 ? d.slice(2) : d;
      })();
      const { error } = await supabase
        .from('clients')
        .update({
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          phone: phoneDigits,
          date_of_birth: formData.date_of_birth || null,
          monitor_bp: formData.monitor_bp,
          monitor_glucose: formData.monitor_glucose,
        })
        .eq('id', client.id);

      if (error) throw error;
      onUpdated();
      onClose();
    } catch (error: any) {
      setErrors({ general: error.message || 'Erro ao atualizar cliente' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setResetMessage(null);
    const email = formData.email.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ ...errors, email: 'Informe um email válido para recuperar a senha' });
      return;
    }
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setResetMessage('Link de recuperação enviado para o email do cliente.');
    } catch (e: any) {
      setErrors({ general: e.message || 'Falha ao enviar recuperação de senha' });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#0F3C4C]">Editar Cliente</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: João da Silva"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F3C4C] focus:border-transparent outline-none"
              />
            </div>
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Telefone *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F3C4C] focus:border-transparent outline-none"
              />
            </div>
            {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email (opcional)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="cliente@email.com (opcional)"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F3C4C] focus:border-transparent outline-none"
              />
            </div>
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetPassword}
                className="inline-flex items-center gap-2 px-3 py-2 border border-[#0F3C4C] text-[#0F3C4C] rounded-lg hover:bg-[#0F3C4C] hover:text-white transition text-sm"
                disabled={resetLoading}
                title="Enviar link de recuperação de senha"
              >
                <Key className="w-4 h-4" />
                {resetLoading ? 'Enviando…' : 'Recuperar senha'}
              </button>
              {resetMessage && <span className="text-green-700 text-xs">{resetMessage}</span>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data de Nascimento (opcional)</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F3C4C] focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">Monitorar Pressão Arterial</p>
                <p className="text-xs text-gray-600">Habilita registro e acompanhamento de PA</p>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.monitor_bp}
                  onChange={(e) => setFormData({ ...formData, monitor_bp: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#0F3C4C] transition relative">
                  <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition peer-checked:translate-x-5" />
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">Monitorar Glicemia</p>
                <p className="text-xs text-gray-600">Habilita registro e acompanhamento de glicose</p>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.monitor_glucose}
                  onChange={(e) => setFormData({ ...formData, monitor_glucose: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[#0F3C4C] transition relative">
                  <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition peer-checked:translate-x-5" />
                </div>
              </label>
            </div>
          </div>

          {errors.general && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{errors.general}</div>
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
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
