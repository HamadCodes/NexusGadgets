'use client';
import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, User, ShoppingCart, Heart, LogOut, Camera, Trash2, UserX, Edit, Save, X } from 'lucide-react';
import Image from 'next/image';

export default function ProfilePage() {
  const { data: session, update, status } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track whether the user has an uploaded image on the server
  const [hasUploadedImage, setHasUploadedImage] = useState(false);
  // Increment this to force a cache-busting reload when the user updates/deletes their image
  const [imageVersion, setImageVersion] = useState<number>(0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/';
      return;
    }
  }, [status]);

  // Initialize username from session
  useEffect(() => {
    setUsername(session?.user?.name || '');
  }, [session?.user?.name]);

  // Check once whether the server has an uploaded image for this user
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    let mounted = true;
    const check = async () => {
      try {
        const res = await fetch(`/api/user/image?userId=${encodeURIComponent(userId)}`, { method: 'HEAD' });
        if (!mounted) return;
        setHasUploadedImage(res.ok);
      } catch {
        // ignore network errors and assume no uploaded image
        setHasUploadedImage(false);
      }
    };

    check();

    return () => {
      mounted = false;
    };
  }, [session?.user?.id]);

  // Helper to compute the image URL we should use in <Image />
  // Priority: uploaded image -> OAuth image -> null
  const computeProfileImageUrl = () => {
    const userId = session?.user?.id;
    if (userId && hasUploadedImage) {
      return `/api/user/image?userId=${encodeURIComponent(userId)}${imageVersion ? `&v=${imageVersion}` : ''}`;
    }
    if (session?.user?.image) return session.user.image;
    return null;
  };

  const profileImageUrl = computeProfileImageUrl();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        setError('Image size exceeds 1MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const updateRes = await fetch('/api/user/image', {
        method: 'POST',
        body: formData,
      });

      const result = await updateRes.json();

      if (!updateRes.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      // Ask next-auth to refresh the session
      await update?.();

      // Force a cache-bust so the client requests the new uploaded image once
      setImageVersion((v) => v + 1);
      setHasUploadedImage(true);

      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!hasUploadedImage) return;

    setIsDeleting(true);
    setError(null);

    try {
      const deleteRes = await fetch('/api/user/image', {
        method: 'DELETE',
      });

      const result = await deleteRes.json();

      if (!deleteRes.ok) {
        throw new Error(result.error || 'Failed to delete profile image');
      }

      await update?.();

      // bump version to refresh any cached endpoint result
      setImageVersion((v) => v + 1);
      setHasUploadedImage(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsDeletingProfile(true);
    setError(null);

    try {
      const deleteRes = await fetch('/api/user/delete-profile', {
        method: 'DELETE',
      });

      const result = await deleteRes.json();

      if (!deleteRes.ok) {
        throw new Error(result.error || 'Failed to delete profile');
      }

      setTimeout(() => {
        signOut({ callbackUrl: '/' });
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeletingProfile(false);
    }
  };

  const handleUsernameUpdate = async () => {
    if (!username.trim()) {
      setUsernameError('Username cannot be empty');
      return;
    }

    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters long');
      return;
    }

    if (username.length > 30) {
      setUsernameError('Username cannot exceed 30 characters');
      return;
    }

    setIsUpdatingUsername(true);
    setUsernameError(null);

    try {
      const updateRes = await fetch('/api/user/update-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const result = await updateRes.json();

      if (!updateRes.ok) {
        throw new Error(result.error || 'Failed to update username');
      }

      await update?.({
        ...session,
        user: {
          ...session?.user,
          name: result.username || username,
        },
      });

      setIsEditingUsername(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setUsernameError(errorMessage);
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const cancelUsernameEdit = () => {
    setIsEditingUsername(false);
    setUsername(session?.user?.name || '');
    setUsernameError(null);
  };

  if (status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-10 w-64" />
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
              <Skeleton className="w-32 h-32 rounded-full" />
              <div className="text-center md:text-left space-y-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-5 w-64" />
              </div>
            </div>
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return session ? (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
      <p className="text-gray-500 mb-8">Manage your account information and preferences</p>

      <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
          <div className="relative group">
            {profileImageUrl ? (
              <Image
                src={profileImageUrl}
                alt="Profile"
                width={128}
                height={128}
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 shadow-sm"
                onError={() => {
                  // If uploaded image fails, fall back to OAuth image
                  if (hasUploadedImage) {
                    setHasUploadedImage(false);
                    setImageVersion((v) => v + 1);
                  }
                }}
                unoptimized
              />
            ) : (
              <div className="bg-gradient-to-br from-blue-400 to-purple-500 rounded-full w-32 h-32 flex items-center justify-center text-4xl text-white shadow-sm">
                {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || '?'}
              </div>
            )}

            {hasUploadedImage && (
              <button
                onClick={handleDeleteImage}
                disabled={isDeleting}
                className={`absolute top-2 right-2 bg-white p-2 rounded-full shadow-md cursor-pointer transition-all hover:scale-105 ${
                  isDeleting
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-gray-700'
                }`}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                  </>
                )}
              </button>
            )}

            <label
              htmlFor="file-upload"
              className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-md cursor-pointer transition-all hover:scale-105"
            >
              <Camera size={16} className="text-gray-700" />
              <input
                id="file-upload"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>

          <div className="text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              {isEditingUsername ? (
                <div className="flex flex-col">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="text-2xl font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isUpdatingUsername}
                  />
                  {usernameError && (
                    <p className="text-red-500 text-sm mt-1">{usernameError}</p>
                  )}
                </div>
              ) : (
                <h2 className="text-2xl font-semibold text-gray-900">
                  {session?.user?.name || 'No name set'}
                </h2>
              )}

              {isEditingUsername ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleUsernameUpdate}
                    disabled={isUpdatingUsername}
                    className="p-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    {isUpdatingUsername ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save size={16} />
                    )}
                  </button>
                  <button
                    onClick={cancelUsernameEdit}
                    className="p-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingUsername(true)}
                  className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  <Edit size={16} />
                </button>
              )}
            </div>

            <p className="text-gray-600 flex items-center justify-center md:justify-start gap-2 mt-1">
              <User size={16} />
              {session?.user?.email}
            </p>
          </div>
        </div>

        {/* Image Upload Section */}
        {previewUrl && (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Upload size={18} />
              Image Preview
            </h3>
            <div className="flex items-center gap-4">
              <Image
                width={64}
                height={64}
                src={previewUrl}
                alt="Preview"
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              />
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className={`px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 ${
                  isUploading
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white transition-colors'
                }`}
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Confirm Upload
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">Max file size: 1MB</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="border border-gray-100 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart size={20} className="text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900">Shopping Cart</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              {session?.user?.cart?.length || 0} items
            </p>
            <Link
              href="/cart"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center gap-1 transition-colors"
            >
              View cart
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>

          <div className="border border-gray-100 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Heart size={20} className="text-red-600" />
              </div>
              <h3 className="font-medium text-gray-900">Favorites</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              {session?.user?.favorites?.length || 0} items
            </p>
            <Link
              href="/favorites"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center gap-1 transition-colors"
            >
              View favorites
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="CurrentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Sign Out */}
        <div className="pt-3">
          <button
            onClick={() => signOut()}
            className="px-5 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>

        {/* Delete Profile Section */}
        <div className="border-t border-gray-100 pt-6 mt-6">
          <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
            <UserX size={20} />
            Danger Zone
          </h3>

          {!showDeleteConfirm ? (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-red-700 mb-3">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button
                onClick={handleDeleteProfile}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-red-700 transition-colors"
              >
                <Trash2 size={16} />
                Delete My Account
              </button>
            </div>
          ) : (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-red-700 mb-3 font-medium">
                Are you absolutely sure you want to delete your account? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteProfile}
                  disabled={isDeletingProfile}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                    isDeletingProfile
                      ? 'bg-red-400 text-white cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white transition-colors'
                  }`}
                >
                  {isDeletingProfile ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Yes, Delete My Account
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeletingProfile}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;
}