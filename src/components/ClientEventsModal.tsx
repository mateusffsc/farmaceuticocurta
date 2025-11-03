import { useState, useEffect } from 'react';
import { X, AlertTriangle, AlertCircle, Calendar, Pill } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Client, AdverseEvent, DoseCorrection, Medication } from '../lib/types';

type ClientEventsModalProps = {
  client: Client;
  onClose: () => void;
};

export default function ClientEventsModal({ client, onClose }: ClientEventsModalProps) {
  const [adverseEvents, setAdverseEvents] = useState<AdverseEvent[]>([]);
  const [corrections, setCorrections] = useState<DoseCorrection[]>([]);
  const [medications, setMedications] = useState<Record<string, Medication>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [client.id]);

  const loadData = async () => {
    try {
      const [eventsResult, correctionsResult, medsResult] = await Promise.all([
        supabase
          .from('adverse_events')
          .select('*')
          .eq('client_id', client.id)
          .order('occurred_at', { ascending: false }),
        supabase
          .from('dose_corrections')
          .select('*')
          .eq('client_id', client.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('medications')
          .select('*')
          .eq('client_id', client.id),
      ]);

      if (eventsResult.data) setAdverseEvents(eventsResult.data);
      if (correctionsResult.data) setCorrections(correctionsResult.data);

      if (medsResult.data) {
        const medsMap: Record<string, Medication> = {};
        medsResult.data.forEach(med => {
          medsMap[med.id] = med;
        });
        setMedications(medsMap);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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

  const formatDateTime = (datetime: string) => {
    return new Date(datetime).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const hasData = adverseEvents.length > 0 || corrections.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto safe-bottom">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Relatórios de {client.name}</h2>
            <p className="text-xs text-gray-600">Reações e erros reportados</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-600">
              Carregando relatórios...
            </div>
          ) : !hasData ? (
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 text-center">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Nenhum problema reportado
              </h3>
              <p className="text-sm text-gray-600">
                Este cliente ainda não reportou nenhuma reação ou erro
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {adverseEvents.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Reações e Sintomas ({adverseEvents.length})
                  </h3>
                  <div className="space-y-2.5">
                    {adverseEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`border-2 rounded-xl p-3 ${getSeverityColor(event.severity)}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            <div>
                              <p className="font-bold text-sm">
                                {getEventTypeLabel(event.event_type)}
                              </p>
                              {event.medication_id && medications[event.medication_id] && (
                                <p className="text-xs flex items-center gap-1 mt-0.5">
                                  <Pill className="w-3 h-3" />
                                  {medications[event.medication_id].name}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/50">
                            {getSeverityLabel(event.severity)}
                          </span>
                        </div>

                        <p className="text-sm mb-2">{event.description}</p>

                        <div className="flex items-center gap-1 text-xs">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDateTime(event.occurred_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {corrections.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    Erros Reportados ({corrections.length})
                  </h3>
                  <div className="space-y-2.5">
                    {corrections.map((correction) => (
                      <div
                        key={correction.id}
                        className="border-2 border-orange-300 bg-orange-50 text-orange-800 rounded-xl p-3"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-bold text-sm mb-1">
                              {getCorrectionTypeLabel(correction.correction_type)}
                            </p>
                            {medications[correction.medication_id] && (
                              <p className="text-xs flex items-center gap-1 mb-2">
                                <Pill className="w-3 h-3" />
                                {medications[correction.medication_id].name}
                              </p>
                            )}
                            <p className="text-sm">{correction.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs mt-2">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDateTime(correction.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
