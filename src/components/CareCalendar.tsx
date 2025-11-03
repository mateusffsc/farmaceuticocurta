import { useState } from 'react';
import { Check, X, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Medication, DoseRecord } from '../lib/types';

type CareCalendarProps = {
  medications: Medication[];
  doseRecords: DoseRecord[];
};

export default function CareCalendar({ medications, doseRecords }: CareCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'skipped':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'taken':
        return 'border-l-green-500 bg-green-50';
      case 'skipped':
        return 'border-l-red-500 bg-red-50';
      default:
        return 'border-l-yellow-500 bg-yellow-50';
    }
  };

  const getMedicationName = (medId: string) => {
    const med = medications.find(m => m.id === medId);
    return med ? `${med.name} ${med.dosage}` : 'Medicamento';
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getDosesForDate = (date: Date) => {
    const dateStr = date.toDateString();
    return doseRecords.filter(dose =>
      new Date(dose.scheduled_time).toDateString() === dateStr
    ).sort((a, b) =>
      new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime()
    );
  };

  const hasDoses = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return getDosesForDate(date).length > 0;
  };

  const getDayStats = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const doses = getDosesForDate(date);

    const taken = doses.filter(d => d.status === 'taken').length;
    const total = doses.length;

    return { taken, total, hasDoses: total > 0 };
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    setSelectedDate(null);
  };

  const selectDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const stats = getDayStats(day);
    if (stats.hasDoses) {
      setSelectedDate(date);
    }
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const selectedDoses = selectedDate ? getDosesForDate(selectedDate) : [];

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-[#0F3C4C] to-[#1a5768] p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition active:scale-95"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-xl font-bold text-white capitalize">
            {monthName}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition active:scale-95"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
            <div
              key={index}
              className="text-center text-sm font-bold text-orange-300 py-2"
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      <div className="p-2">
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const stats = getDayStats(day);
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = selectedDate?.toDateString() === date.toDateString();

            return (
              <button
                key={day}
                onClick={() => selectDay(day)}
                disabled={!stats.hasDoses}
                className={`aspect-square rounded-lg font-semibold transition relative ${
                  isSelected
                    ? 'bg-[#0F3C4C] text-white ring-2 ring-[#0F3C4C] ring-offset-2'
                    : isToday
                    ? 'bg-orange-100 text-[#0F3C4C] ring-2 ring-orange-400'
                    : stats.hasDoses
                    ? 'bg-gray-50 text-gray-800 hover:bg-gray-100 active:scale-95'
                    : 'text-gray-300'
                }`}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span className="text-sm">{day}</span>
                  {stats.hasDoses && (
                    <div className="flex gap-0.5 mt-0.5">
                      {stats.taken === stats.total ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      ) : stats.taken > 0 ? (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                        </>
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && selectedDoses.length > 0 && (
        <div className="border-t-2 border-gray-200 p-4">
          <h3 className="text-lg font-bold text-gray-800 mb-3">
            {selectedDate.toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long'
            })}
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {selectedDoses.map(dose => (
              <div
                key={dose.id}
                className={`border-l-4 p-3 rounded-r-lg ${getStatusColor(dose.status)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-base text-gray-800">
                        {formatTime(dose.scheduled_time)}
                      </span>
                      {getStatusIcon(dose.status)}
                    </div>
                    <p className="text-gray-700 text-sm font-medium">
                      {getMedicationName(dose.medication_id)}
                    </p>
                    {dose.actual_time && dose.status === 'taken' && (
                      <p className="text-xs text-gray-600 mt-1">
                        Tomado às {formatTime(dose.actual_time)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedDate && selectedDoses.length === 0 && (
        <div className="border-t-2 border-gray-200 p-8 text-center">
          <Clock className="w-10 h-10 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">Nenhuma dose programada para este dia</p>
        </div>
      )}

      {!selectedDate && doseRecords.length === 0 && (
        <div className="border-t-2 border-gray-200 p-8 text-center">
          <Clock className="w-10 h-10 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">Nenhuma dose programada</p>
        </div>
      )}
    </div>
  );
}
