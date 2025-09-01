"""
User-related Pydantic schemas
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    """Base user schema"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=100)
    bio: Optional[str] = None

class UserCreateRequest(UserBase):
    """User creation request schema"""
    password: str = Field(..., min_length=8)

class UserUpdateRequest(BaseModel):
    """User update request schema"""
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    bio: Optional[str] = None
    profile_image: Optional[str] = None

class UserResponse(UserBase):
    """User response schema"""
    id: int
    role: str
    is_active: bool
    is_verified: bool
    profile_image: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserLoginRequest(BaseModel):
    """User login request schema"""
    username: str  # Can be username or email
    password: str

class UserLoginResponse(BaseModel):
    """User login response schema"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class PasswordChangeRequest(BaseModel):
    """Password change request schema"""
    current_password: str
    new_password: str = Field(..., min_length=8)

class PasswordResetRequest(BaseModel):
    """Password reset request schema"""
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    """Password reset confirmation schema"""
    token: str
    new_password: str = Field(..., min_length=8)
