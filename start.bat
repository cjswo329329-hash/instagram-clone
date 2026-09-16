@echo off
chcp 65001 > nul
title Instagram Clone Launcher
echo ========================================================
echo [Instagram Clone] 프론트엔드 및 백엔드 서버 동시 실행
echo ========================================================
echo.
echo 1. 백엔드 FastAPI (Uvicorn) 서버 시작 (포트: 8000)...
start "Instagram Backend (FastAPI)" cmd /k "chcp 65001 > nul && cd /d "%~dp0backend" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo 2. 프론트엔드 React (Vite) 서버 시작 (포트: 5173)...
start "Instagram Frontend (Vite)" cmd /k "chcp 65001 > nul && cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================================
echo ✅ 모든 서버가 성공적으로 시작되었습니다!
echo - 프론트엔드 접속 주소: http://localhost:5173
echo - 비밀번호 재설정 주소: http://localhost:5173/accounts/password/reset
echo - 백엔드 API 문서: http://127.0.0.1:8000/docs
echo ========================================================
echo.
echo 이 창을 닫아도 실행된 서버 창들은 계속 유지됩니다.
pause
