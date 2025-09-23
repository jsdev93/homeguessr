"use client";
import React, { useEffect, useState } from "react";
import Game from "../../../components/Game";
import { useSearchParams, useRouter } from "next/navigation";

const MultiplayerGamePage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("sessionId");
  const playerId = searchParams.get("playerId");
  const playerName = searchParams.get("playerName");
  const [valid, setValid] = useState(false);

  useEffect(() => {
    if (!sessionId || !playerId) {
      router.replace("/multiplayer");
    } else {
      setValid(true);
    }
  }, [sessionId, playerId, router]);

  if (!valid) return null;
  return <Game sessionId={sessionId!} playerId={playerId!} playerName={playerName || undefined} multiplayer />;
};

export default MultiplayerGamePage;
