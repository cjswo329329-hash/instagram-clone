import os
import sqlite3
import sys

# Windows 콘솔 인코딩 대응
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def init_database():
    # 데이터베이스 파일 위치: backend/instagram.db
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, "instagram.db")
    schema_path = os.path.join(base_dir, "scripts", "schema.sql")

    print("[INFO] SQLite 데이터베이스 초기화 시작...")
    print(f"[INFO] DB 파일 경로: {db_path}")
    print(f"[INFO] 스키마 파일: {schema_path}")

    if not os.path.exists(schema_path):
        print(f"[ERROR] 스키마 파일을 찾을 수 없습니다: {schema_path}")
        sys.exit(1)

    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 1. backend.md 2.1 필수 SQLite PRAGMA 설정
        print("[INFO] SQLite 필수 최적화 PRAGMA 적용 중...")
        cursor.execute("PRAGMA foreign_keys = ON;")
        cursor.execute("PRAGMA journal_mode = WAL;")
        cursor.execute("PRAGMA synchronous = NORMAL;")
        cursor.execute("PRAGMA busy_timeout = 5000;")
        cursor.execute("PRAGMA cache_size = -64000;")
        
        # PRAGMA 확인
        journal_mode = cursor.execute("PRAGMA journal_mode;").fetchone()[0]
        foreign_keys = cursor.execute("PRAGMA foreign_keys;").fetchone()[0]
        busy_timeout = cursor.execute("PRAGMA busy_timeout;").fetchone()[0]
        cache_size = cursor.execute("PRAGMA cache_size;").fetchone()[0]

        print(f"   - journal_mode: {journal_mode}")
        print(f"   - foreign_keys: {foreign_keys} (1=ON)")
        print(f"   - busy_timeout: {busy_timeout}ms")
        print(f"   - cache_size: {cache_size}")

        # 2. DDL 스키마 적용
        print("[INFO] 스키마 DDL 실행 중 (테이블, 인덱스, 제약조건)...")
        cursor.executescript(schema_sql)
        conn.commit()

        # 3. 생성된 테이블 검증
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"\n[SUCCESS] 생성된 테이블 목록 ({len(tables)}개):")
        for idx, table in enumerate(tables, 1):
            cursor.execute(f"PRAGMA table_info({table});")
            col_count = len(cursor.fetchall())
            print(f"   {idx}. {table} ({col_count}개 컬럼)")

        # 4. 생성된 커스텀 인덱스 검증
        cursor.execute("SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' ORDER BY tbl_name, name;")
        indices = cursor.fetchall()
        print(f"\n[SUCCESS] 생성된 커스텀 인덱스 목록 ({len(indices)}개):")
        for idx, (idx_name, tbl_name) in enumerate(indices, 1):
            print(f"   {idx}. {idx_name} on {tbl_name}")

        print("\n[SUCCESS] SQLite 데이터베이스 스키마 구축이 완벽하게 완료되었습니다!")

    except Exception as e:
        conn.rollback()
        print(f"[ERROR] 데이터베이스 초기화 실패: {e}")
        raise e
    finally:
        conn.close()

if __name__ == "__main__":
    init_database()
