import React from 'react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from '../store/store';
import { ThemeProvider } from '../context/ThemeContext';

const queryClient = new QueryClient();

export function Providers({ children }) {
    return (
        <Provider store={store}>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider>
                    {children}
                </ThemeProvider>
            </QueryClientProvider>
        </Provider>
    );
}
