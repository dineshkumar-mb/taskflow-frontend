import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

// Removed hardcoded API_URL reference, handled inside axiosInstance

// Register user
export const register = createAsyncThunk(
    'auth/register',
    async (userData, thunkAPI) => {
        try {
            // Note: withCredentials: true is automatically handled by axiosInstance
            const response = await axiosInstance.post(`/auth/register`, userData);
            if (response.data) {
                // Notice we still keep basic user profile in local storage, but NOT the Token String! 
                // The token is an HTTP-only cookie now.
                localStorage.setItem('user', JSON.stringify({
                    _id: response.data._id,
                    name: response.data.name,
                    email: response.data.email,
                    role: response.data.role,
                    organizationId: response.data.organizationId,
                }));
            }
            return response.data;
        } catch (error) {
            const message =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Login user
export const login = createAsyncThunk('auth/login', async (user, thunkAPI) => {
    try {
        const response = await axiosInstance.post(`/auth/login`, user);
        if (response.data) {
            localStorage.setItem('user', JSON.stringify({
                _id: response.data._id,
                name: response.data.name,
                email: response.data.email,
                role: response.data.role,
                organizationId: response.data.organizationId,
            }));
        }
        return response.data;
    } catch (error) {
        const message =
            (error.response && error.response.data && error.response.data.message) ||
            error.message ||
            error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Forgot Password
export const forgotPassword = createAsyncThunk(
    'auth/forgotPassword',
    async (email, thunkAPI) => {
        try {
            const response = await axiosInstance.post('/auth/forgotpassword', { email });
            return response.data;
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Reset Password
export const resetPassword = createAsyncThunk(
    'auth/resetPassword',
    async ({ token, password }, thunkAPI) => {
        try {
            const response = await axiosInstance.put(`/auth/resetpassword/${token}`, { password });
            return response.data;
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Logout user
export const logout = createAsyncThunk('auth/logout', async () => {
    // Hits the backend to clear the HTTP-only cookies
    await axiosInstance.post(`/auth/logout`);
    localStorage.removeItem('user');
});

// Sync session on mount
export const initializeAuth = createAsyncThunk(
    'auth/initialize',
    async (_, thunkAPI) => {
        try {
            const response = await axiosInstance.get('/auth/refresh');
            if (response.data) {
                localStorage.setItem('user', JSON.stringify({
                    _id: response.data._id,
                    name: response.data.name,
                    email: response.data.email,
                    role: response.data.role,
                    organizationId: response.data.organizationId,
                }));
            }
            return response.data;
        } catch (error) {
            localStorage.removeItem('user');
            return thunkAPI.rejectWithValue('Session expired');
        }
    }
);

// Helper to check user session on mount
const storedUser = JSON.parse(localStorage.getItem('user'));

const initialState = {
    user: storedUser || null,
    isAuthenticated: !!storedUser,
    isLoading: false,
    isError: false,
    isSuccess: false,
    message: '',
};

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(register.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload;
                state.isAuthenticated = true;
            })
            .addCase(register.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
                state.user = null;
                state.isAuthenticated = false;
            })
            .addCase(login.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload;
                state.isAuthenticated = true;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
                state.user = null;
                state.isAuthenticated = false;
            })
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.isAuthenticated = false;
            })
            .addCase(initializeAuth.fulfilled, (state, action) => {
                state.user = action.payload;
                state.isAuthenticated = true;
                state.isLoading = false;
            })
            .addCase(initializeAuth.rejected, (state) => {
                state.user = null;
                state.isAuthenticated = false;
                state.isLoading = false;
            });
    },
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;
