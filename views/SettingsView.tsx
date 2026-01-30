'use client';

import React from 'react';
import { useApp } from '../contexts/AppContext';
import { LogOut } from 'lucide-react';

// =============================================================================
// 설정 뷰: 좌측 메뉴 + 우측 편집 폼 (프로필 사진, 웹사이트, 바이오, 제출)
// =============================================================================

const SettingsView: React.FC = () => {
  const { logout } = useApp();
  // 메뉴 항목 (Edit profile, Notification, Settings and privacy, ...)
  const menuItems = [
    'Edit profile', 'Notification', 'Settings and privacy', 'Supervision',
    'Help', 'Account Status', 'Subscriptions'
  ];

  return (
    <div className="max-w-[935px] w-full flex bg-white border border-[#dbdbdb] mt-8 rounded-sm overflow-hidden min-h-[600px] mb-10">
      {/* ---------- 구역: 좌측 메뉴 (Settings + 메뉴 목록) ---------- */}
      <div className="w-[235px] border-r border-[#dbdbdb] flex flex-col">
        <div className="px-6 py-4 font-bold text-[16px] border-b border-[#dbdbdb] h-14 flex items-center">Settings</div>
        {menuItems.map((item, i) => (
          <div
            key={item}
            className={`px-6 py-4 text-[14px] cursor-pointer hover:bg-[#fafafa] transition-colors ${i === 0 ? 'border-l-2 border-black font-bold' : ''}`}
          >
            {item}
          </div>
        ))}
        {/* 로그아웃 버튼 */}
        <div className="mt-auto border-t border-[#dbdbdb] p-2">
          <button
            type="button"
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            로그아웃
          </button>
        </div>
      </div>
      {/* ---------- 구역: 우측 편집 폼 (프로필 사진, 웹사이트, 바이오, 제출) ---------- */}
      <div className="flex-1 p-10 flex flex-col gap-8">
        <h2 className="text-[20px] font-normal">Edit profile</h2>

        <div className="flex flex-col gap-6 max-w-[500px]">
          {/* 프로필 사진 + 변경 버튼 */}
          <div className="flex items-center gap-10">
            <div className="w-10 h-10 rounded-full overflow-hidden">
               <img src="https://picsum.photos/seed/meta/50/50" alt="Small Avatar" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[14px]">modern_developer</span>
              <button className="text-[#0095f6] text-[14px] font-bold hover:text-black">Change profile photo</button>
            </div>
          </div>

          {/* 웹사이트 입력 */}
          <div className="flex flex-col gap-2">
            <label className="text-[16px] font-bold">Website</label>
            <input type="text" placeholder="Website" className="bg-[#fafafa] border border-[#dbdbdb] p-2 rounded-md outline-none text-[14px]" defaultValue="https://github.com/modern_dev" />
          </div>

          {/* 바이오 입력 */}
          <div className="flex flex-col gap-2">
            <label className="text-[16px] font-bold">Bio</label>
            <textarea placeholder="Bio" className="bg-[#fafafa] border border-[#dbdbdb] p-2 rounded-md outline-none text-[14px] h-24" defaultValue="Building the future with React & AI. 🚀" />
          </div>

          {/* 제출 버튼 */}
          <button className="bg-[#0095f6] text-white px-4 py-2 rounded-lg text-[14px] font-bold w-fit mt-4">Submit</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
