import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Camera, Loader2, Save, KeyRound } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';

export default function Profile() {
  const { user, updateUserInState } = useAuth();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    dailyGoal: user?.preferences?.dailyGoal || 20,
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const updatedUser = await userService.updateAvatar(file);
      updateUserInState(updatedUser);
      toast.success('Avatar updated');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updatedUser = await userService.updateProfile(form);
      updateUserInState(updatedUser);
      toast.success('Profile updated');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    setSavingPassword(true);
    try {
      await userService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 animate-fade-in">Profile</h1>

        <div className="glass-card p-6 animate-slide-up">
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="group relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-2xl font-bold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                {user?.avatar?.url ? (
                  <img src={user.avatar.url} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  user?.name?.charAt(0)?.toUpperCase()
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white shadow-md transition-transform hover:scale-110"
              >
                {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-800 dark:text-gray-100">{user?.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
              className="input-field"
            />
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Short bio"
              rows={3}
              className="input-field resize-none"
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-300">
                Daily study goal (cards)
              </label>
              <input
                type="number"
                min={1}
                value={form.dailyGoal}
                onChange={(e) => setForm({ ...form, dailyGoal: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <button type="submit" disabled={savingProfile} className="btn-primary w-full">
              {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Profile
            </button>
          </form>
        </div>

        <div className="glass-card p-6 animate-slide-up">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-gray-100">
            <KeyRound size={18} /> Change Password
          </h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              required
              placeholder="Current password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="input-field"
            />
            <input
              type="password"
              required
              placeholder="New password (min. 8 characters)"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="input-field"
            />
            <button type="submit" disabled={savingPassword} className="btn-secondary w-full">
              {savingPassword ? <Loader2 size={16} className="animate-spin" /> : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
