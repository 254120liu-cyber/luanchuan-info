'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';

export default function EditProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) { router.push('/auth'); return; }
    if (!user) return;
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => {
        setNickname(d.nickname || '');
        setAvatarUrl(d.avatar_url || '');
      });
  }, [user, loading, router]);

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!nickname.trim()) { setError('昵称不能为空'); return; }
    setSaving(true);
    setError('');

    let newAvatarUrl = avatarUrl;

    // Upload avatar if changed
    if (avatarFile) {
      const fd = new FormData();
      fd.append('file', avatarFile, `avatar_${Date.now()}.jpg`);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (res.ok) {
          newAvatarUrl = data.url;
        } else {
          setError('头像上传失败');
          setSaving(false);
          return;
        }
      } catch {
        setError('头像上传失败');
        setSaving(false);
        return;
      }
    }

    // Save profile
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: nickname.trim(), avatar_url: newAvatarUrl }),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push('/mine'), 1000);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || '保存失败');
    }
    setSaving(false);
  };

  if (loading) return <div className="text-center py-20 text-[var(--text-muted)]">加载中...</div>;
  if (!user) return null;

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl p-6 border-2 border-[var(--navy)]" style={{ boxShadow: '6px 6px 0px rgba(30,39,46,0.1)' }}>
        <h2 className="text-xl font-extrabold text-[var(--navy)] text-center mb-6">编辑资料</h2>

        {success ? (
          <div className="text-center py-8">
            <span className="text-5xl animate-popIn">✅</span>
            <p className="text-sm font-bold text-green-600 mt-3">保存成功</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-[var(--border)] bg-[var(--bg-warm)] relative">
                {(avatarPreview || avatarUrl) ? (
                  <Image
                    src={avatarPreview || avatarUrl}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-4xl">👤</span>
                )}
              </div>
              <label className="text-sm font-bold text-[var(--primary)] cursor-pointer hover:underline">
                更换头像
                <input type="file" accept="image/*" onChange={handleAvatarPick} className="hidden" />
              </label>
            </div>

            {/* Nickname */}
            <div>
              <label className="block text-sm font-bold text-[var(--navy)] mb-1.5">昵称</label>
              <input
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="给自己起个名字"
                maxLength={20}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            {error && <p className="text-sm text-red-500 font-semibold text-center">{error}</p>}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-bold text-base border-2 border-[var(--navy)] disabled:opacity-50"
              style={{ boxShadow: '4px 4px 0px rgba(30,39,46,0.15)' }}
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
