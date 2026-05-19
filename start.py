import subprocess
import sys
import os
import time
import webbrowser
import threading

PORT = os.environ.get("PORT", "5173")
FILTER = "@workspace/syntax-tree"
CMD = ["pnpm", "--filter", FILTER, "run", "dev"]

def open_browser():
    time.sleep(3)
    url = f"http://localhost:{PORT}"
    print(f"\n사이트 열기: {url}\n")
    webbrowser.open(url)

def main():
    print("=" * 50)
    print("  문법 트리 생성기 / 인공어 제작도구")
    print("=" * 50)
    print(f"\n개발 서버 시작 중 (포트 {PORT})...\n")

    if not os.path.isdir("artifacts/syntax-tree"):
        print("[오류] artifacts/syntax-tree 디렉터리가 없습니다.")
        print("      이 스크립트는 프로젝트 루트에서 실행해야 합니다.")
        sys.exit(1)

    threading.Thread(target=open_browser, daemon=True).start()

    try:
        result = subprocess.run(CMD, check=False)
        sys.exit(result.returncode)
    except FileNotFoundError:
        print("[오류] pnpm 명령을 찾을 수 없습니다.")
        print("      https://pnpm.io 에서 pnpm을 설치한 뒤 다시 실행하세요.")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n서버가 종료되었습니다.")

if __name__ == "__main__":
    main()
