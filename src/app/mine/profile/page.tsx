'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';

function compressAvatar(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas error')); return; }
      ctx.drawImage(img, 0, 0, 200, 200);
      canvas.toBlob(
        blob => { if (blob) resolve(blob); else reject(new Error('compress failed')); },
        'image/jpeg',
        0.6
      );
    };
    img.onerror = () => reject(new Error('load failed'));
    img.src = URL.createObjectURL(file);
  });
}

export default function EditProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const mountedRef = useRef(true);

  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

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

    // Upload avatar and save profile in parallel
    const tasks: Promise<any>[] = [];

    // Profile update
    const profileData: Record<string, string> = { nickname: nickname.trim() };
    tasks.push(
      fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      })
    );

    // Avatar upload (compress + upload in background)
    let avatarPromise: Promise<string | null> = Promise.resolve(null);
    if (avatarFile) {
      avatarPromise = (async () => {
        const compressed = await compressAvatar(avatarFile);
        const fd = new FormData();
        fd.append('file', compressed, `avatar_${Date.now()}.jpg`);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) throw new Error('upload failed');
        const data = await res.json();
        return data.url as string;
      })();
    }

    try {
      const [newAvatarUrl] = await Promise.all([
        avatarPromise,
        ...tasks,
      ]);

      // If avatar was uploaded, update the profile with the new URL
      if (newAvatarUrl) {
        await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar_url: newAvatarUrl }),
        });
      }

      if (mountedRef.current) {
        setSuccess(true);
        setTimeout(() => router.push('/mine'), 800);
      }
    } catch {
      if (mountedRef.current) setError('保存失败');
    }
    if (mountedRef.current) setSaving(false);
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
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-[var(--border)] bg-[var(--bg-warm)] relative">
                {(avatarPreview || avatarUrl) ? (
                  <Image src={avatarPreview || avatarUrl} alt="" fill className="object-cover" unoptimized />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-4xl">👤</span>
                )}
              </div>
              <label className="text-sm font-bold text-[var(--primary)] cursor-pointer hover:underline">
                更换头像
                <input type="file" accept="image/*" onChange={handleAvatarPick} className="hidden" />
              </label>
            </div>

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
