import React, { useState, useRef } from 'react';
import { ImageIcon, Smile, Globe, Users, Lock, X, Send, Paperclip } from 'lucide-react';
import { useAuth } from '../../store/authStore';
import { Avatar, Button, Card } from '../ui';
import { cx } from '../../utils/helpers';
import api from '../../utils/api';
import { Post } from '../../types';
import toast from 'react-hot-toast';

interface Props { onCreated: (p: Post) => void; groupId?: string; }

export default function CreatePost({ onCreated, groupId }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef   = useRef<HTMLTextAreaElement>(null);

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sel = Array.from(e.target.files || []);
    setFiles(p => [...p, ...sel]);
    sel.forEach(f => {
      const r = new FileReader();
      r.onload = ev => setPreviews(p => [...p, ev.target?.result as string]);
      r.readAsDataURL(f);
    });
  };

  const removeFile = (i: number) => {
    setFiles(p => p.filter((_, j) => j !== i));
    setPreviews(p => p.filter((_, j) => j !== i));
  };

  const submit = async () => {
    if (!content.trim() && !files.length) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('content', content);
      fd.append('privacy', privacy);
      if (groupId) fd.append('groupId', groupId);
      files.forEach(f => fd.append('media', f));
      const r = await api.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onCreated(r.data.post);
      setContent(''); setFiles([]); setPreviews([]); setOpen(false);
      toast.success('Post shared!');
    } catch { toast.error('Failed to post'); }
    finally { setLoading(false); }
  };

  const privacyOptions = [
    { v: 'public'  as const, icon: Globe,  label: 'Public'   },
    { v: 'friends' as const, icon: Users,  label: 'Friends'  },
    { v: 'private' as const, icon: Lock,   label: 'Only Me'  },
  ];
  const PrivIcon = privacyOptions.find(p => p.v === privacy)!.icon;

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center gap-3">
        <Avatar user={user} size={40} />
        <button
          onClick={() => { setOpen(true); setTimeout(() => taRef.current?.focus(), 50); }}
          className="flex-1 text-left bg-[#13161e] border border-[#232736] hover:border-[#2e3347] rounded-xl px-4 py-2.5 text-sm text-[#6b7280] transition-all"
        >
          What's on your mind, {user?.firstName}?
        </button>
      </div>

      {open && (
        <div className="mt-4">
          <textarea
            ref={taRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={`What's on your mind, ${user?.firstName}?`}
            rows={3}
            className="w-full bg-transparent border-none outline-none text-[#e8eaf0] placeholder-[#6b7280] text-base resize-none leading-relaxed"
          />

          {/* Media previews */}
          {previews.length > 0 && (
            <div className={cx('mt-3 rounded-xl overflow-hidden', previews.length > 1 ? 'grid grid-cols-2 gap-0.5' : '')}>
              {previews.map((p, i) => (
                <div key={i} className="relative group">
                  {files[i].type.startsWith('video/')
                    ? <video src={p} className="w-full h-52 object-cover" />
                    : <img src={p} alt="" className="w-full h-52 object-cover" />
                  }
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Bottom bar */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#232736]">
            <div className="flex items-center gap-1">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[#00d4b4] hover:bg-[rgba(0,212,180,0.08)] transition-colors"
              >
                <ImageIcon size={15} /> Photo
              </button>
              <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={addFiles} className="hidden" />

              {/* Privacy select */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[#9ca3af]">
                <PrivIcon size={13} />
                <select
                  value={privacy}
                  onChange={e => setPrivacy(e.target.value as typeof privacy)}
                  className="bg-transparent border-none outline-none text-sm text-[#9ca3af] cursor-pointer"
                >
                  {privacyOptions.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost" size="sm"
                onClick={() => { setOpen(false); setContent(''); setFiles([]); setPreviews([]); }}
              >
                Cancel
              </Button>
              <Button
                variant="primary" size="sm"
                loading={loading}
                disabled={!content.trim() && !files.length}
                onClick={submit}
                icon={<Send size={13} />}
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed action bar */}
      {!open && (
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-[#232736]">
          <button
            onClick={() => { setOpen(true); setTimeout(() => fileRef.current?.click(), 100); }}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium text-[#00d4b4] hover:bg-[rgba(0,212,180,0.06)] transition-colors"
          >
            <ImageIcon size={16} /> Photo / Video
          </button>
          <button
            onClick={() => setOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium text-[#f59e0b] hover:bg-[rgba(245,158,11,0.06)] transition-colors"
          >
            <Smile size={16} /> Feeling
          </button>
          <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={addFiles} className="hidden" />
        </div>
      )}
    </Card>
  );
}
