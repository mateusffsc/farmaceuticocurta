import { useState } from 'react';
import { Building2, Mail, Lock, Phone } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { isValidPhone } from '../lib/authUtils';

type PharmacyLoginProps = {
  onLogin: () => void;
  onSwitchToClient: () => void;
};

export default function PharmacyLogin({ onLogin, onSwitchToClient }: PharmacyLoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    identifier: '',
    password: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { loginPharmacy, registerPharmacy } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegistering) {
        await registerPharmacy({ ...formData, identifier: formData.identifier });
      } else {
        await loginPharmacy(formData.identifier, formData.password);
      }
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Erro ao processar. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F3C4C] to-[#1a5768] flex items-center justify-center p-4 safe-top safe-bottom">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-[#0F3C4C] p-3.5 rounded-full mb-3">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#0F3C4C] mb-1.5">
            {isRegistering ? 'Cadastro de Farmácia' : 'Login - Farmácia'}
          </h1>
          <p className="text-gray-600 text-center text-sm">
            {isRegistering
              ? 'Cadastre sua farmácia e gerencie clientes'
              : 'Acesse o painel da sua farmácia'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome da Farmácia
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Farmácia São Paulo"
                className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0F3C4C] focus:border-[#0F3C4C] outline-none text-base"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email ou Telefone
            </label>
            <div className="relative">
              {isValidPhone(formData.identifier) ? <Phone className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" /> : <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />}
              <input
                type="text"
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                placeholder="seu@email.com ou (11) 99999-9999"
                className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0F3C4C] focus:border-[#0F3C4C] outline-none text-base"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0F3C4C] focus:border-[#0F3C4C] outline-none text-base"
                required
                minLength={6}
              />
            </div>
          </div>

          {isRegistering && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Telefone (opcional)
                </label>
                <input
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0F3C4C] focus:border-[#0F3C4C] outline-none text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Endereço (opcional)
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, número, bairro, cidade"
                  className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0F3C4C] focus:border-[#0F3C4C] outline-none text-base"
                />
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0F3C4C] text-white py-4 rounded-xl font-bold text-base active:bg-[#0d3340] transition disabled:opacity-50 active:scale-95 shadow-md"
          >
            {loading ? 'Processando...' : isRegistering ? 'Cadastrar Farmácia' : 'Entrar'}
          </button>
        </form>

        <div className="mt-5 text-center space-y-3">
          <div className="border-t border-gray-200 pt-3">
            <button
              onClick={onSwitchToClient}
              className="text-gray-600 active:text-[#0F3C4C] text-sm font-medium"
            >
              Acessar como Cliente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}