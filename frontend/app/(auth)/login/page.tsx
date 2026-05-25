'use client';

import { motion } from 'framer-motion';
import { useForm } from '../../../hooks/useForm';
import { useLoginMutation } from '../../../hooks/useAuthMutations';
import { loginSchema } from '../../../lib/validations';
import AuthFormCard from '../../components/layout/AuthFormCard';
import { Input, Button } from '../../components/ui';

export default function Login() {
  const loginMutation = useLoginMutation();

  const { values, errors, isSubmitting, handleChange, handleSubmit } = useForm({
    initial: { email: '', password: '' },
    schema: loginSchema,
    onSubmit: (data) => {
      loginMutation.mutate(data);
    },
  });

  return (
    <AuthFormCard
      title="Login"
      subtitle="Connect to the Charge Circle grid"
      footer={{ text: "No operator account?", linkText: "Register", href: "/signup" }}
    >
      {loginMutation.error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-4 p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-sm"
        >
          {(loginMutation.error as Error).message || 'Login failed'}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        <Button type="submit" isLoading={isSubmitting || loginMutation.isPending} className="mt-2 w-full">
          Connect to Grid
        </Button>
      </form>
    </AuthFormCard>
  );
}
