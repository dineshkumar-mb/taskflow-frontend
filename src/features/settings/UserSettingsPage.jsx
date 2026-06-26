import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '../auth/authSlice';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import { Shield, Key, Loader2, CheckCircle2, QrCode } from 'lucide-react';

const UserSettingsPage = () => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const [is2FAEnabled, setIs2FAEnabled] = useState(user?.isTwoFactorEnabled || false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [secret, setSecret] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    // Ideally, the backend would return `isTwoFactorEnabled` in the user object or via a profile endpoint
    useEffect(() => {
        // Fetch current user profile to see if 2FA is enabled
        // Assuming we have a /users/me or we just use a generic endpoint. 
        // For now, let's assume it's fetched or we can toggle it.
        const check2FAStatus = async () => {
            try {
                // If backend had a generic user profile endpoint, we'd hit it here.
                // We'll trust the flow for now.
            } catch (err) {
                console.error("Failed to fetch 2FA status");
            }
        };
        check2FAStatus();
    }, []);

    const handleGenerate2FA = async () => {
        setLoading(true);
        try {
            const { data } = await axiosInstance.post('/auth/2fa/generate');
            setQrCodeUrl(data.qrCode);
            setSecret(data.secret);
            setStep(2);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate 2FA setup');
        } finally {
            setLoading(false);
        }
    };

    const handleEnable2FA = async (e) => {
        e.preventDefault();
        if (verificationCode.length !== 6) return toast.error('Code must be 6 digits');

        setLoading(true);
        try {
            await axiosInstance.post('/auth/2fa/enable', { token: verificationCode });
            setIs2FAEnabled(true);
            dispatch(updateUser({ isTwoFactorEnabled: true }));
            setStep(3);
            toast.success('Two-factor authentication enabled successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleDisable2FA = async () => {
        if (!window.confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) return;
        
        setLoading(true);
        try {
            await axiosInstance.post('/auth/2fa/disable');
            setIs2FAEnabled(false);
            dispatch(updateUser({ isTwoFactorEnabled: false }));
            setStep(1);
            setQrCodeUrl('');
            setSecret('');
            setVerificationCode('');
            toast.success('Two-factor authentication has been disabled.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to disable 2FA');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-v-main">Account Settings</h1>
                <p className="text-sm text-v-muted mt-1">Manage your personal preferences and security.</p>
            </div>

            <div className="bg-v-primary border border-v-border rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-v-border pb-4">
                    <Shield className="text-blue-500" size={24} />
                    <h2 className="text-xl font-semibold text-v-main">Security</h2>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-v-secondary border border-v-border">
                        <div>
                            <h3 className="font-semibold text-v-main flex items-center gap-2">
                                Two-Factor Authentication (2FA)
                                {is2FAEnabled && <CheckCircle2 className="text-green-500" size={16} />}
                            </h3>
                            <p className="text-sm text-v-muted mt-1">
                                Add an extra layer of security to your account using an authenticator app.
                            </p>
                        </div>
                        <div>
                            {is2FAEnabled ? (
                                <button
                                    onClick={handleDisable2FA}
                                    disabled={loading}
                                    className="px-4 py-2 rounded-lg text-sm font-medium border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-colors"
                                >
                                    Disable 2FA
                                </button>
                            ) : (
                                step === 1 && (
                                    <button
                                        onClick={handleGenerate2FA}
                                        disabled={loading}
                                        className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={16} /> : <QrCode size={16} />}
                                        Setup 2FA
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    {step === 2 && !is2FAEnabled && (
                        <div className="p-6 rounded-lg border border-blue-500/20 bg-blue-500/5 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                            <h3 className="font-semibold text-v-main text-lg">Configure Authenticator App</h3>
                            
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="space-y-4 flex-1">
                                    <div className="space-y-2 text-sm text-v-muted">
                                        <p>1. Download Google Authenticator or Authy on your phone.</p>
                                        <p>2. Scan the QR code with your authenticator app.</p>
                                        <p>3. Enter the 6-digit code generated by the app below.</p>
                                    </div>

                                    {secret && (
                                        <div className="pt-2">
                                            <p className="text-xs text-v-muted mb-1">Manual entry key:</p>
                                            <code className="px-2 py-1 rounded bg-v-primary border border-v-border text-xs text-v-main font-mono select-all">
                                                {secret}
                                            </code>
                                        </div>
                                    )}

                                    <form onSubmit={handleEnable2FA} className="pt-4 flex gap-3">
                                        <input
                                            type="text"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="000000"
                                            className="px-3 py-2 rounded-lg bg-v-primary border border-v-border text-v-main text-center tracking-widest focus:outline-none focus:border-blue-500 w-32"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={loading || verificationCode.length !== 6}
                                            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {loading && <Loader2 className="animate-spin" size={16} />}
                                            Verify & Enable
                                        </button>
                                    </form>
                                </div>

                                <div className="p-4 bg-white rounded-xl shadow-sm self-center md:self-start">
                                    {qrCodeUrl ? (
                                        <img src={qrCodeUrl} alt="2FA QR Code" className="w-40 h-40" />
                                    ) : (
                                        <div className="w-40 h-40 flex items-center justify-center bg-gray-100 rounded">
                                            <Loader2 className="animate-spin text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserSettingsPage;
