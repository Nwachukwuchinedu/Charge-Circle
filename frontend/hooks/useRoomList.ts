import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Room } from '../app/types';

export function useRoomList(socket: Socket | null, connected: boolean) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['rooms'],
    queryFn: () => {
      if (!socket || !connected) return Promise.reject('No socket');
      return new Promise<Room[]>((resolve, reject) => {
        socket.emit('get_rooms', {}, (response: any) => {
          if (response && response.rooms) resolve(response.rooms);
          else reject(response?.error || 'Failed to get rooms');
        });
      });
    },
    enabled: !!socket && connected,
    staleTime: 10_000, // Serve from cache for 10s before refetching
  });

  useEffect(() => {
    if (socket && connected) {
      const onRoomsUpdated = () => {
        // When the server notifies us of an update, we invalidate the cache
        // which triggers a background refetch
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
      };
      socket.on('rooms_updated', onRoomsUpdated);
      return () => {
        socket.off('rooms_updated', onRoomsUpdated);
      };
    }
  }, [socket, connected, queryClient]);

  return query;
}
