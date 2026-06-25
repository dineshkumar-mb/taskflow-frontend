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
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 shadow-2xl rounded-t-xl overflow-hidden border-x border-gray-100 dark:border-gray-800">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <MessageSquare size={18} className="text-blue-500" />
                    Messages
                </h3>
                <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600">
                    <X size={18} />
                </button>
            </div>

            {/* Search */}
            <div className="p-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search people..."
                        className="w-full pl-9 pr-3 py-1.5 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-xs focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {searchQuery ? (
                    <div className="p-2 space-y-1">
                        <p className="px-2 text-[10px] font-semibold text-gray-400 uppercase tracking-tight mb-2">Search Results</p>
                        {isSearching ? (
                            <div className="flex justify-center p-4"><Loader2 size={16} className="animate-spin text-blue-500" /></div>
                        ) : searchResults.length === 0 ? (
                            <p className="text-center text-xs text-gray-500 p-4">No people found</p>
                        ) : (
                            searchResults.map(u => (
                                <button
                                    key={u._id}
                                    onClick={() => startConversation(u._id)}
                                    className="w-full flex items-center gap-3 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-left"
                                >
                                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                        {u.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{u.name}</p>
                                        <p className="text-[10px] text-gray-500 truncate">{u.email}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        <p className="px-2 text-[10px] font-semibold text-gray-400 uppercase tracking-tight mb-2">Recent</p>
                        {conversations.length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center">
                                <MessageCircle size={24} className="text-gray-200 mb-2" />
                                <p className="text-xs text-gray-400">No conversations yet</p>
                            </div>
                        ) : (
                            conversations.map(conv => {
                                const other = conv.participants.find(p => p._id !== user._id);
                                return (
                                    <button
                                        key={conv._id}
                                        onClick={() => dispatch(setActiveConversation(conv))}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors text-left group"
                                    >
                                        <div className="relative">
                                            <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                                {other?.name?.charAt(0)}
                                            </div>
                                            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{other?.name}</p>
                                                <span className="text-[9px] text-gray-400">
                                                    {conv.updatedAt && format(new Date(conv.updatedAt), 'h:mm a')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
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
