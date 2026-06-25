import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { login, reset } from './authSlice';
import { Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

const FEATURES = [
    'Kanban board with drag & drop',
    'Sprint planning & backlog',
    'Real-time team collaboration',
    'Issue tracking with priorities',
];

/* ── 3D Cube component ──────────────────────────────────── */
const Cube3D = ({ size = 56, colorA = 'rgba(255,255,255,0.12)', colorB = 'rgba(255,255,255,0.05)', speed = '10s', delay = '0s' }) => {
    const style = {
        width: size,
        height: size,
        transformStyle: 'preserve-3d',
        animation: `rotateCube ${speed} linear ${delay} infinite`,
        position: 'relative',
    };
    const faceBase = {
        position: 'absolute',
        width: '100%',
        height: '100%',
        border: '1px solid rgba(255,255,255,0.18)',
        backdropFilter: 'blur(2px)',
    };
    const half = size / 2;
    return (
        <div style={style}>
            <div style={{ ...faceBase, background: colorA, transform: `rotateY(0deg)   translateZ(${half}px)` }} />
            <div style={{ ...faceBase, background: colorB, transform: `rotateY(90deg)  translateZ(${half}px)` }} />
            <div style={{ ...faceBase, background: colorA, transform: `rotateY(180deg) translateZ(${half}px)` }} />
            <div style={{ ...faceBase, background: colorB, transform: `rotateY(-90deg) translateZ(${half}px)` }} />
            <div style={{ ...faceBase, background: colorA, transform: `rotateX(90deg)  translateZ(${half}px)` }} />
            <div style={{ ...faceBase, background: colorB, transform: `rotateX(-90deg) translateZ(${half}px)` }} />
        </div>
    );
};

/* ── Orbit Ring component ───────────────────────────────── */
const OrbitRing = ({ diameter, thickness = 2, color = 'rgba(255,255,255,0.2)', animClass = 'animate-orbit', dotColor = 'rgba(255,255,255,0.8)' }) => (
    <div
        className={animClass}
        style={{
            width: diameter, height: diameter,
            border: `${thickness}px solid ${color}`,
            borderRadius: '50%',
            position: 'absolute',
            transformStyle: 'preserve-3d',
        }}
    >
        {/* Dot on the ring */}
        <div style={{
            width: 8, height: 8,
            background: dotColor,
            borderRadius: '50%',
            position: 'absolute',
            top: -4, left: '50%',
            transform: 'translateX(-50%)',
            boxShadow: `0 0 8px 2px ${dotColor}`,
        }} />
    </div>
);

/* ── Main LoginPage ─────────────────────────────────────── */
const LoginPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [showPass, setShowPass] = useState(false);

    // Mouse-tilt for the right panel
    const panelRef = useRef(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    const handleMouseMove = useCallback((e) => {
        const el = panelRef.current;
        if (!el) return;
        const { left, top, width, height } = el.getBoundingClientRect();
        const x = ((e.clientX - left) / width - 0.5) * 14;   // max ±7°
        const y = ((e.clientY - top) / height - 0.5) * -14;
        setTilt({ x, y });
    }, []);
    const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

    const { user, isLoading, isError, isSuccess, message } = useSelector(state => state.auth);
    const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(loginSchema) });

    useEffect(() => {
        if (isError) toast.error(message);
        if (isSuccess || user) navigate('/dashboard');
        dispatch(reset());
    }, [user, isError, isSuccess, message, navigate, dispatch]);

    const onSubmit = (data) => dispatch(login(data));

    return (
        <div className="flex min-h-screen overflow-hidden bg-gray-950">

            {/* ── LEFT: 3D animated hero ────────────────────────── */}
            <div
                className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1a1040 0%, #0f1f5c 40%, #0d3068 70%, #0a1f3d 100%)' }}
            >
                {/* Morphing blob backgrounds */}
                <div
                    className="animate-blob animate-glow-pulse"
                    style={{
                        position: 'absolute', top: '-15%', left: '-10%',
                        width: 420, height: 420,
                        background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)',
                        filter: 'blur(40px)',
                    }}
                />
                <div
                    className="animate-blob animate-glow-pulse"
                    style={{
                        position: 'absolute', bottom: '-10%', right: '-10%',
                        width: 380, height: 380,
                        background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)',
                        filter: 'blur(50px)',
                        animationDelay: '3s',
                    }}
                />
                <div
                    className="animate-blob"
                    style={{
                        position: 'absolute', top: '40%', left: '30%',
                        width: 280, height: 280,
                        background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
                        filter: 'blur(35px)',
                        animationDelay: '1.5s',
                    }}
                />

                {/* Grid pattern overlay */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                }} />

                {/* Center 3D scene */}
                <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ perspective: '900px', perspectiveOrigin: '50% 50%' }}
                >
                    <div style={{ position: 'relative', transformStyle: 'preserve-3d', width: 240, height: 240 }}>
                        {/* Outer orbit ring */}
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <OrbitRing diameter={220} thickness={1.5} color="rgba(99,102,241,0.4)" animClass="animate-orbit" dotColor="rgba(139,92,246,0.9)" />
                        </div>
                        {/* Middle orbit ring */}
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <OrbitRing diameter={165} thickness={1} color="rgba(96,165,250,0.35)" animClass="animate-orbit2" dotColor="rgba(96,165,250,0.9)" />
                        </div>

                        {/* Center glowing core logo */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <div
                                className="animate-pulse-ring"
                                style={{
                                    width: 80, height: 80,
                                    background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                                    borderRadius: 20,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 0 40px rgba(99,102,241,0.6), 0 0 80px rgba(99,102,241,0.3)',
                                    fontSize: 32,
                                    transform: 'rotateX(15deg)',
                                }}
                            >
                                ⚡
                            </div>
                        </div>

                        {/* Floating 3D cubes */}
                        <div style={{ position: 'absolute', top: -30, left: -20, perspective: 400 }}>
                            <Cube3D size={44} speed="9s" colorA="rgba(99,102,241,0.2)" colorB="rgba(99,102,241,0.08)" />
                        </div>
                        <div style={{ position: 'absolute', bottom: -24, right: -18, perspective: 400 }}>
                            <Cube3D size={36} speed="13s" delay="-4s" colorA="rgba(59,130,246,0.2)" colorB="rgba(59,130,246,0.08)" />
                        </div>
                        <div style={{ position: 'absolute', top: '40%', right: -50, perspective: 400 }}>
                            <Cube3D size={28} speed="7s" delay="-2s" colorA="rgba(139,92,246,0.2)" colorB="rgba(139,92,246,0.08)" />
                        </div>
                        <div style={{ position: 'absolute', bottom: '40%', left: -44, perspective: 400 }}>
                            <Cube3D size={24} speed="11s" delay="-6s" colorA="rgba(96,165,250,0.2)" colorB="rgba(96,165,250,0.08)" />
                        </div>
                    </div>
                </div>

                {/* Spinning outer decorative rings (flat) */}
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 420, height: 420,
                    border: '1px dashed rgba(255,255,255,0.08)',
                    borderRadius: '50%',
                    animation: 'spin-slow 30s linear infinite',
                }} />
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 320, height: 320,
                    border: '1px dashed rgba(255,255,255,0.06)',
                    borderRadius: '50%',
                    animation: 'spin-reverse 22s linear infinite',
                }} />

                {/* Logo top-left */}
                <div className="relative z-10 p-10 flex items-center gap-3">
                    <div style={{
                        width: 40, height: 40,
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.8), rgba(59,130,246,0.8))',
                        borderRadius: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        fontSize: 18,
                    }}>⚡</div>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>TaskFlow</span>
                </div>

                {/* Bottom content */}
                <div className="relative z-10 p-10 space-y-5">
                    <div>
                        <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800, lineHeight: 1.25, marginBottom: 8 }}>
                            Manage projects<br />like a pro team
                        </h1>
                        <p style={{ color: 'rgba(199,210,254,0.75)', fontSize: 14, lineHeight: 1.6 }}>
                            A powerful Jira-style tool built for agile teams.
                        </p>
                    </div>
                    <ul className="space-y-2.5">
                        {FEATURES.map((f, i) => (
                            <li key={i} className="flex items-center gap-3" style={{ color: 'rgba(224,231,255,0.8)', fontSize: 13 }}>
                                <CheckCircle2 size={16} style={{ color: '#a5b4fc', flexShrink: 0 }} />
                                {f}
                            </li>
                        ))}
                    </ul>
                    <p style={{ color: 'rgba(165,180,252,0.5)', fontSize: 11 }}>Free tier · No credit card required</p>
                </div>
            </div>

            {/* ── RIGHT: 3D-tilt form panel ─────────────────────── */}
            <div
                className="flex flex-1 flex-col items-center justify-center px-6 py-12"
                style={{ background: 'linear-gradient(160deg, #0f172a 0%, #111827 100%)' }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {/* Mobile logo */}
                <div className="mb-8 flex items-center gap-2 lg:hidden">
                    <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#6366f1,#3b82f6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚡</div>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: 17 }}>TaskFlow</span>
                </div>

                {/* The 3D-tilting card */}
                <div
                    ref={panelRef}
                    style={{
                        width: '100%', maxWidth: 400,
                        transition: 'transform 0.1s ease-out',
                        transform: `perspective(900px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
                        transformStyle: 'preserve-3d',
                    }}
                >
                    {/* Glass card */}
                    <div style={{
                        background: 'rgba(255,255,255,0.04)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 24,
                        padding: 36,
                        boxShadow: '0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
                        transform: 'translateZ(20px)',
                    }}>
                        {/* Header */}
                        <div style={{ marginBottom: 28 }}>
                            <h2 style={{ color: 'white', fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Welcome back</h2>
                            <p style={{ color: 'rgba(156,163,175,1)', fontSize: 13 }}>
                                Don't have an account?{' '}
                                <Link to="/register" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>
                                    Sign up free
                                </Link>
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* Email */}
                            <div>
                                <label style={{ color: 'rgba(209,213,219,1)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                                    Email address
                                </label>
                                <input
                                    type="email"
                                    placeholder="name@company.com"
                                    {...register('email')}
                                    style={{
                                        width: '100%', padding: '11px 16px',
                                        background: 'rgba(255,255,255,0.06)',
                                        border: errors.email ? '1.5px solid rgba(239,68,68,0.7)' : '1.5px solid rgba(255,255,255,0.1)',
                                        borderRadius: 12, color: 'white', fontSize: 14,
                                        outline: 'none', transition: 'border-color 0.2s',
                                        boxSizing: 'border-box',
                                    }}
                                    onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.8)')}
                                    onBlur={e => (e.target.style.borderColor = errors.email ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.1)')}
                                />
                                {errors.email && <p style={{ color: '#f87171', fontSize: 11, marginTop: 4 }}>{errors.email.message}</p>}
                            </div>

                            {/* Password */}
                            <div>
                                <label style={{ color: 'rgba(209,213,219,1)', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                                    Password
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        {...register('password')}
                                        style={{
                                            width: '100%', padding: '11px 50px 11px 16px',
                                            background: 'rgba(255,255,255,0.06)',
                                            border: errors.password ? '1.5px solid rgba(239,68,68,0.7)' : '1.5px solid rgba(255,255,255,0.1)',
                                            borderRadius: 12, color: 'white', fontSize: 14,
                                            outline: 'none', transition: 'border-color 0.2s',
                                            boxSizing: 'border-box',
                                        }}
                                        onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.8)')}
                                        onBlur={e => (e.target.style.borderColor = errors.password ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.1)')}
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
                                        {showPass ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                {errors.password && <p style={{ color: '#f87171', fontSize: 11, marginTop: 4 }}>{errors.password.message}</p>}
                                <div style={{ textAlign: 'right', marginTop: 8 }}>
                                    <Link to="/forgot-password" style={{ color: '#818cf8', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                style={{
                                    marginTop: 4,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    padding: '13px 20px',
                                    background: isLoading
                                        ? 'rgba(99,102,241,0.6)'
                                        : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #3b82f6 100%)',
                                    borderRadius: 12, color: 'white', fontWeight: 700, fontSize: 14,
                                    border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
                                    transition: 'all 0.2s',
                                    transform: 'translateZ(8px)',
                                }}
                                onMouseEnter={e => !isLoading && (e.currentTarget.style.transform = 'translateZ(8px) scale(1.02)')}
                                onMouseLeave={e => (e.currentTarget.style.transform = 'translateZ(8px) scale(1)')}
                            >
                                {isLoading ? (
                                    <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Signing in…</>
                                ) : (
                                    <>Sign in <ArrowRight size={16} /></>
                                )}
                            </button>


                        </form>

                        {/* Free tier notice */}
                        <div style={{
                            marginTop: 20,
                            background: 'rgba(251,191,36,0.08)',
                            border: '1px solid rgba(251,191,36,0.2)',
                            borderRadius: 12, padding: '12px 14px',
                            display: 'flex', gap: 10, alignItems: 'flex-start',
                        }}>
                            <span style={{ fontSize: 16 }}>⚡</span>
                            <div>
                                <p style={{ color: 'rgba(251,191,36,0.9)', fontSize: 11, fontWeight: 700 }}>Free tier server</p>
                                <p style={{ color: 'rgba(251,191,36,0.55)', fontSize: 11, marginTop: 2 }}>
                                    First login may take ~30s while the server starts up.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Particle dots decoration */}
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="animate-float"
                        style={{
                            position: 'fixed',
                            width: 4, height: 4,
                            background: `rgba(${i % 2 === 0 ? '99,102,241' : '59,130,246'},0.5)`,
                            borderRadius: '50%',
                            left: `${15 + i * 13}%`,
                            top: `${20 + (i % 3) * 25}%`,
                            animationDelay: `${i * 0.7}s`,
                            animationDuration: `${3 + i * 0.5}s`,
                            pointerEvents: 'none',
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default LoginPage;
