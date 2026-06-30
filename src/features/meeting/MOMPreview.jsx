import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from '../../utils/axiosInstance';
import { CheckCircle, AlertCircle, Clock, Calendar as CalendarIcon, FileText, Share2, ArrowLeft, Trash2, User, Plus } from 'lucide-react';

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
              {/* Summary Card */}
              <div className="bg-v-primary border border-v-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <h2 className="text-lg font-semibold text-v-text mb-4 flex items-center gap-2">
                      <FileText size={20} className="text-blue-500"/>
                      Executive Summary
                  </h2>
                  <textarea
                      value={editedMOM.summary || ''}
                      onChange={(e) => setEditedMOM({ ...editedMOM, summary: e.target.value })}
                      className="w-full bg-v-secondary/50 text-v-text px-4 py-3 rounded-lg border border-v-border/50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y text-sm leading-relaxed transition-colors [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-v-border/50 [&::-webkit-scrollbar-thumb]:rounded-full"
                      rows={5}
                      placeholder="Meeting summary..."
                  />
              </div>

              {/* Decisions Card */}
              <div className="bg-v-primary border border-v-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <h2 className="text-lg font-semibold text-v-text mb-4 flex items-center gap-2">
                      <CheckCircle size={20} className="text-green-500"/>
                      Key Decisions
                  </h2>
                  <textarea
                      value={(editedMOM.decisions || []).join('\n')}
                      onChange={(e) => setEditedMOM({ ...editedMOM, decisions: e.target.value.split('\n') })}
                      className="w-full bg-v-secondary/50 text-v-text px-4 py-3 rounded-lg border border-v-border/50 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-y text-sm leading-relaxed transition-colors [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-v-border/50 [&::-webkit-scrollbar-thumb]:rounded-full"
                      rows={6}
                      placeholder="Decisions made (one per line)..."
                  />
              </div>
          </div>

          <div className="space-y-6">
              {/* Action Items Card */}
              <div className="bg-v-primary border border-v-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full max-h-[800px]">
                  <h2 className="text-lg font-semibold text-v-text mb-4 flex items-center gap-2 flex-shrink-0">
                      <AlertCircle size={20} className="text-orange-500"/>
                      Action Items
                  </h2>
                  <div className="space-y-4 overflow-y-auto pr-2 flex-1 pb-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-v-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
                      {editedMOM.actionItems?.map((item, index) => (
                          <div key={index} className="p-4 bg-v-secondary/40 rounded-xl border border-v-border hover:border-v-border/80 transition-colors space-y-3 relative group">
                              {/* Remove action item */}
                              <button
                                onClick={() => {
                                  const updated = editedMOM.actionItems.filter((_, i) => i !== index);
                                  setEditedMOM({ ...editedMOM, actionItems: updated });
                                }}
                                className="absolute top-3 right-3 text-v-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                                title="Remove Action Item"
                              >
                                <Trash2 size={16} />
                              </button>

                              {/* Title - editable */}
                              <div className="pr-6">
                                <input
                                  type="text"
                                  value={item.title}
                                  onChange={(e) => {
                                    const updated = [...editedMOM.actionItems];
                                    updated[index] = { ...updated[index], title: e.target.value };
                                    setEditedMOM({ ...editedMOM, actionItems: updated });
                                  }}
                                  className="w-full bg-transparent font-medium text-v-text border-b border-transparent focus:border-orange-500 focus:outline-none text-sm transition-colors pb-1"
                                  placeholder="Action item title..."
                                />
                              </div>

                              {/* Assignee - editable */}
                              <div className="flex items-center gap-2 text-v-muted">
                                <User size={14} className="flex-shrink-0"/>
                                <input
                                  type="text"
                                  value={item.assigneeName || ''}
                                  onChange={(e) => {
                                    const updated = [...editedMOM.actionItems];
                                    updated[index] = { ...updated[index], assigneeName: e.target.value };
                                    setEditedMOM({ ...editedMOM, actionItems: updated });
                                  }}
                                  className="w-full bg-transparent text-v-text border-b border-transparent focus:border-blue-500 focus:outline-none text-xs transition-colors pb-1"
                                  placeholder="Assignee name..."
                                />
                              </div>

                              {/* Description - editable */}
                              <textarea
                                value={item.description || ''}
                                onChange={(e) => {
                                  const updated = [...editedMOM.actionItems];
                                  updated[index] = { ...updated[index], description: e.target.value };
                                  setEditedMOM({ ...editedMOM, actionItems: updated });
                                }}
                                rows={2}
                                className="w-full bg-v-background/50 text-v-text px-3 py-2 rounded-lg border border-transparent focus:border-orange-500/50 focus:bg-v-background focus:outline-none text-xs resize-none transition-all [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-v-border/50 [&::-webkit-scrollbar-thumb]:rounded-full"
                                placeholder="Add detailed description..."
                              />

                              <div className="flex gap-3 items-center pt-1">
                                {/* Priority - dropdown */}
                                <select
                                  value={item.priority}
                                  onChange={(e) => {
                                    const updated = [...editedMOM.actionItems];
                                    updated[index] = { ...updated[index], priority: e.target.value };
                                    setEditedMOM({ ...editedMOM, actionItems: updated });
                                  }}
                                  className={`bg-v-background text-xs font-medium px-2 py-1.5 rounded-md border border-v-border focus:outline-none focus:border-orange-500 cursor-pointer transition-colors ${item.priority === 'High' ? 'text-red-500' : item.priority === 'Medium' ? 'text-orange-500' : 'text-green-500'}`}
                                >
                                  <option value="High" className="text-red-500">High</option>
                                  <option value="Medium" className="text-orange-500">Medium</option>
                                  <option value="Low" className="text-green-500">Low</option>
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
                                  className="bg-v-background text-v-muted hover:text-v-text px-2 py-1.5 rounded-md border border-v-border text-xs focus:outline-none focus:border-orange-500 cursor-pointer transition-colors"
                                />
                              </div>
                          </div>
                      ))}
                      {!editedMOM.actionItems?.length && (
                          <div className="text-center p-6 bg-v-secondary/30 rounded-xl border border-dashed border-v-border">
                              <p className="text-v-muted text-sm">No action items yet.</p>
                          </div>
                      )}
                      
                      {/* Add new action item manually */}
                      <button
                        onClick={() => {
                          setEditedMOM({
                            ...editedMOM,
                            actionItems: [
                              ...(editedMOM.actionItems || []),
                              { title: '', description: '', priority: 'Medium', dueDate: '', assigneeName: '' }
                            ]
                          });
                        }}
                        className="w-full py-3 mt-2 border-2 border-dashed border-v-border/60 text-v-muted hover:text-v-text hover:border-v-text hover:bg-v-secondary/20 transition-all rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <Plus size={16} /> Add Action Item
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

