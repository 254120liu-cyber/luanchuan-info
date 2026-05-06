'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import PostForm from '@/components/PostForm';

export default function EditPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.push('/auth'); return; }
    if (!id) return;

    fetch(`/api/posts/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error || data.user_id !== user?.id) {
          alert('无权限编辑');
          router.push('/');
          return;
        }
        setPost(data);
        setPageLoading(false);
      })
      .catch(() => { router.push('/'); });
  }, [id, user, loading, router]);

  if (loading || pageLoading) return <div className="text-center py-20 text-[var(--text-muted)]">加载中...</div>;
  if (!post) return null;

  return (
    <div className="py-4">
      <h2 className="text-xl font-extrabold text-[var(--navy)] text-center mb-2">编辑信息</h2>
      <PostForm
        initial={{
          category: post.category,
          town: post.town,
          content: post.content,
          images: post.images || [],
          phone: post.phone || '',
          wechat: post.wechat || '',
        }}
        postId={id}
        isEdit
      />
    </div>
  );
}
