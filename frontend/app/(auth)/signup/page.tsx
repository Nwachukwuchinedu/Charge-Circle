'use client';

import { motion } from 'framer-motion';
import { useForm } from '../../../hooks/useForm';
import { useSignupMutation } from '../../../hooks/useAuthMutations';
import { signupSchema } from '../../../lib/validations';
import AuthFormCard from '../../components/layout/AuthFormCard';
import { Input, Button } from '../../components/ui';

export default function Signup() {
  const signupMutation = useSignupMutation();

  const { values, errors, isSubmitting, handleChange, handleSubmit } = useForm({
    initial: { nickname: '', email: '', password: '' },
    schema: signupSchema,
    onSubmit: (data) => {
      signupMutation.mutate(data);
    },
  });

  return (
    <AuthFormCard
      title="Join the Grid"
      subtitle="Register your operator node"
      gradient="emerald"
      footer={{ text: "Already an operator?", linkText: "Login", href: "/login" }}
    >
      {signupMutation.error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-4 p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-sm"
        >
          {(signupMutation.error as Error).message || 'Signup failed'}
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
        <Button type="submit" variant="emerald" isLoading={isSubmitting || signupMutation.isPending} className="mt-2 w-full">
          Initialize Node
        </Button>
      </form>
    </AuthFormCard>
  );
}
