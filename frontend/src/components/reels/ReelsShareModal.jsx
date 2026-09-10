import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Copy, 
  Check, 
  Share2
} from 'lucide-react';

const SUGGESTED_USERS = [
  { id: 1, username: 'alex_creator', name: 'Alex Johnson', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
  { id: 2, username: 'cafe_vibes', name: '성수동 카페 가이드', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100' },
  { id: 3, username: 'nature_wanderer', name: 'Minwoo Lee', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
  { id: 4, username: 'fashion_curator', name: 'Sora Park', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
  { id: 5, username: 'tokyo_records', name: 'Kenji Sato', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100' },
  { id: 6, username: 'art_studio_lab', name: 'Art & Design Lab', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' }
];

export default function ReelsShareModal({ isOpen, onClose, reel }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sentUserIds, setSentUserIds] = useState(new Set());
  const [copied, setCopied] = useState(false);

  if (!isOpen || !reel) return null;

  const filteredUsers = SUGGESTED_USERS.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = (userId) => {
    setSentUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/reels?id=${reel.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[480px] bg-[#262626] rounded-2xl overflow-hidden shadow-2xl border border-[#363636] flex flex-col max-h-[85vh] modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#363636]">
          <div className="w-8" />
          <h2 className="text-base font-semibold text-white">공유</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#a8a8a8] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-[#363636]">
          <div className="flex items-center gap-2 bg-[#121212] px-3.5 py-2 rounded-xl text-white text-sm border border-[#363636]/60 focus-within:border-[#555]">
            <Search className="text-[#8e8e8e] w-4 h-4 flex-shrink-0" />
            <input 
              type="text"
              placeholder="검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent w-full focus:outline-none placeholder-[#737373] text-sm text-white"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[#8e8e8e] hover:text-white">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto px-2 py-2 divide-y divide-transparent">
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-[#8e8e8e] text-sm">
              검색 결과가 없습니다
            </div>
          ) : (
            filteredUsers.map(user => {
              const isSent = sentUserIds.has(user.id);
              return (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={user.avatar} 
                      alt={user.username}
                      className="w-11 h-11 rounded-full object-cover flex-shrink-0 border border-white/10" 
                    />
                    <div className="min-w-0">
                      <p className="text-white text-sm font-semibold truncate leading-tight">{user.username}</p>
                      <p className="text-[#a8a8a8] text-xs truncate mt-0.5">{user.name}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSend(user.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isSent 
                        ? 'bg-transparent text-[#a8a8a8] border border-[#555] hover:border-red-500 hover:text-red-400'
                        : 'bg-[#0095f6] text-white hover:bg-[#1877f2] shadow-sm'
                    }`}
                  >
                    {isSent ? '전송됨' : '보내기'}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Quick action buttons */}
        <div className="p-3 border-t border-[#363636] bg-[#1a1a1a]/80 flex items-center justify-around gap-2">
          <button 
            onClick={handleCopyLink}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
          >
            {copied ? (
              <>
                <Check className="text-emerald-400 w-4 h-4" />
                <span className="text-emerald-400 font-semibold">복사 완료!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>링크 복사</span>
              </>
            )}
          </button>

          <button 
            onClick={() => {
              alert('스토리에 공유되었습니다!');
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>스토리에 공유</span>
          </button>
        </div>
      </div>
    </div>
  );
}
