import React, { useState } from 'react';
import axios from '../../utils/axiosInstance';
import { useSelector } from 'react-redux';
import { X, Calendar } from 'lucide-react';

export const MeetingScheduler = ({ projectId, onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [agenda, setAgenda] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);

  // Adjusted selector to fit the codebase
  const { project, projects } = useSelector(state => state.project);
  const user = useSelector(state => state.auth.user);
  
  // If projectId is provided, we use that project. Otherwise, we allow user to pick one from their projects.
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  
  // State for all organization users to select participants
  const [orgUsers, setOrgUsers] = useState([]);

  // Fetch all organization users when the modal opens
  React.useEffect(() => {
    if (isOpen) {
      axios.get('/users')
        .then(res => setOrgUsers(res.data || []))
        .catch(err => console.error('Failed to load users', err));
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!selectedProjectId) {
      alert('Please select a project');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/meetings', {
        title,
        agenda,
        scheduledAt: new Date(scheduledAt).toISOString(),
        projectId: selectedProjectId,
        participantIds: participants
      });

      onSuccess?.(response.data.meeting);
      setIsOpen(false);
      setTitle('');
      setAgenda('');
      setScheduledAt('');
      setParticipants([]);
      if (!projectId) setSelectedProjectId('');
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      alert(error.response?.data?.error || 'Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium text-sm"
      >
        <Calendar size={16} />
        Schedule Meeting
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-v-primary rounded-lg shadow-xl w-full max-w-md border border-v-border flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-v-border">
              <h2 className="text-xl font-semibold text-v-text">Schedule a Meeting</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-v-muted hover:text-v-text transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-5 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-v-muted">Meeting Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Sprint Planning"
                  required
                  className="w-full px-3 py-2 bg-v-secondary border border-v-border rounded-md text-v-text focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-v-muted">Agenda</label>
                <textarea
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  rows="3"
                  placeholder="Optional: outline the topics to cover"
                  className="w-full px-3 py-2 bg-v-secondary border border-v-border rounded-md text-v-text focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-v-muted">Date & Time *</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-v-secondary border border-v-border rounded-md text-v-text focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                />
              </div>

              {!projectId && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-v-muted">Project *</label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-v-secondary border border-v-border rounded-md text-v-text focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                    >
                      <option value="" disabled>Select a project</option>
                      {projects.map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-v-muted">Invite Participants</label>
                <select
                  multiple
                  value={participants}
                  onChange={(e) =>
                    setParticipants([...e.target.selectedOptions].map(o => o.value))
                  }
                  size="5"
                  className="w-full px-3 py-2 bg-v-secondary border border-v-border rounded-md text-v-text focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                >
                  {orgUsers
                    .filter(m => m && m._id !== user._id)
                    .map(member => (
                      <option key={member._id} value={member._id} className="py-1">
                        {member.name}
                      </option>
                    ))}
                </select>
                <small className="text-xs text-v-muted">Hold Ctrl/Cmd to select multiple</small>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-v-border">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-v-muted hover:text-v-text transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Scheduling...' : 'Schedule Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
