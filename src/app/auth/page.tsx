'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

// Phone number → Supabase-compatible email
function phoneToEmail(phone: string) { return phone + '@lc.local'; }

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phone || !/^1\d{10}$/.test(phone)) { setError('请输入正确的手机号'); return; }
    if (!password || password.length < 6) { setError('密码至少6位'); return; }
    if (!isLogin && !nickname.trim()) { setError('请输入昵称'); return; }

    setLoading(true);
    const email = phoneToEmail(phone);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message.includes('Invalid login') ? '手机号或密码错误' : error.message);
        setLoading(false);
      } else {
        router.push('/');
        router.refresh();
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          setError('该手机号已注册，请直接登录');
        } else {
          setError(error.message);
        }
        setLoading(false);
      } else if (data.user) {
        // Create profile with phone
        await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nickname: nickname.trim(), phone }),
        });
        router.push('/');
        router.refresh();
      }
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl p-6 border-2 border-[var(--navy)]" style={{ boxShadow: '6px 6px 0px rgba(30,39,46,0.1)' }}>
        <h1 className="text-2xl font-extrabold text-[var(--navy)] text-center mb-6">
          栾川便民信息
        </h1>
        <p className="text-center text-sm text-[var(--text-muted)] -mt-4 mb-5">
          {isLogin ? '登录后发布信息、收藏' : '注册账号，完全免费'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-bold text-[var(--navy)] mb-1">昵称</label>
              <input
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="怎么称呼你？"
                className="w-full px-3 py-2.5 rounded-xl border-2 border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-[var(--navy)] mb-1">手机号</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="输入11位手机号"
              className="w-full px-3 py-2.5 rounded-xl border-2 border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--navy)] mb-1">
              {isLogin ? '密码' : '设置密码（至少6位数字）'}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={isLogin ? '输入密码' : '建议6位数字，好记'}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          {error && <p className="text-sm text-red-500 font-semibold text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-bold text-base border-2 border-[var(--navy)] disabled:opacity-50"
            style={{ boxShadow: '4px 4px 0px rgba(30,39,46,0.15)' }}
          >
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </button>
        </form>

        <p className="text-center text-xs text-[var(--text-muted)] mt-4">
          {isLogin ? '还没有账号？' : '已有账号？'}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-[var(--primary)] font-bold ml-1">
            {isLogin ? '免费注册' : '去登录'}
          </button>
        </p>
      </div>
    </div>
  );
}
