import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { register as registerUser, reset } from './authSlice';
import { Loader2, ArrowRight, Zap, Users, Building2, Rocket } from 'lucide-react';
import { toast } from 'react-toastify';

const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    organizationName: z.string().min(2, 'Organization name is required'),
});

const STEPS = [
    { icon: <Rocket size={16} />, color: '#818cf8', text: 'Create your organization workspace' },
    { icon: <Users size={16} />, color: '#a78bfa', text: 'Invite your team & assign roles' },
    { icon: <Building2 size={16} />, color: '#60a5fa', text: 'Track projects & ship faster' },
];

const RegisterPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [showPass, setShowPass] = useState(false);

    const panelRef = useRef(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    const handleMouseMove = useCallback((e) => {
        const el = panelRef.current;
        if (!el) return;
        const { left, top, width, height } = el.getBoundingClientRect();
        const x = ((e.clientX - left) / width - 0.5) * 10;
        const y = ((e.clientY - top) / height - 0.5) * -10;
        setTilt({ x, y });
    }, []);
    const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

    const { user, isLoading, isError, isSuccess, message } = useSelector(state => state.auth);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(registerSchema),
    });

    useEffect(() => {
        if (isError) toast.error(message);
        if (isSuccess || user) {
            toast.success('Account created! Welcome aboard 🎉');
            navigate('/dashboard');
        }
        dispatch(reset());
    }, [user, isError, isSuccess, message, navigate, dispatch]);

    const onSubmit = (data) => dispatch(registerUser(data));

    const inputStyle = (hasError) => ({
        width: '100%',
        padding: '11px 16px',
        background: 'rgba(255,255,255,0.06)',
        border: hasError ? '1.5px solid rgba(239,68,68,0.7)' : '1.5px solid rgba(255,255,255,0.1)',
        borderRadius: 12, color: 'white', fontSize: 14,
        outline: 'none', transition: 'border-color 0.2s',
        boxSizing: 'border-box',
    });

    const onFocus = (e) => (e.target.style.borderColor = 'rgba(99,102,241,0.8)');
    const onBlur = (hasError) => (e) => (e.target.style.borderColor = hasError ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.1)');

    return (
        <div className="flex min-h-screen overflow-hidden bg-gray-950">

            {/* ── LEFT: hero panel ─── */}
            <div
                className="hidden lg:flex flex-col justify-between w-5/12 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0f0528 0%, #1a1040 40%, #0f1f5c 80%, #0a1f3d 100%)' }}
            >
                {/* Blob backgrounds */}
                <div className="animate-blob animate-glow-pulse" style={{
                    position: 'absolute', top: '-10%', right: '-10%',
                    width: 380, height: 380,
                    background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)',
                    filter: 'blur(45px)',
                }} />
                <div className="animate-blob" style={{
                    position: 'absolute', bottom: '-10%', left: '-10%',
                    width: 320, height: 320,
                    background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)',
                    filter: 'blur(40px)', animationDelay: '2s',
                }} />

                {/* Grid overlay */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                }} />

                {/* Spinning rings */}
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)',
                    width: 360, height: 360,
                    border: '1px dashed rgba(255,255,255,0.07)',
                    borderRadius: '50%',
                    animation: 'spin-slow 25s linear infinite',
                }} />
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)',
                    width: 260, height: 260,
                    border: '1px dashed rgba(255,255,255,0.05)',
                    borderRadius: '50%',
                    animation: 'spin-reverse 18s linear infinite',
                }} />

                {/* Logo */}
                <div className="relative z-10 p-10 flex items-center gap-3">
                    <div style={{
                        width: 40, height: 40,
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.8), rgba(99,102,241,0.8))',
                        borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(255,255,255,0.2)', fontSize: 18,
                    }}>⚡</div>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>TaskFlow</span>
                </div>

                {/* Bottom content */}
                <div className="relative z-10 p-10 space-y-6">
                    <div>
                        <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, lineHeight: 1.3, marginBottom: 8 }}>
                            Start your team's<br />journey today
                        </h1>
                        <p style={{ color: 'rgba(199,210,254,0.7)', fontSize: 13, lineHeight: 1.6 }}>
                            Get up and running in under 2 minutes.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {STEPS.map((s, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div style={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.08)',
                                    border: `1px solid ${s.color}40`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: s.color, flexShrink: 0,
                                }}>
                                    {i + 1}
                                </div>
                                <span style={{ color: 'rgba(199,210,254,0.8)', fontSize: 13 }}>{s.text}</span>
                            </div>
                        ))}
                    </div>

                    <p style={{ color: 'rgba(165,180,252,0.45)', fontSize: 11 }}>Free tier · No credit card required</p>
                </div>
            </div>

            {/* ── RIGHT: 3D-tilt form panel ─── */}
            <div
                className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6 py-10 overflow-y-auto"
                style={{ background: 'linear-gradient(160deg, #0f172a 0%, #111827 100%)' }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {/* Mobile logo */}
                <div className="mb-6 flex items-center gap-2 lg:hidden">
                    <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚡</div>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: 17 }}>TaskFlow</span>
                </div>

                <div
                    ref={panelRef}
                    style={{
                        width: '100%', maxWidth: 400,
                        transition: 'transform 0.1s ease-out',
                        transform: `perspective(900px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
                        transformStyle: 'preserve-3d',
                    }}
                >
                    <div style={{
                        background: 'rgba(255,255,255,0.04)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 24, padding: 32,
                        boxShadow: '0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
                        transform: 'translateZ(20px)',
                    }}>
                        {/* Header */}
                        <div style={{ marginBottom: 24 }}>
                            <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Create your account</h2>
                            <p style={{ color: 'rgba(156,163,175,1)', fontSize: 13 }}>
                                Already have one?{' '}
                                <Link to="/login" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {/* Full name */}
                            <div>
                                <label style={{ color: 'rgba(209,213,219,1)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Full name</label>
                                <input type="text" placeholder="Alex Johnson" {...register('name')}
                                    style={inputStyle(errors.name)} onFocus={onFocus} onBlur={onBlur(errors.name)} />
                                {errors.name && <p style={{ color: '#f87171', fontSize: 11, marginTop: 4 }}>{errors.name.message}</p>}
                            </div>

                            {/* Work email */}
                            <div>
                                <label style={{ color: 'rgba(209,213,219,1)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Work email</label>
                                <input type="email" placeholder="alex@company.com" {...register('email')}
                                    style={inputStyle(errors.email)} onFocus={onFocus} onBlur={onBlur(errors.email)} />
                                {errors.email && <p style={{ color: '#f87171', fontSize: 11, marginTop: 4 }}>{errors.email.message}</p>}
                            </div>

                            {/* Organization */}
                            <div>
                                <label style={{ color: 'rgba(209,213,219,1)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Organization name</label>
                                <input type="text" placeholder="Acme Corp" {...register('organizationName')}
                                    style={inputStyle(errors.organizationName)} onFocus={onFocus} onBlur={onBlur(errors.organizationName)} />
                                {errors.organizationName
                                    ? <p style={{ color: '#f87171', fontSize: 11, marginTop: 4 }}>{errors.organizationName.message}</p>
                                    : <p style={{ color: 'rgba(107,114,128,1)', fontSize: 11, marginTop: 4 }}>Your team's workspace name</p>
                                }
                            </div>

                            {/* Password */}
                            <div>
                                <label style={{ color: 'rgba(209,213,219,1)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters" {...register('password')}
                                        style={{ ...inputStyle(errors.password), paddingRight: 50 }}
                                        onFocus={onFocus} onBlur={onBlur(errors.password)} />
                                    <button type="button" onClick={() => setShowPass(v => !v)}
                                        style={{
                                            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                                            color: 'rgba(156,163,175,1)', fontSize: 11, fontWeight: 600,
                                            background: 'none', border: 'none', cursor: 'pointer',
                                        }}>
                                        {showPass ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                {errors.password && <p style={{ color: '#f87171', fontSize: 11, marginTop: 4 }}>{errors.password.message}</p>}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                style={{
                                    marginTop: 4,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    padding: '13px 20px',
                                    background: isLoading ? 'rgba(124,58,237,0.6)' : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4f46e5 100%)',
                                    borderRadius: 12, color: 'white', fontWeight: 700, fontSize: 14,
                                    border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 8px 24px rgba(124,58,237,0.4)',
                                    transition: 'all 0.2s',
                                    transform: 'translateZ(8px)',
                                }}
                                onMouseEnter={e => !isLoading && (e.currentTarget.style.transform = 'translateZ(8px) scale(1.02)')}
                                onMouseLeave={e => (e.currentTarget.style.transform = 'translateZ(8px) scale(1)')}
                            >
                                {isLoading ? (
                                    <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating account…</>
                                ) : (
                                    <>Create account <ArrowRight size={16} /></>
                                )}
                            </button>

                            {/* Divider */}
                            <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0' }}>
                                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                                <span style={{ padding: '0 12px', color: 'rgba(156,163,175,1)', fontSize: 12, fontWeight: 600 }}>OR</span>
                                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                            </div>

                            {/* Google OAuth Button */}
                            <button
                                type="button"
                                onClick={() => window.location.href = 'http://localhost:5001/api/auth/google'}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                    padding: '12px 20px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: 12, color: 'white', fontWeight: 600, fontSize: 14,
                                    cursor: 'pointer', transition: 'all 0.2s',
                                    transform: 'translateZ(6px)',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                    e.currentTarget.style.transform = 'translateZ(6px) scale(1.02)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                    e.currentTarget.style.transform = 'translateZ(6px) scale(1)';
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Continue with Google
                            </button>
                        </form>

                        {/* Free tier notice */}
                        <div style={{
                            marginTop: 18,
                            background: 'rgba(251,191,36,0.08)',
                            border: '1px solid rgba(251,191,36,0.2)',
                            borderRadius: 12, padding: '12px 14px',
                            display: 'flex', gap: 10, alignItems: 'flex-start',
                        }}>
                            <span style={{ fontSize: 16 }}>⚡</span>
                            <div>
                                <p style={{ color: 'rgba(251,191,36,0.9)', fontSize: 11, fontWeight: 700 }}>Free tier server</p>
                                <p style={{ color: 'rgba(251,191,36,0.55)', fontSize: 11, marginTop: 2 }}>
                                    First request may take ~30s while the server starts up.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
