
import React from 'react';

const StoryItem: React.FC<{ username: string; avatar: string }> = ({ username, avatar }) => (
  <div className="story-item">
    <div className="story-item__ring">
      <div className="story-item__inner">
        <img src={avatar} alt={username} className="story-item__img" />
      </div>
    </div>
    <span className="story-item__username">{username}</span>
  </div>
);

const Stories: React.FC = () => {
  const dummyStories = Array.from({ length: 15 }).map((_, i) => ({
    username: `user_${i + 1}`,
    avatar: `https://picsum.photos/seed/story-${i}/150/150`,
  }));

  return (
    <div className="story-tray no-scrollbar">
      {dummyStories.map((story) => (
        <StoryItem key={story.username} {...story} />
      ))}
    </div>
  );
};

export default Stories;
