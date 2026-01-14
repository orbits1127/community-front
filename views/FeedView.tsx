
import React, { useEffect, useState } from 'react';
import Stories from '../components/Stories';
import Post from '../components/Post';
import Suggestions from '../components/Suggestions';
import { generatePosts } from '../services/geminiService';
import { Post as PostType } from '../types';

const FeedView: React.FC<{ onOpenComments: (post: PostType) => void }> = ({ onOpenComments }) => {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      const generated = await generatePosts(5);
      setPosts(generated);
      setLoading(false);
    };
    loadContent();
  }, []);

  return (
    <div className="feed-container">
      {/* Left Column: Feed Content (Always 470px on desktop) */}
      <div className="feed-main">
        <Stories />
        <div className="feed-list">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--ig-secondary-text)' }}>
              Loading your feed...
            </div>
          ) : (
            posts.map(post => <Post key={post.id} post={post} />)
          )}
        </div>
      </div>

      {/* Right Column: Home Sidebar (Visible > 1160px) */}
      <aside className="feed-sidebar">
        <Suggestions />
      </aside>
    </div>
  );
};

export default FeedView;
