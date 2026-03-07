import React, { useState, useEffect, useRef } from 'react';
import {
  Send, ImageIcon, Users, X, Search, Phone, Video, Info,
  ChevronLeft, Plus, Smile,
} from 'lucide-react';
import { useAuth } from '../store/authStore';
import { useSocket } from '../store/socketStore';
import api from '../utils/api';
import { Conversation, Message, User } from '../types';
import { Avatar, Button, Input, Modal, Spinner } from '../components/ui';
import { cx, getAvatar, timeAgo } from '../utils/helpers';
import { format, isToday, isYesterday } from 'date-fns';
import toast from 'react-hot-toast';

const fmtTime = (d: string) => {
  const date = new Date(d);
  if (isToday(date))     return format(date, 'HH:mm');
  if (isYesterday(date)) return `Yesterday ${format(date, 'HH:mm')}`;
  return format(date, 'MMM d');
};

export default function MessagesPage() {
  const { user: me } = useAuth();
  const { socket, online } = useSocket();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [friends, setFriends] = useState<User[]>([]);
  const [showGroup, setShowGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState<'list' | 'chat'>('list');
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { fetchConvs(); fetchFriends(); }, []);

  useEffect(() => {
    if (!selected) return;
    socket?.emit('conversation:join', selected._id);
    fetchMsgs(selected._id);
    return () => { socket?.emit('conversation:leave', selected._id); };
  }, [selected?._id, socket]);

  useEffect(() => {
    const handleMsg = (m: Message) => { setMsgs(p => [...p, m]); fetchConvs(); };
    const handleTypingStart = (d: { userId: string; name: string }) => {
      if (d.userId !== me?._id) setTypingUser(d.name);
    };
    const handleTypingStop = () => setTypingUser(null);
    socket?.on('message:receive', handleMsg);
    socket?.on('typing:start', handleTypingStart);
    socket?.on('typing:stop', handleTypingStop);
    return () => {
      socket?.off('message:receive', handleMsg);
      socket?.off('typing:start', handleTypingStart);
      socket?.off('typing:stop', handleTypingStop);
    };
  }, [socket, me?._id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, typingUser]);

  const fetchConvs    = async () => { try { const r = await api.get('/conversations'); setConvs(r.data.conversations); } catch {} finally { setLoading(false); } };
  const fetchFriends  = async () => { try { const r = await api.get('/auth/me'); setFriends(r.data.user.friends || []); } catch {} };
  const fetchMsgs     = async (id: string) => { try { const r = await api.get(`/conversations/${id}/messages`); setMsgs(r.data.messages); } catch {} };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !selected) return;
    try {
      const r = await api.post(`/conversations/${selected._id}/messages`, { content: text });
      setMsgs(p => [...p, r.data.message]);
      socket?.emit('message:send', { conversationId: selected._id, message: r.data.message });
      setText(''); fetchConvs();
    } catch { toast.error('Failed to send'); }
  };

  const handleType = () => {
    if (!selected) return;
    socket?.emit('typing:start', { conversationId: selected._id, userId: me?._id, name: me?.firstName });
    clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => socket?.emit('typing:stop', { conversationId: selected._id }), 2000);
  };

  const startDM = async (uid: string) => {
    try {
      const r = await api.get(`/conversations/dm/${uid}`);
      if (!convs.find(c => c._id === r.data.conversation._id))
        setConvs(p => [r.data.conversation, ...p]);
      setSelected(r.data.conversation);
      setSearchQ('');
      setShowPanel('chat');
    } catch { toast.error('Failed'); }
  };

  const createGroup = async () => {
    if (!groupName.trim() || !picked.length) return;
    try {
      const r = await api.post('/conversations/group', { name: groupName, participants: picked });
      setConvs(p => [r.data.conversation, ...p]);
      setSelected(r.data.conversation);
      setShowGroup(false); setGroupName(''); setPicked([]);
      setShowPanel('chat');
      toast.success('Group created!');
    } catch { toast.error('Failed'); }
  };

  const convName = (c: Conversation) =>
    c.isGroup
      ? (c.groupName || 'Group')
      : c.participants.find(p => p._id !== me?._id)
        ? `${c.participants.find(p => p._id !== me?._id)!.firstName} ${c.participants.find(p => p._id !== me?._id)!.lastName}`
        : 'Conversation';

  const otherUser = (c: Conversation) => c.participants.find(p => p._id !== me?._id);
  const isOnlineConv = (c: Conversation) => {
    const o = otherUser(c);
    return o ? (online[o._id] || o.isOnline) : false;
  };

  const filteredConvs = convs.filter(c => convName(c).toLowerCase().includes(searchQ.toLowerCase()));
  const filteredFriends = friends.filter(f =>
    `${(f as User).firstName} ${(f as User).lastName}`.toLowerCase().includes(searchQ.toLowerCase())
  );

  const selectConv = (c: Conversation) => { setSelected(c); setShowPanel('chat'); };

  return (
    <div className="flex h-[calc(100vh-56px)] max-w-[1100px] mx-auto border-x border-[#232736]">

      {/* Conversation list */}
      <div className={cx(
        'w-full md:w-80 flex flex-col border-r border-[#232736] bg-[#13161e] shrink-0',
        'md:flex', showPanel === 'chat' ? 'hidden' : 'flex'
      )}>
        <div className="p-4 border-b border-[#232736]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black text-[#f4f6fc] font-[var(--font-display)]">Messages</h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="xs" icon={<Users size={14} />} onClick={() => setShowGroup(true)}>
                Group
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
            <input
              type="text"
              placeholder="Search messages…"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-[#181c26] border border-[#232736] rounded-xl text-sm text-[#e8eaf0] placeholder-[#6b7280] focus:outline-none focus:border-[#00d4b4] transition-colors"
            />
          </div>
        </div>

        {/* People results when searching */}
        {searchQ && filteredFriends.length > 0 && (
          <div className="border-b border-[#232736]">
            <p className="px-4 py-1.5 text-[9px] font-bold text-[#6b7280] uppercase tracking-widest">People</p>
            {filteredFriends.slice(0, 4).map(f => (
              <div
                key={(f as User)._id}
                onClick={() => startDM((f as User)._id)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#181c26] cursor-pointer transition-colors"
              >
                <Avatar user={f as User} size={38} online={online[(f as User)._id] || (f as User).isOnline} />
                <p className="text-sm font-semibold text-[#e8eaf0]">{(f as User).firstName} {(f as User).lastName}</p>
              </div>
            ))}
          </div>
        )}

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : filteredConvs.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-sm text-[#6b7280]">No conversations yet</p>
              <p className="text-xs text-[#6b7280] mt-1">Search for a friend to start chatting</p>
            </div>
          ) : filteredConvs.map(c => (
            <div
              key={c._id}
              onClick={() => selectConv(c)}
              className={cx(
                'flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors border-b border-[#1a1d27]',
                selected?._id === c._id ? 'bg-[rgba(0,212,180,0.06)]' : 'hover:bg-[#181c26]'
              )}
            >
              <div className="relative shrink-0">
                {c.isGroup ? (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    {c.groupName?.[0] || 'G'}
                  </div>
                ) : (
                  <Avatar user={otherUser(c)} size={48} online={isOnlineConv(c)} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm text-[#f4f6fc] truncate font-[var(--font-display)]">{convName(c)}</p>
                  {c.lastMessage && (
                    <span className="text-[10px] text-[#6b7280] shrink-0 ml-1">{timeAgo(c.lastMessage.createdAt)}</span>
                  )}
                </div>
                {c.lastMessage && (
                  <p className="text-xs text-[#6b7280] truncate mt-0.5">
                    {(c.lastMessage as Message).content || '📎 Media'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className={cx(
        'flex-1 flex flex-col min-w-0',
        'md:flex', showPanel === 'list' ? 'hidden' : 'flex'
      )}>
        {selected ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#232736] bg-[#13161e] shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPanel('list')}
                  className="md:hidden text-[#6b7280] hover:text-[#e8eaf0] transition-colors mr-1"
                >
                  <ChevronLeft size={20} />
                </button>
                {selected.isGroup ? (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {selected.groupName?.[0] || 'G'}
                  </div>
                ) : (
                  <Avatar user={otherUser(selected)} size={36} online={isOnlineConv(selected)} />
                )}
                <div>
                  <p className="font-bold text-[#f4f6fc] text-sm font-[var(--font-display)]">{convName(selected)}</p>
                  <p className="text-xs text-[#6b7280]">
                    {isOnlineConv(selected) ? (
                      <span className="text-emerald-400">● Active now</span>
                    ) : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button className="w-8 h-8 flex items-center justify-center rounded-xl text-[#6b7280] hover:bg-[#232736] hover:text-[#e8eaf0] transition-colors"><Phone size={15} /></button>
                <button className="w-8 h-8 flex items-center justify-center rounded-xl text-[#6b7280] hover:bg-[#232736] hover:text-[#e8eaf0] transition-colors"><Video size={15} /></button>
                <button className="w-8 h-8 flex items-center justify-center rounded-xl text-[#6b7280] hover:bg-[#232736] hover:text-[#e8eaf0] transition-colors"><Info size={15} /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {msgs.map((m, i) => {
                const isMe = m.sender._id === me?._id;
                const prevMsg = msgs[i - 1];
                const sameAuthor = prevMsg?.sender._id === m.sender._id;
                const showTime = !prevMsg || new Date(m.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 5 * 60000;

                return (
                  <div key={m._id}>
                    {showTime && (
                      <p className="text-center text-[10px] text-[#6b7280] my-3">{fmtTime(m.createdAt)}</p>
                    )}
                    <div className={cx('flex items-end gap-2', isMe ? 'justify-end' : 'justify-start')}>
                      {!isMe && (
                        <img
                          src={getAvatar(m.sender, 48)}
                          alt=""
                          className={cx('w-7 h-7 rounded-full object-cover shrink-0 mb-0.5', sameAuthor && 'opacity-0')}
                        />
                      )}
                      <div className={cx('flex flex-col gap-0.5 max-w-[65%]', isMe ? 'items-end' : 'items-start')}>
                        {!isMe && !sameAuthor && (
                          <p className="text-[10px] text-[#6b7280] px-1">{m.sender.firstName}</p>
                        )}
                        {m.media && (
                          <img src={m.media.url} alt="" className={cx('rounded-2xl max-w-[220px]', isMe ? 'rounded-br-sm' : 'rounded-bl-sm')} />
                        )}
                        {m.content && (
                          <div className={cx(
                            'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                            isMe
                              ? 'bg-[#00d4b4] text-[#0d0f14] rounded-br-sm font-medium'
                              : 'bg-[#232736] text-[#e8eaf0] rounded-bl-sm'
                          )}>
                            {m.content}
                          </div>
                        )}
                        {i === msgs.length - 1 && isMe && (
                          <span className="text-[10px] text-[#6b7280] px-1">
                            {format(new Date(m.createdAt), 'HH:mm')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {typingUser && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="bg-[#232736] rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-[#6b7280]"
                        style={{ animation: `dot-bounce 1.2s ${i * 0.2}s infinite ease-in-out` }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-[#6b7280]">{typingUser} is typing…</span>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Message input */}
            <div className="px-4 py-3 border-t border-[#232736] bg-[#13161e] shrink-0">
              <form onSubmit={send} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-[#6b7280] hover:bg-[#232736] hover:text-[#00d4b4] transition-colors shrink-0"
                >
                  <ImageIcon size={18} />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={async e => {
                    const f = e.target.files?.[0];
                    if (!f || !selected) return;
                    const fd = new FormData(); fd.append('media', f);
                    try {
                      const r = await api.post(`/conversations/${selected._id}/messages`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                      setMsgs(p => [...p, r.data.message]);
                      socket?.emit('message:send', { conversationId: selected._id, message: r.data.message });
                    } catch { toast.error('Failed to send'); }
                  }}
                />
                <div className="flex-1 flex items-center bg-[#181c26] border border-[#232736] focus-within:border-[#00d4b4] rounded-2xl px-4 gap-2 transition-all">
                  <input
                    type="text"
                    placeholder="Type a message…"
                    value={text}
                    onChange={e => { setText(e.target.value); handleType(); }}
                    className="flex-1 bg-transparent border-none outline-none py-2.5 text-sm text-[#e8eaf0] placeholder-[#6b7280]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className={cx(
                    'w-9 h-9 flex items-center justify-center rounded-xl shrink-0 transition-all',
                    text.trim()
                      ? 'bg-[#00d4b4] text-[#0d0f14] shadow-[0_0_16px_rgba(0,212,180,0.3)] hover:bg-[#00b89c]'
                      : 'bg-[#232736] text-[#6b7280]'
                  )}
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
            <div className="w-20 h-20 rounded-2xl bg-[rgba(0,212,180,0.1)] flex items-center justify-center">
              <Send size={36} className="text-[#00d4b4]" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#f4f6fc] font-[var(--font-display)]">Your Messages</p>
              <p className="text-sm text-[#6b7280] mt-1">Select a conversation or start a new one</p>
            </div>
            <Button
              variant="primary"
              icon={<Plus size={15} />}
              onClick={() => setShowPanel('list')}
              className="md:hidden"
            >
              New Message
            </Button>
          </div>
        )}
      </div>

      {/* Create group modal */}
      <Modal open={showGroup} onClose={() => setShowGroup(false)} title="New Group Chat" maxWidth="max-w-md">
        <div className="p-5 space-y-4">
          <Input
            label="Group name"
            placeholder="e.g. Weekend Plans"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
          />
          <div>
            <p className="text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-2">Add Participants</p>
            <div className="space-y-1 max-h-56 overflow-y-auto">
              {friends.map(f => (
                <label
                  key={(f as User)._id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#181c26] cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={picked.includes((f as User)._id)}
                    onChange={e => setPicked(p =>
                      e.target.checked ? [...p, (f as User)._id] : p.filter(id => id !== (f as User)._id)
                    )}
                    className="w-4 h-4 rounded accent-[#00d4b4]"
                  />
                  <Avatar user={f as User} size={34} />
                  <p className="text-sm font-medium text-[#e8eaf0]">{(f as User).firstName} {(f as User).lastName}</p>
                </label>
              ))}
            </div>
          </div>
          <Button
            variant="primary"
            fullWidth
            disabled={!groupName.trim() || !picked.length}
            onClick={createGroup}
          >
            Create Group ({picked.length} members)
          </Button>
        </div>
      </Modal>
    </div>
  );
}
