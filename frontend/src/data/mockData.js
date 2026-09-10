export const currentUser = {
  id: 1,
  username: "alex_creator",
  full_name: "Alex Kim",
  bio: "Digital creator & travel lover 📸✈️\nSeoul & Tokyo based • Architect & Designer\nExploring minimal aesthetics & hidden spaces ✨",
  profile_image_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
  website: "https://alexkim.design",
  is_verified: true,
  posts_count: 36,
  followers_count: 14200,
  following_count: 528,
  is_private: false
};

export const initialUsers = [
  currentUser,
  {
    id: 2,
    username: "cafe_vibes",
    full_name: "성수동 카페 가이드",
    bio: "성수 • 한남 • 연남 매일 업데이트되는 감성 카페 큐레이션 ☕️🍰",
    profile_image_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    website: "https://cafevibes.kr",
    is_verified: false,
    posts_count: 128,
    followers_count: 85200,
    following_count: 310
  },
  {
    id: 3,
    username: "art_studio_lab",
    full_name: "Modern Art Studio",
    bio: "Contemporary Art, Gallery exhibitions & Architectural photography 🎨",
    profile_image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    website: "https://artstudiolab.com",
    is_verified: true,
    posts_count: 84,
    followers_count: 42100,
    following_count: 190
  },
  {
    id: 4,
    username: "nature_wanderer",
    full_name: "Minwoo Lee",
    bio: "Hiking, Wilderness & Mountain photography 🏔️🌲 Sony Alpha Ambassador",
    profile_image_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    website: "https://naturewanderer.photo",
    is_verified: false,
    posts_count: 52,
    followers_count: 19800,
    following_count: 412
  },
  {
    id: 5,
    username: "fashion_curator",
    full_name: "Sora Park",
    bio: "Streetwear, Vintage luxury & Daily Outfit inspiration 👗✨",
    profile_image_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    website: "https://sorapark.style",
    is_verified: true,
    posts_count: 210,
    followers_count: 134000,
    following_count: 670
  },
  {
    id: 6,
    username: "tokyo_records",
    full_name: "Kenji Sato",
    bio: "Vinyl collector & City pop selector 🎧 Tokyo night life",
    profile_image_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    website: "https://tokyorecords.jp",
    is_verified: false,
    posts_count: 45,
    followers_count: 9400,
    following_count: 320
  }
];

export const initialStories = [
  {
    userId: 2,
    username: "cafe_vibes",
    profileImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    hasUnseen: true,
    stories: [
      {
        id: 201,
        mediaUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80",
        mediaType: "image",
        timeAgo: "2시간 전"
      },
      {
        id: 202,
        mediaUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80",
        mediaType: "image",
        timeAgo: "1시간 전"
      }
    ]
  },
  {
    userId: 3,
    username: "art_studio_lab",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    hasUnseen: true,
    stories: [
      {
        id: 301,
        mediaUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop&q=80",
        mediaType: "image",
        timeAgo: "4시간 전"
      },
      {
        id: 302,
        mediaUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80",
        mediaType: "image",
        timeAgo: "3시간 전"
      }
    ]
  },
  {
    userId: 4,
    username: "nature_wanderer",
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    hasUnseen: true,
    stories: [
      {
        id: 401,
        mediaUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80",
        mediaType: "image",
        timeAgo: "5시간 전"
      }
    ]
  },
  {
    userId: 5,
    username: "fashion_curator",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    hasUnseen: true,
    stories: [
      {
        id: 501,
        mediaUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80",
        mediaType: "image",
        timeAgo: "6시간 전"
      }
    ]
  },
  {
    userId: 6,
    username: "tokyo_records",
    profileImage: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    hasUnseen: false,
    stories: [
      {
        id: 601,
        mediaUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
        mediaType: "image",
        timeAgo: "12시간 전"
      }
    ]
  }
];

export const initialPosts = [
  {
    id: 101,
    author: {
      id: 2,
      username: "cafe_vibes",
      fullName: "성수동 카페 가이드",
      profileImageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      isVerified: false
    },
    location: "성수동 베이커리 랩, 서울",
    caption: "성수동 골목 숨겨진 햇살 맛집 베이커리 카페 발견 🥐☕️\n갓 구워져 나온 피스타치오 크루아상과 진한 바닐라빈 라떼의 조화가 예술입니다. 날씨 좋은 주말 나들이 장소로 추천해요!\n\n#성수카페 #디저트투어 #성수핫플 #주말카페 #크루아상맛집 #카페기록",
    media: [
      { id: 1011, mediaUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=900&auto=format&fit=crop&q=80", orderIndex: 0 },
      { id: 1012, mediaUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=900&auto=format&fit=crop&q=80", orderIndex: 1 },
      { id: 1013, mediaUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&auto=format&fit=crop&q=80", orderIndex: 2 }
    ],
    likesCount: 1482,
    isLiked: false,
    isBookmarked: false,
    timeAgo: "2시간 전",
    commentsCount: 24,
    comments: [
      { id: 1, username: "alex_creator", text: "여기 라떼 진짜 고소하고 인테리어도 너무 예쁘죠! ☕️", timeAgo: "1시간 전", likes: 4 },
      { id: 2, username: "fashion_curator", text: "주말에 가봐야겠어요 사진 채광 무슨 일..✨", timeAgo: "30분 전", likes: 2 }
    ]
  },
  {
    id: 102,
    author: {
      id: 3,
      username: "art_studio_lab",
      fullName: "Modern Art Studio",
      profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      isVerified: true
    },
    location: "한남동 현대 미술관",
    caption: "전시 《Light, Dimension & Space》 오프닝 데이 🎨🏛️\n물성과 빛이 교차하며 만들어내는 미니멀한 공간감이 압도적이었습니다. 큐비즘과 현대 건축의 경계를 허무는 실험적인 조형 작품들을 만나보세요.\n\n#현대미술 #한남동전시 #갤러리투어 #미술관 #아트페어",
    media: [
      { id: 1021, mediaUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=900&auto=format&fit=crop&q=80", orderIndex: 0 },
      { id: 1022, mediaUrl: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=900&auto=format&fit=crop&q=80", orderIndex: 1 }
    ],
    likesCount: 3290,
    isLiked: false,
    isBookmarked: false,
    timeAgo: "6시간 전",
    commentsCount: 42,
    comments: [
      { id: 3, username: "tokyo_records", text: "Incredible geometric structure! Great shot 🔥", timeAgo: "4시간 전", likes: 8 },
      { id: 4, username: "nature_wanderer", text: "빛이 들어오는 각도가 환상적이네요 👏", timeAgo: "2시간 전", likes: 3 }
    ]
  },
  {
    id: 103,
    author: {
      id: 4,
      username: "nature_wanderer",
      fullName: "Minwoo Lee",
      profileImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      isVerified: false
    },
    location: "설악산 공룡능선",
    caption: "새벽 4시 등반 끝에 마주한 황금빛 운해 일출 🌅\n차디찬 능선의 바람을 뚫고 솟아오르는 태양을 바라볼 때의 벅찬 감정은 말로 다 표현할 수 없네요. 자연이 선사하는 가장 순수한 찰나의 순간입니다.\n\n#등산 #일출 #설악산 #풍경사진 #아웃도어 #하이킹",
    media: [
      { id: 1031, mediaUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&auto=format&fit=crop&q=80", orderIndex: 0 },
      { id: 1032, mediaUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&auto=format&fit=crop&q=80", orderIndex: 1 }
    ],
    likesCount: 5610,
    isLiked: false,
    isBookmarked: false,
    timeAgo: "12시간 전",
    commentsCount: 88,
    comments: [
      { id: 5, username: "alex_creator", text: "와... 이건 진짜 국립공원 포스터 감이네요 대박입니다!", timeAgo: "10시간 전", likes: 15 },
      { id: 6, username: "cafe_vibes", text: "보는 것만으로도 가슴이 뻥 뚫리네요 🏔️", timeAgo: "8시간 전", likes: 5 }
    ]
  },
  {
    id: 104,
    author: {
      id: 5,
      username: "fashion_curator",
      fullName: "Sora Park",
      profileImageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      isVerified: true
    },
    location: "Tokyo, Omotesando",
    caption: "Autumn minimal layering lookbook 🍂\n모노톤의 오버사이즈 트렌치코트와 레더 부츠 매칭. 단순함 속의 실루엣이 가장 멋진 법이죠.\n\n#오오티디 #가을코디 #데일리룩 #스트릿패션 #미니멀룩 #도쿄여행",
    media: [
      { id: 1041, mediaUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&auto=format&fit=crop&q=80", orderIndex: 0 },
      { id: 1042, mediaUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&auto=format&fit=crop&q=80", orderIndex: 1 }
    ],
    likesCount: 4120,
    isLiked: false,
    isBookmarked: false,
    timeAgo: "1일 전",
    commentsCount: 31,
    comments: [
      { id: 7, username: "art_studio_lab", text: "톤온톤 매칭이 정말 감각적이네요 🖤", timeAgo: "1일 전", likes: 7 }
    ]
  }
];

export const initialExplorePosts = [
  {
    id: 201,
    title: "썸데이 고백",
    mediaUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80",
    likesCount: 38200,
    commentsCount: 1420,
    isVideo: true,
    author: {
      username: "music_live_official",
      fullName: "라이브 뮤직 채널",
      profileImageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    },
    caption: "썸데이 고백 라이브 무대 레전드 음색 🎤✨\n\n#라이브 #음악 #고백 #썸데이 #보컬"
  },
  {
    id: 202,
    title: "이강인 선수 데뷔골 전 세계 댓글 반응 모음",
    mediaUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=80",
    likesCount: 94100,
    commentsCount: 3510,
    isVideo: true,
    author: {
      username: "football_highlight_kr",
      fullName: "축구 하이라이트",
      profileImageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=150"
    },
    caption: "이강인 데뷔골 순간 현지 및 전 세계 팬들의 실시간 반응 ⚽️🔥\n\n#이강인 #축구 #골모음 #해외축구"
  },
  {
    id: 203,
    title: "댕댕이 댄스 챌린지 🐶",
    mediaUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80",
    likesCount: 125000,
    commentsCount: 4890,
    isVideo: true,
    author: {
      username: "cute_puppy_daily",
      fullName: "치와와 데일리",
      profileImageUrl: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=150"
    },
    caption: "두 발로 서서 춤추는 치와와 ㅋㅋㅋ 너무 귀여워 🐾\n\n#댕댕이 #강아지 #치와와 #귀여운동물"
  },
  {
    id: 204,
    title: "개그 억까 레전드 ㅋㅋㅋ",
    mediaUrl: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=600&auto=format&fit=crop&q=80",
    likesCount: 47800,
    commentsCount: 1230,
    isVideo: true,
    author: {
      username: "gag_shorts_club",
      fullName: "개그 숏폼",
      profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
    },
    caption: "당하고 계십니까? 억까 대잔치 현장 ㅋㅋㅋ\n\n#개그 #코미디 #꿀잼 #웃긴영상"
  },
  {
    id: 205,
    title: "아이돌 TOP5 무대 모음",
    mediaUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
    likesCount: 71200,
    commentsCount: 2190,
    isVideo: true,
    author: {
      username: "kpop_fancam_zone",
      fullName: "K-POP 직캠 센터",
      profileImageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
    },
    caption: "차트를 뒤흔든 아이돌 레전드 퍼포먼스 TOP 5 🌟\n\n#아이돌 #케이팝 #직캠 #퍼포먼스"
  },
  {
    id: 206,
    title: "화제의 방송 하이라이트",
    mediaUrl: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&auto=format&fit=crop&q=80",
    likesCount: 33400,
    commentsCount: 940,
    isVideo: true,
    author: {
      username: "streamer_issue_now",
      fullName: "스트리머 이슈",
      profileImageUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
    },
    caption: "실시간 화제의 방송 비하인드 스토리\n\n#방송 #이슈 #예능"
  },
  {
    id: 207,
    title: "POV: 고대 신화 속으로",
    mediaUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
    likesCount: 62900,
    commentsCount: 1680,
    isVideo: true,
    author: {
      username: "cgi_myth_world",
      fullName: "Mythology & VFX",
      profileImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
    },
    caption: "사이클롭스가 오디세우스를 만나지 않았더라면? 놀라운 고퀄리티 그래픽 🏛️\n\n#VFX #신화 #판타지 #POV"
  },
  {
    id: 208,
    title: "환상의 극장골 역습",
    mediaUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&auto=format&fit=crop&q=80",
    likesCount: 88400,
    commentsCount: 2950,
    isVideo: true,
    author: {
      username: "soccer_mania_kr",
      fullName: "축구 매니아",
      profileImageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150"
    },
    caption: "후반 추가시간 94분에 터진 환상의 발리슛 역습 골 ⚽️\n\n#축구 #하이라이트 #스포츠 #골"
  },
  {
    id: 209,
    title: "성수동 감성 에스프레소 바 ☕️",
    mediaUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80",
    likesCount: 19500,
    commentsCount: 312,
    isVideo: true,
    author: {
      username: "cafe_vibes",
      fullName: "성수동 카페 가이드",
      profileImageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150"
    },
    caption: "비 오는 날 어울리는 성수동 스페셜티 커피 바 투어\n\n#성수카페 #커피투어 #에스프레소"
  },
  {
    id: 210,
    title: "가을 미니멀 레이어링 룩북 🍂",
    mediaUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=80",
    likesCount: 42100,
    commentsCount: 520,
    isVideo: true,
    author: {
      username: "fashion_curator",
      fullName: "Sora Park",
      profileImageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
    },
    caption: "도쿄 오모테산도 스트릿에서 담은 가을 아우터 스타일링\n\n#오오티디 #가을패션 #코트코디"
  },
  {
    id: 211,
    title: "설악산 운해 일출 타임랩스 🌅",
    mediaUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80",
    likesCount: 53200,
    commentsCount: 880,
    isVideo: true,
    author: {
      username: "nature_wanderer",
      fullName: "Minwoo Lee",
      profileImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
    },
    caption: "새벽 능선을 물들이는 황금빛 운해의 물결\n\n#등산 #일출 #설악산 #타임랩스"
  },
  {
    id: 212,
    title: "Light & Dimension 공간 예술 🎨",
    mediaUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80",
    likesCount: 28900,
    commentsCount: 410,
    isVideo: true,
    author: {
      username: "art_studio_lab",
      fullName: "Modern Art Studio",
      profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
    },
    caption: "빛과 그림자가 만들어내는 현대 미술의 새로운 지평\n\n#현대미술 #전시회 #갤러리"
  }
];

export const profileHighlights = [
  { id: 1, title: "Travel ✈️", coverUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&auto=format&fit=crop&q=80" },
  { id: 2, title: "Coffee ☕️", coverUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150&auto=format&fit=crop&q=80" },
  { id: 3, title: "Arch 🏛️", coverUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80" },
  { id: 4, title: "Design 🎨", coverUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=150&auto=format&fit=crop&q=80" },
  { id: 5, title: "Daily 🌿", coverUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=150&auto=format&fit=crop&q=80" }
];
