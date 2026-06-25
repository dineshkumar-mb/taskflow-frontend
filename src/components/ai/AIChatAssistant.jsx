import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import ReactMarkdown from 'react-markdown';

const AIChatAssistant = ({ projectId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chat, setChat] = useState([
        { role: 'ai', content: 'Hello! I am your Project Copilot. How can I help you today?', action: 'general_chat' }
    ]);
    const [loading, setLoading] = useState(false);

    const [conversationState, setConversationState] = useState({});
    const [history, setHistory] = useState([]);
    // tracks available projects returned by backend for smart UX
    const [orgProjects, setOrgProjects] = useState([]);

    const chatEndRef = useRef(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat, loading]);

    const handleSend = () => {
        if (!message.trim() || loading) return;
        sendWithText(message);
        setMessage('');
    };

    // Core send logic — accepts any text (used by input + chip clicks)
    const sendWithText = async (text) => {
        if (!text.trim() || loading) return;

        const userMsg = { role: 'user', content: text };
        setChat(prev => [...prev, userMsg]);
        setLoading(true);

        try {
            const payload = { message: text, conversationState, history };
            if (projectId && projectId !== 'undefined') payload.projectId = projectId;

            const response = await axiosInstance.post('/ai/copilot', payload);
            const data = response.data;

            if (data.updatedConversationState !== undefined) {
                setConversationState(data.updatedConversationState);
            } else if (data.issueData) {
                setConversationState(prev => ({
                    ...prev,
                    ...(data.issueData.title && { title: data.issueData.title }),
                    ...(data.issueData.description && { description: data.issueData.description }),
                    ...(data.issueData.priority && { priority: data.issueData.priority }),
                    ...(data.issueData.type && { type: data.issueData.type }),
                }));
            }

            setHistory(prev => [
                ...prev,
                { role: 'user', content: text },
                { role: 'assistant', content: data.message || '' },
            ]);

            const aiMsg = {
                role: 'ai',
                content: data.message || 'Done.',
                action: data.action,
                issueData: data.issueData,
                createdIssue: data.createdIssue || null,
                createdProject: data.createdProject || null,
                missingFields: data.missingFields || [],
                availableProjects: data.availableProjects || [],
            };

            if (data.availableProjects?.length) setOrgProjects(data.availableProjects);

            setChat(prev => [...prev, aiMsg]);

            if ((data.action === 'create_issue' && data.createdIssue) || (data.action === 'create_project' && data.createdProject)) {
                setConversationState({});
                setHistory([]);
            }
        } catch (error) {
            console.error('Copilot error:', error);
            setChat(prev => [
                ...prev,
                { role: 'ai', content: 'Sorry, I encountered an error. Please try again.', action: 'general_chat' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Send a pre-set text from a chip click
    const handleSendText = (text) => {
        sendWithText(text);
    };

    // Render an AI message bubble — handles markdown + action-specific UI
    const AIMessage = ({ msg }) => (
        <div className="flex justify-start">
            <div className="max-w-[85%] flex flex-col gap-2">
                <div className="bg-v-primary text-v-main border border-v-border shadow-sm rounded-2xl rounded-bl-none p-3 text-sm prose prose-sm max-w-none prose-p:my-0 prose-ul:my-1">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>

                {/* Show created issue card on successful creation */}
                {msg.action === 'create_issue' && msg.createdIssue && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-xl p-3 text-xs flex flex-col gap-1">
                        <div className="flex items-center gap-1 font-semibold text-green-700 dark:text-green-400">
                            <CheckCircle size={14} />
                            Issue Created Successfully
                        </div>
                        <p className="text-v-main font-medium">{msg.createdIssue.title}</p>
                        <div className="flex gap-2 text-v-muted">
                            <span className="capitalize bg-v-secondary px-2 py-0.5 rounded-full">{msg.createdIssue.type}</span>
                            <span className="capitalize bg-v-secondary px-2 py-0.5 rounded-full">{msg.createdIssue.priority}</span>
                        </div>
                    </div>
                )}

                {/* Show created project card on successful creation */}
                {msg.action === 'create_project' && msg.createdProject && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-700 rounded-xl p-3 text-xs flex flex-col gap-1">
                        <div className="flex items-center gap-1 font-semibold text-purple-700 dark:text-purple-400">
                            <CheckCircle size={14} />
                            Project Created Successfully
                        </div>
                        <p className="text-v-main font-medium">{msg.createdProject.name}</p>
                        <div className="flex gap-2 text-v-muted">
                            <span className="bg-v-secondary px-2 py-0.5 rounded-full font-mono uppercase">{msg.createdProject.key}</span>
                        </div>
                    </div>
                )}

                {/* Show issue preview when all fields are ready but waiting for save */}
                {msg.action === 'create_issue' && msg.issueData && !msg.createdIssue && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-xl p-3 text-xs flex flex-col gap-1">
                        <div className="flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400">
                            <AlertCircle size={14} />
                            Issue Ready (no project selected)
                        </div>
                        <p className="text-v-main font-medium">{msg.issueData.title}</p>
                        <div className="flex gap-2 text-v-muted">
                            <span className="capitalize bg-v-secondary px-2 py-0.5 rounded-full">{msg.issueData.type || '–'}</span>
                            <span className="capitalize bg-v-secondary px-2 py-0.5 rounded-full">{msg.issueData.priority || '–'}</span>
                        </div>
                    </div>
                )}

                {/* Smart project picker: show when project is missing */}
                {msg.missingFields?.includes('projectName') && msg.availableProjects?.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                        <p className="text-xs text-v-muted font-medium">Choose a project:</p>
                        <div className="flex flex-wrap gap-1.5">
                            {msg.availableProjects.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => handleSendText(`add it to ${p.name}`)}
                                    className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800/40 px-2.5 py-1 rounded-full transition-colors font-medium"
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Fallback: show missing fields pills only when no project chips are shown */}
                {msg.missingFields?.length > 0 && !msg.availableProjects?.length && (
                    <div className="flex flex-wrap gap-1">
                        {msg.missingFields.map(f => (
                            <span key={f} className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700 px-2 py-0.5 rounded-full">
                                Missing: {f}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="relative mb-6">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-110"
                    title="Open AI Copilot"
                >
                    <Bot size={24} />
                </button>
            ) : (
                <div className="bg-v-primary rounded-2xl shadow-2xl w-80 sm:w-96 flex flex-col overflow-hidden border border-v-border">
                    {/* Header */}
                    <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                        <div className="flex items-center gap-2 font-semibold">
                            <Bot size={20} />
                            <span>AI Copilot</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:opacity-75 transition-opacity">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Chat window */}
                    <div className="h-96 overflow-y-auto p-4 flex flex-col gap-3 bg-v-secondary/50">
                        {chat.map((msg, i) =>
                            msg.role === 'user' ? (
                                <div key={i} className="flex justify-end">
                                    <div className="max-w-[80%] p-3 rounded-2xl text-sm bg-blue-600 text-white rounded-br-none">
                                        {msg.content}
                                    </div>
                                </div>
                            ) : (
                                <AIMessage key={i} msg={msg} />
                            )
                        )}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-v-primary p-3 rounded-2xl shadow-sm rounded-bl-none border border-v-border flex items-center gap-2 text-v-muted text-sm">
                                    <Loader2 size={14} className="animate-spin" />
                                    Thinking...
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-v-primary border-t border-v-border flex gap-2">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask anything..."
                            className="flex-1 bg-v-secondary border border-v-border rounded-lg px-4 py-2 text-sm text-v-main placeholder-v-muted focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                            disabled={loading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!message.trim() || loading}
                            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIChatAssistant;
