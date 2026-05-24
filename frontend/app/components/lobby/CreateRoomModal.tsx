'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useForm } from '../../../hooks/useForm';
import { createRoomSchema } from '../../../lib/validations';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

export default function CreateRoomModal({
  onCreate,
}: {
  onCreate: (name: string, maxPlayers: number | null) => void;
}) {
  const [open, setOpen] = useState(false);

  const { values, errors, isSubmitting, handleChange, handleSubmit, reset } = useForm({
    initial: { name: '', maxPlayers: null as number | null },
    schema: createRoomSchema,
    onSubmit: (data) => {
      onCreate(data.name, data.maxPlayers ?? null);
      reset();
      setOpen(false);
    },
  });

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        leftIcon={<Plus size={18} />}
        className="fixed bottom-6 right-6 z-40 shadow-2xl shadow-indigo-500/30"
      >
        <span className="hidden sm:inline">Initialize Room</span>
      </Button>

      <Modal isOpen={open} onClose={() => { setOpen(false); reset(); }} title="Initialize New Room">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Room Designation"
            placeholder="e.g. Alpha Grid"
            value={values.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            autoFocus
          />
          <Input
            label="Player Limit (optional — leave blank for unlimited)"
            type="number"
            placeholder="e.g. 20"
            min={2}
            value={values.maxPlayers ?? ''}
            onChange={(e) => handleChange('maxPlayers', e.target.value ? parseInt(e.target.value) : null)}
          />
          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
            Create Room
          </Button>
        </form>
      </Modal>
    </>
  );
}
