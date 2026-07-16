import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { fetchFullProfile, updateProfile } from '../services/authService';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

const ProfilePage: React.FC = () => {
  const { token, userProfile, setUserProfile } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) return;
      try {
        const fullProfile = await fetchFullProfile(token);
        setProfile(fullProfile);
        setUserProfile(fullProfile);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [token, setUserProfile]);

  const handleBaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile((prev: any) => ({
      ...prev,
      profileData: {
        ...prev.profileData,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateProfile(token, profile);
      setProfile(updated);
      setUserProfile(updated);
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-white">Loading profile...</div>;
  if (error && !profile) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Alert variant="error" message={`Failed to load profile: ${error}`} />
      </div>
    );
  }
  if (!profile) return <div className="p-8 text-white">Profile not found.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">My Profile</h1>

      {error && <Alert variant="error" message={error} className="mb-6" />}
      {success && <Alert variant="success" message={success} className="mb-6" />}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Base Information */}
        <section className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-6 border-b border-gray-800 pb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleBaseChange}
                className="input"
                disabled
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Role</label>
              <input
                type="text"
                value={profile.roleId}
                className="input capitalize"
                disabled
              />
            </div>
          </div>
        </section>

        {/* Dynamic Role-Specific Information */}
        <section className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-6 border-b border-gray-800 pb-4">
            Professional Details ({profile.roleId})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Common Profile Fields for most roles */}
            {profile.profileData && Object.keys(profile.profileData).map((key) => {
              if (['id', 'userId', 'createdAt', 'updatedAt'].includes(key)) return null;
              
              const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
              const value = profile.profileData[key] || '';
              
              return (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">{label}</label>
                  <input
                    type="text"
                    name={key}
                    value={value}
                    onChange={handleProfileDataChange}
                    className="input"
                  />
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <Button type="submit" isLoading={isSaving} size="lg">
            Save Profile Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
