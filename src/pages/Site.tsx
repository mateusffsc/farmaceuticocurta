import { Building2, Pill, Calendar, Activity, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Site() {
  const goPharmacy = () => { if (typeof window !== 'undefined') window.location.href = '/farmacia'; };
  const goClient = () => { if (typeof window !== 'undefined') window.location.href = '/'; };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F3C4C] via-[#134a5c] to-[#1a5768] text-white">
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 rounded-xl p-2">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold">Farmacêutico Curta</div>
            <div className="text-xs text-white/70">Aderência e saúde conectadas</div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <button onClick={goPharmacy} className="px-4 py-2 rounded-xl bg-white text-[#0F3C4C] font-semibold hover:bg-white/90 transition">Acessar como Farmácia</button>
          <button onClick={goClient} className="px-4 py-2 rounded-xl bg-[#CBAA63] text-[#0F3C4C] font-bold hover:brightness-95 transition">Acessar como Cliente</button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-10 pb-14">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">Acompanhe tratamentos, melhore a aderência e cuide melhor de pessoas</h1>
            <p className="mt-4 text-white/85 text-lg">Uma plataforma moderna que integra farmácias e clientes para organizar medicações, acompanhar sinais vitais e agir rápido diante de eventos adversos.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={goPharmacy} className="px-6 py-3 rounded-2xl bg-white text-[#0F3C4C] font-semibold hover:bg-white/90 transition flex items-center gap-2">Acessar como Farmácia <ArrowRight className="w-4 h-4" /></button>
              <button onClick={goClient} className="px-6 py-3 rounded-2xl bg-[#CBAA63] text-[#0F3C4C] font-bold hover:brightness-95 transition">Acessar como Cliente</button>
            </div>
            <div className="mt-6 flex items-center gap-4 text-white/80">
              <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Segurança com RLS</div>
              <div className="flex items-center gap-2"><Activity className="w-5 h-5" /> Insights de saúde</div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 bg-white/10 blur-3xl rounded-3xl" />
            <div className="relative grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
                <div className="flex items-center gap-2 text-white/85"><Calendar className="w-4 h-4" /> Agenda diária</div>
                <div className="mt-3 space-y-2">
                  <div className="bg-white/15 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">Losartana 50mg</div>
                        <div className="text-xs text-white/70">08:00 • 20:00</div>
                      </div>
                      <div className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-200 font-semibold">Tomada</div>
                    </div>
                  </div>
                  <div className="bg-white/15 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">Metformina 500mg</div>
                        <div className="text-xs text-white/70">07:00 • 19:00</div>
                      </div>
                      <div className="px-2 py-1 text-xs rounded-full bg-amber-500/20 text-amber-200 font-semibold">Pendente</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
                <div className="flex items-center gap-2 text-white/85"><Activity className="w-4 h-4" /> Sinais vitais</div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="bg-white/15 rounded-xl p-3 text-center">
                    <div className="text-xs text-white/70">PA</div>
                    <div className="text-2xl font-bold">120/80</div>
                  </div>
                  <div className="bg-white/15 rounded-xl p-3 text-center">
                    <div className="text-xs text-white/70">Glicemia</div>
                    <div className="text-2xl font-bold">98</div>
                  </div>
                </div>
                <div className="mt-3 bg-white/15 rounded-xl p-3">
                  <div className="text-xs text-white/70">Aderência</div>
                  <div className="mt-1 w-full bg-white/20 rounded-full h-2">
                    <div className="h-2 rounded-full bg-[#CBAA63]" style={{ width: '86%' }} />
                  </div>
                  <div className="mt-1 text-xs text-white/80">86%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white text-[#0F3C4C]">
        <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-gray-800 font-semibold"><Calendar className="w-5 h-5" /> Agenda inteligente</div>
            <p className="mt-2 text-sm text-gray-600">Programação de doses com status claro e geração automática de registros.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-gray-800 font-semibold"><Activity className="w-5 h-5" /> Saúde integrada</div>
            <p className="mt-2 text-sm text-gray-600">Registro de sinais vitais e eventos adversos com contexto por dose.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-gray-800 font-semibold"><ShieldCheck className="w-5 h-5" /> Segurança</div>
            <p className="mt-2 text-sm text-gray-600">Isolamento por farmácia e políticas RLS em todas as tabelas.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-gray-800 font-semibold"><Building2 className="w-5 h-5" /> Painel da farmácia</div>
            <p className="mt-2 text-sm text-gray-600">Visão de clientes, aderência e campanhas de anúncios.</p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="rounded-3xl bg-white/10 backdrop-blur p-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/15 rounded-2xl p-5">
              <div className="font-semibold">Agenda diária</div>
              <div className="mt-3 space-y-2">
                {['08:00 • Losartana 50mg', '12:00 • Ácido fólico 5mg', '20:00 • Losartana 50mg'].map((t) => (
                  <div key={t} className="flex items-center justify-between bg-white/10 rounded-xl p-3">
                    <div className="text-sm">{t}</div>
                    <div className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-200">tomada</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/15 rounded-2xl p-5">
              <div className="font-semibold">Sinais vitais</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <div className="text-xs text-white/70">PA</div>
                  <div className="text-2xl font-bold">118/76</div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <div className="text-xs text-white/70">Glicemia</div>
                  <div className="text-2xl font-bold">94</div>
                </div>
              </div>
            </div>
            <div className="bg-white/15 rounded-2xl p-5">
              <div className="font-semibold">Aderência</div>
              <div className="mt-3">
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="h-2 rounded-full bg-[#CBAA63]" style={{ width: '82%' }} />
                </div>
                <div className="mt-1 text-sm">82%</div>
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={goPharmacy} className="px-6 py-3 rounded-2xl bg-white text-[#0F3C4C] font-semibold hover:bg-white/90 transition">Acessar como Farmácia</button>
            <button onClick={goClient} className="px-6 py-3 rounded-2xl bg-[#CBAA63] text-[#0F3C4C] font-bold hover:brightness-95 transition">Acessar como Cliente</button>
          </div>
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-white/70">
        <div className="max-w-6xl mx-auto">
          <div className="text-sm">© {new Date().getFullYear()} Farmacêutico Curta</div>
        </div>
      </footer>
    </div>
  );
}
