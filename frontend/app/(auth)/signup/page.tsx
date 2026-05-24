'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { useForm } from '../../../hooks/useForm';
import { signupSchema } from '../../../lib/validations';
import AuthFormCard from '../../components/layout/AuthFormCard';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function Signup() {
  const router = useRouter();
  const { login } = useAuth();
  const [serverError, setServerError] = useState('');

  const { values, errors, isSubmitting, handleChange, handleSubmit } = useForm({
    initial: { nickname: '', email: '', password: '' },
    schema: signupSchema,
    onSubmit: async (data) => {
      setServerError('');
      const response = await api.post('/auth/signup', data);
      login(response.data.accessToken, response.data.refreshToken, response.data.user);
      router.push('/lobby');
    },
  });

  return (
    <AuthFormCard
      title="Join the Grid"
      subtitle="Register your operator node"
      gradient="emerald"
      footer={{ text: "Already an operator?", linkText: "Login", href: "/login" }}
    >
      {serverError && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-4 p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-sm"
        >
          {serverError}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Operator Alias"
          type="text"
          placeholder="e.g. Neo"
          value={values.nickname}
          onChange={(e) => handleChange('nickname', e.target.value)}
          error={errors.nickname}
        />
        <Input
          label="Email"
          type="email"
          placeholder="operator@grid.com"
          value={values.email}
          onChange={(e) => handleChange('email', e.target.value)}
          error={errors.email}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={values.password}
          onChange={(e) => handleChange('password', e.target.value)}
          error={errors.password}
        />
        <Button type="submit" variant="emerald" isLoading={isSubmitting} className="mt-2 w-full">
          Initialize Node
        </Button>
      </form>
    </AuthFormCard>
  );
}
