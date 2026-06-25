import { useEffect } from 'react';

export const useHotkeys = (keyMap) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Check if user is typing in an input, textarea, or contenteditable
            const activeTag = document.activeElement?.tagName?.toLowerCase();
            const isInputForm = activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable;

            if (isInputForm) {
                // If they are focusing an input, only trigger 'Escape' or similar meta keys that don't swallow typed characters
                if (event.key === 'Escape' && keyMap['Escape']) {
                    keyMap['Escape'](event);
                }
                return;
            }

            const handler = keyMap[event.key] || keyMap[event.key.toLowerCase()];
            if (handler) {
                event.preventDefault(); // Prevent native browser default (like '/' opening quick find)
                handler(event);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [keyMap]);
};
