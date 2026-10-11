import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Layers, Plus, MessageSquare, BookOpen, User, Folder, LayoutDashboard, Search, X } from 'lucide-react';

export const CommandPalette = ({ isOpen, onClose }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = (val) => {
    setInternalOpen(val);
    if (!val && onClose) onClose();
  };
  const navigate = useNavigate();
  const { projects } = useSelector((state) => state.project);
  
  const recentProjects = projects ? projects.slice(0, 5) : [];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(!open);
      }
    };
    const handleCustomOpen = () => setOpen(true);

    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleCustomOpen);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleCustomOpen);
    };
  }, [open]);

  if (!open) return null;

  return (
    <Command.Dialog 
      open={open} 
      onOpenChange={setOpen}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh] bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg rounded-xl bg-v-primary border border-v-border shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center border-b border-v-border px-3.5 bg-v-primary">
          <Search className="w-5 h-5 text-v-muted shrink-0" />
          <Command.Input 
            placeholder="Search issues, projects, people..." 
            className="flex-1 bg-transparent px-3 py-3.5 text-v-main placeholder:text-v-muted focus:outline-none border-none text-sm"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono text-v-muted bg-v-secondary border border-v-border px-1.5 py-0.5 rounded">
              ESC
            </kbd>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close command palette"
              className="p-1 text-v-muted hover:text-v-main hover:bg-v-secondary rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <Command.List className="max-h-[60vh] overflow-y-auto p-2 bg-v-primary">
          <Command.Empty className="p-4 text-center text-sm text-v-muted">
            No results found.
          </Command.Empty>

          <Command.Group heading="Actions" className="px-2 py-1.5 text-xs font-semibold text-v-muted uppercase tracking-wider">
            <Command.Item 
              onSelect={() => { navigate('/projects'); setOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-v-main rounded-md hover:bg-v-secondary hover:text-blue-500 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Project
            </Command.Item>
          </Command.Group>

          {recentProjects.length > 0 && (
            <Command.Group heading="Projects" className="px-2 py-1.5 text-xs font-semibold text-v-muted uppercase tracking-wider mt-2">
              {recentProjects.map(p => (
                <Command.Item 
                  key={p._id} 
                  onSelect={() => { navigate(`/project/${p._id}/board`); setOpen(false); }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-v-main rounded-md hover:bg-v-secondary hover:text-blue-500 cursor-pointer transition-colors"
                >
                  <Layers className="w-4 h-4" /> {p.name}
                </Command.Item>
              ))}
            </Command.Group>
          )}
          
          <Command.Group heading="Navigation" className="px-2 py-1.5 text-xs font-semibold text-v-muted uppercase tracking-wider mt-2">
            <Command.Item 
              onSelect={() => { navigate('/dashboard'); setOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-v-main rounded-md hover:bg-v-secondary hover:text-blue-500 cursor-pointer transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Command.Item>
            <Command.Item 
              onSelect={() => { navigate('/projects'); setOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-v-main rounded-md hover:bg-v-secondary hover:text-blue-500 cursor-pointer transition-colors"
            >
              <Folder className="w-4 h-4" /> All Projects
            </Command.Item>
          </Command.Group>

        </Command.List>
      </div>
    </Command.Dialog>
  );
};
