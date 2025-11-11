import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Pill } from 'lucide-react';

type TopItem = { label: string; count: number };

type ClientRef = { id: string; name: string };

type MedicationRef = {
  id: string;
  name: string;
  client_id: string;
  total_quantity?: number;
  remaining_doses?: number;
};

type PharmacyOverviewProps = {
  pharmacyId: string;
};

export default function PharmacyOverview({ pharmacyId }: PharmacyOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [medications, setMedications] = useState<MedicationRef[]>([]);
  const [clients, setClients] = useState<ClientRef[]>([]);
  const [takenDoses, setTakenDoses] = useState<{ medication_id: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [{ data: meds, error: medsErr }, { data: doses, error: dosesErr }, { data: clientsData, error: clientsErr }] = await Promise.all([
          supabase
            .from('medications')
            .select('id,name,client_id,total_quantity,remaining_doses')
            .eq('pharmacy_id', pharmacyId),
          supabase
            .from('dose_records')
            .select('medication_id,status')
            .eq('pharmacy_id', pharmacyId)
            .eq('status', 'taken'),
          supabase
            .from('clients')
            .select('id,name')
            .eq('pharmacy_id', pharmacyId),
        ]);

        if (medsErr) throw medsErr;
        if (dosesErr) throw dosesErr;
        if (clientsErr) throw clientsErr;

        setMedications(meds || []);
        setTakenDoses((doses || []).map(d => ({ medication_id: d.medication_id })));
        setClients(clientsData || []);
      } catch (e: any) {
        setError(e.message || 'Erro ao carregar overview');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [pharmacyId]);

  const topRegistered: TopItem[] = useMemo(() => {
    const counts = new Map<string, number>();
    for (const med of medications) {
      counts.set(med.name, (counts.get(med.name) || 0) + 1);
    }
    const items = Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
    items.sort((a, b) => b.count - a.count);
    return items.slice(0, 5);
  }, [medications]);

  const topUsed: TopItem[] = useMemo(() => {
    const medIdToName = new Map<string, string>();
    for (const med of medications) medIdToName.set(med.id, med.name);
    const counts = new Map<string, number>();
    for (const d of takenDoses) {
      const name = medIdToName.get(d.medication_id) || 'Desconhecido';
      counts.set(name, (counts.get(name) || 0) + 1);
    }
    const items = Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
    items.sort((a, b) => b.count - a.count);
    return items.slice(0, 5);
  }, [takenDoses, medications]);

  const runningOut = useMemo(() => {
    const threshold = 5; // considerar acabando quando restam ≤ 5 doses
    const clientNameById = new Map<string, string>();
    for (const c of clients) clientNameById.set(c.id, c.name);
    return medications
      .filter(m => typeof m.remaining_doses === 'number' && (m.remaining_doses || 0) <= threshold)
      .map(m => ({
        id: m.id,
        name: m.name,
        client: clientNameById.get(m.client_id) || '—',
        remaining: m.remaining_doses ?? 0,
      }))
      .sort((a, b) => a.remaining - b.remaining)
      .slice(0, 10);
  }, [medications, clients]);

  const maxRegistered = Math.max(...topRegistered.map(i => i.count), 1);
  const maxUsed = Math.max(...topUsed.map(i => i.count), 1);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-md p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-[#0F3C4C] p-2 rounded-lg">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Visão Geral de Medicamentos</h3>
        </div>
        {loading ? (
          <p className="text-sm text-gray-600">Carregando métricas...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Mais Cadastrados</h4>
              <div className="space-y-2">
                {topRegistered.length === 0 && (
                  <p className="text-xs text-gray-500">Sem dados</p>
                )}
                {topRegistered.map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs text-gray-700">
                      <span className="font-medium">{item.label}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-[#0F3C4C] rounded-full"
                        style={{ width: `${Math.round((item.count / maxRegistered) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Mais Usados (doses tomadas)</h4>
              <div className="space-y-2">
                {topUsed.length === 0 && (
                  <p className="text-xs text-gray-500">Sem dados</p>
                )}
                {topUsed.map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs text-gray-700">
                      <span className="font-medium">{item.label}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-emerald-600 rounded-full"
                        style={{ width: `${Math.round((item.count / maxUsed) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-700">Acabando (≤ 5 doses)</h4>
                <span className="text-xs text-gray-500">{runningOut.length} itens</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="py-2 pr-3">Medicamento</th>
                      <th className="py-2 pr-3">Cliente</th>
                      <th className="py-2">Restantes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runningOut.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-3 text-gray-500">Nenhum item acabando</td>
                      </tr>
                    ) : (
                      runningOut.map(item => (
                        <tr key={item.id} className="border-t border-gray-200">
                          <td className="py-2 pr-3 font-medium text-gray-800">{item.name}</td>
                          <td className="py-2 pr-3 text-gray-700">{item.client}</td>
                          <td className="py-2 text-gray-800">
                            <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-700">{item.remaining}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}