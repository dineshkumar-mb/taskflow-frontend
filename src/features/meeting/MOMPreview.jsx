import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from '../../utils/axiosInstance';
import { CheckCircle, AlertCircle, Clock, Calendar as CalendarIcon, FileText, Share2, ArrowLeft } from 'lucide-react';

export const MOMPreview = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);
  
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [editedMOM, setEditedMOM] = useState(null);

  useEffect(() => {
    fetchAndGenerateMOM();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  const fetchAndGenerateMOM = async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Fetch the meeting
      const res = await axios.get(`/meetings/${meetingId}`);
      const fetchedMeeting = res.data.meeting;
      setMeeting(fetchedMeeting);

      // Step 2: If MOM already exists (e.g., page refresh), use it
      if (fetchedMeeting.mom && fetchedMeeting.mom.summary) {
        setEditedMOM(fetchedMeeting.mom);
        setLoading(false);
        return;
      }

      // Step 3: Meeting ended but no MOM yet — generate it
      if (fetchedMeeting.status !== 'ended') {
        // Meeting not ended properly, end it now
        await axios.post(`/meetings/${meetingId}/end`, {
          transcriptSegments: [],
          attendeeIds: user ? [user._id] : []
        });
      }

      // Step 4: Generate MOM from transcript
      setGenerating(true);
      const momRes = await axios.post(`/meetings/${meetingId}/mom/generate`);

      setEditedMOM(momRes.data.mom);
      setMeeting(prev => ({ ...prev, mom: momRes.data.mom }));

    } catch (err) {
      console.error('Error loading MOM:', err);
      setError('Failed to generate MOM. Please try again.');
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  const handleConfirm = async () => {
    setSending(true);
    try {
      await axios.post(`/meetings/${meetingId}/mom/confirm`, {
        updatedMOM: editedMOM
      });
      alert('MOM sent to participants and action items created!');
      navigate(`/dashboard`);
    } catch (error) {
      console.error('Error confirming MOM:', error);
      alert('Failed to confirm and send MOM');
    } finally {
      setSending(false);
    }
  };

  // ✅ Full loading screen while fetching
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-v-background text-v-text space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <h2 className="text-xl font-semibold">{generating ? 'AI is generating your MOM...' : 'Loading meeting...'}</h2>
        <p className="text-v-muted">{generating ? 'This usually takes 20–40 seconds.' : 'Please wait.'}</p>
      </div>
    );
  }

  // ✅ Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-v-background text-v-text space-y-6">
        <div className="text-5xl">⚠️</div>
        <h2 className="text-xl font-semibold">MOM Generation Failed</h2>
        <p className="text-v-muted">{error}</p>

        <div className="flex gap-4">
          <button
            onClick={fetchAndGenerateMOM}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center gap-2"
          >
            🔄 Retry Generation
          </button>

          <button
            onClick={() => navigate(`/projects/${meeting?.projectId}`)}
            className="px-4 py-2 bg-v-secondary hover:bg-v-border text-v-text rounded transition-colors"
          >
            Skip & Go to Project
          </button>
        </div>

        <p className="text-sm text-v-muted/70">
          Tip: Check that your Gemini API key is valid and has available quota.
        </p>
      </div>
    );
  }

  // ✅ No MOM data
  if (!editedMOM) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-v-background text-v-text space-y-4">
        <h2 className="text-xl font-semibold">No transcript found</h2>
        <p className="text-v-muted">The meeting transcript was empty. MOM could not be generated.</p>
        <button 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          onClick={() => navigate(`/projects/${meeting?.projectId}`)}>
          Go to Project
        </button>
      </div>
    );
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

      <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
              {/* Summary Card */}
              <div className="bg-v-primary border border-v-border rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-v-text mb-3 flex items-center gap-2">
                      <FileText size={18} className="text-blue-500"/>
                      Executive Summary
                  </h2>
                  <p className="text-v-muted leading-relaxed">{editedMOM.summary}</p>
              </div>

              {/* Decisions Card */}
              <div className="bg-v-primary border border-v-border rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-v-text mb-3 flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500"/>
                      Key Decisions
                  </h2>
                  <ul className="list-disc pl-5 space-y-2 text-v-muted">
                      {editedMOM.decisions?.map((decision, idx) => (
                          <li key={idx}>{decision}</li>
                      ))}
                      {!editedMOM.decisions?.length && <li>No major decisions recorded.</li>}
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
                      {editedMOM.actionItems?.map((item, index) => (
                          <div key={index} className="p-4 bg-v-secondary rounded-lg border border-v-border space-y-3">
                              {/* Title - editable */}
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => {
                                  const updated = [...editedMOM.actionItems];
                                  updated[index] = { ...updated[index], title: e.target.value };
                                  setEditedMOM({ ...editedMOM, actionItems: updated });
                                }}
                                className="w-full bg-v-background text-v-text px-3 py-2 rounded border border-v-border text-sm focus:outline-none focus:border-blue-500"
                                placeholder="Action item title"
                              />

                              {/* Description - editable */}
                              <textarea
                                value={item.description || ''}
                                onChange={(e) => {
                                  const updated = [...editedMOM.actionItems];
                                  updated[index] = { ...updated[index], description: e.target.value };
                                  setEditedMOM({ ...editedMOM, actionItems: updated });
                                }}
                                rows={2}
                                className="w-full bg-v-background text-v-text px-3 py-2 rounded border border-v-border text-sm focus:outline-none focus:border-blue-500 resize-none"
                                placeholder="Description (optional)"
                              />

                              <div className="flex gap-4 items-center">
                                {/* Priority - dropdown */}
                                <select
                                  value={item.priority}
                                  onChange={(e) => {
                                    const updated = [...editedMOM.actionItems];
                                    updated[index] = { ...updated[index], priority: e.target.value };
                                    setEditedMOM({ ...editedMOM, actionItems: updated });
                                  }}
                                  className="bg-v-background text-v-text px-2 py-1 rounded border border-v-border text-xs focus:outline-none focus:border-blue-500"
                                >
                                  <option value="High">High</option>
                                  <option value="Medium">Medium</option>
                                  <option value="Low">Low</option>
                                </select>

                                {/* Due Date - date picker */}
                                <input
                                  type="date"
                                  value={item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : ''}
                                  onChange={(e) => {
                                    const updated = [...editedMOM.actionItems];
                                    updated[index] = { ...updated[index], dueDate: e.target.value };
                                    setEditedMOM({ ...editedMOM, actionItems: updated });
                                  }}
                                  className="bg-v-background text-v-text px-2 py-1 rounded border border-v-border text-xs focus:outline-none focus:border-blue-500"
                                />
                              </div>

                              {/* Remove action item */}
                              <button
                                onClick={() => {
                                  const updated = editedMOM.actionItems.filter((_, i) => i !== index);
                                  setEditedMOM({ ...editedMOM, actionItems: updated });
                                }}
                                className="text-xs text-red-500 hover:text-red-400 mt-2"
                              >
                                Remove
                              </button>
                          </div>
                      ))}
                      {!editedMOM.actionItems?.length && (
                          <p className="text-v-muted text-sm">No action items assigned.</p>
                      )}
                      
                      {/* Add new action item manually */}
                      <button
                        onClick={() => {
                          setEditedMOM({
                            ...editedMOM,
                            actionItems: [
                              ...(editedMOM.actionItems || []),
                              { title: '', description: '', priority: 'Medium', dueDate: '' }
                            ]
                          });
                        }}
                        className="w-full py-2 border border-dashed border-v-border text-v-muted hover:text-v-text hover:border-v-text transition-colors rounded-lg text-sm"
                      >
                        + Add Action Item
                      </button>
                  </div>
              </div>

              {/* Actions */}
              {!editedMOM.confirmedAt && (
                  <button 
                      onClick={handleConfirm}
                      disabled={sending}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                  >
                      <Share2 size={18} />
                      {sending ? 'Sending...' : 'Confirm & Distribute MOM'}
                  </button>
              )}
              
              {editedMOM.confirmedAt && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm text-center flex items-center justify-center gap-2">
                      <CheckCircle size={16} />
                      MOM Distributed to Participants
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

