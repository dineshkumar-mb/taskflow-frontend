import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

const initialState = {
    activities: [],
    isLoading: false,
    isError: false,
    message: '',
};

export const getIssueActivities = createAsyncThunk('activity/getIssueActivities', async (issueId, thunkAPI) => {
    try {
        const response = await axiosInstance.get(`/issues/${issueId}/activities`);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const activitySlice = createSlice({
    name: 'activity',
    initialState,
    reducers: {
        resetActivity: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(getIssueActivities.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getIssueActivities.fulfilled, (state, action) => {
                state.isLoading = false;
                state.activities = action.payload;
            })
            .addCase(getIssueActivities.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { resetActivity } = activitySlice.actions;
export default activitySlice.reducer;
