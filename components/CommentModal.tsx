
import React from 'react';
import { X, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Smile } from 'lucide-react';
import { Post as PostType } from '../types';

const CommentModal: React.FC<{ post: PostType; onClose: () => void }> = ({ post, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white p-2 hover:opacity-70">
        <X size={32} />
      </button>
      
      <div 
        className="bg-white max-w-[1200px] w-full max-h-[90vh] flex flex-col md:flex-row overflow-hidden rounded-r-lg"
        onClick={e => e.stopPropagation()}
      >
        {/* Left Side - Image */}
        <div className="flex-1 bg-black flex items-center justify-center min-h-[300px]">
          <img src={post.imageUrl} alt="Post" className="max-h-full object-contain" />
        </div>

        {/* Right Side - Details & Comments */}
        <div className="w-full md:w-[400px] lg:w-[500px] flex flex-col bg-white">
          <header className="p-4 border-b border-[#dbdbdb] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={post.user.avatar} className="w-8 h-8 rounded-full" alt="User" />
              <span className="text-[14px] font-bold">{post.user.username}</span>
              <span className="text-[14px]">•</span>
              <button className="text-[#0095f6] text-[14px] font-bold hover:text-[#00376b]">Follow</button>
            </div>
            <MoreHorizontal size={20} className="cursor-pointer" />
          </header>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 no-scrollbar">
            {/* Caption */}
            <div className="flex gap-3">
              <img src={post.user.avatar} className="w-8 h-8 rounded-full h-fit" alt="User" />
              <div>
                <span className="text-[14px] font-bold mr-2">{post.user.username}</span>
                <span className="text-[14px] leading-[18px]">{post.caption}</span>
                <div className="mt-2 text-[12px] text-[#737373]">1d</div>
              </div>
            </div>

            {/* Dummy Comments */}
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex gap-3 group">
                <img src={`https://picsum.photos/seed/comm-${i}/50/50`} className="w-8 h-8 rounded-full h-fit" alt="Commenter" />
                <div className="flex-1">
                  <span className="text-[14px] font-bold mr-2">fan_{i+1}</span>
                  <span className="text-[14px] leading-[18px]">This is an incredible shot! The lighting is perfect. ✨</span>
                  <div className="mt-1 flex items-center gap-3 text-[12px] text-[#737373]">
                    <span>2h</span>
                    <button className="font-bold">12 likes</button>
                    <button className="font-bold">Reply</button>
                  </div>
                </div>
                <Heart size={12} className="mt-2 cursor-pointer hover:text-[#737373]" />
              </div>
            ))}
          </div>

          <footer className="border-t border-[#dbdbdb] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Heart size={24} className="cursor-pointer hover:text-[#737373]" />
                <MessageCircle size={24} className="cursor-pointer hover:text-[#737373]" />
                <Send size={24} className="cursor-pointer hover:text-[#737373]" />
              </div>
              <Bookmark size={24} className="cursor-pointer hover:text-[#737373]" />
            </div>
            <div className="text-[14px] font-bold">{post.likes.toLocaleString()} likes</div>
            <div className="text-[10px] text-[#737373] uppercase tracking-tight">1 day ago</div>
            
            <div className="flex items-center gap-3 pt-4 border-t border-[#efefef] mt-4">
              <Smile size={24} className="text-[#737373]" />
              <input type="text" placeholder="Add a comment..." className="flex-1 outline-none bg-transparent text-[14px]" />
              <button className="text-[#0095f6] font-bold text-[14px] opacity-50">Post</button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default CommentModal;
