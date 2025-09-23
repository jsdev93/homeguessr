import { useEffect } from 'react';

export function useCountdown(countdown: number | null, nextRound: () => void, setCountdown: (n: number | null) => void) {
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      nextRound();
      return;
    }
  const timer = setTimeout(() => setCountdown(countdown !== null ? countdown - 1 : null), 1000);
    return () => clearTimeout(timer);
  }, [countdown, nextRound, setCountdown]);
}
