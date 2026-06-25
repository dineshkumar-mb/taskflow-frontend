import { useEffect, useState } from 'react';
import { Server, Wifi, X } from 'lucide-react';

// Show after this many ms of any pending request
const DELAY_THRESHOLD = 3000;

let pendingRequests = 0;
const listeners = new Set();

const notifyListeners = () => listeners.forEach(fn => fn(pendingRequests));

// Monkey-patch fetch and axios to track pending requests
// We'll integrate via axios interceptors instead — see axiosSetup.js
// This component just reads from the global window.__pendingApiRequests counter

const ServerWakeUpBanner = () => {
    const [show, setShow] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [dots, setDots] = useState('');

    useEffect(() => {
        // Expose a function for axios interceptors to call
        window.__onApiRequest = () => {
            pendingRequests++;
            notifyListeners();
        };
        window.__onApiResponse = () => {
            pendingRequests = Math.max(0, pendingRequests - 1);
            notifyListeners();
            if (pendingRequests === 0) {
                setShow(false);
                setDismissed(false);
            }
        };

        const fn = (count) => {
            if (count > 0 && !dismissed) {
                // Only show banner if request takes too long
                // Timer starts when first request fires
            }
        };
        listeners.add(fn);
        return () => listeners.delete(fn);
    }, [dismissed]);

    useEffect(() => {
        let timer;
        const checkPending = () => {
            if (pendingRequests > 0 && !dismissed) {
                timer = setTimeout(() => {
                    if (pendingRequests > 0) setShow(true);
                }, DELAY_THRESHOLD);
            }
        };

        const fn = (count) => {
            clearTimeout(timer);
            if (count > 0) checkPending();
            else { setShow(false); setDismissed(false); }
        };
        listeners.add(fn);
        return () => { listeners.delete(fn); clearTimeout(timer); };
    }, [dismissed]);

    // Animated dots
    useEffect(() => {
        if (!show) return;
        const interval = setInterval(() => {
            setDots(d => d.length >= 3 ? '' : d + '.');
        }, 500);
        return () => clearInterval(interval);
    }, [show]);

    if (!show || dismissed) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-auto max-w-md">
            <div className="flex items-center gap-3 rounded-2xl bg-gray-900 text-white px-5 py-3.5 shadow-2xl border border-white/10 backdrop-blur-sm animate-in slide-in-from-bottom-4 duration-300">
                <div className="relative flex-shrink-0">
                    <Server size={20} className="text-blue-400" />
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
                    </span>
                </div>
                <div>
                    <p className="text-sm font-medium">Server is waking up{dots}</p>
                    <p className="text-xs text-white/50 mt-0.5">Free-tier servers sleep after inactivity. First load may take ~30s.</p>
                </div>
                <Wifi size={16} className="text-white/30 animate-pulse ml-1" />
                <button
                    onClick={() => setDismissed(true)}
                    className="ml-1 rounded-full p-1 hover:bg-white/10 text-white/40 hover:text-white transition-colors flex-shrink-0"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};

export default ServerWakeUpBanner;
