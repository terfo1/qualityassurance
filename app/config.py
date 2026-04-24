import os


class Settings:
    def __init__(self) -> None:
        self.database_url = os.getenv(
            "DATABASE_URL",
            "postgresql+psycopg://novacart:novacart@localhost:5432/novacart",
        )
        self.auth_secret = os.getenv("AUTH_SECRET", "change-me-in-production")
        self.demo_email = os.getenv("DEMO_EMAIL", "demo@novacart.local")
        self.admin_email = os.getenv("ADMIN_EMAIL", "admin@novacart.local")
        self.qa_fault_injection_enabled = os.getenv("QA_FAULT_INJECTION_ENABLED", "false").lower() == "true"
        self.qa_fault_injection_max_delay_ms = int(os.getenv("QA_FAULT_INJECTION_MAX_DELAY_MS", "5000"))


settings = Settings()
