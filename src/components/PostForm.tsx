'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES, TOWNS } from '@/lib/constants';
import ImageUploader from './ImageUploader';

interface FormData {
  category: string;
  town: string;
  content: string;
  images: string[];
  phone: string;
  wechat: string;
}

interface Props {
  initial?: FormData;
  postId?: string;
  isEdit?: boolean;
}

export default function PostForm({ initial, postId, isEdit }: Props) {
  const router = useRouter();

  const [category, setCategory] = useState(initial?.category || '');
  const [town, setTown] = useState(initial?.town || '');
  const [content, setContent] = useState(initial?.content || '');
  const [images, setImages] = useState<string[]>(initial?.images || []);
  const [phone, setPhone] = useState(initial?.phone || '');
  const [wechat, setWechat] = useState(initial?.wechat || '');
  const [submitting, setSubmitting] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [showCelebrate, setShowCelebrate] = useState(false);
  const [error, setError] = useState('');

  const cats = CATEGORIES.filter(c => c.key !== 'all');

  const validate = () => {
    if (!category) { setError('请选择分类'); return false; }
    if (!content.trim()) { setError('请输入内容'); return false; }
    if (!phone && !wechat) { setError('电话和微信号至少填一个'); return false; }
    if (phone && !/^1\d{10}$/.test(phone)) { setError('电话号码格式不正确'); return false; }
    if (!town) { setError('请选择所在区域'); return false; }
    if (!agreePrivacy) { setError('请阅读并同意隐私政策'); return false; }
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);

    try {
      // Images are already uploaded by ImageUploader, just submit the URLs
      const body = { category, content: content.trim(), images, phone, wechat, town };
      const url = isEdit ? `/api/posts/${postId}` : '/api/posts';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '发布失败');
        setSubmitting(false);
        return;
      }

      if (!isEdit) {
        setShowCelebrate(true);
        setTimeout(() => setShowCelebrate(false), 1200);
      }

      if (isEdit) {
        setTimeout(() => router.push('/mine/posts'), 1000);
      } else {
        setCategory(''); setTown(''); setContent(''); setImages([]);
        setPhone(''); setWechat(''); setAgreePrivacy(false);
      }
    } catch {
      setError('发布失败，请重试');
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <div>
        <label className="block text-sm font-bold text-[var(--navy)] mb-1.5">分类 *</label>
        <div className="grid grid-cols-4 gap-2">
          {cats.map(c => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`py-2 px-1 rounded-lg text-xs font-bold border-2 transition-all ${
                category === c.key
                  ? 'bg-[var(--primary)] text-white border-[var(--navy)]'
                  : 'bg-white text-[var(--navy)] border-[var(--border)] hover:border-[var(--primary)]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-[var(--navy)] mb-1.5">内容 *</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="请详细描述你要发布的信息..."
          className="w-full h-28 px-3 py-2.5 rounded-xl border-2 border-[var(--border)] text-sm resize-none focus:outline-none focus:border-[var(--primary)]"
          maxLength={500}
        />
        <p className="text-xs text-[var(--text-muted)] text-right mt-1">{content.length}/500</p>
      </div>

      <div>
        <label className="block text-sm font-bold text-[var(--navy)] mb-1.5">图片（最多6张，选图即上传）</label>
        <ImageUploader images={images} onChange={setImages} max={6} />
      </div>

      <div>
        <label className="block text-sm font-bold text-[var(--navy)] mb-1.5">电话</label>
        <input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="输入手机号"
          className="w-full px-3 py-2.5 rounded-xl border-2 border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
          maxLength={11}
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-[var(--navy)] mb-1.5">微信号</label>
        <input
          value={wechat}
          onChange={e => setWechat(e.target.value)}
          placeholder="输入微信号"
          className="w-full px-3 py-2.5 rounded-xl border-2 border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-[var(--navy)] mb-1.5">所在区域 *</label>
        <select
          value={town}
          onChange={e => setTown(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border-2 border-[var(--border)] bg-white text-sm font-semibold focus:outline-none focus:border-[var(--primary)] appearance-none"
        >
          <option value="">请选择区域</option>
          {TOWNS.map(t => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={agreePrivacy}
          onChange={e => setAgreePrivacy(e.target.checked)}
          className="w-4 h-4 accent-[var(--primary)]"
        />
        <span className="text-xs text-[var(--text-muted)]">
          已阅读并同意
          <a href="/privacy" target="_blank" className="text-[var(--primary)] font-semibold ml-1">隐私政策</a>
        </span>
      </div>

      {error && <p className="text-sm text-red-500 font-semibold text-center">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3 rounded-xl bg-[var(--primary)] text-white font-bold text-base border-2 border-[var(--navy)] disabled:opacity-50 transition-all"
        style={{ boxShadow: '4px 4px 0px rgba(30,39,46,0.15)' }}
      >
        {submitting ? '提交中...' : (isEdit ? '保存修改' : '发布信息')}
      </button>

      {showCelebrate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 pointer-events-none">
          <div className="animate-celebrate text-8xl">🎉</div>
        </div>
      )}
    </div>
  );
}
