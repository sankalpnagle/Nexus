import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ThumbsUp, MessageCircle, Share2, MoreHorizontal, Trash2,
  Globe, Users, Lock, Send, ChevronDown,
} from 'lucide-react';
import { Post, User } from '../../types';
import { useAuth } from '../../store/authStore';
import { Avatar, Card } from '../ui';
import { cx, getAvatar, timeAgo } from '../../utils/helpers';
import api from '../../utils/api';
import toast from 'react-hot-toast';

interface Props { post: Post; onDelete?: (id: string) => void; }

export default function PostCard({ post, onDelete }: Props) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [liked, setLiked] = useState(post.likes.includes(user?._id || ''));
  const [likesCount, setLikesCount] = useState(post.likes.length);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(post.comments);
  const [showMenu, setShowMenu] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const isOwner = post.author._id === user?._id;

  const PrivIcon = post.privacy === 'public' ? Globe : post.privacy === 'friends' ? Users : Lock;

  const handleLike = async () => {
    try {
      const r = await api.post(`/posts/${post._id}/like`);
      setLiked(r.data.liked);
      setLikesCount(r.data.likes.length);
    } catch { toast.error('Failed'); }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const r = await api.post(`/posts/${post._id}/comment`, { content: commentText });
      setComments(r.data.post.comments);
      setCommentText('');
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/posts/${post._id}`);
      onDelete?.(post._id);
      toast.success('Post deleted');
    } catch { toast.error('Failed'); }
  };

  const handleShare = async () => {
    try { await api.post(`/posts/${post._id}/share`, {}); toast.success('Shared!'); }
    catch { toast.error('Failed'); }
  };

  const visible = showAll ? comments : comments.slice(-2);

  return (
    <Card className="mb-4 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => nav(`/profile/${post.author._id}`)}
        >
          <Avatar user={post.author} size={42} />
          <div>
            <p className="text-sm font-bold text-[#f4f6fc] group-hover:text-[#00d4b4] transition-colors font-[var(--font-display)]">
              {post.author.firstName} {post.author.lastName}
            </p>
            <div className="flex items-center gap-1.5 text-[#6b7280] text-xs">
              <span>{timeAgo(post.createdAt)}</span>
              <span>·</span>
              <PrivIcon size={10} />
            </div>
          </div>
        </div>
        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(v => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#232736] text-[#6b7280] hover:text-[#e8eaf0] transition-colors"
            >
              <MoreHorizontal size={17} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-[#13161e] border border-[#2e3347] rounded-xl shadow-2xl z-10 py-1 min-w-[140px] animate-fade-in">
                <button
                  onClick={() => { handleDelete(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#f43f5e] hover:bg-[#1e2230] transition-colors"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <p className="px-4 pb-3 text-[#e8eaf0] leading-relaxed text-[15px]">{post.content}</p>
      )}

      {/* Shared post */}
      {post.sharedFrom && (
        <div className="mx-4 mb-3 border border-[#2e3347] rounded-xl p-3 bg-[#13161e]">
          <div className="flex items-center gap-2 mb-1.5">
            <img
              src={getAvatar((post.sharedFrom as Post).author, 40)}
              alt="" className="w-6 h-6 rounded-full object-cover"
            />
            <p className="text-xs font-semibold text-[#9ca3af]">
              {(post.sharedFrom as Post).author?.firstName} {(post.sharedFrom as Post).author?.lastName}
            </p>
          </div>
          <p className="text-sm text-[#9ca3af]">{(post.sharedFrom as Post).content}</p>
        </div>
      )}

      {/* Media */}
      {post.media.length > 0 && (
        <div className="relative overflow-hidden">
          {post.media.length === 1 ? (
            post.media[0].type === 'image'
              ? <img src={post.media[0].url} alt="" className="w-full max-h-[520px] object-cover" />
              : <video src={post.media[0].url} controls className="w-full max-h-[520px]" />
          ) : (
            <div className={cx('gap-0.5', post.media.length >= 2 ? 'grid grid-cols-2' : '')}>
              {post.media.slice(0, 4).map((m, i) => (
                <div key={i} className="relative overflow-hidden">
                  <img
                    src={m.url} alt=""
                    className="w-full h-56 object-cover hover:scale-[1.02] transition-transform cursor-pointer"
                    onClick={() => setActiveImg(i)}
                  />
                  {i === 3 && post.media.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold font-[var(--font-display)]">+{post.media.length - 4}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {post.media.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              {post.media.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={cx('w-1.5 h-1.5 rounded-full transition-all', i === activeImg ? 'bg-[#00d4b4] w-4' : 'bg-white/50')}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats bar */}
      {(likesCount > 0 || comments.length > 0) && (
        <div className="flex items-center justify-between px-4 py-2 text-xs text-[#6b7280]">
          {likesCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-4.5 h-4.5 rounded-full bg-[#00d4b4] inline-flex items-center justify-center text-[#0d0f14] text-[9px] font-bold">👍</span>
              {' '}{likesCount}
            </span>
          )}
          {comments.length > 0 && (
            <button onClick={() => setShowComments(v => !v)} className="hover:text-[#00d4b4] transition-colors">
              {comments.length} comment{comments.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center border-t border-[#232736] mx-3">
        {[
          { icon: ThumbsUp, label: 'Like', action: handleLike, active: liked },
          { icon: MessageCircle, label: 'Comment', action: () => setShowComments(v => !v), active: showComments },
          { icon: Share2, label: 'Share', action: handleShare, active: false },
        ].map(({ icon: Icon, label, action, active }) => (
          <button
            key={label}
            onClick={action}
            className={cx(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-xl m-0.5 transition-all',
              active ? 'text-[#00d4b4] bg-[rgba(0,212,180,0.08)]' : 'text-[#6b7280] hover:bg-[#232736] hover:text-[#e8eaf0]'
            )}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Comments */}
      {showComments && (
        <div className="px-4 pb-4 pt-1">
          {comments.length > 2 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="flex items-center gap-1 text-xs font-semibold text-[#6b7280] hover:text-[#00d4b4] mb-3 transition-colors"
            >
              <ChevronDown size={13} /> View {comments.length - 2} more
            </button>
          )}
          <div className="space-y-2.5 mb-3">
            {visible.map(c => (
              <div key={c._id} className="flex gap-2.5">
                <img
                  src={getAvatar(c.author as User, 56)}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                />
                <div className="bg-[#13161e] border border-[#232736] rounded-xl px-3 py-2 flex-1">
                  <p className="text-xs font-bold text-[#00d4b4]">
                    {(c.author as User).firstName} {(c.author as User).lastName}
                  </p>
                  <p className="text-sm text-[#e8eaf0] mt-0.5">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Comment input */}
          <form onSubmit={handleComment} className="flex items-center gap-2">
            <img
              src={getAvatar(user, 56)}
              alt=""
              className="w-7 h-7 rounded-full object-cover shrink-0"
            />
            <div className="flex-1 flex items-center bg-[#13161e] border border-[#232736] focus-within:border-[#00d4b4] rounded-full px-3.5 py-2 gap-2 transition-all">
              <input
                type="text"
                placeholder="Write a comment…"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm text-[#e8eaf0] placeholder-[#6b7280]"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className={cx('transition-colors', commentText.trim() ? 'text-[#00d4b4] hover:text-[#00b89c]' : 'text-[#6b7280]')}
              >
                <Send size={15} />
              </button>
            </div>
          </form>
        </div>
      )}
    </Card>
  );
}
