import type { ApiResponse, User } from '../types';
import { apiClient } from './apiClient';

/** 유저 정보 단일 조회 - POST /api/user/getUser */
export const getUser = (params: Partial<User>) =>
  apiClient.post<ApiResponse<User>>('/user/getUser', params);

/** 유저 정보 리스트 조회 - POST /api/user/getUserList */
export const getUserList = (params?: Partial<User>) =>
  apiClient.post<ApiResponse<User[]>>('/user/getUserList', params ?? {});

/** 유저 회원 가입 신청 - POST /api/user/signUp */
export const signUp = (userData: Partial<User> & { password: string }) =>
  apiClient.post<ApiResponse<User>>('/user/signUp', userData);

/** 유저 로그인 - POST /api/user/login */
export const login = (credentials: { email: string; password: string }) =>
  apiClient.post<ApiResponse<User>>('/user/login', credentials);

/** 유저 정보 변경 (상태, 프로필, 권한) - PUT /api/user/userUpdate */
export const userUpdate = (userData: Partial<User>) =>
  apiClient.put<ApiResponse<User>>('/user/userUpdate', userData);

/** 아이디(이메일) 찾기 - POST /api/user/getUserEmail */
export const getUserEmail = (params: { userName: string; userPhone: string }) =>
  apiClient.post<ApiResponse<User>>('/user/getUserEmail', params);

/** 비밀번호 찾기 - POST /api/user/getUserPWD */
export const getUserPWD = (params: { email: string; userPhone: string }) =>
  apiClient.post<ApiResponse<User>>('/user/getUserPWD', params);

/** 유저 삭제 - DELETE /api/user/deleteUser */
export const deleteUser = (params: Partial<User>) =>
  apiClient.delete<ApiResponse<User>>('/user/deleteUser', params);
