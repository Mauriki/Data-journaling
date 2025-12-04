import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, User, Mail, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile } from 'firebase/auth';
import { auth } from '../firebase';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = async () => {
        if (!auth.currentUser) return;
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            await updateProfile(auth.currentUser, {
                displayName: displayName.trim() || null,
                photoURL: photoURL.trim() || null,
            });
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 1000);
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoClick = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPhotoURL(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 50 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-zinc-800">
                            <h2 className="text-lg font-semibold text-stone-900 dark:text-white">Edit Profile</h2>
                            <button
                                onClick={onClose}
                                className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4">
                            {/* Photo */}
                            <div className="flex flex-col items-center">
                                <div
                                    onClick={handlePhotoClick}
                                    className="relative w-16 h-16 rounded-full bg-gradient-to-br from-accent-leather to-accent-wood cursor-pointer group"
                                >
                                    {photoURL ? (
                                        <img src={photoURL} alt="" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold">
                                            {displayName?.[0]?.toUpperCase() || <User size={24} />}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera size={16} className="text-white" />
                                    </div>
                                </div>
                                <button onClick={handlePhotoClick} className="mt-1 text-xs text-accent-leather font-medium">
                                    Change Photo
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-xs font-medium text-stone-500 dark:text-zinc-400 mb-1">Name</label>
                                <div className="relative">
                                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Your name"
                                        className="w-full pl-8 pr-3 py-2 text-sm bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-leather/50"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-medium text-stone-500 dark:text-zinc-400 mb-1">Email</label>
                                <div className="relative">
                                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="w-full pl-8 pr-3 py-2 text-sm bg-stone-100 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-700 rounded-lg text-stone-400 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Messages */}
                            {error && <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg">{error}</div>}
                            {success && <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs rounded-lg">Saved!</div>}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-stone-200 dark:border-zinc-800 flex gap-2">
                            <button
                                onClick={onClose}
                                className="flex-1 px-3 py-2 text-sm bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 font-medium rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 px-3 py-2 text-sm bg-accent-leather text-white font-medium rounded-lg hover:bg-accent-wood transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                            >
                                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving</> : <><Save size={14} /> Save</>}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ProfileModal;
