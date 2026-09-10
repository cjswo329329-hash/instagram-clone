export const initialConversations = [
  {
    id: "conv-1",
    partner: {
      id: 201,
      username: "전진님",
      full_name: "전진",
      profile_image_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=150&auto=format&fit=crop&q=80",
      is_verified: false,
      is_online: false,
      last_active: "4주 전 활동",
      is_muted: true,
      has_story: false
    },
    unread_count: 0,
    time_ago: "4주",
    messages: [
      {
        id: "msg-101",
        sender_id: 201,
        text: "형 저번에 추천해주신 카페 가봤어요 ㅋㅋㅋ",
        created_at: "4주 전",
        is_read: true,
        reactions: []
      },
      {
        id: "msg-102",
        sender_id: 1,
        text: "오 어땠어? 필터 커피 괜찮았지?",
        created_at: "4주 전",
        is_read: true,
        reactions: []
      },
      {
        id: "msg-103",
        sender_id: 201,
        text: "네 분위기 미쳤더라고요 ㅋㅋㅋ 사람도 엄청 많았어요",
        created_at: "4주 전",
        is_read: true,
        reactions: []
      },
      {
        id: "msg-104",
        sender_id: 1,
        text: "ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ",
        created_at: "4주 전",
        is_read: true,
        reactions: []
      }
    ]
  },
  {
    id: "conv-2",
    partner: {
      id: 202,
      username: "현 아님",
      full_name: "김현아",
      profile_image_url: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=150&auto=format&fit=crop&q=80",
      is_verified: false,
      is_online: false,
      last_active: "4주 전 활동",
      is_muted: true,
      has_story: false
    },
    unread_count: 0,
    time_ago: "4주",
    messages: [
      {
        id: "msg-201",
        sender_id: 1,
        text: "현아님 디자인 시안 최종 확인 부탁드려요~",
        created_at: "4주 전",
        is_read: true,
        reactions: []
      },
      {
        id: "msg-202",
        sender_id: 202,
        text: "헠ㅋㅋ큐ㅠㅠ 넴넴!!",
        created_at: "4주 전",
        is_read: true,
        reactions: ["❤️"]
      }
    ]
  },
  {
    id: "conv-3",
    partner: {
      id: 203,
      username: "Jihan님",
      full_name: "이지한",
      profile_image_url: null, // default avatar silhouette
      is_verified: false,
      is_online: false,
      last_active: "6주 전 활동",
      is_muted: true,
      has_story: false
    },
    unread_count: 0,
    time_ago: "6주",
    messages: [
      {
        id: "msg-301",
        sender_id: 1,
        text: "지한아 이번 주에 시간 돼?",
        created_at: "6주 전",
        is_read: true,
        reactions: []
      },
      {
        id: "msg-302",
        sender_id: 203,
        text: "오키오키 금욜에 보자",
        created_at: "6주 전",
        is_read: true,
        reactions: []
      }
    ]
  },
  {
    id: "conv-4",
    partner: {
      id: 204,
      username: "별🌻님",
      full_name: "별",
      profile_image_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      is_verified: false,
      is_online: true,
      last_active: "현재 활동 중",
      is_muted: false,
      has_story: true // Instagram sunset gradient ring
    },
    unread_count: 0,
    time_ago: "36주",
    messages: [
      {
        id: "msg-401",
        sender_id: 204,
        text: "프로젝트 관련 참고 자료 보내드려요!",
        mediaUrl: "https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?w=600&auto=format&fit=crop&q=80",
        created_at: "36주 전",
        is_read: true,
        reactions: ["❤️"]
      }
    ]
  },
  {
    id: "conv-5",
    partner: {
      id: 205,
      username: "kakruso님",
      full_name: "카크루소",
      profile_image_url: null, // default silhouette
      is_verified: false,
      is_online: false,
      last_active: "47주 전 활동",
      is_muted: false,
      has_story: false
    },
    unread_count: 0,
    time_ago: "47주",
    messages: [
      {
        id: "msg-501",
        sender_id: 205,
        text: "포트폴리오 파일 공유합니다 확인 부탁드려요",
        mediaUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&auto=format&fit=crop&q=80",
        created_at: "47주 전",
        is_read: true,
        reactions: []
      }
    ]
  },
  {
    id: "conv-6",
    partner: {
      id: 206,
      username: "Jieun Joanna님",
      full_name: "지은",
      profile_image_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      is_verified: false,
      is_online: false,
      last_active: "1년 전 활동",
      is_muted: false,
      has_story: false
    },
    unread_count: 0,
    time_ago: "1년",
    messages: [
      {
        id: "msg-601",
        sender_id: 1,
        text: "오늘 공연 너무 멋있었어요!",
        created_at: "1년 전",
        is_read: true,
        reactions: ["❤️"]
      },
      {
        id: "msg-602",
        sender_id: 206,
        text: "메시지를 좋아합니다",
        created_at: "1년 전",
        is_read: true,
        reactions: ["❤️"]
      }
    ]
  }
];
