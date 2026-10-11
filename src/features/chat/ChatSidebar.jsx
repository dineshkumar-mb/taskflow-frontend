import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getConversations, setActiveConversation } from './chatSlice';
import { MessageSquare, Search, Plus, MessageCircle, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import axiosInstance from '../../utils/axiosInstance';

const ChatSidebar = ({ onClose }) => {
    const dispatch = useDispatch();
    const { conversations, isLoading } = useSelector((state) => state.chat);
    const { user } = useSelector((state) => state.auth);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        dispatch(getConversations());
    }, [dispatch]);

    const handleSearch = async (val) => {
        setSearchQuery(val);
        if (val.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await axiosInstance.get(`/users/search?query=${val}`);
            setSearchResults(response.data.filter(u => u._id !== user._id));
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setIsSearching(false);
        }
    };

    const startConversation = async (participantId) => {
        try {
            const response = await axiosInstance.post('/chat/conversations', { participantId });
            dispatch(setActiveConversation(response.data));
            setSearchQuery('');
            setSearchResults([]);
            dispatch(getConversations());
        } catch (error) {
            console.error('Failed to start conversation', error);
        }
    };

    return (
        <div className="flex flex-col h-full bg-v-primary shadow-2xl rounded-2xl overflow-hidden border border-v-border">
            <div className="p-3.5 border-b border-v-border bg-v-secondary flex items-center justify-between">
                <h3 className="font-bold text-sm text-v-main flex items-center gap-2">
                    <MessageSquare size={16} className="text-blue-500" />
                    Team Messages
                </h3>
                <button
                    onClick={onClose}
                    className="p-1 rounded-lg text-v-muted hover:text-v-main hover:bg-v-primary transition-colors"
                    title="Close messages"
                    aria-label="Close messages"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-v-border/60">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-v-muted pointer-events-none" size={14} />
                    <input
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search team members…"
                        spellCheck={false}
                        className="w-full pl-9 pr-3 py-1.5 bg-v-secondary border border-v-border rounded-xl text-xs text-v-main placeholder:text-v-muted focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {searchQuery ? (
                    <div className="p-2 space-y-1">
                        <p className="px-2 text-[10px] font-semibold text-v-muted uppercase tracking-tight mb-2">Search Results</p>
                        {isSearching ? (
                            <div className="flex justify-center p-4"><Loader2 size={16} className="animate-spin text-blue-500" /></div>
                        ) : searchResults.length === 0 ? (
                            <p className="text-center text-xs text-v-muted p-4">No team members found</p>
                        ) : (
                            searchResults.map(u => (
                                <button
                                    key={u._id}
                                    onClick={() => startConversation(u._id)}
                                    className="w-full flex items-center gap-3 p-2 hover:bg-v-secondary rounded-xl transition-colors text-left"
                                >
                                    <div className="h-8 w-8 rounded-full bg-blue-500/15 text-blue-500 flex items-center justify-center font-bold text-xs border border-blue-500/20">
                                        {u.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-semibold text-v-main truncate">{u.name}</p>
                                        <p className="text-[10px] text-v-muted truncate">{u.email}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        <p className="px-2 text-[10px] font-semibold text-v-muted uppercase tracking-wider mb-1.5">Conversations</p>
                        {conversations.length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center">
                                <div className="h-10 w-10 rounded-full bg-v-secondary flex items-center justify-center mb-2">
                                    <MessageCircle size={18} className="text-v-muted opacity-50" />
                                </div>
                                <p className="text-xs font-medium text-v-main">No messages yet</p>
                                <p className="text-[11px] text-v-muted mt-0.5">Search a teammate above to chat</p>
                            </div>
                        ) : (
                            conversations.map(conv => {
                                const other = conv.participants.find(p => p._id !== user._id);
                                return (
                                    <button
                                        key={conv._id}
                                        onClick={() => dispatch(setActiveConversation(conv))}
                                        className="w-full flex items-center gap-3 p-2.5 hover:bg-v-secondary rounded-xl transition-colors text-left group"
                                    >
                                        <div className="relative">
                                            <div className="h-9 w-9 rounded-full bg-indigo-500/15 text-indigo-500 flex items-center justify-center font-bold text-xs border border-indigo-500/20">
                                                {other?.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-v-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <p className="text-xs sm:text-sm font-semibold text-v-main truncate">{other?.name}</p>
                                                <span className="text-[9px] text-v-muted font-medium">
                                                    {conv.updatedAt && format(new Date(conv.updatedAt), 'h:mm a')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-v-muted truncate">
                                                {conv.lastMessage?.content || 'Started a conversation'}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatSidebar;
