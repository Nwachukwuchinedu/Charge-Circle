'use client';

import { useState, useCallback } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
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
  onSave: (
    roomId: string,
    name: string,
    maxPlayers: number | null,
    callback?: (success: boolean) => void,
  ) => void;
}) {
  const [name, setName] = useState(room?.name ?? '');
  const [maxPlayers, setMaxPlayers] = useState<number | null>(
    room && typeof room.maxPlayers === 'number' ? room.maxPlayers : null,
  );
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!room) return;

      const trimmed = name.trim();
      if (!trimmed || trimmed.length > 50) {
        setError('Room name must be 1–50 characters');
        return;
      }

      setIsSubmitting(true);
      onSave(room.id, trimmed, maxPlayers, (success) => {
        setIsSubmitting(false);
        if (success) onClose();
      });
    },
    [room, name, maxPlayers, onSave, onClose],
  );

  return (
    <Modal key={room?.id ?? 'none'} isOpen={isOpen} onClose={onClose} title="Edit Room">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Room Name"
          placeholder="e.g. Alpha Grid"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          error={error}
          autoFocus
        />
        <Input
          label="Player Limit (optional — blank for unlimited)"
          type="number"
          placeholder="e.g. 20"
          min={2}
          value={maxPlayers ?? ''}
          onChange={(e) => setMaxPlayers(e.target.value ? parseInt(e.target.value) : null)}
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
