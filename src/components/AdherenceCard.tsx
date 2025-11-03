import { TrendingUp } from 'lucide-react';
import { DoseRecord } from '../lib/types';

type AdherenceCardProps = {
  doseRecords: DoseRecord[];
};

export default function AdherenceCard({ doseRecords }: AdherenceCardProps) {
  const calculateAdherence = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayDoses = doseRecords.filter(dose => {
      const doseDate = new Date(dose.scheduled_time);
      return doseDate >= today && doseDate < tomorrow;
    });

    if (todayDoses.length === 0) return 0;

    const takenDoses = todayDoses.filter(dose => dose.status === 'taken').length;
    return Math.round((takenDoses / todayDoses.length) * 100);
  };

  const adherence = calculateAdherence();

  const getAdherenceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAdherenceMessage = (percentage: number) => {
    if (percentage >= 80) return 'Excelente adesão! Continue assim!';
    if (percentage >= 60) return 'Boa adesão. Tente melhorar!';
    if (percentage > 0) return 'Adesão baixa. Não desista!';
    return 'Comece seu tratamento hoje!';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-600';
    if (percentage >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="bg-gradient-to-br from-[#0F3C4C] to-[#1a5768] rounded-xl shadow-lg p-6 text-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-white/20 p-3 rounded-lg">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Adesão Diária</h3>
          <p className="text-sm text-white/80">Hoje</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex-1">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block text-white/80">
                  Progresso
                </span>
              </div>
              <div className="text-right">
                <span className={`text-xs font-semibold inline-block ${adherence >= 80 ? 'text-[#CBAA63]' : 'text-white'}`}>
                  {adherence}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-white/20">
              <div
                style={{ width: `${adherence}%` }}
                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${getProgressColor(adherence)} transition-all duration-500`}
              ></div>
            </div>
          </div>

          <p className="text-sm font-medium">
            {getAdherenceMessage(adherence)}
          </p>
        </div>

        <div className="text-center">
          <div className={`text-5xl font-bold ${adherence >= 80 ? 'text-[#CBAA63]' : ''}`}>
            {adherence}
          </div>
          <div className="text-xs text-white/80 mt-1">
            pontos
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold">
            {(() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              return doseRecords.filter(d => {
                const doseDate = new Date(d.scheduled_time);
                return d.status === 'taken' && doseDate >= today && doseDate < tomorrow;
              }).length;
            })()}
          </div>
          <div className="text-xs text-white/80">Tomados</div>
        </div>
        <div>
          <div className="text-2xl font-bold">
            {(() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              return doseRecords.filter(d => {
                const doseDate = new Date(d.scheduled_time);
                return d.status === 'pending' && doseDate >= today && doseDate < tomorrow;
              }).length;
            })()}
          </div>
          <div className="text-xs text-white/80">Pendentes</div>
        </div>
        <div>
          <div className="text-2xl font-bold">
            {(() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              return doseRecords.filter(d => {
                const doseDate = new Date(d.scheduled_time);
                return d.status === 'skipped' && doseDate >= today && doseDate < tomorrow;
              }).length;
            })()}
          </div>
          <div className="text-xs text-white/80">Perdidos</div>
        </div>
      </div>
    </div>
  );
}
