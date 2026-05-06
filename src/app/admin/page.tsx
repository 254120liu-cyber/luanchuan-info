'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function AdminPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'reports' | 'banned'>('reports');
  const [reports, setReports] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) { router.push('/'); }
  }, [loading, isAdmin, router]);

  const fetchReports = useCallback(async () => {
    setLoadingData(true);
    try {
      const res = await fetch('/api/admin/reports');
      const data = await res.json();
      if (res.ok) setReports(data.reports || []);
    } catch {}
    setLoadingData(false);
  }, []);

  const fetchBanned = useCallback(async () => {
    setLoadingData(true);
    try {
      const res = await fetch('/api/admin/banned');
      const data = await res.json();
      if (res.ok) setBannedUsers(data.users || []);
    } catch {}
    setLoadingData(false);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === 'reports') fetchReports();
    else fetchBanned();
  }, [activeTab, isAdmin, fetchReports, fetchBanned]);

  const handleApprove = async (reportId: string) => {
    // Ask for ban type
    const banChoice = prompt(
      '选择处理方式：\n1. 永久封禁\n2. 封禁7天\n3. 封禁3天\n4. 不封禁，仅删除信息\n\n输入数字：'
    );
    if (!banChoice) return;
    let banType: string | null = null;
    let banDays = 0;
    switch (banChoice) {
      case '1': banType = 'perm_banned'; break;
      case '2': banType = 'temp_banned'; banDays = 7; break;
      case '3': banType = 'temp_banned'; banDays = 3; break;
      default: banType = null; break;
    }

    const res = await fetch(`/api/admin/reports/${reportId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ banType, banDays }),
    });
    if (res.ok) {
      alert('已处理');
      fetchReports();
    } else {
      const data = await res.json();
      alert(data.error || '操作失败');
    }
  };

  const handleReject = async (reportId: string) => {
    if (!confirm('确定驳回举报并恢复信息显示吗？')) return;
    const res = await fetch(`/api/admin/reports/${reportId}/reject`, { method: 'POST' });
    if (res.ok) {
      alert('已驳回');
      fetchReports();
    } else {
      const data = await res.json();
      alert(data.error || '操作失败');
    }
  };

  const handleUnban = async (userId: string) => {
    if (!confirm('确定解封该用户吗？')) return;
    const res = await fetch('/api/admin/unban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      alert('已解封');
      fetchBanned();
    } else {
      const data = await res.json();
      alert(data.error || '操作失败');
    }
  };

  const formatTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return hours + '小时前';
    return Math.floor(hours / 24) + '天前';
  };

  if (loading) return <div className="text-center py-20 text-[var(--text-muted)]">加载中...</div>;
  if (!isAdmin) return null;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🛡️</span>
        <h2 className="text-xl font-extrabold text-[var(--navy)]">管理面板</h2>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl font-bold text-sm border-2 transition-all ${
            activeTab === 'reports'
              ? 'bg-[var(--navy)] text-white border-[var(--navy)]'
              : 'bg-white text-[var(--navy)] border-[var(--border)]'
          }`}
        >
          举报审核
        </button>
        <button
          onClick={() => setActiveTab('banned')}
          className={`px-4 py-2 rounded-xl font-bold text-sm border-2 transition-all ${
            activeTab === 'banned'
              ? 'bg-[var(--navy)] text-white border-[var(--navy)]'
              : 'bg-white text-[var(--navy)] border-[var(--border)]'
          }`}
        >
          封禁用户
        </button>
      </div>

      {loadingData ? (
        <div className="text-center py-10 text-[var(--text-muted)]">加载中...</div>
      ) : activeTab === 'reports' ? (
        reports.length === 0 ? (
          <div className="text-center py-10 text-[var(--text-muted)]">
            <p className="text-4xl mb-2">✅</p>
            <p className="text-sm font-semibold">暂无举报</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(report => (
              <div key={report.id} className={`bg-white rounded-xl p-4 border-2 ${
                report.review_status === 'pending' ? 'border-red-300' : 'border-[var(--border)]'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    report.review_status === 'pending' ? 'bg-red-100 text-red-600' :
                    report.review_status === 'approved' ? 'bg-green-100 text-green-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {report.review_status === 'pending' ? '待审核' : report.review_status === 'approved' ? '已通过' : '已驳回'}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">举报人: {report.reporter_nickname}</span>
                  <span className="text-xs text-[var(--text-muted)] ml-auto">{formatTime(report.reported_at)}</span>
                </div>
                <p className="text-sm text-[var(--navy)] font-medium mb-3 bg-[var(--bg-warm)] p-2 rounded-lg">
                  {report.post_content || '(信息已删除)'}
                </p>
                {report.review_status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(report.id)}
                      className="px-4 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold border-2 border-red-600"
                    >
                      通过
                    </button>
                    <button
                      onClick={() => handleReject(report.id)}
                      className="px-4 py-1.5 rounded-lg bg-white text-[var(--navy)] text-xs font-bold border-2 border-[var(--border)]"
                    >
                      驳回
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        bannedUsers.length === 0 ? (
          <div className="text-center py-10 text-[var(--text-muted)]">
            <p className="text-4xl mb-2">👤</p>
            <p className="text-sm font-semibold">暂无封禁用户</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bannedUsers.map(u => (
              <div key={u.id} className="bg-white rounded-xl p-4 border-2 border-[var(--border)] flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[var(--navy)]">{u.nickname || '用户'}</p>
                  <p className={`text-xs font-semibold ${u.ban_status === 'perm_banned' ? 'text-red-500' : 'text-orange-500'}`}>
                    {u.ban_status === 'perm_banned' ? '永久封禁' : '临时封禁'}
                    {u.ban_until && ` · 至${new Date(u.ban_until).toLocaleDateString()}`}
                  </p>
                </div>
                <button
                  onClick={() => handleUnban(u.id)}
                  className="px-3 py-1.5 rounded-lg bg-green-50 text-green-600 text-xs font-bold border border-green-300 hover:bg-green-100"
                >
                  解封
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
