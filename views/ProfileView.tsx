
import React from 'react';
import { Grid, Bookmark, Tag, Settings } from 'lucide-react';

const ProfileView: React.FC = () => {
  return (
    <div className="max-w-[935px] w-full px-4 pt-8">
      {/* Header Info */}
      <header className="flex flex-col md:flex-row gap-10 md:gap-20 pb-10 border-b border-[#dbdbdb] mb-10">
        <div className="flex justify-center md:block">
          <div className="w-[150px] h-[150px] rounded-full overflow-hidden border border-[#dbdbdb] cursor-pointer">
            <img src="https://picsum.photos/seed/meta/300/300" alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
            <h2 className="text-[20px] font-normal">modern_developer</h2>
            <div className="flex gap-2">
              <button className="bg-[#efefef] hover:bg-[#dbdbdb] px-4 py-1.5 rounded-lg text-[14px] font-semibold transition-colors">Edit Profile</button>
              <button className="bg-[#efefef] hover:bg-[#dbdbdb] px-4 py-1.5 rounded-lg text-[14px] font-semibold transition-colors">View archive</button>
              <Settings size={24} className="cursor-pointer" />
            </div>
          </div>
          <div className="flex gap-10 text-[16px]">
            <span><b>128</b> posts</span>
            <span className="cursor-pointer"><b>14.2K</b> followers</span>
            <span className="cursor-pointer"><b>842</b> following</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-[14px]">Modern Dev</span>
            <span className="text-[14px]">Building the future with React & AI. 🚀<br/>📍 Seoul, Korea</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex justify-center gap-14 border-t border-black -mt-[41px]">
        <div className="flex items-center gap-1.5 py-4 border-t border-black uppercase text-[12px] font-bold tracking-widest cursor-pointer">
           <Grid size={12} /> Posts
        </div>
        <div className="flex items-center gap-1.5 py-4 uppercase text-[12px] font-bold tracking-widest text-[#737373] cursor-pointer hover:text-black">
           <Bookmark size={12} /> Saved
        </div>
        <div className="flex items-center gap-1.5 py-4 uppercase text-[12px] font-bold tracking-widest text-[#737373] cursor-pointer hover:text-black">
           <Tag size={12} /> Tagged
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-1 md:gap-7 pb-20">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-100 overflow-hidden cursor-pointer group relative">
            <img src={`https://picsum.photos/seed/post-${i}/600/600`} alt="Post" className="w-full h-full object-cover group-hover:brightness-75 transition-all" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileView;
