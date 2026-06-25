import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosInstance';
import { MeetingScheduler } from './MeetingScheduler';
import { Video, Calendar, Clock, Users, ArrowRight } from 'lucide-react';

export const GlobalMeetingsPage = () => {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchMeetings();
    }, []);

    const fetchMeetings = async () => {
        try {
            const response = await axios.get('/meetings');
            setMeetings(response.data.meetings || []);
        } catch (error) {
            console.error('Error fetching global meetings:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-v-main flex items-center gap-2">
                        <Video className="text-blue-500" />
                        My Meetings
                    </h1>
                    <p className="text-sm text-v-muted mt-1">View and manage all your upcoming and past meetings across projects.</p>
                </div>
                {/* Note: We pass no projectId here, we'll need MeetingScheduler to handle it */}
                <MeetingScheduler onSuccess={(m) => {
                    setMeetings(prev => [m, ...prev]);
                }} />
            </div>

            {loading ? (
                <div className="flex justify-center p-12 text-v-muted">Loading meetings...</div>
            ) : meetings.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 bg-v-primary border border-dashed border-v-border rounded-xl">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                        <Video size={32} className="text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-v-main mb-2">No meetings found</h3>
                    <p className="text-v-muted mb-6 text-center max-w-sm">You haven't scheduled or been invited to any meetings yet.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {meetings.map(meeting => (
                        <div key={meeting._id} className="bg-v-primary border border-v-border rounded-xl p-5 hover:border-blue-500/30 transition-colors shadow-sm flex flex-col">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-v-main text-lg truncate">{meeting.title}</h3>
                                    <span className="text-xs text-v-muted font-medium bg-v-secondary px-2 py-0.5 rounded-full mt-1 inline-block">
                                        Project: {meeting.projectId?.name || 'Unknown'}
                                    </span>
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                                    meeting.status === 'live' ? 'bg-red-500/10 text-red-500' :
                                    meeting.status === 'scheduled' ? 'bg-blue-500/10 text-blue-500' :
                                    'bg-gray-500/10 text-gray-500'
                                }`}>
                                    {meeting.status}
                                </span>
                            </div>

                            <div className="space-y-2 mb-6">
                                <div className="flex items-center gap-2 text-sm text-v-muted">
                                    <Calendar size={14} className="opacity-70" />
                                    <span>{new Date(meeting.scheduledAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-v-muted">
                                    <Clock size={14} className="opacity-70" />
                                    <span>{new Date(meeting.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-v-muted">
                                    <Users size={14} className="opacity-70" />
                                    <span>{meeting.participantIds?.length || 0} participants</span>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-v-border grid grid-cols-2 gap-2">
                                {meeting.status === 'ended' ? (
                                    <button 
                                        onClick={() => navigate(`/meetings/${meeting._id}/mom`)}
                                        className="col-span-2 flex items-center justify-center gap-2 w-full py-2 bg-v-secondary hover:bg-v-secondary/80 text-v-main rounded-lg text-sm font-medium transition-colors"
                                    >
                                        View MOM <ArrowRight size={16} />
                                    </button>
                                ) : (
                                    <>
                                        <button 
                                            onClick={() => navigate(`/meetings/${meeting._id}/join`)}
                                            className="col-span-2 flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                                        >
                                            {meeting.status === 'live' ? 'Join Now' : 'Join'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
