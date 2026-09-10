import os
import sys
import random
import uuid
from datetime import datetime, timedelta

# UTF-8 stdout encoding for Windows
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

# ==========================================
# Curated High Quality Unsplash & Video Data
# ==========================================

AVATAR_URLS = [
    # Females
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1514315384763-ba401779410f?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1526080652727-5b77f74eacd2?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    # Males
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1480429370139-e0132c086e2a?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1463453091185-61582044d556?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=300&auto=format&fit=crop&q=80",
    # Aesthetics & Studio
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
]

IMAGE_BANKS = {
    "cafe": [
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1080&auto=format&fit=crop&q=80",
    ],
    "travel": [
        "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1080&auto=format&fit=crop&q=80",
    ],
    "fashion": [
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1080&auto=format&fit=crop&q=80",
    ],
    "food": [
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=1080&auto=format&fit=crop&q=80",
    ],
    "fitness": [
        "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1483721074573-5a022416b677?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=1080&auto=format&fit=crop&q=80",
    ],
    "pets": [
        "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=1080&auto=format&fit=crop&q=80",
    ],
    "tech": [
        "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1080&auto=format&fit=crop&q=80",
    ],
    "art": [
        "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1549887534-1541e9326642?w=1080&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1080&auto=format&fit=crop&q=80",
    ]
}

REEL_VIDEOS = [
    {
        "video": "/videos/reel1.mp4",
        "poster": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800",
        "audio": "NewJeans - How Sweet",
        "caption": "불금 네온사인 아래서 댄스 챌린지 ✨ #댄스 #릴스 #힙합"
    },
    {
        "video": "/videos/reel2.mp4",
        "poster": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800",
        "audio": "DJ Wave - Weekend Night Mix",
        "caption": "오늘 밤 성수동 클럽 파티 라이브 세트 🎧🔥 #DJ #성수클럽"
    },
    {
        "video": "/videos/reel3.mp4",
        "poster": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800",
        "audio": "Lo-Fi Cafe Beats - Morning Coffee",
        "caption": "아침을 여는 핸드드립 커피 ☕ 결이 다른 에티오피아 원두 #홈카페 #ASMR"
    },
    {
        "video": "/videos/reel4.mp4",
        "poster": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
        "audio": "선재 업고 튀어 OST - 소나기",
        "caption": "제주도 일몰 러닝 🌅 파도 소리와 함께 5km 완주! #러닝크루 #오운완"
    },
    {
        "video": "/videos/reel5.mp4",
        "poster": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
        "audio": "Cooking Vibes - Sweet & Sizzle",
        "caption": "15분 컷! 감칠맛 폭발하는 버터 갈릭 쉬림프 파스타 🍝 #자취요리 #쿡스타그램"
    },
    {
        "video": "/videos/reel1.mp4",
        "poster": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800",
        "audio": "Cute Cat Song - Meow Beat",
        "caption": "햇살 아래서 졸고 있는 우리집 치즈냥이 🐱 식빵 굽는 중 #고양이 #냥스타그램"
    },
    {
        "video": "/videos/reel2.mp4",
        "poster": "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=800",
        "audio": "aespa - Supernova",
        "caption": "한강 공원에서 롱보드 크루징 🛹 바람 너무 시원해요! #롱보드 #여름일상"
    },
    {
        "video": "/videos/reel3.mp4",
        "poster": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800",
        "audio": "Wave to Earth - Seasons",
        "caption": "동해 바다 윤슬 보며 힐링 타임 🌊 소리 켜고 감상하세요 #바다 #힐링"
    },
    {
        "video": "/videos/reel4.mp4",
        "poster": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800",
        "audio": "Gym Beast - Heavy Metal Beat",
        "caption": "오늘 등 운동 데드리프트 180kg 성공 💪 꾸준함이 답이다 #헬스타그램 #오운완"
    },
    {
        "video": "/videos/reel5.mp4",
        "poster": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800",
        "audio": "Calm Lo-Fi - Pottery Mind",
        "caption": "물레 위에서 피어나는 나만의 도자기 화병 🏺 마음이 편안해지는 시간 #도예 #취미"
    }
]

# Realistic User Profiles Definitions (100 users)
USER_PROFILES = [
    # Top creators
    ("seoul_cafe_hunter", "성수동 카페사냥꾼", "전국 감성 카페와 신상 디저트를 찾아다닙니다 ☕🧁 성수/연남/한남", "cafe", "https://cafehunter.kr", True),
    ("minji_film_snap", "김민지 📸 필름스냅", "Minolta X-700 & Kodak Gold 200 | 따뜻한 일상의 순간을 기록해요", "art", "https://minjifilm.photo", True),
    ("travel_with_jin", "진우의 지구별 여행", "32개국 배낭여행자 ✈️ 다음 목적지는 아이슬란드 🇮🇸", "travel", "https://jinwookim.travel", True),
    ("sora_daily_look", "소라 SORA | 데일리룩", "163cm / 미니멀 & 스트릿 캐주얼 OOTD 👗 문의는 DM", "fashion", "https://sora-style.com", True),
    ("chef_minsu_table", "민수셰프의 홈쿡", "간단하지만 근사한 파인다이닝 레시피를 공유합니다 🍳🍷", "food", "https://minsutable.kitchen", True),
    ("running_crew_seoul", "서울 러닝크루 SRC", "함께 달리는 즐거움 🏃‍♂️ 매주 화/목 여의도 & 반포 한강 러닝", "fitness", "https://seoulrunning.club", True),
    ("golden_retriever_bori", "골든리트리버 보리 🐶", "2021년생 천사견 보리의 하루하루 🦴 산책이 제일 좋아", "pets", "https://bori-dog.pet", False),
    ("tech_setup_jun", "준이의 데스크테리어", "M3 Max MacBook Pro | Custom Keyboards & Desk Setup 💻✨", "tech", "https://jun-setup.tech", True),
    ("pottery_atelier_clay", "도예공방 클레이랩", "흙을 만지며 쉼을 얻는 시간 🏺 정규/원데이 클래스 상시 모집", "art", "https://claylab.art", False),
    ("vinyl_music_lounge", "LP & 바이닐 바 라운지", "음악이 흐르는 밤 🍸 Jazz, Soul, City Pop Vinyl Collection", "art", "https://vinyllounge.bar", True),
    ("jeju_island_diary", "제주 살이 3년차 은서", "푸른 바다와 오름, 귤밭 풍경을 전합니다 🍊🏝️", "travel", "https://jejudairy.kr", False),
    ("bread_lover_yoon", "빵지순례 윤서", "크루아상, 소금빵, 베이글에 진심인 빵순이의 빵 지도 🥐🥖", "food", "https://yoonbread.food", False),
    ("pilates_with_hana", "하나 강사의 필라테스", "바른 자세와 건강한 바디라인 만들기 🧘‍♀️ 체형교정 전문", "fitness", "https://hanapilates.fit", True),
    ("street_fashion_korea", "K-Street Style Mag", "홍대 & 성수 스트릿 패션 스냅 매거진 📸 매주 업데이트", "fashion", "https://kstreetmag.com", True),
    ("cat_mom_bomi", "삼색이와 치즈 냥이집사", "길에서 만난 두 냥이와의 행복한 동거 일기 🐾", "pets", "https://bomcats.me", False),
    ("camping_outdoor_camp", "주말 백패커 현우", "미니멀 캠핑 & 불멍 & 노지 차박 🌲🏕️ 자연으로 떠나요", "travel", "https://hyuncamp.site", False),
    ("vintage_camera_shop", "을지로 빈티지 카메라", "클래식 필름 카메라 복원 & 렌즈 수리 📷 을지로 3가", "tech", "https://vintagecam.kr", False),
    ("plant_interior_green", "초록이네 식물 인테리어", "몬스테라, 알로카시아, 베란다 가드닝 🌿 플랜테리어 가이드", "art", "https://greenplant.house", False),
    ("dessert_lab_chloe", "파티시에 클로이", "르꼬르동블루 출신 파티시에의 디저트 연구소 🍰 프랑스 정통 제과", "food", "https://chloedessert.kr", True),
    ("running_girl_yuri", "유리의 마라톤 도전기", "풀코스 서브3를 향해 달리는 직장인 러너 🏃‍♀️ 나이키 런클럽", "fitness", "https://yurirun.com", False),
    ("tokyo_gourmet_guide", "도쿄 미식 탐방기", "현지인들만 아는 도쿄 숨은 맛집 & 이자카야 리스트 🇯🇵🍣", "food", "https://tokyogourmet.jp", True),
    ("interior_house_view", "20평대 온라인 집들이", "화이트 & 우드 톤의 따뜻한 감성 신혼집 인테리어 🛋️", "art", "https://warmhouse.co.kr", False),
    ("kpop_dance_cover", "K-DANCE STUDIO", "최신 K-POP 댄스 커버 & 튜토리얼 댄스 챌린지 💃", "art", "https://kdancestudio.net", True),
    ("coffee_roastery_beans", "블루문 로스터리", "Specialty Coffee Roasting Lab ☕ 직접 볶은 신선한 원두", "cafe", "https://bluemoonroast.com", True),
    ("parisian_daily_life", "파리 유학생 지민", "센느강 산책, 미술관 투어, 파리의 일상 브이로그 🇫🇷🥐", "travel", "https://jiminparis.fr", False),
    ("french_bulldog_toby", "프렌치불독 토비 🐾", "뚱땅뚱땅 걷는 매력둥이 토비의 먹방 & 낮잠 라이프", "pets", "https://tobydog.kr", False),
    ("omakase_explorer", "오마카세 & 파인다이닝", "전국 하이엔드 스시야 & 한우 오마카세 솔직 리뷰 🍣🥩", "food", "https://omakasereview.kr", True),
    ("minimal_wardrobe", "미니멀 옷장 프로젝트", "적은 옷으로 감각 있게 입는 30가지 캡슐 워드로브 🧥", "fashion", "https://minimalwardrobe.style", False),
    ("mountain_climbing_kr", "대한민국 100대 명산", "지리산, 설악산, 덕유산 능선을 걷는 등산 일지 ⛰️", "travel", "https://koreanmountains.kr", False),
    ("illustration_artist_dami", "일러스트레이터 다미", "따뜻한 동화풍 수채화 & 아이패드 드로잉 🎨 굿즈샵 오픈", "art", "https://dami-art.net", True),
    ("health_diet_coach", "다이어트 멘토 성훈", "굶지 않고 지속 가능한 건강 식단 & 홈트 루틴 🥗🏋️‍♂️", "fitness", "https://healthcoach.kr", True),
    ("macbook_desk_decor", "미니멀 데스크 셋업", "케이블리스 무선 환경 & 4K 모니터 암 셋업 가이드 ⌨️", "tech", "https://minimaldesk.space", False),
    ("dog_training_center", "반려견 행동전문가 강쌤", "긍정 강화 훈련으로 문제견 행동 교정 🐕 함께 행복한 반려생활", "pets", "https://dogtraining.center", True),
    ("brunch_cafe_lover", "주말엔 브런치", "에그 베네딕트, 프렌치토스트, 팬케이크 맛집 지도 🥞🍳", "cafe", "https://weekendbrunch.kr", False),
    ("london_snap_diary", "런던 스냅 포토그래퍼", "비 내리는 런던 거리 & 빅벤, 타워브릿지 로맨틱 스냅 🇬🇧", "travel", "https://londonsnap.co.uk", True),
    ("menswear_editorial", "남성 클래식 & 테일러링", "수트, 코트, 로퍼 스타일링 가이드 👔 사르토리아의 세계", "fashion", "https://mensclassic.kr", False),
    ("sushi_master_jin", "스시마스터 진우", "노량진 새벽 어시장 직송 제철 생선 손질 & 스시 🍣", "food", "https://sushijin.kitchen", True),
    ("cycling_road_bike", "로드 자전거 라이딩", "한강 자전거길 & 북악 스카이웨이 힐클라임 🚴 라이더 모임", "fitness", "https://roadbike.club", False),
    ("scent_perfume_lab", "니치 향수 큐레이터", "딥티크, 바이레도, 르라보 등 향수 리뷰 & 레이어링 팁 🌸", "fashion", "https://perfumelab.kr", False),
    ("leather_craft_studio", "가죽공예 헤리티지", "한 땀 한 땀 손바느질로 만드는 수제 가죽 지갑 & 가방 👜", "art", "https://leathercraft.kr", False),
    ("tokyo_ramen_hunter", "도쿄 라멘 정복기", "진한 돈코츠, 깔끔한 시오, 츠케멘 라멘 전국 랭킹 🍜", "food", "https://ramenhunter.jp", False),
    ("ocean_diving_club", "스쿠버 & 프리다이빙", "제주 문섬, 세부, 오키나와 푸른 바닷속 신비로운 세상 🤿🐠", "travel", "https://oceandive.kr", False),
    ("cat_cafe_peace", "힐링 고양이 쉼터", "구조된 유기묘들의 평화로운 오후 일상 🐾 입양 홍보", "pets", "https://catpeace.org", False),
    ("sneaker_collector_k", "한정판 스니커즈 아카이브", "나이키 조던, 아디다스 이지, 트래비스 스캇 실물 리뷰 👟", "fashion", "https://k-sneakers.kr", True),
    ("baking_class_sweet", "달콤한 베이킹 클래스", "마카롱, 까눌레, 휘낭시에 실패 없는 홈베이킹 레시피 🍪", "food", "https://sweetbaking.academy", False),
    ("crossfit_box_iron", "크로스핏 아이언 짐", "WOD 기록 갱신, 풀업, 버피, 역도 트레이닝 🔥 강해지는 매일", "fitness", "https://ironcrossfit.kr", False),
    ("newyork_city_life", "뉴욕 직장인 지호", "맨해튼 브루클린 일상, 센트럴파크 러닝 🗽🇺🇸", "travel", "https://nycziho.com", False),
    ("calligraphy_lettering", "손글씨 캘리그라피", "마음을 울리는 책 속 한 줄, 따뜻한 펜글씨 ✍️", "art", "https://calliletter.kr", False),
    ("wine_sommelier_eric", "소믈리에 에릭의 와인 노트", "가성비 데일리 와인부터 보르도 그랑크뤼까지 페어링 가이드 🍷", "food", "https://ericwine.note", True),
    ("retro_gaming_room", "레트로 게임 박물관", "패미컴, 플스1, 아케이드 오락실 게임기 룸 투어 🕹️👾", "tech", "https://retrogames.club", False),
]

# Fill up to 100 users with varied Korean profiles
for i in range(len(USER_PROFILES) + 1, 101):
    categories = ["cafe", "travel", "fashion", "food", "fitness", "pets", "tech", "art"]
    cat = categories[i % len(categories)]
    names = [
        ("민경", "minkyung"), ("수현", "suhyun"), ("도윤", "doyoon"), ("서진", "seojin"),
        ("지안", "jian"), ("하은", "haeun"), ("태민", "taemin"), ("예준", "yejun"),
        ("채원", "chaewon"), ("우진", "woojin"), ("시우", "siwoo"), ("지우", "jiwoo"),
        ("가은", "gaeun"), ("현준", "hyunjun"), ("서아", "seoa"), ("다온", "daon"),
        ("은우", "eunwoo"), ("윤아", "yoona"), ("재원", "jaewon"), ("소율", "soyul"),
        ("승우", "seungwoo"), ("나연", "nayeon"), ("건우", "gunwoo"), ("보민", "bomin"),
        ("성민", "sungmin"), ("주원", "joowon"), ("다인", "dain"), ("시윤", "siyoon"),
        ("유진", "yujin"), ("동현", "donghyun"), ("혜원", "hyewon"), ("민재", "minjae"),
        ("수아", "sua"), ("선우", "sunwoo"), ("예나", "yena"), ("진혁", "jinhyuk"),
        ("하린", "harin"), ("경민", "kyungmin"), ("채은", "chaeeun"), ("민석", "minseok"),
        ("서연", "seoyeon"), ("지호", "jiho"), ("유나", "yuna"), ("도현", "dohyun"),
        ("아린", "arin"), ("태양", "taeyang"), ("소희", "sohee"), ("정우", "jungwoo"),
        ("연우", "yeonwoo"), ("슬기", "seulgi")
    ]
    k_name, e_name = names[(i - 51) % len(names)]
    tag = ["daily", "style", "life", "vibes", "studio", "photo", "fit", "space", "gram", "story"][i % 10]
    username = f"{e_name}_{tag}_{i}"
    full_name = f"{k_name} | {cat.upper()}"
    bio = f"소소하고 특별한 일상의 기록 ✨ {cat} 콘텐츠를 공유해요 💌"
    web = f"https://{username}.link"
    verified = (i % 7 == 0)
    USER_PROFILES.append((username, full_name, bio, cat, web, verified))

# Post Captions & Locations by Category
CATEGORY_CAPTIONS = {
    "cafe": [
        ("성수동 골목 숨은 로스터리 카페에서 마시는 게이샤 드립 커피 ☕ 산미와 꽃향이 예술이네요! #성수카페 #스페셜티커피 #카페투어", "성수동 서울숲 카페거리"),
        ("주말 아침 갓 구운 바질 토마토 크루아상과 시원한 플랫 화이트 🥐 창가 자리 햇살이 너무 좋아요 #연남동카페 #브런치", "연남동 경의선숲길"),
        ("한남동 골목의 고즈넉한 티 하우스 🍵 말차 라떼와 모나카 세트의 환상적인 조합 #한남동카페 #티타임", "한남동 블루스퀘어 뒤편"),
        ("도심 속 정원 같은 대형 온실 카페 🌿 식물들 사이에서 피어나는 여유로운 주말 #온실카페 #플랜테리어 #힐링", "양재천 카페거리"),
        ("을지로 인쇄소 골목 4층에 숨겨진 빈티지 LP 카페 📻 턴테이블에서 흘러나오는 재즈 선율 #을지로카페 #힙지로", "을지로 3가"),
    ],
    "travel": [
        ("제주 동쪽 오름에서 맞이한 황홀한 일출 🌅 붉게 물드는 하늘과 바다를 보며 힐링 #제주도여행 #오름일출", "제주 용눈이오름"),
        ("파리 에펠탑 앞 잔디밭에서 바게트 샌드위치 먹으며 피크닉 🇫🇷 날씨마저 완벽했던 하루 #파리여행 #에펠탑", "파리 샹드마르스 공원"),
        ("도쿄 시부야의 활기찬 밤거리 🇯🇵 네온사인과 화려한 도시 풍경 #도쿄여행 #시부야스크램블", "도쿄 시부야"),
        ("스위스 인터라켄 융프라우요흐 가는 길 🇨🇭 눈 덮인 알프스 산맥의 웅장함에 압도당했어요 #스위스 #알프스", "스위스 인터라켄"),
        ("강릉 안목해변 커피거리에서 바라본 푸른 동해 바다 파도 🌊 윤슬이 보석처럼 반짝여요 #강릉여행 #안목해변", "강릉 안목해변"),
    ],
    "fashion": [
        ("오늘의 미니멀 데일리룩 🖤 블랙 린넨 셋업에 실버 악세서리로 포인트 #OOTD #데일리룩 #미니멀룩", "한남동 쇼룸"),
        ("가을 시즌 필수템 오버핏 트렌치코트 코디 🍂 클래식하면서도 편안한 무드 #가을코디 #스트릿패션", "압구정 로데오"),
        ("성수 팝업스토어 나들이 룩 🕶️ 화이트 와이드 팬츠와 빈티지 레더 자켓 조합 #성수패션 #패션스타그램", "더현대 서울"),
        ("편안하면서도 스타일리시한 주말 원마일웨어 🏃‍♀️ 볼캡과 볼드한 스니커즈 매치 #원마일웨어 #캐주얼룩", "서울숲 공원"),
        ("클래식 네이비 블레이저와 스트레이트 데님 팬츠 👖 실패 없는 정석 코디 #출근룩 #데일리코디", "광화문 광장"),
    ],
    "food": [
        ("주말 저녁 한우 안심 스테이크 & 트러플 매쉬드 포테이토 홈쿠킹 🥩🍷 완벽한 미디엄 레어!", "스위트 홈 키친"),
        ("바질 페스토와 신선한 부라타 치즈 콜드 파스타 🍝 향긋함이 입안 가득 퍼지는 맛 #홈쿡 #파스타", "연남동 키친 스튜디오"),
        ("제철 대방어와 참치 사시미 오마카세 코스 🐟 입에 넣자마자 살살 녹네요 #스시야 #오마카세", "도산공원 스시 맛집"),
        ("겉바속촉 수제 통삼겹 바베큐와 구운 아스파라거스 🥓 주말 캠핑 요리로 최고예요 #캠핑요리 #바베큐", "가평 캠핑장"),
        ("얼큰하고 시원한 해물 가득 짬뽕 파스타 🦞 해산물 풍미가 가득해요 #맛집탐방 #푸드스타그램", "이태원 레스토랑"),
    ],
    "fitness": [
        ("새벽 6시 한강 10km 조깅 완료 🏃‍♂️ 맑은 공기 마시며 뛰니까 하루가 상쾌해요! #오운완 #러닝크루 #마라톤", "여의도 한강공원"),
        ("하체 데이! 스쿼트 140kg 5세트 완료 💪 땀 흘린 만큼 성장하는 뿌듯함 #헬스타그램 #웨이트트레이닝", "강남 피트니스 클럽"),
        ("아침을 깨우는 리포머 필라테스 코어 강화 세션 🧘‍♀️ 몸과 마음이 정렬되는 느낌 #필라테스 #체형교정", "청담 필라테스 스튜디오"),
        ("친구들과 함께한 주말 클라이밍 🧗‍♀️ 드디어 완등한 빨간색 난이도 코스! 손에 굳은살 뿌듯해요 #볼더링", "성수 클라이밍 짐"),
        ("퇴근 후 실내 테니스 레슨 🎾 백핸드 스트로크 자세 교정 중! 땀 흠뻑 젖었네요 #테니스 #테린이", "양재 실내 테니스장"),
    ],
    "pets": [
        ("날씨 좋은 날 잔디밭에서 공놀이 삼매경 🎾 공 던져줄 때까지 꼬리 붕붕 흔드는 천사견 #골든리트리버 #댕댕이", "올림픽공원 잔디마당"),
        ("햇살 따스한 오후 캣타워 꼭대기에서 낮잠 자는 치즈 냥이 🐱 젤리 발바닥 너무 귀여워 #고양이 #냥스타그램", "우리집 거실"),
        ("애견 카페에서 신나게 뛰어놀고 기절한 멍멍이 🐶 잘 때가 제일 천사야 #강아지일상 #멍스타그램", "남양주 애견카페"),
        ("새로 사준 스크래처 마음에 쏙 들었는지 하루 종일 긁는 중 🐾 꾹꾹이 서비스까지 해줬어요 #집사일상", "홈 스위트 홈"),
        ("낙엽 밟으며 신나게 산책하는 가을 강아지 🍂 코에 낙엽 묻히고 신났어요 #가을산책 #반려견", "서울숲 산책로"),
    ],
    "tech": [
        ("드디어 완성한 2026 데스크테리어 셋업 💻✨ 49인치 커브드 모니터와 원목 데스크의 조화 #데스크셋업 #맥북", "홈 오피스"),
        ("새로 빌드한 65% 배열 기계식 커스텀 키보드 ⌨️ 윤활 작업 끝내니 타건음이 조약돌 굴러가는 소리네요 #키보드 #ASMR", "작업실"),
        ("M3 Max 칩셋 맥북 프로 언박싱 📦 영상 렌더링 속도가 이전 세대와 비교 불가네요 #테크리뷰 #애플", "테크 랩"),
        ("주말 코딩 & 커피 타임 ☕ 깔끔한 다크 모드 IDE와 함께 버그 없는 하루 만들기 #개발자 #코딩스타그램", "성수 코워킹 스페이스"),
        ("레트로 무드 감성 게임룸 🕹️ 플레이스테이션과 앰비언트 라이트로 가득 찬 휴식 공간 #게임룸 #인테리어", "마이 룸"),
    ],
    "art": [
        ("이번 주말 오픈한 현대미술 기획전 'Light & Space' 다녀왔어요 🎨 빛과 공간의 조화가 주는 울림", "한남동 리움미술관"),
        ("물레 돌리며 빚어낸 나만의 백자 화병 🏺 가마에서 구워져 나올 색감이 너무 기대돼요 #도예 #핸드메이드", "이천 도예마을"),
        ("아이패드로 작업한 가을 숲속 일러스트 🍂 따뜻한 색감으로 완성해 보았습니다 #일러스트 #디지털드로잉", "아틀리에"),
        ("원데이 가죽공예로 만든 여권 케이스 ✈️ 내 손으로 새긴 이니셜이 주는 특별함 #가죽공예 #원데이클래스", "망원동 공방"),
        ("주말 오일 파스텔 풍경화 작업 🖼️ 꾸덕꾸덕한 질감으로 표현한 노을빛 하늘 #유화 #취미미술", "아트 스튜디오"),
    ]
}

COMMENTS_POOL = [
    "사진 분위기 진짜 미쳤네요... 색감 너무 좋아요! ✨",
    "여기 위치가 어디인가요? 다음 주말에 꼭 가봐야겠어요 ☕",
    "착장 정보 너무 궁금해요! 자켓 어디 제품인가요? 🧥",
    "크루아상 결 살아있는 것 좀 보세요 🤤 빵순이 눈 돌아갑니다",
    "항상 좋은 영감 주는 피드 감사합니다 🙌",
    "와 뷰가 대박이네요! 힐링 제대로 하고 갑니다 🌊",
    "운동 자극 팍팍 받고 갑니다 오늘도 열운 파이팅!! 💪",
    "댕댕이 발바닥 너무 치명적이에요 ㅠㅠ 심쿵사 🐾❤️",
    "데스크 셋업 너무 깔끔하네요 조명 정보 알 수 있을까요?",
    "일몰 색감이 비현실적이에요 🌅 필카 어떤 기종 쓰세요?",
    "팔로우하고 갑니다! 자주 소통해요 ㅎㅎ 맞팔 환영합니다 ✨",
    "맛있겠다... 퇴근길에 당장 먹으러 달려가고 싶어요 🍕",
    "영상 릴스 보고 넘어왔는데 피드도 감성 맛집이네요 🔥",
    "오늘도 멋진 하루 보내세요 응원합니다! 😊",
    "이 조합 찬성입니다 👍 센스 최고예요!",
    "소리 켜고 들으니까 빗소리 ASMR 완전 힐링되네요 🎧",
    "피드가 너무 예뻐서 한참 구경하다 갑니다 📸",
    "장소 저장 완료! 이번 여행 코스에 꼭 넣어야겠어요 ✈️",
    "진짜 너무 귀여워서 멍하니 10번 넘게 봤어요 ㅋㅋㅋ 🐱",
    "도자기 완성품 나오면 꼭 피드에 올려주세요 기대됩니다 🏺"
]

def generate_massive_data():
    db = SessionLocal()
    print("=" * 60)
    print("🚀 100명 계정 & 대규모 고품질 실제 서비스 레벨 시딩 시작...")
    print("=" * 60)

    # 1. Check existing users (Keep user 11: 제임스 cjswo329329@gmail.com)
    existing_users = db.query(User).all()
    user_map = {u.username: u for u in existing_users}
    
    # Check if target user exists
    target_user = db.query(User).filter(User.email == "cjswo329329@gmail.com").first()
    if not target_user:
        target_user = User(
            username="제임스",
            email="cjswo329329@gmail.com",
            hashed_password=get_password_hash("aaaa1234"),
            full_name="제임스",
            bio="Instagram에 오신 것을 환영합니다 ✨ | Daily, Tech & Lifestyle",
            profile_image_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            website="https://instagram.com/제임스",
            is_verified=True,
            gender="male"
        )
        db.add(target_user)
        db.commit()
        db.refresh(target_user)
    
    user_map[target_user.username] = target_user

    # Create 100 Users
    all_users = [target_user]
    created_count = 0

    for idx, prof in enumerate(USER_PROFILES):
        uname, fname, bio, cat, web, verified = prof
        if uname in user_map:
            user = user_map[uname]
        else:
            avatar = AVATAR_URLS[idx % len(AVATAR_URLS)]
            user = User(
                username=uname,
                email=f"{uname}@example.com",
                hashed_password=get_password_hash("aaaa1234"),
                full_name=fname,
                bio=bio,
                profile_image_url=avatar,
                website=web,
                is_verified=verified,
                gender="female" if idx % 2 == 0 else "male",
                created_at=datetime.now() - timedelta(days=random.randint(10, 60))
            )
            db.add(user)
            created_count += 1
        all_users.append(user)

    db.commit()
    for u in all_users:
        db.refresh(u)
    
    # Deduplicate user list
    unique_users_dict = {u.id: u for u in all_users}
    all_users = list(unique_users_dict.values())

    print(f"✅ 총 사용자 계정 준비 완료: {len(all_users)}명 (신규 생성: {created_count}명)")

    # 2. Generate Dense Follower Network (500+ follows)
    print("⏳ 팔로우 네트워크 구축 중...")
    existing_follows = set(
        (f.follower_id, f.following_id) for f in db.query(Follow).all()
    )
    new_follows = []

    # Make target_user follow 35 creators, and 45 creators follow target_user
    for other in all_users:
        if other.id == target_user.id:
            continue
        # Follow target_user
        if (other.id, target_user.id) not in existing_follows and random.random() < 0.45:
            new_follows.append(Follow(follower_id=other.id, following_id=target_user.id, status="accepted"))
            existing_follows.add((other.id, target_user.id))
        # Target user follows others
        if (target_user.id, other.id) not in existing_follows and random.random() < 0.35:
            new_follows.append(Follow(follower_id=target_user.id, following_id=other.id, status="accepted"))
            existing_follows.add((target_user.id, other.id))

    # Inter-user follows
    for u1 in all_users[:50]:
        candidates = random.sample(all_users, min(15, len(all_users)))
        for u2 in candidates:
            if u1.id != u2.id and (u1.id, u2.id) not in existing_follows:
                new_follows.append(Follow(follower_id=u1.id, following_id=u2.id, status="accepted"))
                existing_follows.add((u1.id, u2.id))

    if new_follows:
        db.add_all(new_follows)
        db.commit()
    print(f"✅ 팔로우 관계 생성 완료: 총 {db.query(Follow).count()}건")

    # 3. Generate 130+ Feeds (Posts) & PostMedia
    print("⏳ 130+ 피드 게시물 및 다중 사진 생성 중...")
    current_post_count = db.query(Post).count()
    target_posts_to_create = max(0, 130 - current_post_count)

    categories_list = list(IMAGE_BANKS.keys())
    created_posts = []

    for i in range(target_posts_to_create):
        author = all_users[i % len(all_users)]
        cat = categories_list[i % len(categories_list)]
        caption_pair = random.choice(CATEGORY_CAPTIONS[cat])
        caption, location = caption_pair
        
        # Post creation time distributed over last 14 days
        hours_ago = random.randint(1, 14 * 24)
        created_time = datetime.now() - timedelta(hours=hours_ago)

        post = Post(
            user_id=author.id,
            caption=caption,
            location=location,
            created_at=created_time,
            updated_at=created_time
        )
        db.add(post)
        db.commit()
        db.refresh(post)
        created_posts.append(post)

        # 1 to 4 images per post
        num_images = random.choices([1, 2, 3], weights=[0.6, 0.25, 0.15])[0]
        cat_images = random.sample(IMAGE_BANKS[cat], min(num_images, len(IMAGE_BANKS[cat])))
        
        for o_idx, img_url in enumerate(cat_images):
            pm = PostMedia(
                post_id=post.id,
                media_url=img_url,
                media_type="image",
                order_index=o_idx,
                created_at=created_time
            )
            db.add(pm)

    db.commit()
    all_posts = db.query(Post).all()
    print(f"✅ 피드 게시물 생성 완료: 총 {len(all_posts)}개 (미디어 {db.query(PostMedia).count()}장)")

    # 4. Generate 120+ Active 24h Stories
    print("⏳ 120+ 실시간 24h 스토리 생성 중...")
    current_stories = db.query(Story).count()
    target_stories_to_create = max(0, 120 - current_stories)

    new_stories = []
    for i in range(target_stories_to_create):
        author = all_users[i % len(all_users)]
        cat = categories_list[i % len(categories_list)]
        img_url = random.choice(IMAGE_BANKS[cat])
        
        # Active within past 24 hours
        created_hours_ago = random.uniform(0.5, 20.0)
        c_time = datetime.now() - timedelta(hours=created_hours_ago)
        exp_time = c_time + timedelta(hours=24) # 24h expiration

        story = Story(
            user_id=author.id,
            media_url=img_url,
            media_type="image",
            created_at=c_time,
            expires_at=exp_time
        )
        new_stories.append(story)

    if new_stories:
        db.add_all(new_stories)
        db.commit()
    print(f"✅ 활성 스토리 생성 완료: 총 {db.query(Story).count()}개")

    # 5. Generate 110+ Reels with Video URLs & Soundtracks
    print("⏳ 110+ 릴스 동영상 및 오디오 트랙 생성 중...")
    current_reels = db.query(Reel).count()
    target_reels_to_create = max(0, 110 - current_reels)

    new_reels = []
    for i in range(target_reels_to_create):
        author = all_users[i % len(all_users)]
        template = REEL_VIDEOS[i % len(REEL_VIDEOS)]
        
        c_time = datetime.now() - timedelta(hours=random.randint(2, 200))
        reel = Reel(
            user_id=author.id,
            video_url=template["video"],
            poster_url=template["poster"],
            caption=template["caption"],
            audio_title=template["audio"],
            audio_cover_url=template["poster"],
            audio_is_explicit=False,
            shares_count=random.randint(50, 4500),
            reposts_count=random.randint(10, 800),
            created_at=c_time
        )
        new_reels.append(reel)

    if new_reels:
        db.add_all(new_reels)
        db.commit()
    all_reels = db.query(Reel).all()
    print(f"✅ 릴스 동영상 생성 완료: 총 {len(all_reels)}개")

    # 6. Generate 350+ Realistic Comments
    print("⏳ 350+ 실시간 댓글 생성 중...")
    existing_comments_count = db.query(Comment).count()
    target_comments = max(0, 350 - existing_comments_count)

    new_comments = []
    for i in range(target_comments):
        commenter = random.choice(all_users)
        # Randomly choose post or reel
        if random.random() < 0.7 and all_posts:
            target_post = random.choice(all_posts)
            c_text = random.choice(COMMENTS_POOL)
            c_time = target_post.created_at + timedelta(minutes=random.randint(5, 500))
            new_comments.append(Comment(
                user_id=commenter.id,
                post_id=target_post.id,
                content=c_text,
                created_at=c_time
            ))
        elif all_reels:
            target_reel = random.choice(all_reels)
            c_text = random.choice(COMMENTS_POOL)
            c_time = target_reel.created_at + timedelta(minutes=random.randint(5, 500))
            new_comments.append(Comment(
                user_id=commenter.id,
                reel_id=target_reel.id,
                content=c_text,
                created_at=c_time
            ))

    if new_comments:
        db.add_all(new_comments)
        db.commit()
    print(f"✅ 댓글 생성 완료: 총 {db.query(Comment).count()}건")

    # 7. Generate 600+ Likes (Posts, Reels)
    print("⏳ 600+ 좋아요 기록 생성 중...")
    existing_likes_set = set()
    for l in db.query(Like).all():
        if l.post_id:
            existing_likes_set.add((l.user_id, "post", l.post_id))
        elif l.reel_id:
            existing_likes_set.add((l.user_id, "reel", l.reel_id))

    new_likes = []
    # Generate likes across posts (avoiding target_user unsolicited likes unless natural)
    for p in all_posts:
        likers = random.sample(all_users, min(random.randint(3, 18), len(all_users)))
        for u in likers:
            if u.id != target_user.id and (u.id, "post", p.id) not in existing_likes_set:
                new_likes.append(Like(user_id=u.id, post_id=p.id, created_at=p.created_at + timedelta(minutes=random.randint(2, 300))))
                existing_likes_set.add((u.id, "post", p.id))

    for r in all_reels:
        likers = random.sample(all_users, min(random.randint(4, 25), len(all_users)))
        for u in likers:
            if u.id != target_user.id and (u.id, "reel", r.id) not in existing_likes_set:
                new_likes.append(Like(user_id=u.id, reel_id=r.id, created_at=r.created_at + timedelta(minutes=random.randint(2, 300))))
                existing_likes_set.add((u.id, "reel", r.id))

    if new_likes:
        db.add_all(new_likes)
        db.commit()
    print(f"✅ 좋아요 생성 완료: 총 {db.query(Like).count()}건")

    # 8. Generate 60+ Bookmarks (Saved Posts)
    print("⏳ 60+ 북마크 및 컬렉션 저장 생성 중...")
    existing_bm_set = set(
        (b.user_id, b.post_id) for b in db.query(Bookmark).filter(Bookmark.post_id.isnot(None)).all()
    )
    new_bookmarks = []
    for u in all_users[:25]:
        sample_posts = random.sample(all_posts, min(random.randint(2, 5), len(all_posts)))
        for p in sample_posts:
            if (u.id, p.id) not in existing_bm_set:
                new_bookmarks.append(Bookmark(user_id=u.id, post_id=p.id, created_at=p.created_at + timedelta(hours=1)))
                existing_bm_set.add((u.id, p.id))

    if new_bookmarks:
        db.add_all(new_bookmarks)
        db.commit()
    print(f"✅ 북마크 생성 완료: 총 {db.query(Bookmark).count()}건")

    # 9. Generate 15+ DM Conversations & 70+ Messages with target_user & creators
    print("⏳ 15+ DM 대화방 및 70+ 실시간 대화 메시지 생성 중...")
    existing_convs = db.query(Conversation).all()
    existing_conv_pairs = set((c.user1_id, c.user2_id) for c in existing_convs)

    sample_creators = [u for u in all_users if u.id != target_user.id][:15]
    new_messages = []

    DM_DIALOGUES = [
        [
            ("안녕하세요 제임스님! 피드 사진 구도가 너무 좋아서 연락드렸어요 😊", False),
            ("안녕하세요! 좋게 봐주셔서 감사합니다 ㅎㅎ", True),
            ("혹시 이번 주말 성수동 팝업스토어 같이 가실래요?", False),
            ("오 좋은데요! 토요일 오후에 시간 어떠세요?", True),
            ("토요일 2시 성수역 3번 출구에서 봬요! 🎉", False)
        ],
        [
            ("작가님 혹시 포토그래피 레슨도 진행하시나요?", False),
            ("네! 주말에 원데이 클래스 정기적으로 열고 있습니다", True),
            ("커리큘럼이랑 장소 DM으로 받아볼 수 있을까요?", False),
            ("네 확인 후 바로 상세 안내 링크 보내드릴게요 ✨", True)
        ],
        [
            ("추천해주신 에티오피아 원두 드립 카페 다녀왔어요! ☕", False),
            ("어떠셨나요? 산미 깔끔하고 괜찮았죠?", True),
            ("진짜 인생 커피 등극했습니다... 앞으로 자주 갈 것 같아요 🤤", False)
        ],
        [
            ("안녕하세요! 다음 주 콜라보 릴스 촬영 일정 조율 가능할까요?", False),
            ("네 가능합니다! 수요일이나 목요일 편하신 시간으로 맞춰볼게요", True),
            ("목요일 오후 4시 강남 스튜디오로 예약해둘게요 감사합니다! 👍", False)
        ],
        [
            ("스토리 보고 연락드려요! 착용하신 자켓 브랜드 알 수 있을까요? 🧥", False),
            ("아 저 자켓 지난 시즌 빈티지 제품이에요! 홍대 샵에서 구매했습니다", True),
            ("친절한 답변 감사드립니다 좋은 하루 보내세요! ❤️", False)
        ]
    ]

    for idx, creator in enumerate(sample_creators):
        u1_id = min(target_user.id, creator.id)
        u2_id = max(target_user.id, creator.id)
        
        conv_id = f"conv-user-{u1_id}-{u2_id}"
        conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
        if not conv:
            conv = Conversation(
                id=conv_id,
                user1_id=u1_id,
                user2_id=u2_id,
                created_at=datetime.now() - timedelta(days=random.randint(1, 5))
            )
            db.add(conv)
            db.commit()
            db.refresh(conv)

        dialogue = DM_DIALOGUES[idx % len(DM_DIALOGUES)]
        base_time = conv.created_at
        for m_idx, (m_text, is_me) in enumerate(dialogue):
            sender_id = target_user.id if is_me else creator.id
            msg_id = f"msg-{conv_id}-{m_idx+1}"
            if not db.query(Message).filter(Message.id == msg_id).first():
                msg = Message(
                    id=msg_id,
                    conversation_id=conv.id,
                    sender_id=sender_id,
                    text=m_text,
                    is_read=True,
                    reactions='["❤️"]' if (m_idx % 2 == 1) else "[]",
                    created_at=base_time + timedelta(minutes=m_idx * 12)
                )
                db.add(msg)

    db.commit()
    print(f"✅ DM 대화방 생성 완료: 대화방 {db.query(Conversation).count()}개, 메시지 {db.query(Message).count()}건")

    # 10. Generate 40+ Notifications for target_user & others
    print("⏳ 40+ 활동 알림 내역 생성 중...")
    new_notifs = []
    for i in range(30):
        sender = random.choice([u for u in all_users if u.id != target_user.id])
        n_type = random.choice(["like_post", "comment", "follow"])
        target_post = random.choice(all_posts) if all_posts else None
        
        notif = Notification(
            recipient_id=target_user.id,
            sender_id=sender.id,
            type=n_type,
            target_id=target_post.id if target_post and n_type != "follow" else None,
            is_read=random.choice([True, False]),
            created_at=datetime.now() - timedelta(hours=random.randint(1, 72))
        )
        new_notifs.append(notif)

    if new_notifs:
        db.add_all(new_notifs)
        db.commit()
    print(f"✅ 알림 생성 완료: 총 {db.query(Notification).count()}건")

    db.close()
    print("=" * 60)
    print("🎉 100명 계정 & 실제 서비스 수준 초대용량 시딩 성공적으로 완료!")
    print("=" * 60)

if __name__ == "__main__":
    generate_massive_data()
