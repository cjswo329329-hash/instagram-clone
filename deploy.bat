@echo off
chcp 65001 > nul
echo ========================================================
echo 🚀 [Instagram Clone] 원클릭 프로덕션 자동 배포 파이프라인
echo ========================================================
echo.

echo 1. 백엔드 상용화 검증 및 보안 테스트 수행...
cd /d %~dp0backend
python scripts/test_admin_commercial_readiness.py
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] 상용화 검증 테스트에 실패했습니다. 배포를 중단합니다.
    pause
    exit /b 1
)

echo.
echo 2. 프론트엔드 프로덕션 최적화 빌드...
cd /d %~dp0frontend
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] 프론트엔드 빌드에 실패했습니다. 배포를 중단합니다.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo ✅ 빌드 및 보안 검증 통과! 서버를 프로덕션 모드로 기동합니다.
echo ========================================================
cd /d %~dp0
start "Instagram Production Backend" cmd /k "cd /d %~dp0backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4"
start "Instagram Production Frontend" cmd /k "cd /d %~dp0frontend && npm run preview -- --port 80 --host"

echo.
echo 모든 서버가 성공적으로 배포 및 실행되었습니다!
echo - 프론트엔드: http://localhost
echo - 백엔드 API: http://localhost:8000/docs
echo.
pause
