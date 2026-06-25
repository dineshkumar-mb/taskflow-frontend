import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import axiosInstance from '../../utils/axiosInstance';
import { initializeAuth } from './authSlice';

const AcceptInvite = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            toast.error('Invalid invitation link');
            navigate('/login');
        }
    }, [token, navigate]);

    const handleAccept = async () => {
        if (!isAuthenticated) {
            toast.info('Please log in or register to accept the invitation');
            navigate(`/login?redirect=accept-invite&token=${token}`);
            return;
        }

        setLoading(true);
        try {
            await axiosInstance.post('/invites/accept', { token });
            toast.success('Invitation accepted successfully!');
            // Refresh auth state to get new organizationId and role
            await dispatch(initializeAuth());
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to accept invitation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-slate-50">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center">
                <h1 className="text-2xl font-bold text-slate-800 mb-4">Accept Invitation</h1>
                <p className="text-slate-600 mb-8">
                    You've been invited to join an organization on TaskFlow.
                    Click the button below to join the team.
                </p>
                <button
                    onClick={handleAccept}
                    disabled={loading}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50"
                >
                    {loading ? 'Processing...' : 'Accept & Join Organization'}
                </button>
            </div>
        </div>
    );
};

export default AcceptInvite;
