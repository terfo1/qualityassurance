import unittest

from app.application.dto import LoginCommand, RegisterUserCommand
from app.application.services import AuthService
from app.domain.exceptions import ValidationError
from app.security import hash_password
from tests.test_helpers import InMemoryUserRepository


class AuthServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.users = InMemoryUserRepository()
        self.service = AuthService(self.users)

    def test_register_creates_lowercased_user_and_token(self) -> None:
        payload = RegisterUserCommand(
            email="Buyer@Example.com",
            full_name="Buyer One",
            password="Buyer123!",
        )

        result = self.service.register(payload)

        self.assertIn("token", result)
        self.assertEqual(result["user"]["email"], "buyer@example.com")
        self.assertIsNotNone(self.users.get_by_email("buyer@example.com"))

    def test_register_rejects_duplicate_email(self) -> None:
        self.users.seed_user(
            email="buyer@example.com",
            full_name="Buyer One",
            password_hash=hash_password("Buyer123!"),
        )

        with self.assertRaises(ValidationError):
            self.service.register(
                RegisterUserCommand(
                    email="buyer@example.com",
                    full_name="Buyer Two",
                    password="Buyer456!",
                )
            )

    def test_login_rejects_wrong_password(self) -> None:
        self.users.seed_user(
            email="buyer@example.com",
            full_name="Buyer One",
            password_hash=hash_password("Buyer123!"),
        )

        with self.assertRaises(ValidationError):
            self.service.login(LoginCommand(email="buyer@example.com", password="WrongPass1!"))

    def test_login_rejects_inactive_user(self) -> None:
        self.users.seed_user(
            email="buyer@example.com",
            full_name="Buyer One",
            password_hash=hash_password("Buyer123!"),
            is_active=False,
        )

        with self.assertRaises(ValidationError):
            self.service.login(LoginCommand(email="buyer@example.com", password="Buyer123!"))


if __name__ == "__main__":
    unittest.main()
