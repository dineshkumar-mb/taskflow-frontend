import { configureStore } from '@reduxjs/toolkit';
import authReducer, { logout } from '../features/auth/authSlice';
import projectReducer from '../features/project/projectSlice';
import boardReducer from '../features/board/boardSlice';
import sprintReducer from '../features/sprint/sprintSlice';
import commentReducer from '../features/comment/commentSlice';
import activityReducer from '../features/activity/activitySlice';
import notificationReducer from '../features/notification/notificationSlice';
import chatReducer from '../features/chat/chatSlice';
import { setUnauthorizedCallback } from '../utils/axiosInstance';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        project: projectReducer,
        board: boardReducer,
        sprint: sprintReducer,
        comment: commentReducer,
        activity: activityReducer,
        notification: notificationReducer,
        chat: chatReducer,
    },
});

// Set the callback to bridge axios and redux without circular imports
setUnauthorizedCallback(() => {
    store.dispatch(logout());
});
