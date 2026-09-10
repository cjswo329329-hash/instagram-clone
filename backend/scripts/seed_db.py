import os
import sys
from datetime import datetime, timedelta

# Windows 콘솔 인코딩 대응
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import SessionLocal, engine, Base
from app.models import (
    User, Follow, Post, PostMedia, Reel, Comment,
    Like, Bookmark, Story, StoryView, Conversation,
    Message, Notification
)
from app.core.security import get_password_hash

def seed():
    db = SessionLocal()

    if db.query(User).count() > 0:
        print("[INFO] 데이터베이스에 이미 데이터가 존재합니다. 시딩을 건너뜁니다.")
        db.close()
        return

    print("[INFO] 인스타그램 목업 더미 데이터 시딩 시작...")

    # 1. 유저 5명 생성
    users_data = [
        {
            "username": "alex_creator",
            "email": "alex@example.com",
            "full_name": "Alex Kim",
            "bio": "Digital creator & travel lover 📸 Seoul & Tokyo based",
            "profile_image_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            "website": "https://alexkim.design",
            "is_verified": True,
            "gender": "male"
        },
        {
            "username": "cafe_vibes",
            "email": "cafe@example.com",
            "full_name": "Daily Cafe Guide",
            "bio": "전국의 감성 카페와 맛있는 디저트를 기록합니다",
            "profile_image_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
            "website": "https://cafevibes.kr",
            "is_verified": False,
            "gender": "female"
        },
        {
            "username": "art_studio_lab",
            "email": "studio@example.com",
            "full_name": "Modern Art Studio",
            "bio": "Contemporary Art & Design Gallery",
            "profile_image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
            "website": "https://artstudiolab.com",
            "is_verified": True,
            "gender": "not_specified"
        },
        {
            "username": "nature_wanderer",
            "email": "nature@example.com",
            "full_name": "Minwoo Lee",
            "bio": "Hiking | Landscape | Outdoors",
            "profile_image_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
            "website": "https://naturewanderer.photo",
            "is_verified": False,
            "gender": "male"
        },
        {
            "username": "fashion_curator",
            "email": "fashion@example.com",
            "full_name": "Sora Park",
            "bio": "Street style & Minimalism",
            "profile_image_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
            "website": "https://sorapark.style",
            "is_verified": True,
            "gender": "female"
        }
    ]

    created_users = []
    for u in users_data:
        user = User(
            username=u["username"],
            email=u["email"],
            hashed_password=get_password_hash("aaaa1234"),
            full_name=u["full_name"],
            bio=u["bio"],
            profile_image_url=u["profile_image_url"],
            website=u["website"],
            is_verified=u["is_verified"],
            gender=u["gender"]
        )
        db.add(user)
        created_users.append(user)

    db.commit()
    for u in created_users:
        db.refresh(u)

    # 2. 팔로우 관계 생성
    follows = [
        Follow(follower_id=created_users[0].id, following_id=created_users[1].id),
        Follow(follower_id=created_users[0].id, following_id=created_users[2].id),
        Follow(follower_id=created_users[0].id, following_id=created_users[4].id),
        Follow(follower_id=created_users[1].id, following_id=created_users[0].id),
        Follow(follower_id=created_users[2].id, following_id=created_users[0].id),
    ]
    db.add_all(follows)
    db.commit()

    # 3. 피드 게시물 생성
    posts_data = [
        {
            "user_id": created_users[1].id,
            "caption": "주말 성수동 신상 베이커리 카페 투어! 갓 구운 크루아상 냄새가 정말 향긋해요! #성수카페 #디저트투어",
            "location": "성수동, 서울",
            "media": [
                "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "user_id": created_users[2].id,
            "caption": "이번 주말 오픈한 새로운 현대미술 전시 'Light & Shadow' 공간의 빛과 그림자가 주는 영감 #전시회 #현대미술",
            "location": "한남동 아트 갤러리",
            "media": [
                "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80"
            ]
        }
    ]

    for p in posts_data:
        post = Post(
            user_id=p["user_id"],
            caption=p["caption"],
            location=p["location"]
        )
        db.add(post)
        db.commit()
        db.refresh(post)

        for idx, m_url in enumerate(p["media"]):
            media = PostMedia(
                post_id=post.id,
                media_url=m_url,
                media_type="image",
                order_index=idx
            )
            db.add(media)

        comment = Comment(
            post_id=post.id,
            user_id=created_users[1].id,
            content="와 사진 분위기 정말 최고네요!"
        )
        db.add(comment)

        like = Like(
            post_id=post.id,
            user_id=created_users[1].id
        )
        db.add(like)

    # 4. 릴스 생성
    reel = Reel(
        user_id=created_users[0].id,
        video_url="/videos/reel1.mp4",
        poster_url="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800",
        caption="힙한 주말 댄스 챌린지 😎",
        tagged_user="qkqkfl4",
        audio_title="Original Audio • qkqkfl4",
        audio_cover_url="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100",
        audio_is_explicit=False,
        shares_count=10
    )
    db.add(reel)
    db.commit()
    db.refresh(reel)

    # 릴스 댓글 및 좋아요
    reel_comment = Comment(
        reel_id=reel.id,
        user_id=created_users[1].id,
        content="두 분 춤선 너무 힙하고 멋져요! ✨"
    )
    db.add(reel_comment)
    reel_like = Like(
        reel_id=reel.id,
        user_id=created_users[1].id
    )
    db.add(reel_like)

    from datetime import timezone
    now = datetime.now(timezone.utc)
    expires = now + timedelta(hours=24)
    stories_data = [
        Story(user_id=created_users[1].id, media_url="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800", media_type="image", expires_at=expires),
        Story(user_id=created_users[2].id, media_url="https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800", media_type="image", expires_at=expires),
    ]
    db.add_all(stories_data)

    # 6. 다이렉트 대화 및 메시지 생성
    conv = Conversation(
        id="conv-1",
        user1_id=created_users[0].id,
        user2_id=created_users[1].id
    )
    db.add(conv)
    db.commit()

    msg = Message(
        id="msg-101",
        conversation_id="conv-1",
        sender_id=created_users[1].id,
        text="저번에 추천해주신 카페 가봤어요 ㅋㅋㅋ",
        media_url=None,
        is_read=True,
        reactions='["❤️"]'
    )
    db.add(msg)

    # 7. 알림 생성
    notif = Notification(
        recipient_id=created_users[0].id,
        sender_id=created_users[1].id,
        type="like_reel",
        target_id=reel.id,
        is_read=False
    )
    db.add(notif)

    db.commit()
    db.close()
    print("[SUCCESS] 더미 데이터 시딩이 완벽하게 완료되었습니다!")

if __name__ == "__main__":
    seed()
