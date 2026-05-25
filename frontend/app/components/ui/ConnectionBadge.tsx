'use client';

import Badge from './Badge';

export default function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <Badge variant={connected ? 'success' : 'error'} dot>
      {connected ? 'Grid Live' : 'Reconnecting...'}
    </Badge>
  );
}
