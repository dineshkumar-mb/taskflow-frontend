import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

const initialState = {
    sprints: [],
    activeSprint: null,
    isLoading: false,
    isError: false,
    message: '',
};

export const getSprints = createAsyncThunk('sprint/getSprints', async (projectId, thunkAPI) => {
    try {
        const response = await axiosInstance.get(`/sprints/project/${projectId}`);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const createSprint = createAsyncThunk('sprint/createSprint', async (data, thunkAPI) => {
    try {
        const response = await axiosInstance.post(`/sprints`, data);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const updateSprint = createAsyncThunk('sprint/updateSprint', async ({ id, ...data }, thunkAPI) => {
    try {
        const response = await axiosInstance.put(`/sprints/${id}`, data);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const startSprint = createAsyncThunk('sprint/startSprint', async (sprintId, thunkAPI) => {
    try {
        const response = await axiosInstance.put(`/sprints/${sprintId}/start`);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const completeSprint = createAsyncThunk('sprint/completeSprint', async (sprintId, thunkAPI) => {
    try {
        const response = await axiosInstance.put(`/sprints/${sprintId}/complete`);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

const sprintSlice = createSlice({
    name: 'sprint',
    initialState,
    reducers: {
        reset: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(getSprints.pending, (state) => { state.isLoading = true; })
            .addCase(getSprints.fulfilled, (state, action) => {
                state.isLoading = false;
                state.sprints = action.payload;
                state.activeSprint = action.payload.find(s => s.status === 'active') || null;
            })
            .addCase(getSprints.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(createSprint.fulfilled, (state, action) => {
                state.sprints.push(action.payload);
            })
            .addCase(updateSprint.fulfilled, (state, action) => {
                const idx = state.sprints.findIndex(s => s._id === action.payload._id);
                if (idx !== -1) state.sprints[idx] = action.payload;
            })
            .addCase(startSprint.fulfilled, (state, action) => {
                const idx = state.sprints.findIndex(s => s._id === action.payload._id);
                if (idx !== -1) state.sprints[idx] = action.payload;
                state.activeSprint = action.payload;
            })
            .addCase(completeSprint.fulfilled, (state, action) => {
                const idx = state.sprints.findIndex(s => s._id === action.payload._id);
                if (idx !== -1) state.sprints[idx] = action.payload;
                if (state.activeSprint?._id === action.payload._id) {
                    state.activeSprint = null;
                }
            });
    },
});

export const { reset } = sprintSlice.actions;
export default sprintSlice.reducer;
