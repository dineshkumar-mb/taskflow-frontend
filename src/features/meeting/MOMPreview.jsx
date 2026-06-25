import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosInstance';
import { CheckCircle, AlertCircle, Clock, Calendar as CalendarIcon, FileText, Share2, ArrowLeft } from 'lucide-react';

export const MOMPreview = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMeeting();
  }, [meetingId]);

  const fetchMeeting = async () => {
    try {
      const response = await axios.get(`/meetings/${meetingId}`);
      setMeeting(response.data.meeting);
      
      // Auto-generate MOM if not exists and meeting ended
      if (response.data.meeting.status === 'ended' && !response.data.meeting.mom?.summary) {
          generateMOM();
      }
    } catch (error) {
      console.error('Error fetching meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMOM = async () => {
    setGenerating(true);
    try {
      const response = await axios.post(`/meetings/${meetingId}/mom/generate`);
      setMeeting(prev => ({ ...prev, mom: response.data.mom }));
    } catch (error) {
      console.error('Error generating MOM:', error);
      alert('Failed to generate MOM');
    } finally {
      setGenerating(false);
    }
  };

  const handleConfirm = async () => {
    setSending(true);
    try {
      await axios.post(`/meetings/${meetingId}/mom/confirm`);
      alert('MOM sent to participants and action items created!');
      navigate(`/dashboard`);
    } catch (error) {
      console.error('Error confirming MOM:', error);
      alert('Failed to confirm and send MOM');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center text-v-muted">Loading meeting details...</div>;
  }

  if (!meeting) {
    return <div className="p-8 flex justify-center text-red-500">Meeting not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 bg-v-background min-h-screen">
      
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-v-border pb-6">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-v-secondary rounded-full transition-colors text-v-muted hover:text-v-text"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
            <h1 className="text-2xl font-bold text-v-text flex items-center gap-2">
                {meeting.title} 
                {meeting.status === 'ended' && <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded-full font-medium">Completed</span>}
            </h1>
            <div className="flex items-center gap-4 text-v-muted text-sm mt-2">
                <span className="flex items-center gap-1"><CalendarIcon size={14} /> {new Date(meeting.scheduledAt).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><Clock size={14} /> {meeting.duration || '--'} mins</span>
            </div>
        </div>
      </div>

      {generating ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-v-muted font-medium">AI Copilot is generating Minutes of Meeting...</p>
            <p className="text-sm text-v-muted/70">Analyzing transcript and extracting action items.</p>
        </div>
      ) : meeting.mom?.summary ? (
        <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
                {/* Summary Card */}
                <div className="bg-v-primary border border-v-border rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-v-text mb-3 flex items-center gap-2">
                        <FileText size={18} className="text-blue-500"/>
                        Executive Summary
                    </h2>
                    <p className="text-v-muted leading-relaxed">{meeting.mom.summary}</p>
                </div>

                {/* Decisions Card */}
                <div className="bg-v-primary border border-v-border rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-v-text mb-3 flex items-center gap-2">
                        <CheckCircle size={18} className="text-green-500"/>
                        Key Decisions
                    </h2>
                    <ul className="list-disc pl-5 space-y-2 text-v-muted">
                        {meeting.mom.decisions?.map((decision, idx) => (
                            <li key={idx}>{decision}</li>
                        ))}
                        {!meeting.mom.decisions?.length && <li>No major decisions recorded.</li>}
                    </ul>
                </div>
            </div>

            <div className="col-span-1 space-y-6">
                {/* Action Items Card */}
                <div className="bg-v-primary border border-v-border rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-v-text mb-4 flex items-center gap-2">
                        <AlertCircle size={18} className="text-orange-500"/>
                        Action Items
                    </h2>
                    <div className="space-y-4">
                        {meeting.mom.actionItems?.map((item, idx) => (
                            <div key={idx} className="p-3 bg-v-secondary rounded-lg border border-v-border">
                                <h4 className="font-medium text-v-text text-sm mb-1">{item.title}</h4>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs px-2 py-1 bg-v-background rounded text-v-muted">
                                        {item.priority} Priority
                                    </span>
                                </div>
                            </div>
                        ))}
                        {!meeting.mom.actionItems?.length && (
                            <p className="text-v-muted text-sm">No action items assigned.</p>
                        )}
                    </div>
                </div>

                {/* Actions */}
                {!meeting.mom.confirmedAt && (
                    <button 
                        onClick={handleConfirm}
                        disabled={sending}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                    >
                        <Share2 size={18} />
                        {sending ? 'Sending...' : 'Confirm & Distribute MOM'}
                    </button>
                )}
                
                {meeting.mom.confirmedAt && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm text-center flex items-center justify-center gap-2">
                        <CheckCircle size={16} />
                        MOM Distributed to Participants
                    </div>
                )}
            </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-v-primary rounded-xl border border-v-border shadow-sm">
            <AlertCircle size={48} className="mx-auto text-v-muted mb-4 opacity-50"/>
            <h3 className="text-lg font-medium text-v-text mb-2">No MOM Generated Yet</h3>
            <p className="text-v-muted mb-6">The meeting has not ended or transcription was empty.</p>
            {meeting.status === 'ended' && (
                <button 
                    onClick={generateMOM}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                    Retry AI Generation
                </button>
            )}
        </div>
      )}
    </div>
  );
};
