import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

const initialState = {
    comments: [],
    isLoading: false,
    isError: false,
    message: '',
};

export const getComments = createAsyncThunk('comment/getComments', async (issueId, thunkAPI) => {
    try {
        const response = await axiosInstance.get(`/comments?issueId=${issueId}`);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const addComment = createAsyncThunk('comment/addComment', async ({ issueId, content }, thunkAPI) => {
    try {
        const response = await axiosInstance.post(`/comments`, { issueId, content });
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const deleteComment = createAsyncThunk('comment/deleteComment', async (commentId, thunkAPI) => {
    try {
        await axiosInstance.delete(`/comments/${commentId}`);
        return commentId;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

const commentSlice = createSlice({
    name: 'comment',
    initialState,
    reducers: {
        reset: () => initialState,
        clearComments: (state) => { state.comments = []; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getComments.pending, (state) => { state.isLoading = true; })
            .addCase(getComments.fulfilled, (state, action) => {
                state.isLoading = false;
                state.comments = action.payload;
            })
            .addCase(getComments.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(addComment.fulfilled, (state, action) => {
                state.comments.push(action.payload);
            })
            .addCase(deleteComment.fulfilled, (state, action) => {
                state.comments = state.comments.filter(c => c._id !== action.payload);
            });
    },
});

export const { reset, clearComments } = commentSlice.actions;
export default commentSlice.reducer;
