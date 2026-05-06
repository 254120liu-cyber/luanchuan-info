'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

export default function ChangePasswordPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (loading) return <div className="text-center py-20 text-[var(--text-muted)]">加载中...</div>;
  if (!user) { router.push('/auth'); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!oldPassword || !newPassword) { setError('请填写所有密码字段'); return; }
    if (newPassword.length < 6) { setError('新密码至少6位'); return; }
    if (newPassword !== confirmPassword) { setError('两次输入的新密码不一致'); return; }
    if (oldPassword === newPassword) { setError('新密码不能和旧密码相同'); return; }

    setSubmitting(true);

    // Re-authenticate first, then update
    const email = user.email!;
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: oldPassword });
    if (signInError) {
      setError('当前密码不正确');
      setSubmitting(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.push('/mine'), 1500);
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl p-6 border-2 border-[var(--navy)]" style={{ boxShadow: '6px 6px 0px rgba(30,39,46,0.1)' }}>
        <h2 className="text-xl font-extrabold text-[var(--navy)] text-center mb-6">修改密码</h2>

        {success ? (
          <div className="text-center py-8">
            <span className="text-5xl animate-popIn">✅</span>
            <p className="text-sm font-bold text-green-600 mt-3">密码修改成功</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[var(--navy)] mb-1">当前密码</label>
              <input
                type="password"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                placeholder="输入当前密码"
                className="w-full px-3 py-2.5 rounded-xl border-2 border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--navy)] mb-1">新密码</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="至少6位"
                className="w-full px-3 py-2.5 rounded-xl border-2 border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--navy)] mb-1">确认新密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="再次输入新密码"
                className="w-full px-3 py-2.5 rounded-xl border-2 border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            {error && <p className="text-sm text-red-500 font-semibold text-center">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-bold text-base border-2 border-[var(--navy)] disabled:opacity-50"
              style={{ boxShadow: '4px 4px 0px rgba(30,39,46,0.15)' }}
            >
              {submitting ? '修改中...' : '确认修改'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
