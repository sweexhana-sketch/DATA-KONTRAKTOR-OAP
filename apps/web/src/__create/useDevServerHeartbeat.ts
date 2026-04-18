'use client';

export function useDevServerHeartbeat() {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  // Use dynamic import to avoid issues in production bundles
  import('react-idle-timer').then(({ useIdleTimer }) => {
    useIdleTimer({
      throttle: 60_000 * 3,
      timeout: 60_000,
      onAction: () => {
        fetch('/', {
          method: 'GET',
        }).catch((error) => {
          // this is a no-op
        });
      },
    });
  }).catch(() => {
    // ignore
  });
}
