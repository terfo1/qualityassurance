from app.domain.entities import User, UserRole


class InMemoryUserRepository:
    def __init__(self) -> None:
        self._users: dict[int, User] = {}
        self._next_id = 1

    def get(self, user_id: int) -> User | None:
        return self._users.get(user_id)

    def get_by_email(self, email: str) -> User | None:
        email = email.lower()
        for user in self._users.values():
            if user.email.lower() == email:
                return user
        return None

    def create(self, user: User) -> User:
        self._users[user.id] = user
        return user

    def next_id(self) -> int:
        value = self._next_id
        self._next_id += 1
        return value

    def seed_user(
        self,
        email: str,
        full_name: str,
        password_hash: str,
        role: UserRole = UserRole.customer,
        is_active: bool = True,
    ) -> User:
        user = User(
            id=self.next_id(),
            email=email.lower(),
            full_name=full_name,
            password_hash=password_hash,
            role=role,
            is_active=is_active,
        )
        return self.create(user)
