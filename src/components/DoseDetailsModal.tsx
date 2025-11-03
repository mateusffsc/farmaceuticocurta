import { useState, useEffect } from 'react';
import { X, Clock, AlertTriangle, AlertCircle, Calendar, Check, XIcon, Edit2 } from 'lucide-react';
import { DoseRecord, Medication, AdverseEvent, DoseCorrection } from '../lib/types';
import { supabase } from '../lib/supabase';
import EditMedicationModal from './EditMedicationModal';

type DoseDetailsModalProps = {
  dose: DoseRecord;
  medication: Medication;
  onClose: () => void;
  onMedicationUpdated?: () => void;
};

export default function DoseDetailsModal({ dose, medication, onClose, onMedicationUpdated }: DoseDetailsModalProps) {
  const [adverseEvents, setAdverseEvents] = useState<AdverseEvent[]>([]);
  const [correction, setCorrection] = useState<DoseCorrection | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadDoseDetails();
  }, [dose.id]);

  const loadDoseDetails = async () => {
    try {
      const [eventsResult, correctionResult] = await Promise.all([
        supabase
          .from('adverse_events')
          .select('*')
          .eq('dose_record_id', dose.id)
          .order('occurred_at', { ascending: false }),
        supabase
          .from('dose_corrections')
          .select('*')
          .eq('original_dose_id', dose.id)
          .maybeSingle(),
      ]);

      if (eventsResult.data) setAdverseEvents(eventsResult.data);
      if (correctionResult.data) setCorrection(correctionResult.data);
    } catch (error) {
      console.error('Error loading dose details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (datetime: string) => {
    return new Date(datetime).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusInfo = () => {
    switch (dose.status) {
      case 'taken':
        return {
          icon: <Check className="w-5 h-5" />,
          label: 'Tomado',
          color: 'bg-green-100 text-green-700 border-green-300',
        };
      case 'skipped':
        return {
          icon: <XIcon className="w-5 h-5" />,
          label: 'Perdido',
          color: 'bg-red-100 text-red-700 border-red-300',
        };
      default:
        return {
          icon: <Clock className="w-5 h-5" />,
          label: 'Pendente',
          color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        };
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe':
        return 'bg-red-100 border-red-300 text-red-700';
      case 'moderate':
        return 'bg-yellow-100 border-yellow-300 text-yellow-700';
      default:
        return 'bg-green-100 border-green-300 text-green-700';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'severe':
        return 'Grave';
      case 'moderate':
        return 'Moderada';
      default:
        return 'Leve';
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'symptom':
        return 'Sintoma';
      case 'side_effect':
        return 'Efeito Colateral';
      case 'allergic_reaction':
        return 'Reação Alérgica';
      default:
        return 'Outro';
    }
  };

  const getCorrectionTypeLabel = (type: string) => {
    switch (type) {
      case 'double_dose':
        return 'Dose Dupla';
      case 'wrong_medication':
        return 'Medicamento Errado';
      case 'wrong_time':
        return 'Horário Incorreto';
      case 'missed_then_taken':
        return 'Atrasada mas Tomada';
      default:
        return 'Outro';
    }
  };

  const statusInfo = getStatusInfo();
  const hasIssues = dose.has_adverse_event || dose.has_correction;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto safe-bottom">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Detalhes da Dose</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-gradient-to-br from-[#0F3C4C] to-[#1a5768] rounded-2xl p-4 text-white">
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">{medication.name}</h3>
                <p className="text-white/90 text-sm mb-3">{medication.dosage}</p>
              </div>
              <button
                onClick={() => setShowEditModal(true)}
                className="p-2 hover:bg-white/10 rounded-lg transition active:scale-95"
                title="Editar medicamento"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-white/90 text-sm mb-2">
              <Clock className="w-4 h-4" />
              <span>Horário programado: {formatTime(dose.scheduled_time)}</span>
            </div>

            {dose.actual_time && (
              <div className="flex items-center gap-2 text-white/90 text-sm">
                <Calendar className="w-4 h-4" />
                <span>Tomado às: {formatTime(dose.actual_time)}</span>
              </div>
            )}
          </div>

          <div className={`border-2 rounded-xl p-4 ${statusInfo.color}`}>
            <div className="flex items-center gap-2">
              {statusInfo.icon}
              <span className="font-bold text-base">{statusInfo.label}</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-6 text-gray-600">
              Carregando detalhes...
            </div>
          ) : hasIssues ? (
            <>
              {correction && (
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    Erro Reportado
                  </h4>
                  <div className="border-2 border-orange-300 bg-orange-50 text-orange-800 rounded-xl p-4">
                    <p className="font-bold text-sm mb-2">
                      {getCorrectionTypeLabel(correction.correction_type)}
                    </p>
                    <p className="text-sm mb-3">{correction.description}</p>
                    <div className="flex items-center gap-1 text-xs">
                      <Calendar className="w-3 h-3" />
                      <span>Reportado em {formatDateTime(correction.created_at)}</span>
                    </div>
                  </div>
                </div>
              )}

              {adverseEvents.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Reações Reportadas ({adverseEvents.length})
                  </h4>
                  <div className="space-y-2.5">
                    {adverseEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`border-2 rounded-xl p-4 ${getSeverityColor(event.severity)}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            <p className="font-bold text-sm">
                              {getEventTypeLabel(event.event_type)}
                            </p>
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/50">
                            {getSeverityLabel(event.severity)}
                          </span>
                        </div>

                        <p className="text-sm mb-2">{event.description}</p>

                        <div className="flex items-center gap-1 text-xs">
                          <Calendar className="w-3 h-3" />
                          <span>Reportado em {formatDateTime(event.occurred_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">
                Nenhum problema reportado para esta dose
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold active:bg-gray-200 transition active:scale-95"
          >
            Fechar
          </button>
        </div>
      </div>

      {showEditModal && (
        <EditMedicationModal
          medication={medication}
          onClose={() => setShowEditModal(false)}
          onUpdated={() => {
            setShowEditModal(false);
            if (onMedicationUpdated) {
              onMedicationUpdated();
            }
            onClose();
          }}
        />
      )}
    </div>
  );
}
