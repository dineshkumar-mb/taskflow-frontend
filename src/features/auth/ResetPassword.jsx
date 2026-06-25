import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resetPassword, reset } from './authSlice';
import { Loader2, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';

const resetPasswordSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [showPass, setShowPass] = useState(false);
    const { isLoading, isError, isSuccess, message } = useSelector(state => state.auth);
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(resetPasswordSchema)
    });

    useEffect(() => {
        if (isError) {
            toast.error(message);
            dispatch(reset());
        }
        if (isSuccess && message === 'Password reset successfully') {
            toast.success('Password updated! You can now login.');
            dispatch(reset());
            navigate('/login');
        }
    }, [isError, isSuccess, message, dispatch, navigate]);

    const onSubmit = (data) => {
        dispatch(resetPassword({ token, password: data.password }));
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 px-6 py-12">
            <div style={{
                width: '100%', maxWidth: 400,
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 24,
                padding: 36,
                boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            }}>
                <div className="mb-8 flex items-center justify-center gap-2">
                    <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#6366f1,#3b82f6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚡</div>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: 17 }}>TaskFlow</span>
                </div>

                <div style={{ marginBottom: 28, textAlign: 'center' }}>
                    <h2 style={{ color: 'white', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Set new password</h2>
                    <p style={{ color: 'rgba(156,163,175,1)', fontSize: 13 }}>
                        Your new password must be different from previous passwords.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                        <label style={{ color: 'rgba(209,213,219,1)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                            New Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(156,163,175,0.5)' }} />
                            <input
                                type={showPass ? 'text' : 'password'}
                                placeholder="••••••••"
                                {...register('password')}
                                style={{
                                    width: '100%', padding: '11px 50px 11px 42px',
                                    background: 'rgba(255,255,255,0.06)',
                                    border: errors.password ? '1.5px solid rgba(239,68,68,0.7)' : '1.5px solid rgba(255,255,255,0.1)',
                                    borderRadius: 12, color: 'white', fontSize: 14,
                                    outline: 'none', transition: 'border-color 0.2s',
                                    boxSizing: 'border-box',
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(v => !v)}
                                style={{
                                    position: 'absolute', right: 14, top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'rgba(156,163,175,1)', fontSize: 11, fontWeight: 600,
                                    background: 'none', border: 'none', cursor: 'pointer',
                                }}
                            >
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.password && <p style={{ color: '#f87171', fontSize: 11, marginTop: 4 }}>{errors.email.message}</p>}
                    </div>

                    <div>
                        <label style={{ color: 'rgba(209,213,219,1)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                            Confirm New Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(156,163,175,0.5)' }} />
                            <input
                                type={showPass ? 'text' : 'password'}
                                placeholder="••••••••"
                                {...register('confirmPassword')}
                                style={{
                                    width: '100%', padding: '11px 16px 11px 42px',
                                    background: 'rgba(255,255,255,0.06)',
                                    border: errors.confirmPassword ? '1.5px solid rgba(239,68,68,0.7)' : '1.5px solid rgba(255,255,255,0.1)',
                                    borderRadius: 12, color: 'white', fontSize: 14,
                                    outline: 'none', transition: 'border-color 0.2s',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>
                        {errors.confirmPassword && <p style={{ color: '#f87171', fontSize: 11, marginTop: 4 }}>{errors.confirmPassword.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            padding: '13px 20px',
                            background: isLoading
                                ? 'rgba(99,102,241,0.6)'
                                : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #3b82f6 100%)',
                            borderRadius: 12, color: 'white', fontWeight: 700, fontSize: 14,
                            border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
                            transition: 'all 0.2s',
                        }}
                    >
                        {isLoading ? (
                            <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Updating…</>
                        ) : (
                            <>Update Password <ArrowRight size={16} /></>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
