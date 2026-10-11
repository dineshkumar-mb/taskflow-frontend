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
        <div className="flex flex-col h-full bg-v-primary shadow-2xl rounded-2xl overflow-hidden border border-v-border animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-3.5 py-3 border-b border-v-border bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                        {otherParticipant?.name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold truncate leading-tight">{otherParticipant?.name}</p>
                        <p className="text-[10px] text-blue-100 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 inline-block" />
                            Direct Message
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                    title="Close chat"
                    aria-label="Close chat"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-v-secondary/40">
                {messages.map((msg, i) => {
                    const isOwn = msg.sender?._id === user._id || msg.sender === user._id;
                    return (
                        <div key={msg._id || i} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm ${isOwn
                                    ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                                    : 'bg-v-primary text-v-main border border-v-border rounded-bl-none shadow-sm'
                                }`}>
                                <p className="leading-relaxed break-words">{msg.content}</p>
                                <p className={`text-[9px] mt-1 text-right font-medium ${isOwn ? 'text-blue-100' : 'text-v-muted'}`}>
                                    {format(new Date(msg.createdAt), 'h:mm a')}
                                </p>
                            </div>
                        </div>
                    );
                })}
                {typingUser && (
                    <div className="flex justify-start">
                        <div className="bg-v-primary border border-v-border text-v-muted rounded-2xl px-3 py-1.5 text-xs italic flex items-center gap-2 shadow-sm">
                            <div className="flex gap-0.5">
                                <span className="animate-bounce">.</span>
                                <span className="animate-bounce delay-100">.</span>
                                <span className="animate-bounce delay-200">.</span>
                            </div>
                            {typingUser} is typing…
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-v-border bg-v-primary flex items-center gap-2">
                <input
                    value={content}
                    onChange={handleTyping}
                    placeholder="Type a message…"
                    spellCheck={false}
                    className="flex-1 bg-v-secondary border border-v-border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl py-2 px-3 text-xs sm:text-sm text-v-main placeholder:text-v-muted outline-none transition-colors"
                />
                <button
                    type="submit"
                    disabled={!content.trim()}
                    aria-label="Send message"
                    title="Send message"
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white p-2 rounded-xl transition-all shadow-sm active:scale-95 flex-shrink-0"
                >
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;
