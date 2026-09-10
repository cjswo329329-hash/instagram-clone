from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, computed_field

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
    website: Optional[str] = None
    gender: Optional[str] = None
    is_private: bool = False
    is_verified: bool = False

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    website: Optional[str] = None
    gender: Optional[str] = None
    is_private: Optional[bool] = None
    profile_image_url: Optional[str] = None

class ProfileImageUpdate(BaseModel):
    image_url: Optional[str] = None
    profile_image_url: Optional[str] = None
    profileImageUrl: Optional[str] = None

    def get_url(self) -> Optional[str]:
        return self.image_url or self.profile_image_url or self.profileImageUrl

class UserSimple(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    profile_image_url: Optional[str] = None
    bio: Optional[str] = None
    website: Optional[str] = None
    gender: Optional[str] = None
    is_verified: bool = False
    is_admin: bool = False
    is_following: bool = False
    is_private: bool = False

    @computed_field
    @property
    def fullName(self) -> Optional[str]:
        return self.full_name

    @computed_field
    @property
    def profileImageUrl(self) -> Optional[str]:
        return self.profile_image_url

    @computed_field
    @property
    def isVerified(self) -> bool:
        return self.is_verified

    @computed_field
    @property
    def isAdmin(self) -> bool:
        return self.is_admin

    @computed_field
    @property
    def isFollowing(self) -> bool:
        return self.is_following

    @computed_field
    @property
    def isPrivate(self) -> bool:
        return self.is_private

    class Config:
        from_attributes = True

class UserProfileResponse(UserSimple):
    posts_count: int = 0
    followers_count: int = 0
    following_count: int = 0
    is_requested: bool = False
    is_me: bool = False

    @computed_field
    @property
    def postsCount(self) -> int:
        return self.posts_count

    @computed_field
    @property
    def followersCount(self) -> int:
        return self.followers_count

    @computed_field
    @property
    def followingCount(self) -> int:
        return self.following_count

    @computed_field
    @property
    def isFollowing(self) -> bool:
        return self.is_following

    @computed_field
    @property
    def isRequested(self) -> bool:
        return self.is_requested

    @computed_field
    @property
    def isMe(self) -> bool:
        return self.is_me

    class Config:
        from_attributes = True

