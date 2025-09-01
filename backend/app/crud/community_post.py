"""CRUD for CommunityPost."""
from app.crud.base import CRUDBase
from app.models.community_post import CommunityPost
from app.schemas.community_post import CommunityPostCreate, CommunityPostUpdate


class CRUDCommunityPost(
    CRUDBase[CommunityPost, CommunityPostCreate, CommunityPostUpdate]
):
    pass


community_post = CRUDCommunityPost(CommunityPost)
