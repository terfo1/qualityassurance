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


settings = Settings()
