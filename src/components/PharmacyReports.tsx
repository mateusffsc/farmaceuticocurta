import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import PharmacyAdsManager from './PharmacyAdsManager';
import { BarChart2, Users, CheckCircle, AlertCircle } from 'lucide-react';

type Client = { id: string; name: string; phone?: string };
type Medication = { id: string; name: string; client_id: string; is_active?: boolean; remaining_doses?: number };
type DoseRecord = { id: string; client_id: string; medication_id: string; scheduled_time: string; status: 'pending' | 'taken' | 'skipped' };

type PharmacyReportsProps = {
  pharmacyId: string;
};

type TimeRange = '7d' | '30d';

export default function PharmacyReports({ pharmacyId }: PharmacyReportsProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [doses, setDoses] = useState<DoseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<TimeRange>('30d');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [cRes, mRes, dRes] = await Promise.all([
          supabase.from('clients').select('id,name,phone').eq('pharmacy_id', pharmacyId),
          supabase.from('medications').select('id,name,client_id,is_active,remaining_doses').eq('pharmacy_id', pharmacyId),
          supabase.from('dose_records').select('id,client_id,medication_id,scheduled_time,status').eq('pharmacy_id', pharmacyId),
        ]);

        if (cRes.error) throw cRes.error;
        if (mRes.error) throw mRes.error;
        if (dRes.error) throw dRes.error;

        setClients(cRes.data || []);
        setMedications(mRes.data || []);
        setDoses(dRes.data || []);
      } catch (e: any) {
        setError(e.message || 'Erro ao carregar relatórios');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [pharmacyId]);

  const LOW_STOCK_THRESHOLD = 5;

  const now = new Date();
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999);

  const rangeDays = range === '7d' ? 7 : 30;
  const startOfRange = new Date(now); startOfRange.setDate(startOfRange.getDate() - rangeDays); startOfRange.setHours(0, 0, 0, 0);

  const dosesToday = useMemo(() => {
    const todayDoses = doses.filter(d => {
      const t = new Date(d.scheduled_time);
      return t >= startOfToday && t <= endOfToday;
    });
    const total = todayDoses.length;
    const taken = todayDoses.filter(d => d.status === 'taken').length;
    const pending = todayDoses.filter(d => d.status === 'pending').length;
    const skipped = todayDoses.filter(d => d.status === 'skipped').length;
    return { total, taken, pending, skipped };
  }, [doses]);

  const adherenceOverall = useMemo(() => {
    const ranged = doses.filter(d => {
      const t = new Date(d.scheduled_time);
      return t >= startOfRange && t <= now;
    });
    const total = ranged.length || 1;
    const taken = ranged.filter(d => d.status === 'taken').length;
    const pct = Math.round((taken / total) * 100);
    return { total, taken, pct };
  }, [doses, range]);

  const topMedicationsUsed = useMemo(() => {
    const medIdToName = new Map<string, string>();
    medications.forEach(m => medIdToName.set(m.id, m.name));
    const counts = new Map<string, number>();
    doses
      .filter(d => {
        const t = new Date(d.scheduled_time);
        return t >= startOfRange && t <= now && d.status === 'taken';
      })
      .forEach(d => {
        const name = medIdToName.get(d.medication_id) || 'Desconhecido';
        counts.set(name, (counts.get(name) || 0) + 1);
      });
    const items = Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
    items.sort((a, b) => b.count - a.count);
    return items.slice(0, 5);
  }, [doses, medications, range]);

  const clientNameById = useMemo(() => {
    const m = new Map<string, string>();
    clients.forEach(c => m.set(c.id, c.name));
    return m;
  }, [clients]);

  const clientsById = useMemo(() => {
    const m = new Map<string, { name: string; phone?: string }>();
    clients.forEach(c => m.set(c.id, { name: c.name, phone: c.phone }));
    return m;
  }, [clients]);

  const lowAdherenceClients = useMemo(() => {
    const byClient = new Map<string, { total: number; taken: number }>();
    doses
      .filter(d => {
        const t = new Date(d.scheduled_time);
        return t >= startOfRange && t <= now;
      })
      .forEach(d => {
        const agg = byClient.get(d.client_id) || { total: 0, taken: 0 };
        agg.total += 1;
        if (d.status === 'taken') agg.taken += 1;
        byClient.set(d.client_id, agg);
      });
    const rows = Array.from(byClient.entries()).map(([clientId, { total, taken }]) => ({
      clientId,
      name: clientNameById.get(clientId) || '—',
      pct: total ? Math.round((taken / total) * 100) : 0,
      total,
    }));
    rows.sort((a, b) => a.pct - b.pct);
    return rows.slice(0, 10);
  }, [doses, clientNameById, range]);

  const activeMedications = useMemo(() => medications.filter(m => m.is_active !== false).length, [medications]);

  const maxMedUsed = Math.max(...topMedicationsUsed.map(i => i.count), 1);

  const lowStockRows = useMemo(() => {
    const rows = medications
      .filter(m => (m.remaining_doses ?? Infinity) <= LOW_STOCK_THRESHOLD)
      .map(m => {
        const info = clientsById.get(m.client_id);
        return {
          clientId: m.client_id,
          clientName: info?.name || '—',
          phone: info?.phone,
          medicationName: m.name,
          remaining: m.remaining_doses ?? 0,
        };
      });
    rows.sort((a, b) => a.remaining - b.remaining);
    return rows.slice(0, 30);
  }, [medications, clientsById]);

  const buildWhatsAppLink = (phone: string | undefined, clientName: string, medicationName: string) => {
    if (!phone) return undefined;
    const digits = phone.replace(/\D/g, '');
    const normalized = digits.startsWith('55') ? digits : (digits.length >= 10 ? `55${digits}` : digits);
    const text = encodeURIComponent(`Olá ${clientName}, seu medicamento ${medicationName} está acabando. Podemos te ajudar a repor?`);
    return `https://wa.me/${normalized}?text=${text}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-[#0F3C4C] p-2 rounded-lg">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Relatórios</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRange('7d')}
            className={`px-3 py-1.5 rounded-lg text-sm border ${range === '7d' ? 'bg-[#0F3C4C] text-white border-transparent' : 'bg-white text-gray-700 border-gray-300'}`}
          >7 dias</button>
          <button
            onClick={() => setRange('30d')}
            className={`px-3 py-1.5 rounded-lg text-sm border ${range === '30d' ? 'bg-[#0F3C4C] text-white border-transparent' : 'bg-white text-gray-700 border-gray-300'}`}
          >30 dias</button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-600">Carregando dados...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <div className="space-y-4">
          {/* Anúncios */}
          <PharmacyAdsManager pharmacyId={pharmacyId} />

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-600">Clientes</div>
              <div className="text-2xl font-bold text-gray-800">{clients.length}</div>
              <div className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Users className="w-3 h-3" /> Total</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-600">Medicamentos Ativos</div>
              <div className="text-2xl font-bold text-gray-800">{activeMedications}</div>
              <div className="text-xs text-gray-500">Em acompanhamento</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-600">Adesão ({range})</div>
              <div className="text-2xl font-bold text-gray-800">{adherenceOverall.pct}%</div>
              <div className="text-xs text-gray-500">{adherenceOverall.taken}/{adherenceOverall.total} doses</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-600">Doses Hoje</div>
              <div className="text-2xl font-bold text-gray-800">{dosesToday.total}</div>
              <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle className="w-3 h-3" />{dosesToday.taken}</span>
                <span className="inline-flex items-center gap-1 text-amber-700">P:{dosesToday.pending}</span>
                <span className="inline-flex items-center gap-1 text-red-700"><AlertCircle className="w-3 h-3" />{dosesToday.skipped}</span>
              </div>
            </div>
          </div>

          {/* Top usados */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Medicamentos Usados ({range})</h4>
            <div className="space-y-2">
              {topMedicationsUsed.length === 0 && <p className="text-xs text-gray-500">Sem dados</p>}
              {topMedicationsUsed.map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs text-gray-700">
                    <span className="font-medium">{item.label}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-[#0F3C4C] rounded-full"
                      style={{ width: `${Math.round((item.count / maxMedUsed) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Baixa adesão por cliente */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700">Clientes com Baixa Adesão ({range})</h4>
              <span className="text-xs text-gray-500">TOP 10</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-3">Cliente</th>
                    <th className="py-2 pr-3">Adesão</th>
                    <th className="py-2">Doses no período</th>
                  </tr>
                </thead>
                <tbody>
                  {lowAdherenceClients.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-3 text-gray-500">Sem dados</td>
                    </tr>
                  ) : (
                    lowAdherenceClients.map(row => (
                      <tr key={row.clientId} className="border-t border-gray-200">
                        <td className="py-2 pr-3 font-medium text-gray-800">{row.name}</td>
                        <td className="py-2 pr-3">
                          <span className={`inline-block px-2 py-1 rounded text-xs ${row.pct < 60 ? 'bg-red-100 text-red-700' : row.pct < 80 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{row.pct}%</span>
                        </td>
                        <td className="py-2 text-gray-700">{row.total}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Clientes com medicamentos no fim */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700">Clientes com Medicamentos no Fim</h4>
              <span className="text-xs text-gray-500">Threshold: ≤ {LOW_STOCK_THRESHOLD} doses</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-3">Cliente</th>
                    <th className="py-2 pr-3">Telefone</th>
                    <th className="py-2 pr-3">Medicamento</th>
                    <th className="py-2 pr-3">Doses restantes</th>
                    <th className="py-2">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-3 text-gray-500">Sem dados</td>
                    </tr>
                  ) : (
                    lowStockRows.map((row, idx) => {
                      const waLink = buildWhatsAppLink(row.phone, row.clientName, row.medicationName);
                      return (
                        <tr key={`${row.clientId}-${idx}`} className="border-t border-gray-200">
                          <td className="py-2 pr-3 font-medium text-gray-800">{row.clientName}</td>
                          <td className="py-2 pr-3 text-gray-700">{row.phone || '—'}</td>
                          <td className="py-2 pr-3 text-gray-700">{row.medicationName}</td>
                          <td className="py-2 pr-3">
                            <span className={`px-2 py-1 rounded-lg text-xs ${row.remaining <= 2 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{row.remaining}</span>
                          </td>
                          <td className="py-2">
                            {waLink ? (
                              <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-lg active:bg-green-700 transition">
                                <span className="text-xs font-semibold">WhatsApp</span>
                              </a>
                            ) : (
                              <span className="text-xs text-gray-500">Sem telefone</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}