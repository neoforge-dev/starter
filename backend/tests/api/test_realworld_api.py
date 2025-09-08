"""
RealWorld API Test Suite

This module contains comprehensive tests for the RealWorld/Conduit API implementation.
Tests follow the Given-When-Then pattern for clarity and maintainability.

Test Coverage:
- Authentication (Registration, Login, Current User)
- Profiles (Get Profile, Follow/Unfollow)
- Articles (CRUD, Feed, Favoriting, Filtering)
- Comments (CRUD on articles)
- Tags (List all tags)

All tests use pytest fixtures and follow async patterns.
"""
import pytest
from typing import Dict, List
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.article import Article
from app.models.comment import Comment
from app.schemas.article import ArticleCreate, ArticleUpdate
from app.schemas.comment import CommentCreate
from app.schemas.user import UserCreate
from app.crud.user import user as user_crud
from app.core.security import create_access_token
from app.core.config import get_settings
from tests.factories import UserFactory


class TestRealWorldAuthentication:
    """Test authentication endpoints following RealWorld spec."""

    @pytest.mark.asyncio
    async def test_user_registration(self, client: AsyncClient, db: AsyncSession):
        """
        Given: A new user registration request
        When: POST /api/users with valid user data
        Then: User is created and JWT token is returned
        """
        user_data = {
            "user": {
                "username": "testuser",
                "email": "test@example.com",
                "password": "testpassword123"
            }
        }

        response = await client.post("/api/users", json=user_data)

        assert response.status_code == 201
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == "test@example.com"
        assert data["user"]["username"] == "testuser"
        assert "token" in data["user"]

    @pytest.mark.asyncio
    async def test_user_login(self, client: AsyncClient, db: AsyncSession):
        """
        Given: An existing user
        When: POST /api/users/login with valid credentials
        Then: JWT token is returned
        """
        # Create test user
        user_in = UserCreate(
            email="login@example.com",
            password="testpassword123",
            password_confirm="testpassword123",
            full_name="Login Test User"
        )
        user = await user_crud.create(db, obj_in=user_in)
        await db.commit()

        login_data = {
            "user": {
                "email": "login@example.com",
                "password": "testpassword123"
            }
        }

        response = await client.post("/api/users/login", json=login_data)

        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == "login@example.com"
        assert "token" in data["user"]

    @pytest.mark.asyncio
    async def test_get_current_user(self, client: AsyncClient, db: AsyncSession, test_settings):
        """
        Given: An authenticated user
        When: GET /api/user with valid JWT token
        Then: Current user information is returned
        """
        # Create test user
        user = await UserFactory.create(session=db, is_superuser=False)
        await db.commit()

        # Generate token
        token = create_access_token(
            subject=str(user.id),
            settings=test_settings
        )

        headers = {"Authorization": f"Token {token}"}
        response = await client.get("/api/user", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == user.email

    @pytest.mark.asyncio
    async def test_update_current_user(self, client: AsyncClient, db: AsyncSession, test_settings):
        """
        Given: An authenticated user
        When: PUT /api/user with updated data
        Then: User information is updated
        """
        # Create test user
        user = await UserFactory.create(session=db, is_superuser=False)
        await db.commit()

        # Generate token
        token = create_access_token(
            subject=str(user.id),
            settings=test_settings
        )

        headers = {"Authorization": f"Token {token}"}
        update_data = {
            "user": {
                "bio": "Updated bio",
                "image": "https://example.com/avatar.jpg"
            }
        }

        response = await client.put("/api/user", json=update_data, headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["bio"] == "Updated bio"


class TestRealWorldProfiles:
    """Test profile endpoints following RealWorld spec."""

    @pytest.mark.asyncio
    async def test_get_profile(self, client: AsyncClient, db: AsyncSession, test_settings):
        """
        Given: Two users exist
        When: GET /api/profiles/{username} as authenticated user
        Then: Profile information is returned with following status
        """
        # Create two users
        user1 = await UserFactory.create(session=db, is_superuser=False)
        user2 = await UserFactory.create(session=db, is_superuser=False)
        await db.commit()

        # Generate token for user1
        token = create_access_token(
            subject=str(user1.id),
            settings=test_settings
        )

        headers = {"Authorization": f"Token {token}"}
        response = await client.get(f"/api/profiles/{user2.email}", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert "profile" in data
        assert data["profile"]["username"] == user2.email
        assert "following" in data["profile"]

    @pytest.mark.asyncio
    async def test_follow_user(self, client: AsyncClient, db: AsyncSession, test_settings):
        """
        Given: Two users exist
        When: POST /api/profiles/{username}/follow
        Then: User is followed and following status is updated
        """
        # Create two users
        user1 = await UserFactory.create(session=db, is_superuser=False)
        user2 = await UserFactory.create(session=db, is_superuser=False)
        await db.commit()

        # Generate token for user1
        token = create_access_token(
            subject=str(user1.id),
            settings=test_settings
        )

        headers = {"Authorization": f"Token {token}"}
        response = await client.post(f"/api/profiles/{user2.email}/follow", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert "profile" in data
        assert data["profile"]["following"] is True

    @pytest.mark.asyncio
    async def test_unfollow_user(self, client: AsyncClient, db: AsyncSession, test_settings):
        """
        Given: User A follows User B
        When: DELETE /api/profiles/{username}/follow
        Then: User is unfollowed
        """
        # Create two users
        user1 = await UserFactory.create(session=db, is_superuser=False)
        user2 = await UserFactory.create(session=db, is_superuser=False)
        await db.commit()

        # Generate token for user1
        token = create_access_token(
            subject=str(user1.id),
            settings=test_settings
        )

        headers = {"Authorization": f"Token {token}"}

        # First follow
        await client.post(f"/api/profiles/{user2.email}/follow", headers=headers)

        # Then unfollow
        response = await client.delete(f"/api/profiles/{user2.email}/follow", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert "profile" in data
        assert data["profile"]["following"] is False


class TestRealWorldArticles:
    """Test article endpoints following RealWorld spec."""

    @pytest.mark.asyncio
    async def test_list_articles(self, client: AsyncClient, db: AsyncSession):
        """
        Given: Articles exist in the system
        When: GET /api/articles
        Then: List of articles is returned with pagination
        """
        response = await client.get("/api/articles")

        assert response.status_code == 200
        data = response.json()
        assert "articles" in data
        assert "articlesCount" in data
        assert isinstance(data["articles"], list)

    @pytest.mark.asyncio
    async def test_create_article(self, client: AsyncClient, db: AsyncSession, test_settings):
        """
        Given: An authenticated user
        When: POST /api/articles with article data
        Then: Article is created and returned
        """
        # Create test user
        user = await UserFactory.create(session=db, is_superuser=False)
        await db.commit()

        # Generate token
        token = create_access_token(
            subject=str(user.id),
            settings=test_settings
        )

        headers = {"Authorization": f"Token {token}"}
        article_data = {
            "article": {
                "title": "Test Article",
                "description": "Test Description",
                "body": "Test Body",
                "tagList": ["test", "article"]
            }
        }

        response = await client.post("/api/articles", json=article_data, headers=headers)

        assert response.status_code == 201
        data = response.json()
        assert "article" in data
        assert data["article"]["title"] == "Test Article"
        assert data["article"]["slug"] is not None
        assert "test" in data["article"]["tagList"]

    @pytest.mark.asyncio
    async def test_get_article_by_slug(self, client: AsyncClient, db: AsyncSession, test_settings):
        """
        Given: An article exists
        When: GET /api/articles/{slug}
        Then: Article details are returned
        """
        # Create test user and article
        user = await UserFactory.create(session=db, is_superuser=False)
        await db.commit()

        # Generate token
        token = create_access_token(
            subject=str(user.id),
            settings=test_settings
        )

        headers = {"Authorization": f"Token {token}"}
        article_data = {
            "article": {
                "title": "Test Article",
                "description": "Test Description",
                "body": "Test Body"
            }
        }

        # Create article
        create_response = await client.post("/api/articles", json=article_data, headers=headers)
        created_article = create_response.json()["article"]
        slug = created_article["slug"]

        # Get article by slug
        response = await client.get(f"/api/articles/{slug}")

        assert response.status_code == 200
        data = response.json()
        assert "article" in data
        assert data["article"]["slug"] == slug

    @pytest.mark.asyncio
    async def test_update_article(self, client: AsyncClient, db: AsyncSession, test_settings):
        """
        Given: An article exists and user is the author
        When: PUT /api/articles/{slug} with updated data
        Then: Article is updated
        """
        # Create test user and article
        user = await UserFactory.create(session=db, is_superuser=False)
        await db.commit()

        # Generate token
        token = create_access_token(
            subject=str(user.id),
            settings=test_settings
        )

        headers = {"Authorization": f"Token {token}"}
        article_data = {
            "article": {
                "title": "Original Title",
                "description": "Original Description",
                "body": "Original Body"
            }
        }

        # Create article
        create_response = await client.post("/api/articles", json=article_data, headers=headers)
        created_article = create_response.json()["article"]
        slug = created_article["slug"]

        # Update article
        update_data = {
            "article": {
                "title": "Updated Title",
                "description": "Updated Description"
            }
        }

        response = await client.put(f"/api/articles/{slug}", json=update_data, headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert "article" in data
        assert data["article"]["title"] == "Updated Title"
        assert data["article"]["description"] == "Updated Description"

    @pytest.mark.asyncio
    async def test_delete_article(self, client: AsyncClient, db: AsyncSession, test_settings):
        """
        Given: An article exists and user is the author
        When: DELETE /api/articles/{slug}
        Then: Article is deleted
        """
        # Create test user and article
        user = await UserFactory.create(session=db, is_superuser=False)
        await db.commit()

        # Generate token
        token = create_access_token(
            subject=str(user.id),
            settings=test_settings
        )

        headers = {"Authorization": f"Token {token}"}
        article_data = {
            "article": {
                "title": "Article to Delete",
                "description": "Will be deleted",
                "body": "Delete me"
            }
        }

        # Create article
        create_response = await client.post("/api/articles", json=article_data, headers=headers)
        created_article = create_response.json()["article"]
        slug = created_article["slug"]

        # Delete article
        response = await client.delete(f"/api/articles/{slug}", headers=headers)

        assert response.status_code == 204

        # Verify article is deleted
        get_response = await client.get(f"/api/articles/{slug}")
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_favorite_article(self, client: AsyncClient, db: AsyncSession, test_settings):
        """
        Given: An article exists and user is authenticated
        When: POST /api/articles/{slug}/favorite
        Then: Article is favorited
        """
        # Create two users
        author = await UserFactory.create(session=db, is_superuser=False)
        favoriter = await UserFactory.create(session=db, is_superuser=False)
        await db.commit()

        # Create article as author
        author_token = create_access_token(
            subject=str(author.id),
            settings=test_settings
        )

        headers = {"Authorization": f"Token {author_token}"}
        article_data = {
            "article": {
                "title": "Article to Favorite",
                "description": "Test favoriting",
                "body": "Favorite me"
            }
        }

        create_response = await client.post("/api/articles", json=article_data, headers=headers)
        created_article = create_response.json()["article"]
        slug = created_article["slug"]

        # Favorite article as different user
        favoriter_token = create_access_token(
            subject=str(favoriter.id),
            settings=test_settings
        )

        headers = {"Authorization": f"Token {favoriter_token}"}
        response = await client.post(f"/api/articles/{slug}/favorite", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert "article" in data
        assert data["article"]["favorited"] is True
        assert data["article"]["favoritesCount"] == 1

    @pytest.mark.asyncio
    async def test_unfavorite_article(self, client: AsyncClient, db: AsyncSession, test_settings):
        """
        Given: An article is favorited by user
        When: DELETE /api/articles/{slug}/favorite
        Then: Article is unfavorited
        """
        # Create two users
        author = await UserFactory.create(session=db, is_superuser=False)
        favoriter = await UserFactory.create(session=db, is_superuser=False)
        await db.commit()

        # Create article as author
        author_token = create_access_token(
            subject=str(author.id),
            settings=test_settings
        )

        headers = {"Authorization": f"Token {author_token}"}
        article_data = {
            "article": {
                "title": "Article to Unfavorite",
                "description": "Test unfavoriting",
                "body": "Unfavorite me"
            }
        }

        create_response = await client.post("/api/articles", json=article_data, headers=headers)
        created_article = create_response.json()["article"]
        slug = created_article["slug"]

        # Favorite article first
        favoriter_token = create_access_token(
            subject=str(favoriter.id),
            settings=test_settings
        )

        headers = {"Authorization": f"Token {favoriter_token}"}
        await client.post(f"/api/articles/{slug}/favorite", headers=headers)

        # Then unfavorite
        response = await client.delete(f"/api/articles/{slug}/favorite", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert "article" in data
        assert data["article"]["favorited"] is False
        assert data["article"]["favoritesCount"] == 0

    @pytest.mark.asyncio
    async def test_get_articles_feed(self, client: AsyncClient, db: AsyncSession, test_settings):
        """
        Given: User follows other users who have articles
        When: GET /api/articles/feed
        Then: Articles from followed users are returned
        """
        # Create three users
        user1 = await UserFactory.create(session=db, is_superuser=False)
        user2 = await UserFactory.create(session=db, is_superuser=False)
        user3 = await UserFactory.create(session=db, is_superuser=False)
        await db.commit()

        # User1 follows user2
        follow_token = create_access_token(
            subject=str(user1.id),
            settings=test_settings
        )

        headers = {"Authorization": f"Token {follow_token}"}
        await client.post(f"/api/profiles/{user2.email}/follow", headers=headers)

        # User2 creates an article
        article_token = create_access_token(
            subject=str(user2.id),
            settings=test_settings
        )

        headers = {"Authorization": f"Token {article_token}"}
        article_data = {
            "article": {
                "title": "Article in Feed",
                "description": "Should appear in feed",
                "body": "Feed content"
            }
        }

        await client.post("/api/articles", json=article_data, headers=headers)

        # User3 creates an article (should not appear in feed)
        user3_token = create_access_token(
            subject=str(user3.id),
            settings=test_settings
        )

        headers = {"Authorization": f"Token {user3_token}"}
        article_data = {
            "article": {
                "title": "Article Not in Feed",
                "description": "Should not appear in feed",
                "body": "Not in feed"
            }
        }

        await client.post("/api/articles", json=article_data, headers=headers)

        # Get feed for user1
        headers = {"Authorization": f"Token {follow_token}"}
        response = await client.get("/api/articles/feed", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert "articles" in data
        assert "articlesCount" in data
        # Should only contain user2's article
        assert len(data["articles"]) == 1
        assert data["articles"][0]["title"] == "Article in Feed"


class TestRealWorldComments:
    """Test comment endpoints following RealWorld spec."""

    @pytest.mark.asyncio
    async def test_add_comment_to_article(self, client: AsyncClient, db: AsyncSession, test_settings):
        """
        Given: An article exists and user is authenticated
        When: POST /api/articles/{slug}/comments with comment data
        Then: Comment is added to article
        """
        # Create user and article
        user = await UserFactory.create(session=db, is_superuser=False)
        await db.commit()

        # Create article
        token = create_access_token(
            subject=str(user.id),
            settings=test_settings
        )

        headers = {"Authorization": f"Token {token}"}
        article_data = {
            "article": {
                "title": "Article with Comments",
                "description": "Test comments",
                "body": "Comment on me"
            }
        }

        create_response = await client.post("/api/articles", json=article_data, headers=headers)
        created_article = create_response.json()["article"]
        slug = created_article["slug"]

        # Add comment
        comment_data = {
            "comment": {
                "body": "This is a test comment"
            }
        }

        response = await client.post(f"/api/articles/{slug}/comments", json=comment_data, headers=headers)

        assert response.status_code == 201
        data = response.json()
        assert "comment" in data
        assert data["comment"]["body"] == "This is a test comment"

    @pytest.mark.asyncio
    async def test_get_comments_from_article(self, client: AsyncClient, db: AsyncSession, test_settings):
        """
        Given: An article has comments
        When: GET /api/articles/{slug}/comments
        Then: List of comments is returned
        """
        # Create user and article
        user = await UserFactory.create(session=db, is_superuser=False)
        await db.commit()

        # Create article
        token = create_access_token(
            subject=str(user.id),
            settings=test_settings
        )

        headers = {"Authorization": f"Token {token}"}
        article_data = {
            "article": {
                "title": "Article with Comments",
                "description": "Test comments",
                "body": "Comment on me"
            }
        }

        create_response = await client.post("/api/articles", json=article_data, headers=headers)
        created_article = create_response.json()["article"]
        slug = created_article["slug"]

        # Add comment
        comment_data = {
            "comment": {
                "body": "Test comment"
            }
        }

        await client.post(f"/api/articles/{slug}/comments", json=comment_data, headers=headers)

        # Get comments
        response = await client.get(f"/api/articles/{slug}/comments")

        assert response.status_code == 200
        data = response.json()
        assert "comments" in data
        assert len(data["comments"]) == 1
        assert data["comments"][0]["body"] == "Test comment"

    @pytest.mark.asyncio
    async def test_delete_comment(self, client: AsyncClient, db: AsyncSession, test_settings):
        """
        Given: A comment exists and user is the author
        When: DELETE /api/articles/{slug}/comments/{id}
        Then: Comment is deleted
        """
        # Create user and article
        user = await UserFactory.create(session=db, is_superuser=False)
        await db.commit()

        # Create article
        token = create_access_token(
            subject=str(user.id),
            settings=test_settings
        )

        headers = {"Authorization": f"Token {token}"}
        article_data = {
            "article": {
                "title": "Article with Comments",
                "description": "Test comments",
                "body": "Comment on me"
            }
        }

        create_response = await client.post("/api/articles", json=article_data, headers=headers)
        created_article = create_response.json()["article"]
        slug = created_article["slug"]

        # Add comment
        comment_data = {
            "comment": {
                "body": "Comment to delete"
            }
        }

        comment_response = await client.post(f"/api/articles/{slug}/comments", json=comment_data, headers=headers)
        comment_id = comment_response.json()["comment"]["id"]

        # Delete comment
        response = await client.delete(f"/api/articles/{slug}/comments/{comment_id}", headers=headers)

        assert response.status_code == 204

        # Verify comment is deleted
        get_response = await client.get(f"/api/articles/{slug}/comments")
        data = get_response.json()
        assert len(data["comments"]) == 0


class TestRealWorldTags:
    """Test tag endpoints following RealWorld spec."""

    @pytest.mark.asyncio
    async def test_get_tags(self, client: AsyncClient, db: AsyncSession, test_settings):
        """
        Given: Articles with tags exist
        When: GET /api/tags
        Then: List of all unique tags is returned
        """
        # Create user and articles with tags
        user = await UserFactory.create(session=db, is_superuser=False)
        await db.commit()

        token = create_access_token(
            subject=str(user.id),
            settings=test_settings
        )

        headers = {"Authorization": f"Token {token}"}

        # Create articles with different tags
        articles_data = [
            {
                "article": {
                    "title": "Article 1",
                    "description": "Desc 1",
                    "body": "Body 1",
                    "tagList": ["javascript", "react"]
                }
            },
            {
                "article": {
                    "title": "Article 2",
                    "description": "Desc 2",
                    "body": "Body 2",
                    "tagList": ["python", "fastapi", "javascript"]
                }
            }
        ]

        for article_data in articles_data:
            await client.post("/api/articles", json=article_data, headers=headers)

        # Get tags
        response = await client.get("/api/tags")

        assert response.status_code == 200
        data = response.json()
        assert "tags" in data
        assert isinstance(data["tags"], list)

        # Should contain all unique tags
        tags = data["tags"]
        assert "javascript" in tags
        assert "react" in tags
        assert "python" in tags
        assert "fastapi" in tags


class TestRealWorldFiltering:
    """Test filtering functionality following RealWorld spec."""

    @pytest.mark.asyncio
    async def test_filter_articles_by_tag(self, client: AsyncClient, db: AsyncSession, test_settings):
        """
        Given: Articles with different tags exist
        When: GET /api/articles?tag=javascript
        Then: Only articles with javascript tag are returned
        """
        # Create user and articles
        user = await UserFactory.create(session=db, is_superuser=False)
        await db.commit()

        token = create_access_token(
            subject=str(user.id),
            settings=test_settings
        )

        headers = {"Authorization": f"Token {token}"}

        # Create articles with different tags
        articles_data = [
            {
                "article": {
                    "title": "JS Article",
                    "description": "JavaScript article",
                    "body": "JS content",
                    "tagList": ["javascript", "frontend"]
                }
            },
            {
                "article": {
                    "title": "Python Article",
                    "description": "Python article",
                    "body": "Python content",
                    "tagList": ["python", "backend"]
                }
            }
        ]

        for article_data in articles_data:
            await client.post("/api/articles", json=article_data, headers=headers)

        # Filter by javascript tag
        response = await client.get("/api/articles?tag=javascript")

        assert response.status_code == 200
        data = response.json()
        assert "articles" in data
        assert len(data["articles"]) == 1
        assert data["articles"][0]["title"] == "JS Article"

    @pytest.mark.asyncio
    async def test_filter_articles_by_author(self, client: AsyncClient, db: AsyncSession, test_settings):
        """
        Given: Multiple users have articles
        When: GET /api/articles?author={username}
        Then: Only articles by that author are returned
        """
        # Create two users
        user1 = await UserFactory.create(session=db, is_superuser=False)
        user2 = await UserFactory.create(session=db, is_superuser=False)
        await db.commit()

        # User1 creates article
        token1 = create_access_token(
            subject=str(user1.id),
            settings=test_settings
        )

        headers = {"Authorization": f"Token {token1}"}
        article_data = {
            "article": {
                "title": "User1 Article",
                "description": "Article by user1",
                "body": "Content by user1"
            }
        }

        await client.post("/api/articles", json=article_data, headers=headers)

        # User2 creates article
        token2 = create_access_token(
            subject=str(user2.id),
            settings=test_settings
        )

        headers = {"Authorization": f"Token {token2}"}
        article_data = {
            "article": {
                "title": "User2 Article",
                "description": "Article by user2",
                "body": "Content by user2"
            }
        }

        await client.post("/api/articles", json=article_data, headers=headers)

        # Filter by user1
        response = await client.get(f"/api/articles?author={user1.email}")

        assert response.status_code == 200
        data = response.json()
        assert "articles" in data
        assert len(data["articles"]) == 1
        assert data["articles"][0]["title"] == "User1 Article"

    @pytest.mark.asyncio
    async def test_filter_articles_by_favorited(self, client: AsyncClient, db: AsyncSession, test_settings):
        """
        Given: User has favorited some articles
        When: GET /api/articles?favorited={username}
        Then: Only articles favorited by that user are returned
        """
        # Create three users
        author = await UserFactory.create(session=db, is_superuser=False)
        favoriter = await UserFactory.create(session=db, is_superuser=False)
        other_user = await UserFactory.create(session=db, is_superuser=False)
        await db.commit()

        # Author creates two articles
        author_token = create_access_token(
            subject=str(author.id),
            settings=test_settings
        )

        headers = {"Authorization": f"Token {author_token}"}

        articles_data = [
            {
                "article": {
                    "title": "Favorited Article",
                    "description": "Will be favorited",
                    "body": "Favorited content"
                }
            },
            {
                "article": {
                    "title": "Unfavorited Article",
                    "description": "Will not be favorited",
                    "body": "Unfavorited content"
                }
            }
        ]

        created_articles = []
        for article_data in articles_data:
            response = await client.post("/api/articles", json=article_data, headers=headers)
            created_articles.append(response.json()["article"])

        # Favoriter favorites first article
        favoriter_token = create_access_token(
            subject=str(favoriter.id),
            settings=test_settings
        )

        headers = {"Authorization": f"Token {favoriter_token}"}
        slug = created_articles[0]["slug"]
        await client.post(f"/api/articles/{slug}/favorite", headers=headers)

        # Filter by favorited
        response = await client.get(f"/api/articles?favorited={favoriter.email}")

        assert response.status_code == 200
        data = response.json()
        assert "articles" in data
        assert len(data["articles"]) == 1
        assert data["articles"][0]["title"] == "Favorited Article"


class TestRealWorldPagination:
    """Test pagination functionality following RealWorld spec."""

    @pytest.mark.asyncio
    async def test_articles_pagination(self, client: AsyncClient, db: AsyncSession, test_settings):
        """
        Given: Multiple articles exist
        When: GET /api/articles with limit and offset
        Then: Correct pagination is applied
        """
        # Create user
        user = await UserFactory.create(session=db, is_superuser=False)
        await db.commit()

        token = create_access_token(
            subject=str(user.id),
            settings=test_settings
        )

        headers = {"Authorization": f"Token {token}"}

        # Create multiple articles
        for i in range(5):
            article_data = {
                "article": {
                    "title": f"Article {i}",
                    "description": f"Description {i}",
                    "body": f"Body {i}"
                }
            }
            await client.post("/api/articles", json=article_data, headers=headers)

        # Get first page (limit=2, offset=0)
        response = await client.get("/api/articles?limit=2&offset=0")

        assert response.status_code == 200
        data = response.json()
        assert "articles" in data
        assert "articlesCount" in data
        assert len(data["articles"]) == 2
        assert data["articlesCount"] == 5

        # Get second page (limit=2, offset=2)
        response = await client.get("/api/articles?limit=2&offset=2")

        assert response.status_code == 200
        data = response.json()
        assert len(data["articles"]) == 2
        assert data["articlesCount"] == 5

        # Verify different articles
        first_page_titles = {article["title"] for article in data["articles"]}
        response = await client.get("/api/articles?limit=2&offset=2")
        data = response.json()
        second_page_titles = {article["title"] for article in data["articles"]}

        assert first_page_titles != second_page_titles