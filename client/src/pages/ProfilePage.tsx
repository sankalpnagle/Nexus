import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Camera, MessageCircle, UserPlus, UserCheck, UserMinus, Edit3,
  MapPin, Link2, Calendar, Briefcase, GraduationCap, Loader2,
} from 'lucide-react';
import { User, Post } from '../types';
import api from '../utils/api';
import { useAuth } from '../store/authStore';
import PostCard from '../components/feed/PostCard';
import CreatePost from '../components/feed/CreatePost';
import { Avatar, Button, Card, EmptyState, Input, Spinner, Tabs, Textarea } from '../components/ui';
import { getAvatar, cx } from '../utils/helpers';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

type Tab = 'posts' | 'about' | 'friends' | 'photos';

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: me, setUser, refreshUser } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('posts');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    firstName: '', lastName: '', bio: '', location: '',
    website: '', occupation: '', education: '',
  });

  const isOwner = userId === me?._id;
  const isFriend = profile?.friends.some(f =>
    (typeof f === 'string' ? f : (f as User)._id) === me?._id
  );
  const sentReq  = me?.sentFriendRequests.includes(userId || '');
  const recvdReq = me?.friendRequests.some(r => r.from._id === userId);

  useEffect(() => {
    if (userId) { loadProfile(); loadPosts(); }
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/users/${userId}`);
      setProfile(r.data.user);
      const u = r.data.user;
      setEditData({
        firstName: u.firstName, lastName: u.lastName,
        bio: u.bio || '', location: u.location || '',
        website: u.website || '', occupation: u.occupation || '',
        education: u.education || '',
      });
    } catch { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  };

  const loadPosts = async () => {
    try { const r = await api.get(`/posts/user/${userId}`); setPosts(r.data.posts); } catch {}
  };

  const doRefresh = async () => { loadProfile(); await refreshUser(); };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const r = await api.put('/users/profile', editData);
      setUser(r.data.user);
      loadProfile();
      setEditing(false);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const changePhoto = async (field: 'avatar' | 'coverPhoto', file: File) => {
    const fd = new FormData();
    fd.append(field, file);
    try {
      const r = await api.put('/users/profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(r.data.user);
      loadProfile();
      toast.success('Photo updated!');
    } catch { toast.error('Failed'); }
  };

  const sendFriendReq = async () => {
    try { await api.post(`/users/${userId}/friend-request`); doRefresh(); toast.success('Request sent!'); }
    catch { toast.error('Failed'); }
  };

  const respondReq = async (action: 'accept' | 'decline') => {
    try { await api.put(`/users/${userId}/friend-request`, { action }); doRefresh(); }
    catch { toast.error('Failed'); }
  };

  const unfriend = async () => {
    try { await api.delete(`/users/${userId}/unfriend`); doRefresh(); toast.success('Unfriended'); }
    catch { toast.error('Failed'); }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Spinner size={40} />
    </div>
  );
  if (!profile) return (
    <div className="text-center py-16 text-[#6b7280]">User not found</div>
  );

  const friends = profile.friends as User[];
  const photos  = posts.flatMap(p => p.media.filter(m => m.type === 'image').map(m => m.url));

  const aboutItems = [
    { icon: Briefcase,     label: 'Works at',    val: profile.occupation },
    { icon: GraduationCap, label: 'Studied at',  val: profile.education },
    { icon: MapPin,        label: 'Lives in',    val: profile.location },
    { icon: Link2,         label: 'Website',     val: profile.website, link: true },
    { icon: Calendar,      label: 'Birthday',    val: profile.birthday ? format(new Date(profile.birthday), 'MMMM d, yyyy') : undefined },
    { icon: Calendar,      label: 'Joined',      val: format(new Date(profile.createdAt), 'MMMM yyyy') },
  ];

  return (
    <div className="max-w-[980px] mx-auto pb-8">

      {/* Cover photo */}
      <div className="relative h-64 sm:h-80 bg-gradient-to-br from-[#00d4b4]/30 via-[#6366f1]/20 to-[#0d0f14] overflow-hidden">
        {profile.coverPhoto && (
          <img src={profile.coverPhoto} alt="" className="w-full h-full object-cover" />
        )}
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#00d4b4 1px, transparent 1px), linear-gradient(90deg, #00d4b4 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
          }}
        />
        {isOwner && (
          <label className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-[#13161e]/90 backdrop-blur-sm text-[#e8eaf0] text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer hover:bg-[#181c26] transition-colors border border-[#2e3347]">
            <Camera size={13} /> Edit Cover
            <input type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && changePhoto('coverPhoto', e.target.files[0])} />
          </label>
        )}
      </div>

      {/* Profile header */}
      <div className="bg-[#13161e] border border-[#232736] border-t-0 px-4 sm:px-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          {/* Avatar */}
          <div className="flex items-end gap-4 -mt-14 sm:-mt-16">
            <div className="relative shrink-0">
              <img
                src={getAvatar(profile, 256)}
                alt=""
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover border-4 border-[#13161e] shadow-2xl"
              />
              {isOwner && (
                <label className="absolute bottom-2 right-2 w-8 h-8 bg-[#13161e] border border-[#2e3347] rounded-xl flex items-center justify-center cursor-pointer hover:bg-[#232736] transition-colors">
                  <Camera size={14} className="text-[#9ca3af]" />
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && changePhoto('avatar', e.target.files[0])} />
                </label>
              )}
            </div>
            <div className="pb-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#f4f6fc] font-[var(--font-display)] tracking-tight">
                {profile.firstName} {profile.lastName}
              </h1>
              <p className="text-[#6b7280] text-sm mt-0.5">{friends.length} friends</p>
              {/* Friend avatars */}
              <div className="flex mt-1.5">
                {friends.slice(0, 5).map((f, i) => (
                  <img
                    key={i}
                    src={getAvatar(f as User, 40)}
                    alt=""
                    className={cx('w-6 h-6 rounded-full border-2 border-[#13161e] object-cover', i > 0 && '-ml-1.5')}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pb-2 flex-wrap">
            {isOwner ? (
              <Button variant="secondary" icon={<Edit3 size={14} />} onClick={() => setEditing(v => !v)}>
                Edit Profile
              </Button>
            ) : isFriend ? (
              <>
                <Button variant="secondary" icon={<UserMinus size={14} />} onClick={unfriend}>
                  Unfriend
                </Button>
                <Button variant="primary" icon={<MessageCircle size={14} />} onClick={() => nav('/messages')}>
                  Message
                </Button>
              </>
            ) : recvdReq ? (
              <>
                <Button variant="primary" icon={<UserCheck size={14} />} onClick={() => respondReq('accept')}>
                  Confirm
                </Button>
                <Button variant="secondary" onClick={() => respondReq('decline')}>Delete</Button>
              </>
            ) : sentReq ? (
              <Button variant="secondary" icon={<UserCheck size={14} />} disabled>Request Sent</Button>
            ) : (
              <>
                <Button variant="primary" icon={<UserPlus size={14} />} onClick={sendFriendReq}>
                  Add Friend
                </Button>
                <Button variant="secondary" icon={<MessageCircle size={14} />} onClick={() => nav('/messages')}>
                  Message
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Bio preview */}
        {profile.bio && !editing && (
          <p className="text-[#9ca3af] text-sm mt-3 border-t border-[#232736] pt-3">{profile.bio}</p>
        )}

        {/* Tabs */}
        <div className="flex gap-0 mt-3 border-t border-[#232736] -mx-4 sm:-mx-6 px-4 sm:px-6 pt-1">
          {(['posts', 'about', 'friends', 'photos'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cx(
                'px-4 py-2 text-sm font-semibold capitalize transition-all',
                tab === t
                  ? 'text-[#00d4b4] border-b-2 border-[#00d4b4]'
                  : 'text-[#6b7280] hover:text-[#e8eaf0] hover:bg-[#181c26] rounded-xl'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Edit form */}
      {editing && isOwner && (
        <Card className="p-5 mt-4 mx-2 sm:mx-0">
          <h3 className="font-bold text-[#f4f6fc] mb-4 font-[var(--font-display)]">Edit Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="First Name" value={editData.firstName} onChange={e => setEditData(d => ({ ...d, firstName: e.target.value }))} />
            <Input label="Last Name"  value={editData.lastName}  onChange={e => setEditData(d => ({ ...d, lastName: e.target.value }))} />
          </div>
          <div className="mt-3">
            <Textarea label="Bio" rows={3} value={editData.bio} placeholder="Tell people about yourself…"
              onChange={e => setEditData(d => ({ ...d, bio: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <Input label="Location"   value={editData.location}   placeholder="City, Country" onChange={e => setEditData(d => ({ ...d, location: e.target.value }))} />
            <Input label="Website"    value={editData.website}    placeholder="https://…"     onChange={e => setEditData(d => ({ ...d, website: e.target.value }))} />
            <Input label="Occupation" value={editData.occupation} placeholder="Job title / Company" onChange={e => setEditData(d => ({ ...d, occupation: e.target.value }))} />
            <Input label="Education"  value={editData.education}  placeholder="School / University"  onChange={e => setEditData(d => ({ ...d, education: e.target.value }))} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="primary" loading={saving} onClick={saveProfile}>Save Changes</Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Tab content */}
      <div className="mt-4 px-0 sm:px-0">

        {/* Posts tab */}
        {tab === 'posts' && (
          <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-4 px-2 sm:px-0">
            {/* Sidebar — intro + photos */}
            <div className="space-y-3">
              <Card className="p-4">
                <h3 className="font-bold text-[#f4f6fc] mb-3 font-[var(--font-display)]">Intro</h3>
                <div className="space-y-2.5">
                  {aboutItems.filter(a => a.val).map(({ icon: Icon, label, val, link }) => (
                    <div key={label} className="flex items-center gap-2.5 text-sm">
                      <span className="w-7 h-7 bg-[#232736] rounded-lg flex items-center justify-center shrink-0">
                        <Icon size={13} className="text-[#9ca3af]" />
                      </span>
                      <span className="text-[#9ca3af]">{label}</span>
                      {link
                        ? <a href={val} target="_blank" rel="noreferrer" className="text-[#00d4b4] hover:underline truncate">{val}</a>
                        : <strong className="text-[#e8eaf0]">{val}</strong>
                      }
                    </div>
                  ))}
                </div>
              </Card>

              {photos.length > 0 && (
                <Card className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-[#f4f6fc] font-[var(--font-display)]">Photos</h3>
                    <button onClick={() => setTab('photos')} className="text-xs text-[#00d4b4] hover:text-[#00b89c]">See all</button>
                  </div>
                  <div className="grid grid-cols-3 gap-0.5 rounded-xl overflow-hidden">
                    {photos.slice(0, 9).map((url, i) => (
                      <img key={i} src={url} alt="" className="aspect-square object-cover hover:opacity-80 cursor-pointer transition-opacity" />
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Posts */}
            <div>
              {isOwner && <CreatePost onCreated={p => setPosts(prev => [p, ...prev])} />}
              {posts.length === 0
                ? <EmptyState icon={<span className="text-2xl">✍️</span>} title="No posts yet" />
                : posts.map(p => (
                  <PostCard key={p._id} post={p} onDelete={id => setPosts(prev => prev.filter(x => x._id !== id))} />
                ))
              }
            </div>
          </div>
        )}

        {/* About tab */}
        {tab === 'about' && (
          <Card className="p-6 mx-2 sm:mx-0">
            <h3 className="font-bold text-[#f4f6fc] text-lg mb-5 font-[var(--font-display)]">About {profile.firstName}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {aboutItems.filter(a => a.val).map(({ icon: Icon, label, val, link }) => (
                <div key={label} className="flex items-center gap-3 p-3.5 bg-[#13161e] border border-[#232736] rounded-xl">
                  <span className="w-9 h-9 bg-[rgba(0,212,180,0.1)] rounded-xl flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-[#00d4b4]" />
                  </span>
                  <div>
                    <p className="text-[10px] text-[#6b7280] font-bold uppercase tracking-wider">{label}</p>
                    {link
                      ? <a href={val} target="_blank" rel="noreferrer" className="text-[#00d4b4] hover:underline text-sm">{val}</a>
                      : <p className="text-[#e8eaf0] font-semibold text-sm">{val}</p>
                    }
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Friends tab */}
        {tab === 'friends' && (
          <Card className="p-5 mx-2 sm:mx-0">
            <h3 className="font-bold text-[#f4f6fc] mb-4 font-[var(--font-display)]">
              Friends · <span className="text-[#00d4b4]">{friends.length}</span>
            </h3>
            {friends.length === 0 ? (
              <EmptyState icon={<span className="text-2xl">👥</span>} title="No friends yet" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {friends.map(f => (
                  <div
                    key={(f as User)._id}
                    onClick={() => nav(`/profile/${(f as User)._id}`)}
                    className="cursor-pointer group"
                  >
                    <img
                      src={getAvatar(f as User, 200)}
                      alt=""
                      className="w-full aspect-square object-cover rounded-xl group-hover:opacity-80 transition-opacity"
                    />
                    <p className="mt-1.5 text-sm font-semibold text-[#e8eaf0] truncate text-center group-hover:text-[#00d4b4] transition-colors">
                      {(f as User).firstName} {(f as User).lastName}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Photos tab */}
        {tab === 'photos' && (
          <Card className="p-5 mx-2 sm:mx-0">
            <h3 className="font-bold text-[#f4f6fc] mb-4 font-[var(--font-display)]">
              Photos · <span className="text-[#00d4b4]">{photos.length}</span>
            </h3>
            {photos.length === 0 ? (
              <EmptyState icon={<span className="text-2xl">📸</span>} title="No photos yet" />
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                {photos.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="aspect-square object-cover rounded-xl hover:opacity-80 cursor-pointer transition-opacity"
                  />
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
