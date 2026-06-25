import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updateProject, deleteProject, getProjects } from './projectSlice';
import { getBoards, updateBoard } from '../board/boardSlice';
import { toast } from 'react-toastify';
import { Settings, Trash2, Save, Loader2, AlertTriangle, ListPlus, GripVertical } from 'lucide-react';

const ProjectSettingsPage = () => {
    const { projectId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { projects } = useSelector(state => state.project);
    const { currentBoard, isLoading: isBoardLoading } = useSelector(state => state.board);
    const project = projects.find(p => p._id === projectId);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [columns, setColumns] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingWorkflow, setIsSavingWorkflow] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    useEffect(() => {
        if (!projects.length) dispatch(getProjects());
        dispatch(getBoards(projectId));
    }, [dispatch, projectId, projects.length]);

    useEffect(() => {
        if (project) {
            setName(project.name || '');
            setDescription(project.description || '');
        }
    }, [project]);

    useEffect(() => {
        if (currentBoard) {
            setColumns([...currentBoard.columns]);
        }
    }, [currentBoard]);

    if (!project) {
        return (
            <div className="flex h-64 items-center justify-center text-v-muted">
                <Loader2 className="animate-spin" size={28} />
            </div>
        );
    }

    const handleSave = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setIsSaving(true);
        dispatch(updateProject({ id: projectId, name: name.trim(), description: description.trim() }))
            .unwrap()
            .then(() => toast.success('Project updated successfully!'))
            .catch(err => toast.error(err || 'Failed to update project'))
            .finally(() => setIsSaving(false));
    };

    const handleDelete = async () => {
        if (confirmText !== project.name) {
            toast.error('Project name does not match');
            return;
        }
        setIsDeleting(true);
        dispatch(deleteProject(projectId))
            .unwrap()
            .then(() => {
                toast.success('Project deleted.');
                navigate('/');
            })
            .catch(err => toast.error(err || 'Failed to delete project'))
            .finally(() => setIsDeleting(false));
    };

    const handleSaveWorkflow = async () => {
        if (!currentBoard) return;
        setIsSavingWorkflow(true);
        const sortedColumns = columns.map((c, i) => ({ ...c, position: i }));
        dispatch(updateBoard({ id: currentBoard._id, data: { columns: sortedColumns } }))
            .unwrap()
            .then(() => toast.success('Workflow updated successfully!'))
            .catch(err => toast.error(err || 'Failed to update workflow'))
            .finally(() => setIsSavingWorkflow(false));
    };

    const handleAddColumn = () => {
        const newStatus = `status-${Date.now()}`;
        setColumns([...columns, { name: 'New Column', status: newStatus, position: columns.length }]);
    };

    const handleRemoveColumn = (index) => {
        const newCols = [...columns];
        newCols.splice(index, 1);
        setColumns(newCols);
    };

    const updateColumnName = (index, newName) => {
        const newCols = [...columns];
        newCols[index].name = newName;
        setColumns(newCols);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Settings size={22} className="text-blue-500" />
                <div>
                    <h1 className="text-xl font-bold text-v-main">Project Settings</h1>
                    <p className="text-xs text-v-muted mt-0.5">Key: <span className="font-mono font-semibold">{project.key}</span></p>
                </div>
            </div>

            {/* General settings */}
            <form onSubmit={handleSave} className="rounded-xl bg-v-primary border border-v-border shadow-sm p-6 space-y-4 transition-colors">
                <h2 className="text-sm font-semibold text-v-main">General</h2>

                <div>
                    <label className="text-xs font-semibold text-v-muted uppercase tracking-wider">Project Name *</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        className="mt-1 w-full rounded-lg border border-v-border bg-v-secondary text-v-main px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                </div>

                <div>
                    <label className="text-xs font-semibold text-v-muted uppercase tracking-wider">Description</label>
                    <textarea
                        rows={3}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Describe what this project is about..."
                        className="mt-1 w-full rounded-lg border border-v-border bg-v-secondary text-v-main px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors"
                    />
                </div>

                <div className="flex justify-end pt-2 border-t border-v-border">
                    <button
                        type="submit"
                        disabled={isSaving || !name.trim()}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
                    >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Save Changes
                    </button>
                </div>
            </form>

            {/* Workflow Configurator */}
            <div className="rounded-xl bg-v-primary border border-v-border shadow-sm p-6 space-y-4 transition-colors">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-v-main">Workflow Board Columns</h2>
                        <p className="text-xs text-v-muted mt-0.5">Customize the statuses available on your project board.</p>
                    </div>
                </div>

                {isBoardLoading && !currentBoard ? (
                    <div className="py-4 text-center"><Loader2 size={20} className="animate-spin mx-auto text-blue-500" /></div>
                ) : (
                    <div className="space-y-3">
                        <div className="space-y-2">
                            {columns.map((col, idx) => (
                                <div key={col.status} className="flex items-center gap-2 bg-v-secondary border border-v-border rounded-lg p-2 transition-colors">
                                    <GripVertical size={16} className="text-v-muted cursor-move" />
                                    <input
                                        type="text"
                                        value={col.name}
                                        onChange={(e) => updateColumnName(idx, e.target.value)}
                                        className="flex-1 bg-v-primary border border-v-border text-v-main rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                                    />
                                    <button
                                        onClick={() => handleRemoveColumn(idx)}
                                        className="text-v-muted hover:text-red-500 p-1.5 rounded transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleAddColumn}
                            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                            <ListPlus size={16} /> Add Column
                        </button>

                        <div className="flex justify-end pt-4 border-t border-v-border">
                            <button
                                onClick={handleSaveWorkflow}
                                disabled={isSavingWorkflow}
                                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
                            >
                                {isSavingWorkflow ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Save Workflow
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Danger zone */}
            <div className="rounded-xl bg-red-500/5 border border-red-500/20 shadow-sm p-6 space-y-4">
                <h2 className="text-sm font-semibold text-red-500 flex items-center gap-2">
                    <AlertTriangle size={15} />
                    Danger Zone
                </h2>

                {!showDeleteConfirm ? (
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-v-main">Delete this project</p>
                            <p className="text-xs text-v-muted mt-0.5">
                                Permanently removes all issues, sprints, and board data. This cannot be undone.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center gap-1.5 rounded-lg border border-red-500/20 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                            <Trash2 size={14} />
                            Delete Project
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm text-v-muted">
                            Type <span className="font-mono font-semibold text-v-main">{project.name}</span> to confirm deletion:
                        </p>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={e => setConfirmText(e.target.value)}
                            placeholder={project.name}
                            className="w-full rounded-lg border border-red-500/20 bg-v-secondary text-v-main px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting || confirmText !== project.name}
                                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                Confirm Delete
                            </button>
                            <button
                                onClick={() => { setShowDeleteConfirm(false); setConfirmText(''); }}
                                className="rounded-lg px-4 py-2 text-sm text-v-muted hover:bg-v-secondary transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectSettingsPage;
