import { useState } from 'react';
import { User, Phone, Lock, CheckCircle, AlertCircle } from 'lucide-react';

export default function RecuperarSenha() {
  const [formData, setFormData] = useState({ phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const phone = formData.phone.trim();
    const password = formData.password;
    const confirm = formData.confirm;
    const digitsCandidate = phone.replace(/\D/g, '');

    if (!digitsCandidate || digitsCandidate.length !== 11 || !/^[1-9]/.test(digitsCandidate)) {
      setError('Telefone inválido. Use 11 dígitos, ex: 31973223898');
      return;
    }
    if (!password || password.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      const digits = digitsCandidate;
      const fnBase = import.meta.env.VITE_SUPABASE_URL?.replace('.supabase.co', '.functions.supabase.co');
      const url = import.meta.env.DEV ? '/edge/update-password' : `${fnBase}/update-password`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone: digits, newPassword: password }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          let message = text;
          let parsedError: string | undefined;
          try {
            const parsed: { error?: string } = JSON.parse(text);
            parsedError = parsed.error;
          } catch {
            parsedError = undefined;
          }
          if (parsedError) {
            message = parsedError;
          }
          setError(message || `Erro ${res.status} ao alterar senha`);
          return;
        }
        const payload = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (payload.ok) {
          setSuccess('Senha alterada com sucesso. Você já pode entrar.');
        } else {
          setError(payload.error || 'Falha ao alterar senha');
        }
      } catch (err: unknown) {
        const message = err instanceof DOMException && err.name === 'AbortError'
          ? 'Tempo excedido ao comunicar com o servidor. Tente novamente.'
          : err instanceof Error
            ? err.message
            : 'Falha de rede ao alterar senha';
        setError(message);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao iniciar recuperação de senha';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F3C4C] to-[#1a5768] flex items-center justify-center p-4 safe-top safe-bottom">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-[#0F3C4C] p-3.5 rounded-full mb-3">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#0F3C4C] mb-1.5">Recuperar Senha</h1>
          <p className="text-gray-600 text-center text-sm">Informe seu telefone e defina a nova senha</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Telefone</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
                className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0F3C4C] focus:border-[#0F3C4C] outline-none text-base"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nova senha</label>
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmar nova senha</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={formData.confirm}
                onChange={(e) => setFormData({ ...formData, confirm: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0F3C4C] focus:border-[#0F3C4C] outline-none text-base"
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">
              <CheckCircle className="w-5 h-5" />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0F3C4C] text-white py-4 rounded-xl font-bold text-base active:bg-[#0d3340] transition disabled:opacity-50 active:scale-95 shadow-md"
          >
            {loading ? 'Processando...' : 'Recuperar Senha'}
          </button>

          <div className="mt-3 text-center">
            <a href="/" className="text-gray-600 active:text-[#0F3C4C] text-sm font-medium">Voltar ao login</a>
          </div>
        </form>
      </div>
    </div>
  );
}
