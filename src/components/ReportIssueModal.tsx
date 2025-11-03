import { useState } from 'react';
import { X, AlertTriangle, AlertCircle } from 'lucide-react';
import { DoseRecord, Medication } from '../lib/types';
import { supabase } from '../lib/supabase';

type ReportIssueModalProps = {
  dose: DoseRecord;
  medication: Medication;
  clientId: string;
  pharmacyId: string;
  onClose: () => void;
  onReported: () => void;
};

type IssueType = 'correction' | 'adverse_event' | null;

export default function ReportIssueModal({
  dose,
  medication,
  clientId,
  pharmacyId,
  onClose,
  onReported,
}: ReportIssueModalProps) {
  const [issueType, setIssueType] = useState<IssueType>(null);
  const [correctionType, setCorrectionType] = useState('');
  const [eventType, setEventType] = useState('');
  const [severity, setSeverity] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (issueType === 'correction') {
        const { error } = await supabase
          .from('dose_corrections')
          .insert([{
            original_dose_id: dose.id,
            client_id: clientId,
            medication_id: medication.id,
            pharmacy_id: pharmacyId,
            correction_type: correctionType,
            description,
          }]);

        if (error) throw error;

        await supabase
          .from('dose_records')
          .update({ has_correction: true })
          .eq('id', dose.id);
      } else if (issueType === 'adverse_event') {
        const { error } = await supabase
          .from('adverse_events')
          .insert([{
            client_id: clientId,
            medication_id: medication.id,
            dose_record_id: dose.id,
            pharmacy_id: pharmacyId,
            event_type: eventType,
            severity,
            description,
            occurred_at: new Date().toISOString(),
          }]);

        if (error) throw error;

        await supabase
          .from('dose_records')
          .update({ has_adverse_event: true })
          .eq('id', dose.id);
      }

      onReported();
      onClose();
    } catch (error) {
      console.error('Error reporting issue:', error);
      alert('Erro ao reportar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto safe-bottom">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Reportar Problema</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 mb-4">
            <p className="text-sm font-semibold text-blue-900 mb-1">{medication.name}</p>
            <p className="text-xs text-blue-700">
              Horário: {new Date(dose.scheduled_time).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {!issueType ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-3">Selecione o tipo de problema:</p>

              <button
                onClick={() => setIssueType('correction')}
                className="w-full flex items-start gap-3 p-4 border-2 border-gray-300 rounded-xl active:border-[#0F3C4C] transition text-left"
              >
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-800">Dose Incorreta</p>
                  <p className="text-sm text-gray-600">
                    Tomei dose dupla, medicamento errado ou horário incorreto
                  </p>
                </div>
              </button>

              <button
                onClick={() => setIssueType('adverse_event')}
                className="w-full flex items-start gap-3 p-4 border-2 border-gray-300 rounded-xl active:border-[#0F3C4C] transition text-left"
              >
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-800">Reação ou Sintoma</p>
                  <p className="text-sm text-gray-600">
                    Mal-estar, dor de cabeça, enjoo ou outros sintomas
                  </p>
                </div>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {issueType === 'correction' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tipo de erro
                    </label>
                    <select
                      value={correctionType}
                      onChange={(e) => setCorrectionType(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0F3C4C] focus:border-[#0F3C4C] outline-none"
                      required
                    >
                      <option value="">Selecione...</option>
                      <option value="double_dose">Tomei dose dupla</option>
                      <option value="wrong_medication">Medicamento errado</option>
                      <option value="wrong_time">Horário incorreto</option>
                      <option value="missed_then_taken">Atrasada mas tomei</option>
                      <option value="other">Outro</option>
                    </select>
                  </div>
                </>
              )}

              {issueType === 'adverse_event' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tipo de reação
                    </label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0F3C4C] focus:border-[#0F3C4C] outline-none"
                      required
                    >
                      <option value="">Selecione...</option>
                      <option value="symptom">Sintoma</option>
                      <option value="side_effect">Efeito colateral</option>
                      <option value="allergic_reaction">Reação alérgica</option>
                      <option value="other">Outro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Gravidade
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSeverity('mild')}
                        className={`py-3 px-2 rounded-xl border-2 font-medium text-sm transition ${
                          severity === 'mild'
                            ? 'bg-green-100 border-green-600 text-green-700'
                            : 'border-gray-300 text-gray-700'
                        }`}
                      >
                        Leve
                      </button>
                      <button
                        type="button"
                        onClick={() => setSeverity('moderate')}
                        className={`py-3 px-2 rounded-xl border-2 font-medium text-sm transition ${
                          severity === 'moderate'
                            ? 'bg-yellow-100 border-yellow-600 text-yellow-700'
                            : 'border-gray-300 text-gray-700'
                        }`}
                      >
                        Moderada
                      </button>
                      <button
                        type="button"
                        onClick={() => setSeverity('severe')}
                        className={`py-3 px-2 rounded-xl border-2 font-medium text-sm transition ${
                          severity === 'severe'
                            ? 'bg-red-100 border-red-600 text-red-700'
                            : 'border-gray-300 text-gray-700'
                        }`}
                      >
                        Grave
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descrição detalhada
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o que aconteceu..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0F3C4C] focus:border-[#0F3C4C] outline-none resize-none"
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIssueType(null)}
                  className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold active:bg-gray-50 transition"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading || (issueType === 'adverse_event' && !severity)}
                  className="flex-1 py-3 bg-[#0F3C4C] text-white rounded-xl font-semibold active:bg-[#0d3340] transition disabled:opacity-50 active:scale-95"
                >
                  {loading ? 'Enviando...' : 'Reportar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
