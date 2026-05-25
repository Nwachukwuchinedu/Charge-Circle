import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import { useAuth } from './useAuth';
import { AuthResponse } from '../app/types';

interface AuthInput {
  email: string;
  password: string;
  nickname?: string;
}

interface ApiResponseWrapper<T> {
  success: boolean;
  message: string;
  data: T;
}

export function useSignupMutation() {
  const router = useRouter();
  const { login } = useAuth();

  return useMutation({
    mutationFn: (data: AuthInput) => api.post('/auth/signup', data),
    onSuccess: (response: ApiResponseWrapper<AuthResponse>) => {
      const authData = response.data;
      login(authData.accessToken, authData.refreshToken, authData.user);
      router.push('/lobby');
    },
  });
}

export function useLoginMutation() {
  const router = useRouter();
  const { login } = useAuth();

  return useMutation({
    mutationFn: (data: AuthInput) => api.post('/auth/login', data),
    onSuccess: (response: ApiResponseWrapper<AuthResponse>) => {
      const authData = response.data;
      login(authData.accessToken, authData.refreshToken, authData.user);
      router.push('/lobby');
    },
  });
}
