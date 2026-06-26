import React, { useState, useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

const shortcuts = [
  { key: 'Cmd+K / Ctrl+K', action: 'Open command palette' },
  { key: '?', action: 'Show shortcuts' }
];

export const KeyboardShortcuts = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        return;
      }
      
      if (e.key === '?') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-v-primary rounded-xl shadow-2xl overflow-hidden border border-v-border">
        <div className="flex items-center justify-between p-4 border-b border-v-border bg-v-secondary">
          <h2 className="text-lg font-semibold text-v-main flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-blue-500" />
            Keyboard Shortcuts
          </h2>
          <button 
            onClick={() => setOpen(false)}
            className="text-v-muted hover:text-v-main p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-2">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between p-3 border-b border-v-border last:border-0 hover:bg-v-secondary/50 rounded-lg transition-colors">
              <span className="text-sm text-v-muted">{shortcut.action}</span>
              <div className="flex gap-1">
                {shortcut.key.split(' ').map((k, i) => (
                  <span key={i} className={`text-xs font-mono px-2 py-1 bg-v-background border border-v-border rounded-md text-v-main shadow-sm ${k === '/' || k === '+' ? 'border-none bg-transparent shadow-none px-0 text-v-muted' : ''}`}>
                    {k}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-v-border bg-v-secondary text-xs text-center text-v-muted">
          Press <kbd className="font-mono bg-v-background border border-v-border rounded px-1">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
};
