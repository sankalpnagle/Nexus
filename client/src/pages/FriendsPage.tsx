import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, UserX, UserPlus, Users } from 'lucide-react';
import { User } from '../types';
import api from '../utils/api';
import { useAuth } from '../store/authStore';
import { Avatar, Button, Card, EmptyState, Spinner, Tabs } from '../components/ui';
import { getAvatar } from '../utils/helpers';
import toast from 'react-hot-toast';

type Tab = 'requests' | 'suggestions' | 'all';

export default function FriendsPage() {
  const { user: me, refreshUser } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>('requests');
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const requests = me?.friendRequests || [];
  const allFriends = (me?.friends as User[]) || [];

  useEffect(() => {
    setLoading(true);
    api.get('/users/suggestions')
      .then(r => setSuggestions(r.data.users))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const respond = async (uid: string, action: 'accept' | 'decline') => {
    try {
      await api.put(`/users/${uid}/friend-request`, { action });
      await refreshUser();
      toast.success(action === 'accept' ? '✓ Friend added!' : 'Declined');
    } catch { toast.error('Failed'); }
  };

  const sendReq = async (uid: string) => {
    try {
      await api.post(`/users/${uid}/friend-request`);
      setSuggestions(p => p.filter(u => u._id !== uid));
      toast.success('Friend request sent!');
    } catch { toast.error('Failed'); }
  };

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'requests',    label: 'Requests',    count: requests.length },
    { key: 'suggestions', label: 'Suggestions' },
    { key: 'all',         label: 'All Friends', count: allFriends.length },
  ];

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-5">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-black text-[var(--nx-heading)] font-[var(--font-display)] tracking-tight">Friends</h1>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} className="mb-5 max-w-sm" />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={36} /></div>
      ) : (
        <>
          {/* Requests */}
          {tab === 'requests' && (
            requests.length === 0 ? (
              <EmptyState icon={<Users size={28} />} title="No pending requests" subtitle="When someone sends you a request, it'll appear here" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {requests.map(req => (
                  <Card key={req._id} className="p-4">
                    <div
                      className="flex items-center gap-3 mb-3 cursor-pointer group"
                      onClick={() => nav(`/profile/${req.from._id}`)}
                    >
                      <Avatar user={req.from} size={52} />
                      <div>
                        <p className="font-bold text-[var(--nx-heading)] text-sm font-[var(--font-display)] group-hover:text-[#7c6ff7] transition-colors">
                          {req.from.firstName} {req.from.lastName}
                        </p>
                        <p className="text-xs text-[var(--nx-muted)]">{(req.from.friends as string[])?.length || 0} mutual friends</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="primary" fullWidth size="sm" icon={<UserCheck size={13} />} onClick={() => respond(req.from._id, 'accept')}>
                        Confirm
                      </Button>
                      <Button variant="secondary" fullWidth size="sm" icon={<UserX size={13} />} onClick={() => respond(req.from._id, 'decline')}>
                        Delete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )
          )}

          {/* Suggestions */}
          {tab === 'suggestions' && (
            suggestions.length === 0 ? (
              <EmptyState icon={<Users size={28} />} title="No suggestions right now" subtitle="Check back later as new people join Nexus" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {suggestions.map(u => (
                  <Card key={u._id} className="overflow-hidden group">
                    <img
                      src={getAvatar(u, 200)}
                      alt=""
                      className="w-full h-36 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                      onClick={() => nav(`/profile/${u._id}`)}
                    />
                    <div className="p-3">
                      <p
                        className="font-bold text-[var(--nx-heading)] text-sm truncate cursor-pointer hover:text-[#7c6ff7] transition-colors mb-0.5 font-[var(--font-display)]"
                        onClick={() => nav(`/profile/${u._id}`)}
                      >
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-xs text-[var(--nx-muted)] mb-2.5">{(u.friends as string[])?.length || 0} mutual friends</p>
                      <Button variant="primary" fullWidth size="xs" icon={<UserPlus size={12} />} onClick={() => sendReq(u._id)}>
                        Add Friend
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )
          )}

          {/* All friends */}
          {tab === 'all' && (
            allFriends.length === 0 ? (
              <EmptyState icon={<Users size={28} />} title="No friends yet" subtitle="Send friend requests to get started" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {allFriends.map(f => (
                  <Card key={(f as User)._id} className="overflow-hidden group">
                    <img
                      src={getAvatar(f as User, 200)}
                      alt=""
                      className="w-full h-36 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                      onClick={() => nav(`/profile/${(f as User)._id}`)}
                    />
                    <div className="p-3">
                      <p
                        className="font-bold text-[var(--nx-heading)] text-sm truncate cursor-pointer hover:text-[#7c6ff7] transition-colors font-[var(--font-display)]"
                        onClick={() => nav(`/profile/${(f as User)._id}`)}
                      >
                        {(f as User).firstName} {(f as User).lastName}
                      </p>
                      <Button variant="ghost" fullWidth size="xs" className="mt-2" onClick={() => nav(`/profile/${(f as User)._id}`)}>
                        View Profile
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
