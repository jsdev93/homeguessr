import { useEffect, useState } from 'react';

type Address = {
  zipcode: string;
};

type CurrentType = {
  address?: Address;
};

export function useGameTimer(
  round: number,
  guessedZip: string | null,
  gameOver: boolean,
  current: CurrentType | null,
  setScore: (fn: (s: number) => number) => void,
  setGuessedZip: (zip: string) => void,
  setCountdown: (n: number | null) => void
) {
  const [roundTimer, setRoundTimer] = useState<number>(60);

  useEffect(() => {
  setRoundTimer(60);
  }, [round]);

  useEffect(() => {
    if (guessedZip || gameOver) return;
    if (roundTimer === 0) {
      setScore((s) => {
        const newScore = s - 500;
        if (newScore <= 0) return 0;
        return newScore;
      });
      if (current && current.address && current.address.zipcode) {
        setGuessedZip(current.address.zipcode);
      } else {
        setGuessedZip('');
      }
      setCountdown(5);
      return;
    }
    const timer = setTimeout(() => setRoundTimer((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [roundTimer, guessedZip, gameOver, current, setScore, setGuessedZip, setCountdown]);

  return roundTimer;
}
