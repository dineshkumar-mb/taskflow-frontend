import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMessages, sendMessage, addMessage, clearActiveConversation } from './chatSlice';
import { X, Send, Smile, Paperclip, Loader2 } from 'lucide-react';
import { socket } from '../../utils/socket';
import { format } from 'date-fns';

const ChatWindow = ({ conversation, onClose }) => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { messages: allMessages } = useSelector((state) => state.chat);
    const messages = allMessages[conversation._id] || [];

    const [content, setContent] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState(null);
    const scrollRef = useRef();
    const typingTimeoutRef = useRef();

    const otherParticipant = conversation.participants.find(p => p._id !== user._id);

    useEffect(() => {
        dispatch(getMessages(conversation._id));

        // Join conversation room
        socket.emit('chat:join', conversation._id);

        // Listen for new messages
        socket.on('chat:message', (message) => {
            if (message.conversation === conversation._id) {
                dispatch(addMessage(message));
            }
        });

        // Listen for typing
        socket.on('chat:typing', ({ userId, userName }) => {
            if (userId !== user._id) {
                setTypingUser(userName);
            }
        });

        socket.on('chat:stop_typing', ({ userId }) => {
            if (userId !== user._id) {
                setTypingUser(null);
            }
        });

        return () => {
            socket.emit('chat:leave', conversation._id);
            socket.off('chat:message');
            socket.off('chat:typing');
            socket.off('chat:stop_typing');
        };
    }, [conversation._id, dispatch, user._id]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typingUser]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        dispatch(sendMessage({ conversationId: conversation._id, content }));
        setContent('');
        socket.emit('chat:stop_typing', { conversationId: conversation._id, userId: user._id });
    };

    const handleTyping = (e) => {
        setContent(e.target.value);

        if (!isTyping) {
            setIsTyping(true);
            socket.emit('chat:typing', {
                conversationId: conversation._id,
                userId: user._id,
                userName: user.name
            });
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            socket.emit('chat:stop_typing', { conversationId: conversation._id, userId: user._id });
        }, 3000);
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 shadow-2xl rounded-t-xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-800 bg-blue-600 text-white">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs uppercase">
                        {otherParticipant?.name?.charAt(0)}
                    </div>
                    <div>
                        <p className="text-sm font-semibold truncate leading-tight">{otherParticipant?.name}</p>
                        <p className="text-[10px] text-blue-100">Online</p>
                    </div>
                </div>
                <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
                    <X size={18} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => {
                    const isOwn = msg.sender?._id === user._id || msg.sender === user._id;
                    return (
                        <div key={msg._id || i} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isOwn
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none'
                                }`}>
                                <p>{msg.content}</p>
                                <p className={`text-[10px] mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                                    {format(new Date(msg.createdAt), 'h:mm a')}
                                </p>
                            </div>
                        </div>
                    );
                })}
                {typingUser && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl px-4 py-2 text-xs italic flex items-center gap-2">
                            <div className="flex gap-0.5">
                                <span className="animate-bounce">.</span>
                                <span className="animate-bounce delay-100">.</span>
                                <span className="animate-bounce delay-200">.</span>
                            </div>
                            {typingUser} is typing
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <button type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                    <Paperclip size={20} />
                </button>
                <input
                    value={content}
                    onChange={handleTyping}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-blue-500 rounded-lg py-2 px-3 text-sm dark:text-white"
                />
                <button type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                    <Smile size={20} />
                </button>
                <button
                    type="submit"
                    disabled={!content.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;
