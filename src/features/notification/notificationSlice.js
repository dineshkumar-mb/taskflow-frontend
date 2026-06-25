import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

const initialState = {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    isError: false,
    message: '',
};

export const getNotifications = createAsyncThunk('notification/getAll', async (_, thunkAPI) => {
    try {
        const response = await axiosInstance.get(`/notifications`);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const markAsRead = createAsyncThunk('notification/markRead', async (id, thunkAPI) => {
    try {
        const response = await axiosInstance.put(`/notifications/${id}/read`);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const markAllAsRead = createAsyncThunk('notification/markAllRead', async (_, thunkAPI) => {
    try {
        const response = await axiosInstance.put(`/notifications/read-all`);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const notificationSlice = createSlice({
    name: 'notification',
    initialState,
    reducers: {
        addNotification: (state, action) => {
            state.notifications.unshift(action.payload);
            state.unreadCount += 1;
        },
    },
    extraReducers: (builder) => {
        builder
            // Get all
            .addCase(getNotifications.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getNotifications.fulfilled, (state, action) => {
                state.isLoading = false;
                state.notifications = action.payload;
                state.unreadCount = action.payload.filter(n => !n.read).length;
            })
            .addCase(getNotifications.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Mark read
            .addCase(markAsRead.fulfilled, (state, action) => {
                const index = state.notifications.findIndex(n => n._id === action.payload._id);
                if (index !== -1 && !state.notifications[index].read) {
                    state.notifications[index].read = true;
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
            })
            // Mark all read
            .addCase(markAllAsRead.fulfilled, (state) => {
                state.notifications.forEach(n => n.read = true);
                state.unreadCount = 0;
            });
    },
});

export const { addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
