import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosInstance';
import { MeetingScheduler } from './MeetingScheduler';
import { Video, Calendar, Clock, Users, ArrowRight } from 'lucide-react';
import { GlobalMeetingsSkeleton } from '../../components/ui/Skeleton';

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
                <GlobalMeetingsSkeleton />
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
                        <div key={meeting._id} className="bg-v-primary border border-v-border rounded-xl p-5 hover:border-blue-500/40 hover:shadow-md transition-all duration-200 flex flex-col group">
                            <div className="flex justify-between items-start mb-3 gap-2">
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-v-main text-lg truncate group-hover:text-blue-500 transition-colors">{meeting.title}</h3>
                                    <span className="text-xs text-v-muted font-medium bg-v-secondary border border-v-border px-2 py-0.5 rounded-full mt-1 inline-block">
                                        Project: {meeting.projectId?.name || 'General'}
                                    </span>
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0 ${
                                    meeting.status === 'live' ? 'bg-red-500/10 border border-red-500/20 text-red-500' :
                                    meeting.status === 'scheduled' ? 'bg-blue-500/10 border border-blue-500/20 text-blue-500' :
                                    'bg-v-secondary border border-v-border text-v-muted'
                                }`}>
                                    {meeting.status === 'live' && (
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                        </span>
                                    )}
                                    {meeting.status}
                                </span>
                            </div>

                            <div className="space-y-2 mb-6">
                                <div className="flex items-center gap-2 text-sm text-v-muted">
                                    <Calendar size={14} className="opacity-70 text-blue-500" />
                                    <span>{new Date(meeting.scheduledAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-v-muted">
                                    <Clock size={14} className="opacity-70 text-blue-500" />
                                    <span>{new Date(meeting.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-v-muted">
                                    <Users size={14} className="opacity-70 text-blue-500" />
                                    <span>{meeting.participantIds?.length || 0} participant{meeting.participantIds?.length === 1 ? '' : 's'}</span>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-v-border grid grid-cols-2 gap-2">
                                {meeting.status === 'ended' ? (
                                    <button 
                                        onClick={() => navigate(`/meetings/${meeting._id}/mom`)}
                                        className="col-span-2 flex items-center justify-center gap-2 w-full py-2.5 bg-v-secondary hover:bg-v-border text-v-main rounded-lg text-sm font-medium transition-colors border border-v-border active:scale-98"
                                    >
                                        View MOM <ArrowRight size={16} />
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => navigate(`/meetings/${meeting._id}/join`)}
                                        className={`col-span-2 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm active:scale-98 text-white ${
                                            meeting.status === 'live'
                                                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                                        }`}
                                    >
                                        <Video size={16} />
                                        {meeting.status === 'live' ? 'Join Live Meeting' : 'Join Call'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
