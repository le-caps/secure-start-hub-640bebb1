import React, { useEffect, useState, useRef } from 'react';
import { UserProfile, Deal } from '@/types';
import { User, Bell, Shield, CreditCard, Check, Download, Moon, Sun, Upload, Loader2, Link2, RefreshCw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useHubspot } from '@/hooks/useHubspot';
import { useDeals } from '@/hooks/useDeals';
import { supabase } from '@/integrations/supabase/client';

interface SettingsViewProps {
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  deals: Deal[];
}

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    type="button"
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
      checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-zinc-700'
    }`}
    role="switch"
    aria-checked={checked}
  >
    <span
      aria-hidden="true"
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
  isDarkMode,
  onToggleDarkMode,
  deals,
}) => {
  const { session, signOut } = useAuth();
  const { toast } = useToast();
  const { refetch: refetchDeals } = useDeals();
  const hubspot = useHubspot(refetchDeals);

  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'billing' | 'integrations' | 'account'>('general');
  const [localProfile, setLocalProfile] = useState<UserProfile>(profile);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep local state in sync (important when profile loads async after login)
  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  const handleSave = (key: keyof UserProfile, value: any) => {
    const updated = { ...localProfile, [key]: value };
    setLocalProfile(updated);
    onUpdateProfile(updated);
  };

  const handleNotificationToggle = (key: keyof UserProfile['notifications']) => {
    const updated = {
      ...localProfile,
      notifications: {
        ...localProfile.notifications,
        [key]: !localProfile.notifications[key],
      },
    };
    setLocalProfile(updated);
    onUpdateProfile(updated);
  };

  const handleChangeAvatar = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Please select an image file' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Image must be under 5MB' });
      return;
    }

    setAvatarUploading(true);
    try {
      const userId = session.user.id;
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add cache buster to force refresh
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      // Update local state
      handleSave('avatarUrl', avatarUrl);
      toast({ title: 'Avatar updated!' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload avatar';
      toast({ variant: 'destructive', title: 'Error', description: message });
    } finally {
      setAvatarUploading(false);
      // Reset input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSignOut = async () => {
    if (!session) return;

    try {
      await signOut();
      toast({ title: 'Signed out' });
      window.location.href = '/auth';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign out';
      toast({ variant: 'destructive', title: 'Error', description: message });
    }
  };

  const handleDeleteAccount = async () => {
    if (!session) return;

    const confirmed = window.confirm(
      'This will permanently delete your account and all your data. Continue?',
    );
    if (!confirmed) return;

    setDeleteLoading(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;

      toast({ title: 'Account deleted' });
      await signOut();
      window.location.href = '/auth';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete account';
      toast({ variant: 'destructive', title: 'Error', description: message });
    } finally {
      setDeleteLoading(false);
    }
  };
  const formatLastSync = (lastSync?: string) => {
    if (!lastSync) return "Never";
    const date = new Date(lastSync);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-20 px-4">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-8">Settings</h2>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Settings Sidebar */}
        <div className="w-full md:w-56 flex-shrink-0">
          <div className="flex flex-col gap-1 sticky top-24">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'general'
                  ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <User size={16} /> General
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'notifications'
                  ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <Bell size={16} /> Notifications
            </button>
            <button
              onClick={() => setActiveTab('integrations')}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'integrations'
                  ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <Link2 size={16} /> Integrations
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'billing'
                  ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <CreditCard size={16} /> Billing
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'account'
                  ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <Shield size={16} /> Account
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 space-y-8">
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-8 animate-fade-in">
              {/* Profile Section */}
              <section className="p-6 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-6">Public Profile</h3>
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-lg font-bold text-white border border-gray-300 dark:border-zinc-700">
                    {localProfile.avatarUrl ? (
                      <img
                        src={localProfile.avatarUrl}
                        alt={`${localProfile.name} avatar`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      localProfile.name
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase() || 'U'
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={handleChangeAvatar}
                      disabled={avatarUploading}
                      className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-zinc-600 text-xs font-semibold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors mb-1 flex items-center gap-2 disabled:opacity-50"
                    >
                      {avatarUploading ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={14} />
                          Change Avatar
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-400">JPG, PNG up to 5MB</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={localProfile.name}
                      onChange={(e) => handleSave('name', e.target.value)}
                      className="w-full rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={localProfile.email}
                      onChange={(e) => handleSave('email', e.target.value)}
                      className="w-full rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Job Title</label>
                    <input
                      type="text"
                      value={localProfile.title}
                      onChange={(e) => handleSave('title', e.target.value)}
                      className="w-full rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700"
                    />
                  </div>
                </div>
              </section>

              {/* Preferences Section */}
              <section className="p-6 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-6">Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Language</label>
                    <div className="relative">
                      <select
                        value={localProfile.language}
                        onChange={(e) => handleSave('language', e.target.value)}
                        className="w-full rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 appearance-none"
                      >
                        <option value="en">English (US)</option>
                        <option value="fr">French</option>
                        <option value="es">Spanish</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Timezone</label>
                    <select
                      value={localProfile.timezone}
                      onChange={(e) => handleSave('timezone', e.target.value)}
                      className="w-full rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700"
                    >
                      <option value="PST">Pacific Time</option>
                      <option value="EST">Eastern Time</option>
                      <option value="GMT">Greenwich Mean Time</option>
                      <option value="CET">Central European Time</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">Appearance</p>
                      <p className="text-xs text-gray-500 mt-1">Light or dark mode.</p>
                    </div>
                    <div className="flex p-1 bg-gray-100 dark:bg-zinc-800 rounded-md">
                      <button
                        onClick={() => isDarkMode && onToggleDarkMode()}
                        className={`p-1.5 rounded transition-all ${
                          !isDarkMode ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <Sun size={16} />
                      </button>
                      <button
                        onClick={() => !isDarkMode && onToggleDarkMode()}
                        className={`p-1.5 rounded transition-all ${
                          isDarkMode ? 'bg-zinc-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <Moon size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="space-y-8 animate-fade-in">
              <section className="p-6 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-6">Email Notifications</h3>
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">Daily Digest</p>
                      <p className="text-xs text-gray-500 mt-1">Summary of stalled deals at 9 AM.</p>
                    </div>
                    <Toggle
                      checked={localProfile.notifications.emailDigest}
                      onChange={() => handleNotificationToggle('emailDigest')}
                    />
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">Product Updates</p>
                      <p className="text-xs text-gray-500 mt-1">News about features and improvements.</p>
                    </div>
                    <Toggle
                      checked={localProfile.notifications.marketing}
                      onChange={() => handleNotificationToggle('marketing')}
                    />
                  </div>
                </div>
              </section>
              <section className="p-6 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-6">Push Notifications</h3>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm text-gray-900 dark:text-white">Browser Notifications</p>
                    <p className="text-xs text-gray-500 mt-1">Immediate alerts for stalled deals.</p>
                  </div>
                  <Toggle
                    checked={localProfile.notifications.pushDesktop}
                    onChange={() => handleNotificationToggle('pushDesktop')}
                  />
                </div>
              </section>
            </div>
          )}

          {/* INTEGRATIONS TAB */}
          {activeTab === 'integrations' && (
            <div className="space-y-8 animate-fade-in">
              <section className="p-6 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-6">Connected Services</h3>
                
                {/* HubSpot Integration Card */}
                <div className="border border-gray-200 dark:border-zinc-700 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-orange-500/10 flex items-center justify-center">
                        <span className="text-orange-500 font-bold">H</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-white">HubSpot</p>
                          {hubspot.loading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                          ) : hubspot.connected ? (
                            hubspot.expired ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                <AlertCircle size={12} />
                                Expired
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                                <CheckCircle2 size={12} />
                                Connected
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 border border-gray-200 dark:border-zinc-700">
                              <XCircle size={12} />
                              Disconnected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">Sync your deals automatically</p>
                      </div>
                    </div>
                  </div>

                  {hubspot.connected && !hubspot.loading && (
                    <div className="text-xs text-gray-500 border-t border-gray-100 dark:border-zinc-800 pt-3">
                      Last sync: {formatLastSync(hubspot.lastSync)}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {hubspot.loading ? (
                      <div className="h-9 w-24 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse" />
                    ) : hubspot.connected ? (
                      <>
                        <button 
                          onClick={() => hubspot.sync()}
                          disabled={hubspot.syncing}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                          {hubspot.syncing ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <RefreshCw size={14} />
                          )}
                          {hubspot.syncing ? "Syncing..." : "Sync Now"}
                        </button>
                        <button 
                          onClick={() => hubspot.connect()}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                          Reconnect
                        </button>
                        <button 
                          onClick={() => hubspot.disconnect()}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => hubspot.connect()}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                      >
                        Connect HubSpot
                      </button>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* BILLING TAB */}
          {activeTab === 'billing' && (
            <div className="space-y-8 animate-fade-in">
              {/* Plan Details */}
              <section className="p-6 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Current Plan</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                    Active
                  </span>
                </div>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">$29</span>
                  <span className="text-gray-500 mb-1">/ month</span>
                </div>
                <p className="text-sm text-gray-500 mb-6">Pro Plan • Billed monthly</p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm rounded-md font-medium shadow-sm transition-colors">Manage Subscription</button>
              </section>

              {/* Usage */}
              <section className="p-6 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Usage</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-gray-700 dark:text-gray-300">AI Generations</span>
                      <span className="text-gray-500">842 / 1,000</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '84%' }}></div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Payment Method */}
              <section className="p-6 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Payment Method</h3>
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-zinc-700 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-6 bg-gray-200 dark:bg-zinc-700 rounded-sm flex items-center justify-center text-xs font-bold text-gray-500">
                      VISA
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">•••• 4242</p>
                      <p className="text-xs text-gray-500">Expires 12/2028</p>
                    </div>
                  </div>
                  <button className="text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white">Edit</button>
                </div>
              </section>

              {/* Invoice History */}
              <section className="p-6 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Invoice History</h3>
                <div className="space-y-1">
                  {[
                    { date: 'Oct 1, 2023', amount: '$29.00', status: 'Paid' },
                    { date: 'Sep 1, 2023', amount: '$29.00', status: 'Paid' },
                    { date: 'Aug 1, 2023', amount: '$29.00', status: 'Paid' },
                  ].map((inv, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-zinc-800 last:border-0"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-1.5 bg-green-50 dark:bg-green-900/20 rounded-full text-green-600 dark:text-green-400">
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Invoice #{1024 - i}</p>
                          <p className="text-xs text-gray-500">{inv.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{inv.amount}</span>
                        <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ACCOUNT TAB */}
          {activeTab === 'account' && (
            <div className="space-y-8 animate-fade-in">
              <section className="p-6 rounded-lg border-l-4 border-l-rose-500 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Danger Zone</h3>
                <p className="text-sm text-gray-500 mb-6">Irreversible account actions.</p>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Sign Out</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={!session}
                      className="px-3 py-1.5 border border-gray-300 dark:border-zinc-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                      Log Out
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-zinc-800">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Delete Account</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={!session || deleteLoading}
                      className="px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-md text-sm font-medium hover:bg-rose-100 transition-colors disabled:opacity-50"
                    >
                      {deleteLoading ? 'Deleting…' : 'Delete Account'}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
