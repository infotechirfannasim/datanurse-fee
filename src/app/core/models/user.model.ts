// src/app/core/models/user.model.ts
export interface User {
    _id?: string;
    firstName: string;
    lastName: string;
    fullName: string;
    username: string;
    email: string;
    status: string;
    name?: string;
    initials?: string;
    role: Role;
    phone: string;
    permissions?: [string];
    lastActiveAt?: string;
    badge?: string;
    cases: number;
    profileImage: ProfileImage;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date;
    turnstileToken?: string;
}

export interface ProfileImage {
    contentType: string;
    data: string;
    uploadedAt: string
}

export interface FilterParams {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface Role {
    _id: number;
    name: string;
    label: string;
    description?: string;
    permissions?: [string];
    isSystem?: boolean;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface LoginRequest {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface LoginResponse {
    tokens: Tokens;
    user: User;
    expiresIn: number;
}

export interface Tokens {
    accessToken: string;
    refreshToken: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    username: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    password: string;
    confirmPassword: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    errors?: string[];
    timestamp: string;
}
