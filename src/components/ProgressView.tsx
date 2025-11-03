import { useState, useMemo } from 'react';
import { Calendar, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import { DoseRecord, Medication } from '../lib/types';

type Period = 'daily' | 'weekly' | 'monthly';

type ProgressViewProps = {
  doseRecords: DoseRecord[];
  medications: Medication[];
};

export default function ProgressView({ doseRecords, medications }: ProgressViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const getDateRange = () => {
    const date = new Date(selectedDate);

    switch (selectedPeriod) {
      case 'daily':
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        return { start: startOfDay, end: endOfDay };

      case 'weekly':
        const startOfWeek = new Date(date);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day;
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return { start: startOfWeek, end: endOfWeek };

      case 'monthly':
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
        return { start: startOfMonth, end: endOfMonth };
    }
  };

  const filteredRecords = useMemo(() => {
    const { start, end } = getDateRange();
    return doseRecords.filter(record => {
      const recordDate = new Date(record.scheduled_time);
      return recordDate >= start && recordDate <= end;
    });
  }, [doseRecords, selectedPeriod, selectedDate]);

  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const taken = filteredRecords.filter(r => r.status === 'taken').length;
    const skipped = filteredRecords.filter(r => r.status === 'skipped').length;
    const pending = filteredRecords.filter(r => r.status === 'pending').length;
    const adherence = total > 0 ? Math.round((taken / total) * 100) : 0;

    return { total, taken, skipped, pending, adherence };
  }, [filteredRecords]);

  const getMedicationStats = () => {
    return medications.map(med => {
      const medRecords = filteredRecords.filter(r => r.medication_id === med.id);
      const medTaken = medRecords.filter(r => r.status === 'taken').length;
      const medTotal = medRecords.length;
      const medAdherence = medTotal > 0 ? Math.round((medTaken / medTotal) * 100) : 0;

      return {
        medication: med,
        total: medTotal,
        taken: medTaken,
        adherence: medAdherence,
      };
    }).filter(stat => stat.total > 0);
  };

  const formatPeriodLabel = () => {
    const date = selectedDate;

    switch (selectedPeriod) {
      case 'daily':
        return date.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });

      case 'weekly':
        const { start, end } = getDateRange();
        return `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;

      case 'monthly':
        return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
  };

  const navigatePeriod = (direction: 'prev' | 'next') => {
    const date = new Date(selectedDate);

    switch (selectedPeriod) {
      case 'daily':
        date.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'weekly':
        date.setDate(date.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }

    setSelectedDate(date);
  };

  const getAdherenceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-[#0F3C4C] mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Progresso do Tratamento
        </h2>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPeriod('daily')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedPeriod === 'daily'
                  ? 'bg-[#0F3C4C] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Diário
            </button>
            <button
              onClick={() => setSelectedPeriod('weekly')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedPeriod === 'weekly'
                  ? 'bg-[#0F3C4C] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => setSelectedPeriod('monthly')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedPeriod === 'monthly'
                  ? 'bg-[#0F3C4C] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mensal
            </button>
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            <button
              onClick={() => navigatePeriod('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              ←
            </button>
            <div className="px-4 py-2 bg-gray-50 rounded-lg text-sm font-medium min-w-[200px] text-center capitalize">
              {formatPeriodLabel()}
            </div>
            <button
              onClick={() => navigatePeriod('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              disabled={new Date(selectedDate) >= new Date()}
            >
              →
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-4 py-2 bg-[#0F3C4C] text-white rounded-lg hover:bg-[#0d3340] transition text-sm font-medium"
            >
              Hoje
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          <div className="bg-gradient-to-br from-[#0F3C4C] to-[#1a5768] rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm opacity-90">Adesão</span>
            </div>
            <div className="text-3xl font-bold">{stats.adherence}%</div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-700">Total</span>
            </div>
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700">Tomados</span>
            </div>
            <div className="text-3xl font-bold text-green-600">{stats.taken}</div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-red-700">Perdidos</span>
            </div>
            <div className="text-3xl font-bold text-red-600">{stats.skipped}</div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-700">Pendentes</span>
            </div>
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
          </div>
        </div>

        {medications.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Por Medicamento
            </h3>
            <div className="space-y-3">
              {getMedicationStats().map((stat) => (
                <div
                  key={stat.medication.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {stat.medication.name}
                      </h4>
                      <p className="text-sm text-gray-600">{stat.medication.dosage}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${getAdherenceColor(stat.adherence)}`}>
                      {stat.adherence}%
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      {stat.taken} de {stat.total} doses tomadas
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        stat.adherence >= 80 ? 'bg-green-500' :
                        stat.adherence >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${stat.adherence}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
