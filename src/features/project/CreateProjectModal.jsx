import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createProject } from './projectSlice';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Loader2, Plus, X } from 'lucide-react';
import { toast } from 'react-toastify';

const projectSchema = z.object({
    name: z.string().min(2, 'Project name is required'),
    key: z.string().min(2, 'Key must be at least 2 characters').max(10, 'Key max 10 chars'),
    description: z.string().optional(),
});

const CreateProjectModal = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const { isLoading } = useSelector((state) => state.project);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(projectSchema),
    });

    const onSubmit = async (data) => {
        dispatch(createProject(data)).then((res) => {
            if (res.meta.requestStatus === 'fulfilled') {
                toast.success('Project created successfully!');
                reset();
                onClose();
            } else {
                toast.error(res.payload || 'Failed to create project');
            }
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-md rounded-xl bg-v-primary p-6 shadow-2xl border border-v-border transition-colors" onClick={e => e.stopPropagation()}>
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-v-main">Create Project</h3>
                    <button onClick={onClose} className="rounded-full p-1 text-v-muted hover:bg-v-secondary transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <Label htmlFor="name" className="text-v-muted">Project Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Website Redesign"
                            {...register('name')}
                            className={`${errors.name ? 'border-red-500' : 'border-v-border'} bg-v-secondary text-v-main focus:ring-blue-500 transition-colors`}
                        // Simple key auto-generation logic could be added here
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="key" className="text-v-muted">Key</Label>
                        <Input
                            id="key"
                            placeholder="e.g. WEB"
                            {...register('key')}
                            className={`${errors.key ? 'border-red-500' : 'border-v-border'} bg-v-secondary text-v-main focus:ring-blue-500 transition-colors`}
                        />
                        <p className="text-xs text-v-muted mt-1">Unique identifier for issues (e.g. WEB-101)</p>
                        {errors.key && (
                            <p className="mt-1 text-sm text-red-500">{errors.key.message}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="description" className="text-v-muted">Description</Label>
                        <Input
                            id="description"
                            placeholder="Project description..."
                            {...register('description')}
                            className="border-v-border bg-v-secondary text-v-main focus:ring-blue-500 transition-colors"
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Project'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProjectModal;
