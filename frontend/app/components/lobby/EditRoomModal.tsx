'use client';

import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import { useForm } from '../../../hooks/useForm';
import { createRoomSchema } from '../../../lib/validations';
import type { Room } from '../../types';

export default function EditRoomModal({
  room,
  isOpen,
  onClose,
  onSave,
}: {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (roomId: string, name: string, maxPlayers: number | null) => void;
}) {
  const { values, errors, isSubmitting, handleChange, handleSubmit } = useForm({
    initial: { name: room?.name ?? '', maxPlayers: (room && typeof room.maxPlayers === 'number' ? room.maxPlayers : null) as number | null },
    schema: createRoomSchema,
    onSubmit: (data) => {
      if (!room) return;
      onSave(room.id, data.name.trim(), data.maxPlayers ?? null);
      onClose();
    },
  });

  return (
    <Modal key={room?.id ?? 'none'} isOpen={isOpen} onClose={onClose} title="Edit Room">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Room Name"
          placeholder="e.g. Alpha Grid"
          value={values.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          autoFocus
        />
        <Input
          label="Player Limit (optional — blank for unlimited)"
          type="number"
          placeholder="e.g. 20"
          min={2}
          value={values.maxPlayers ?? ''}
          onChange={(e) => handleChange('maxPlayers', e.target.value ? parseInt(e.target.value) : null)}
        />
        <div className="flex gap-2 mt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} className="flex-1">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
