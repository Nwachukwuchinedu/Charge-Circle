'use client';

import { useState, useCallback } from 'react';
import { z } from 'zod';

interface UseFormOptions<T> {
  initial: T;
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void> | void;
}

export function useForm<T extends Record<string, unknown>>({ initial, schema, onSubmit }: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((field: keyof T, value: unknown) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrors({});

      const result = schema.safeParse(values);
      if (!result.success) {
        const fieldErrors: Partial<Record<keyof T, string>> = {};
        for (const issue of result.error.issues) {
          const field = issue.path[0] as keyof T;
          if (!fieldErrors[field]) {
            fieldErrors[field] = issue.message;
          }
        }
        setErrors(fieldErrors);
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(result.data);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, schema, onSubmit],
  );

  const reset = useCallback(() => {
    setValues(initial);
    setErrors({});
  }, [initial]);

  return { values, errors, isSubmitting, handleChange, handleSubmit, reset } as const;
}
