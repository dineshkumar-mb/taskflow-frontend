import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

const initialState = {
    conversations: [],
    messages: {}, // { conversationId: [messages] }
    activeConversation: null,
    isLoading: false,
    isError: false,
    message: '',
};

export const getConversations = createAsyncThunk('chat/getConversations', async (_, thunkAPI) => {
    try {
        const response = await axiosInstance.get('/chat/conversations');
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const getOrCreateConversation = createAsyncThunk('chat/getOrCreate', async (participantId, thunkAPI) => {
    try {
        const response = await axiosInstance.post('/chat/conversations', { participantId });
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const getMessages = createAsyncThunk('chat/getMessages', async (conversationId, thunkAPI) => {
    try {
        const response = await axiosInstance.get(`/chat/messages/${conversationId}`);
        return { conversationId, messages: response.data };
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const sendMessage = createAsyncThunk('chat/sendMessage', async ({ conversationId, content }, thunkAPI) => {
    try {
        const response = await axiosInstance.post('/chat/messages', { conversationId, content });
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setActiveConversation: (state, action) => {
            state.activeConversation = action.payload;
        },
        addMessage: (state, action) => {
            const message = action.payload;
            const convId = message.conversation;
            if (state.messages[convId]) {
                state.messages[convId].push(message);
            } else {
                state.messages[convId] = [message];
            }
        },
        clearActiveConversation: (state) => {
            state.activeConversation = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getConversations.fulfilled, (state, action) => {
                state.conversations = action.payload;
            })
            .addCase(getOrCreateConversation.fulfilled, (state, action) => {
                const exists = state.conversations.find(c => c._id === action.payload._id);
                if (!exists) {
                    state.conversations.unshift(action.payload);
                }
                state.activeConversation = action.payload;
            })
            .addCase(getMessages.fulfilled, (state, action) => {
                state.messages[action.payload.conversationId] = action.payload.messages;
            })
            .addCase(sendMessage.fulfilled, (state, action) => {
                const message = action.payload;
                const convId = message.conversation;
                if (state.messages[convId]) {
                    state.messages[convId].push(message);
                } else {
                    state.messages[convId] = [message];
                }
            });
    }
});

export const { setActiveConversation, addMessage, clearActiveConversation } = chatSlice.actions;
export default chatSlice.reducer;
