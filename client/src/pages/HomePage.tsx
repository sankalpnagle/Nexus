import React, { useState, useEffect, useCallback } from 'react';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import CreatePost from '../components/feed/CreatePost';
import PostCard from '../components/feed/PostCard';
import { Button, EmptyState, Spinner } from '../components/ui';
import { Post } from '../types';
import api from '../utils/api';
import { Newspaper } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchFeed = useCallback(async (pg: number) => {
    if (pg === 1) setLoading(true); else setLoadingMore(true);
    try {
      const r = await api.get(`/posts/feed?page=${pg}&limit=10`);
      setPosts(p => pg === 1 ? r.data.posts : [...p, ...r.data.posts]);
      setHasMore(pg < r.data.pages);
    } catch { toast.error('Failed to load feed'); }
    finally { setLoading(false); setLoadingMore(false); }
  }, []);

  useEffect(() => { fetchFeed(1); }, [fetchFeed]);

  return (
    <div className="flex max-w-[1240px] mx-auto px-2 gap-0">
      <LeftSidebar />

      {/* Feed */}
      <main className="flex-1 min-w-0 px-3 py-5 max-w-[620px] mx-auto lg:mx-0">
        <CreatePost onCreated={p => setPosts(prev => [p, ...prev])} />

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size={36} />
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<Newspaper size={28} />}
            title="Your feed is empty"
            subtitle="Add some friends or join groups to see posts here"
          />
        ) : (
          <>
            {posts.map(p => (
              <PostCard
                key={p._id}
                post={p}
                onDelete={id => setPosts(prev => prev.filter(x => x._id !== id))}
              />
            ))}
            {hasMore && (
              <div className="flex justify-center pb-6">
                <Button
                  variant="outline"
                  loading={loadingMore}
                  onClick={() => { const n = page + 1; setPage(n); fetchFeed(n); }}
                >
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <RightSidebar />
    </div>
  );
}
