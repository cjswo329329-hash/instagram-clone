#!/bin/bash
set -e

echo "========================================================"
echo "🚀 [Instagram Clone] 프로덕션 자동 배포 파이프라인 시작"
echo "========================================================"

# 1. 최신 코드 동기화
echo "📥 1. Git 저장소 최신 커밋 풀링..."
git pull origin main

# 2. 백엔드 검증 테스트 실행
echo "🧪 2. 상용화 보안 및 성능 검증 테스트 수행..."
cd backend
python scripts/test_admin_commercial_readiness.py
python scripts/red_team_attack_suite.py
cd ..

# 3. Docker 컨테이너 무중단 빌드 및 배포
echo "🐳 3. Docker 컨테이너 무중단 빌드 및 재배포..."
docker compose build
docker compose up -d

# 4. 상태 헬스체크 확인
echo "🏥 4. 서비스 헬스체크 진단..."
sleep 5
docker compose ps

echo "========================================================"
echo "🎉 모든 자동 배포 절차가 성공적으로 완료되었습니다!"
echo "웹 서비스 접속: http://localhost"
echo "API 문서: http://localhost:8000/docs"
echo "========================================================"
