
import React from 'react';

const FooterLink: React.FC<{ label: string; isLast?: boolean }> = ({ label, isLast }) => (
  <React.Fragment>
    <span className="h-sidebar__link">{label}</span>
    {!isLast && <span className="h-sidebar__dot">•</span>}
  </React.Fragment>
);

const Suggestions: React.FC = () => {
  const suggestions = [
    { username: 'pixel_master', reason: 'Followed by art_daily + 5 more', avatar: 'https://picsum.photos/seed/s1/150/150' },
    { username: 'chef_pro', reason: 'New to Instagram', avatar: 'https://picsum.photos/seed/s2/150/150' },
    { username: 'travel_holic', reason: 'Suggested for you', avatar: 'https://picsum.photos/seed/s3/150/150' },
    { username: 'tech_insider', reason: 'Followed by dev_team', avatar: 'https://picsum.photos/seed/s4/150/150' },
    { username: 'nature_clicks', reason: 'Suggested for you', avatar: 'https://picsum.photos/seed/s5/150/150' },
  ];

  const footerLinks = [
    'About', 'Help', 'Press', 'API', 'Jobs', 'Privacy', 'Terms', 'Locations', 'Language', 'Meta Verified'
  ];

  return (
    <div className="h-sidebar">
      {/* 1. 로그인한 사용자 요약 카드 */}
      <div className="h-sidebar__user-summary">
        <div className="h-sidebar__profile">
          <img 
            src="https://picsum.photos/seed/meta/150/150" 
            alt="Current User" 
            className="h-sidebar__avatar" 
          />
          <div className="h-sidebar__user-info">
            <span className="h-sidebar__username">modern_developer</span>
            <span className="h-sidebar__fullname">Modern Dev</span>
          </div>
        </div>
        <button className="h-sidebar__btn">Switch</button>
      </div>

      {/* 2. 회원님을 위한 추천 섹션 */}
      <div className="h-sidebar__suggestions-header">
        <span className="h-sidebar__label">Suggested for you</span>
        <button className="h-sidebar__btn h-sidebar__btn--black">See All</button>
      </div>

      <div className="h-sidebar__list">
        {suggestions.map((user) => (
          <div key={user.username} className="h-sidebar__item">
            <div className="h-sidebar__suggested-user">
              <img 
                src={user.avatar} 
                alt={user.username} 
                className="h-sidebar__avatar-small" 
              />
              <div className="h-sidebar__suggested-info">
                <span className="h-sidebar__username">{user.username}</span>
                <span className="h-sidebar__reason">{user.reason}</span>
              </div>
            </div>
            <button className="h-sidebar__btn">Follow</button>
          </div>
        ))}
      </div>

      {/* 3. 하단 고정 링크 */}
      <footer className="h-sidebar__footer">
        <div className="h-sidebar__links">
          {footerLinks.map((link, idx) => (
            <FooterLink 
              key={link} 
              label={link} 
              isLast={idx === footerLinks.length - 1} 
            />
          ))}
        </div>
        <div className="h-sidebar__copyright">
          © 2025 Instagram from Meta
        </div>
      </footer>
    </div>
  );
};

export default Suggestions;
