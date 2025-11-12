import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { PharmacyAd } from '../lib/types';

type AdsBannerProps = {
  pharmacyId: string;
};

function buildWhatsAppLink(phone: string | undefined, message?: string) {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, '');
  const normalized = digits.startsWith('55') ? digits : (digits.length >= 10 ? `55${digits}` : digits);
  const text = encodeURIComponent(message || 'Olá! Vi o anúncio no app e gostaria de informações.');
  return `https://wa.me/${normalized}?text=${text}`;
}

export default function AdsBanner({ pharmacyId }: AdsBannerProps) {
  const [ads, setAds] = useState<PharmacyAd[]>([]);
  const [pharmacyPhone, setPharmacyPhone] = useState<string | undefined>(undefined);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: adsData, error: adsError } = await supabase
          .from('pharmacy_ads')
          .select('*')
          .eq('pharmacy_id', pharmacyId)
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false });
        if (adsError) throw adsError;
        setAds(adsData || []);

        // Fallback phone from pharmacy profile, used when ad doesn't specify its own phone
        const { data: pharm, error: pharmError } = await supabase
          .from('pharmacies')
          .select('phone')
          .eq('id', pharmacyId)
          .single();
        if (!pharmError && pharm) setPharmacyPhone(pharm.phone || undefined);
      } catch (e) {
        console.error('Erro ao carregar anúncios:', e);
      }
    };
    load();
  }, [pharmacyId]);

  // Reset index when ads change
  useEffect(() => {
    setCurrent(0);
  }, [ads.length]);

  // Slide show: advance every 10s when more than one ad
  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % ads.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [ads.length]);

  if (ads.length === 0) return null;

  const ad = ads[current];
  const link = buildWhatsAppLink(ad.whatsapp_phone || pharmacyPhone, ad.whatsapp_message || undefined);

  const goPrev = () => setCurrent((prev) => (prev - 1 + ads.length) % ads.length);
  const goNext = () => setCurrent((prev) => (prev + 1) % ads.length);

  return (
    <div className="mb-4">
      <div className="mx-auto w-full max-w-[1080px]">
        <div className="relative w-full aspect-[1080/452] rounded-xl overflow-hidden border-2 border-gray-200 bg-white hover:border-[#0F3C4C] transition">
          <a href={link} target="_blank" rel="noreferrer" className="absolute inset-0 block">
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <img src={ad.image_url} className="w-full h-full object-cover" />
          </a>
          {ads.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 border border-gray-300 rounded-full w-8 h-8 flex items-center justify-center shadow"
                aria-label="Anterior"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 border border-gray-300 rounded-full w-8 h-8 flex items-center justify-center shadow"
                aria-label="Próximo"
              >
                ›
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {ads.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrent(i)}
                    className={`w-2 h-2 rounded-full ${i === current ? 'bg-[#0F3C4C]' : 'bg-gray-300'}`}
                    aria-label={`Ir para anúncio ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}