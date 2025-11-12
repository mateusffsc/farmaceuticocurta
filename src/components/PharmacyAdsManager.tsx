import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { PharmacyAd } from '../lib/types';

type PharmacyAdsManagerProps = {
  pharmacyId: string;
};

export default function PharmacyAdsManager({ pharmacyId }: PharmacyAdsManagerProps) {
  const [ads, setAds] = useState<PharmacyAd[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAds = async () => {
    const { data, error } = await supabase
      .from('pharmacy_ads')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .order('is_active', { ascending: false })
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (!error) setAds(data || []);
  };

  useEffect(() => {
    loadAds();
  }, [pharmacyId]);

  const tryUpload = async (): Promise<string | null> => {
    if (!file) return null;
    const fileName = `${pharmacyId}/${Date.now()}_${file.name}`;
    try {
      const { data, error } = await supabase.storage
        .from('banners')
        .upload(fileName, file, { upsert: false });
      if (error) throw error;
      const { data: publicUrlData } = await supabase.storage
        .from('banners')
        .getPublicUrl(fileName);
      return publicUrlData.publicUrl || null;
    } catch (e) {
      console.error('Falha ao enviar arquivo para bucket banners.', e);
      return null;
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Selecione uma imagem para o anúncio.');
      return;
    }
    setSaving(true);
    try {
      const uploadedUrl = await tryUpload();
      const finalUrl = uploadedUrl;
      if (!finalUrl) throw new Error('Falha ao obter URL pública da imagem');
      const { error } = await supabase
        .from('pharmacy_ads')
        .insert([
          {
            pharmacy_id: pharmacyId,
            image_url: finalUrl,
            whatsapp_phone: phone || null,
            whatsapp_message: message || null,
            is_active: true,
          },
        ]);
      if (error) throw error;
      setFile(null);
      setPhone('');
      setMessage('');
      await loadAds();
    } catch (e) {
      console.error('Erro ao criar anúncio:', e);
      alert('Erro ao criar anúncio. Verifique a imagem/URL e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (ad: PharmacyAd) => {
    const { error } = await supabase
      .from('pharmacy_ads')
      .update({ is_active: !ad.is_active })
      .eq('id', ad.id);
    if (!error) loadAds();
  };

  const handleDelete = async (ad: PharmacyAd) => {
    if (!confirm('Deseja excluir este anúncio?')) return;
    const { error } = await supabase
      .from('pharmacy_ads')
      .delete()
      .eq('id', ad.id);
    if (!error) loadAds();
  };

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Anúncios (Banners finos)</h4>
      <form onSubmit={handleCreate} className="space-y-3 mb-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Imagem (upload)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
          />
          <p className="text-[11px] text-gray-500 mt-1">A imagem será enviada ao Storage e a URL pública gerada automaticamente.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp (telefone)</label>
            <input
              type="tel"
              placeholder="Ex: 5599999999999 ou (99) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
            />
            <p className="text-[11px] text-gray-500 mt-1">Se vazio, usa o telefone da farmácia (se disponível).</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Mensagem (opcional)</label>
            <input
              type="text"
              placeholder="Texto que aparece ao abrir o WhatsApp"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-[#0F3C4C] text-white rounded-lg font-semibold active:bg-[#0d3340] transition disabled:opacity-50"
          >{saving ? 'Salvando...' : 'Criar Anúncio'}</button>
        </div>
      </form>

      <div className="space-y-2">
        {ads.length === 0 && (
          <p className="text-xs text-gray-500">Nenhum anúncio criado.</p>
        )}
        {ads.map((ad) => (
          <div key={ad.id} className="flex items-center justify-between bg-white rounded-lg border-2 border-gray-200 p-3">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <img src={ad.image_url} className="w-40 h-10 object-cover rounded-lg border" />
              <div className="text-xs text-gray-700">
                <div className="font-semibold">Ativo: {ad.is_active ? 'Sim' : 'Não'}</div>
                <div className="text-gray-500">WhatsApp: {ad.whatsapp_phone || '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleActive(ad)}
                className="px-3 py-1.5 text-xs rounded-lg border-2 border-gray-300 active:bg-gray-100"
              >{ad.is_active ? 'Desativar' : 'Ativar'}</button>
              <button
                onClick={() => handleDelete(ad)}
                className="px-3 py-1.5 text-xs rounded-lg border-2 border-red-500 text-red-600 active:bg-red-50"
              >Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}