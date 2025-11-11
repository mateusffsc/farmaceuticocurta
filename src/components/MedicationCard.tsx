import { useState } from 'react';
import { Clock, Check, X, AlertCircle, Info } from 'lucide-react';
import { Medication, DoseRecord } from '../lib/types';
import ReportIssueModal from './ReportIssueModal';
import DoseDetailsModal from './DoseDetailsModal';

type MedicationCardProps = {
  medication: Medication;
  doses: DoseRecord[];
  clientId: string;
  pharmacyId: string;
  onDoseAction: (doseId: string, action: 'taken' | 'skipped') => void;
  onIssueReported: () => void;
};

export default function MedicationCard({ medication, doses, clientId, pharmacyId, onDoseAction, onIssueReported }: MedicationCardProps) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDose, setSelectedDose] = useState<DoseRecord | null>(null);

  const getStatusColor = (status: string, hasIssues?: boolean) => {
    if (hasIssues) return 'bg-orange-100 text-orange-700 border-orange-300';

    switch (status) {
      case 'taken':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'skipped':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken':
        return <Check className="w-4 h-4" />;
      case 'skipped':
        return <X className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'taken':
        return 'Tomado';
      case 'skipped':
        return 'Perdido';
      default:
        return 'Pendente';
    }
  };

  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleReportIssue = (dose: DoseRecord) => {
    setSelectedDose(dose);
    setShowReportModal(true);
  };

  const handleViewDetails = (dose: DoseRecord) => {
    setSelectedDose(dose);
    setShowDetailsModal(true);
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md active:shadow-lg transition p-4">
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#0F3C4C] mb-0.5">
                {medication.name}
              </h3>
              <p className="text-gray-600 text-sm">{medication.dosage}</p>
            </div>
            {typeof medication.remaining_doses === 'number' && (
              <div className="text-right">
                <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 px-2.5 py-1 rounded-lg text-xs font-semibold">
                  Restantes
                  <span className="bg-[#0F3C4C] text-white px-2 py-0.5 rounded-md text-xs">
                    {medication.remaining_doses}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2.5">
          {doses.length === 0 ? (
            <div className="text-center py-3 text-gray-500 text-sm">
              Nenhuma dose programada para hoje
            </div>
          ) : (
            doses.map((dose) => {
              const hasIssues = dose.has_adverse_event || dose.has_correction;
              return (
                <div key={dose.id}>
                  <div
                    onClick={() => dose.status !== 'pending' && handleViewDetails(dose)}
                    className={`border-2 rounded-xl p-3 ${getStatusColor(dose.status, hasIssues)} ${
                      dose.status !== 'pending' ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {hasIssues && <AlertCircle className="w-4 h-4" />}
                        {!hasIssues && getStatusIcon(dose.status)}
                        <span className="font-bold text-base">
                          {formatTime(dose.scheduled_time)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {dose.status !== 'pending' && (
                          <Info className="w-4 h-4" />
                        )}
                        <span className="text-xs font-semibold">
                          {hasIssues ? 'Com alerta' : getStatusText(dose.status)}
                        </span>
                      </div>
                    </div>

                    {dose.status === 'taken' && dose.actual_time && (
                      <div className="text-xs mt-2 font-medium">
                        Tomado às {formatTime(dose.actual_time)}
                      </div>
                    )}
                  </div>

                  {dose.status === 'pending' && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDoseAction(dose.id, 'taken');
                        }}
                        className="flex-1 bg-green-600 text-white py-3 rounded-xl active:bg-green-700 transition text-sm font-semibold active:scale-95"
                      >
                        Tomei agora
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDoseAction(dose.id, 'skipped');
                        }}
                        className="flex-1 bg-red-600 text-white py-3 rounded-xl active:bg-red-700 transition text-sm font-semibold active:scale-95"
                      >
                        Pular dose
                      </button>
                    </div>
                  )}

                  {dose.status === 'taken' && !hasIssues && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReportIssue(dose);
                      }}
                      className="w-full mt-2 flex items-center justify-center gap-2 py-2 border-2 border-gray-300 text-gray-700 rounded-xl active:bg-gray-50 transition text-xs font-semibold"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      Reportar Problema
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Horários:</span>
            <span className="font-semibold text-gray-800">{medication.schedules}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Duração:</span>
            <span className="font-semibold text-gray-800">{medication.treatment_duration_days} dias</span>
          </div>
        </div>
      </div>

      {showReportModal && selectedDose && (
        <ReportIssueModal
          dose={selectedDose}
          medication={medication}
          clientId={clientId}
          pharmacyId={pharmacyId}
          onClose={() => {
            setShowReportModal(false);
            setSelectedDose(null);
          }}
          onReported={() => {
            onIssueReported();
          }}
        />
      )}

      {showDetailsModal && selectedDose && (
        <DoseDetailsModal
          dose={selectedDose}
          medication={medication}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedDose(null);
          }}
          onMedicationUpdated={onIssueReported}
        />
      )}
    </>
  );
}
