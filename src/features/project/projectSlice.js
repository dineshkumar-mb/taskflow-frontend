import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

const errMessage = (error) => {
    return (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
};

const initialState = {
    projects: [],
    currentProject: null,
    isLoading: false,
    isError: false,
    isSuccess: false,
    message: '',
};

// Fetch user projects
export const getProjects = createAsyncThunk(
    'projects/getAll',
    async (_, thunkAPI) => {
        try {
            const response = await axiosInstance.get('/projects');
            return response.data;
        } catch (error) {
            const message = errMessage(error);
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Create new project
export const createProject = createAsyncThunk(
    'projects/create',
    async (projectData, thunkAPI) => {
        try {
            const response = await axiosInstance.post('/projects', projectData);
            return response.data;
        } catch (error) {
            const message = errMessage(error);
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Update a project
export const updateProject = createAsyncThunk(
    'projects/update',
    async ({ id, ...data }, thunkAPI) => {
        try {
            const response = await axiosInstance.put(`/projects/${id}`, data);
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Delete a project
export const deleteProject = createAsyncThunk(
    'projects/delete',
    async (projectId, thunkAPI) => {
        try {
            await axiosInstance.delete(`/projects/${projectId}`);
            return projectId;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const projectSlice = createSlice({
    name: 'project',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
            state.currentProject = null;
        },
        setCurrentProject: (state, action) => {
            state.currentProject = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getProjects.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getProjects.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.projects = action.payload;
            })
            .addCase(getProjects.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(createProject.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createProject.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.projects.push(action.payload);
            })
            .addCase(createProject.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(updateProject.fulfilled, (state, action) => {
                const index = state.projects.findIndex(p => p._id === action.payload._id);
                if (index !== -1) state.projects[index] = action.payload;
                if (state.currentProject?._id === action.payload._id) {
                    state.currentProject = action.payload;
                }
            })
            .addCase(deleteProject.fulfilled, (state, action) => {
                state.projects = state.projects.filter(p => p._id !== action.payload);
                if (state.currentProject?._id === action.payload) {
                    state.currentProject = null;
                }
            });
    },
});

export const { reset, setCurrentProject } = projectSlice.actions;
export default projectSlice.reducer;
