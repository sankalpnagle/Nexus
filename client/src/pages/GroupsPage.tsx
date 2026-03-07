import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid3x3, Users, Lock, Globe, Plus, Search,
  ChevronRight, Crown, UserPlus, LogOut,
} from 'lucide-react';
import { Group } from '../types';
import api from '../utils/api';
import { useAuth } from '../store/authStore';
import { Button, Card, EmptyState, Input, Modal, Spinner, Tabs, Textarea } from '../components/ui';
import { getGroupAvatar, cx } from '../utils/helpers';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Technology', 'Gaming', 'Music', 'Sports', 'Art', 'Education', 'Food', 'Travel', 'General'];

type Tab = 'discover' | 'mine';

export default function GroupsPage() {
  const { user: me } = useAuth();
  const nav = useNavigate();
  const [tab, setTab]             = useState<Tab>('discover');
  const [groups, setGroups]       = useState<Group[]>([]);
  const [myGroups, setMyGroups]   = useState<Group[]>([]);
  const [loading, setLoading]     = useState(true);
  const [category, setCategory]   = useState('All');
  const [search, setSearch]       = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating]   = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', privacy: 'public', category: 'General', rules: '',
  });

  useEffect(() => { fetchGroups(); fetchMyGroups(); }, [category, search]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== 'All') params.set('category', category);
      if (search) params.set('search', search);
      const r = await api.get(`/groups?${params}`);
      setGroups(r.data.groups);
    } catch {} finally { setLoading(false); }
  };

  const fetchMyGroups = async () => {
    try { const r = await api.get('/groups/mine'); setMyGroups(r.data.groups); } catch {}
  };

  const join = async (groupId: string) => {
    try {
      const r = await api.post(`/groups/${groupId}/join`);
      toast.success(r.data.message);
      fetchGroups(); fetchMyGroups();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed');
    }
  };

  const leave = async (groupId: string) => {
    try {
      await api.post(`/groups/${groupId}/leave`);
      toast.success('Left group');
      fetchGroups(); fetchMyGroups();
    } catch { toast.error('Failed'); }
  };

  const createGroup = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      await api.post('/groups', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Group created!');
      setShowCreate(false);
      setForm({ name: '', description: '', privacy: 'public', category: 'General', rules: '' });
      fetchGroups(); fetchMyGroups();
    } catch { toast.error('Failed to create group'); }
    finally { setCreating(false); }
  };

  const isMember = (g: Group) =>
    g.members.some(m => (typeof m === 'string' ? m : (m as { _id: string })._id) === me?._id);

  const isAdmin = (g: Group) =>
    typeof g.admin === 'string' ? g.admin === me?._id : (g.admin as { _id: string })._id === me?._id;

  const GroupCard = ({ g }: { g: Group }) => {
    const member = isMember(g);
    const admin  = isAdmin(g);
    return (
      <Card className="overflow-hidden hover:border-[#2e3347] transition-colors group">
        <div className="relative">
          <img
            src={g.cover || getGroupAvatar(g.name, 600)}
            alt=""
            className="w-full h-36 object-cover cursor-pointer group-hover:opacity-90 transition-opacity"
            onClick={() => nav(`/groups/${g._id}`)}
          />
          <div className="absolute top-2 right-2">
            <span className={cx(
              'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full',
              g.privacy === 'public'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-[#6b7280]/20 text-[#9ca3af]'
            )}>
              {g.privacy === 'public' ? <Globe size={9} /> : <Lock size={9} />}
              {g.privacy}
            </span>
          </div>
          {admin && (
            <div className="absolute top-2 left-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-[#00d4b4]/20 text-[#00d4b4]">
                <Crown size={9} /> Admin
              </span>
            </div>
          )}
        </div>
        <div className="p-3.5">
          <p
            className="font-bold text-[#f4f6fc] text-sm cursor-pointer hover:text-[#00d4b4] transition-colors truncate font-[var(--font-display)]"
            onClick={() => nav(`/groups/${g._id}`)}
          >
            {g.name}
          </p>
          <div className="flex items-center gap-3 text-xs text-[#6b7280] mt-1 mb-3">
            <span className="flex items-center gap-1"><Users size={10} /> {(g.members as unknown[]).length} members</span>
            <span className="flex items-center gap-1"><Grid3x3 size={10} /> {g.category}</span>
          </div>
          {member ? (
            <div className="flex gap-2">
              <Button variant="primary" size="sm" fullWidth onClick={() => nav(`/groups/${g._id}`)}>
                View Group
              </Button>
              {!admin && (
                <Button variant="secondary" size="sm" icon={<LogOut size={12} />} onClick={() => leave(g._id)}>
                  Leave
                </Button>
              )}
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              fullWidth
              icon={<UserPlus size={13} />}
              onClick={() => join(g._id)}
            >
              {g.privacy === 'public' ? 'Join Group' : 'Request to Join'}
            </Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-5">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-black text-[#f4f6fc] font-[var(--font-display)] tracking-tight">Groups</h1>
        <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
          Create Group
        </Button>
      </div>

      <Tabs
        tabs={[{ key: 'discover' as Tab, label: 'Discover' }, { key: 'mine' as Tab, label: 'Your Groups', count: myGroups.length }]}
        active={tab}
        onChange={setTab}
        className="max-w-xs mb-5"
      />

      {tab === 'discover' && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
              <input
                type="text"
                placeholder="Search groups…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-[#13161e] border border-[#232736] rounded-xl text-sm text-[#e8eaf0] placeholder-[#6b7280] focus:outline-none focus:border-[#00d4b4] transition-colors"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.slice(0, 6).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={cx(
                    'px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                    category === cat
                      ? 'bg-[#00d4b4] text-[#0d0f14] font-bold'
                      : 'bg-[#181c26] border border-[#232736] text-[#9ca3af] hover:border-[#2e3347]'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Spinner size={36} /></div>
          ) : groups.length === 0 ? (
            <EmptyState icon={<Grid3x3 size={28} />} title="No groups found" subtitle="Try a different search or category" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {groups.map(g => <GroupCard key={g._id} g={g} />)}
            </div>
          )}
        </>
      )}

      {tab === 'mine' && (
        myGroups.length === 0 ? (
          <EmptyState
            icon={<Grid3x3 size={28} />}
            title="No groups yet"
            subtitle="Join or create a group to get started"
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {myGroups.map(g => <GroupCard key={g._id} g={g} />)}
          </div>
        )
      )}

      {/* Create group modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Group" maxWidth="max-w-lg">
        <div className="p-5 space-y-4">
          <Input
            label="Group Name *"
            placeholder="Give your group a name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <Textarea
            label="Description"
            placeholder="What's this group about?"
            value={form.description}
            rows={3}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-1.5">Privacy</label>
              <select
                value={form.privacy}
                onChange={e => setForm(f => ({ ...f, privacy: e.target.value }))}
                className="w-full bg-[#13161e] border border-[#232736] text-[#e8eaf0] rounded-xl text-sm px-3.5 py-2.5 focus:outline-none focus:border-[#00d4b4]"
              >
                <option value="public">🌍 Public</option>
                <option value="private">🔒 Private</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full bg-[#13161e] border border-[#232736] text-[#e8eaf0] rounded-xl text-sm px-3.5 py-2.5 focus:outline-none focus:border-[#00d4b4]"
              >
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <Button variant="primary" fullWidth loading={creating} disabled={!form.name.trim()} onClick={createGroup}>
            Create Group
          </Button>
        </div>
      </Modal>
    </div>
  );
}
