import os
from backend.app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"[*] Starting Professional Basic School Management System Backend on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=True)
