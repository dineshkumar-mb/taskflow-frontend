import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

const initialState = {
    boards: [],
    currentBoard: null,
    issues: [],
    selectedIssue: null,
    isLoading: false,
    isError: false,
    message: '',
};

export const getBoards = createAsyncThunk('board/getBoards', async (projectId, thunkAPI) => {
    try {
        const response = await axiosInstance.get(`/boards/project/${projectId}`);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const updateBoard = createAsyncThunk('board/updateBoard', async ({ id, data }, thunkAPI) => {
    try {
        const response = await axiosInstance.put(`/boards/${id}`, data);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const getIssues = createAsyncThunk('board/getIssues', async (projectId, thunkAPI) => {
    try {
        const response = await axiosInstance.get(`/issues?projectId=${projectId}`);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const getIssueById = createAsyncThunk('board/getIssueById', async (issueId, thunkAPI) => {
    try {
        const response = await axiosInstance.get(`/issues/${issueId}`);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const updateIssueStatus = createAsyncThunk(
    'board/updateIssueStatus',
    async ({ issueId, status, position }, thunkAPI) => {
        try {
            const response = await axiosInstance.put(
                `/issues/${issueId}`,
                { status, position }
            );
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const reorderIssues = createAsyncThunk(
    'board/reorderIssues',
    async ({ issueId, status, position, projectId, sprintId }, thunkAPI) => {
        try {
            const response = await axiosInstance.post(`/issues/reorder`, {
                issueId,
                status,
                position,
                projectId,
                sprintId
            });
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const updateIssue = createAsyncThunk('board/updateIssue', async ({ id, ...data }, thunkAPI) => {
    try {
        const response = await axiosInstance.put(`/issues/${id}`, data);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const createIssue = createAsyncThunk('board/createIssue', async (issueData, thunkAPI) => {
    try {
        const response = await axiosInstance.post(`/issues`, issueData);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const deleteIssue = createAsyncThunk('board/deleteIssue', async (issueId, thunkAPI) => {
    try {
        await axiosInstance.delete(`/issues/${issueId}`);
        return issueId;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const boardSlice = createSlice({
    name: 'board',
    initialState,
    reducers: {
        reset: () => initialState,
        setCurrentBoard: (state, action) => {
            state.currentBoard = action.payload;
        },
        setSelectedIssue: (state, action) => {
            state.selectedIssue = action.payload;
        },
        moveIssueOptimistic: (state, action) => {
            const { issueId, status, position } = action.payload;
            const issueIndex = state.issues.findIndex((i) => i._id === issueId);
            if (issueIndex !== -1) {
                state.issues[issueIndex].status = status;
                state.issues[issueIndex].position = position;
            }
        },
        moveIssueBetweenSprintsOptimistic: (state, action) => {
            const { issueId, sprintId } = action.payload;
            const issueIndex = state.issues.findIndex((i) => i._id === issueId);
            if (issueIndex !== -1) {
                state.issues[issueIndex].sprint = sprintId || null;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getBoards.pending, (state) => { state.isLoading = true; })
            .addCase(getBoards.fulfilled, (state, action) => {
                state.isLoading = false;
                state.boards = action.payload;
                // Always set to freshly fetched board to avoid stale data on project switch
                if (action.payload.length > 0) {
                    state.currentBoard = action.payload[0];
                }
            })
            .addCase(getBoards.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(updateBoard.fulfilled, (state, action) => {
                const index = state.boards.findIndex((b) => b._id === action.payload._id);
                if (index !== -1) {
                    state.boards[index] = action.payload;
                }
                if (state.currentBoard?._id === action.payload._id) {
                    state.currentBoard = action.payload;
                }
            })
            .addCase(getIssues.fulfilled, (state, action) => {
                state.issues = action.payload;
            })
            .addCase(getIssueById.fulfilled, (state, action) => {
                state.selectedIssue = action.payload;
            })
            .addCase(updateIssueStatus.fulfilled, (state, action) => {
                const index = state.issues.findIndex((i) => i._id === action.payload._id);
                if (index !== -1) state.issues[index] = action.payload;
            })
            .addCase(updateIssue.fulfilled, (state, action) => {
                const index = state.issues.findIndex((i) => i._id === action.payload._id);
                if (index !== -1) state.issues[index] = action.payload;
                if (state.selectedIssue?._id === action.payload._id) {
                    state.selectedIssue = action.payload;
                }
            })
            .addCase(createIssue.fulfilled, (state, action) => {
                state.issues.push(action.payload);
            })
            .addCase(deleteIssue.fulfilled, (state, action) => {
                state.issues = state.issues.filter((i) => i._id !== action.payload);
            })
            .addCase(reorderIssues.fulfilled, (state, action) => {
                const index = state.issues.findIndex((i) => i._id === action.payload._id);
                if (index !== -1) state.issues[index] = action.payload;
            })
            .addCase(reorderIssues.rejected, (state, action) => {
                // Revert optimistic update using previous data from args
                const { issueId, previousStatus, previousPosition, previousSprint } = action.meta.arg;
                const index = state.issues.findIndex((i) => i._id === issueId);
                if (index !== -1) {
                    if (previousStatus) state.issues[index].status = previousStatus;
                    if (previousPosition !== undefined) state.issues[index].position = previousPosition;
                    if (previousSprint !== undefined) state.issues[index].sprint = previousSprint;
                }
            })
            .addCase(updateIssueStatus.rejected, (state, action) => {
                const { issueId, previousStatus } = action.meta.arg;
                const index = state.issues.findIndex((i) => i._id === issueId);
                if (index !== -1 && previousStatus) {
                    state.issues[index].status = previousStatus;
                }
            });
    },
});

export const { reset, setCurrentBoard, setSelectedIssue, moveIssueOptimistic, moveIssueBetweenSprintsOptimistic } = boardSlice.actions;
export default boardSlice.reducer;
