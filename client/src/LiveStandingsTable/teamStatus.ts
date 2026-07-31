const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isTrue = (value: unknown) =>
  value === true || value === 1 || value === "1" || value === "true";

const getPlayerHp = (player: any) =>
  toNumber(
    player?.hp ??
      player?.hpPercent ??
      player?.hp_info?.current_hp ??
      player?.hpInfo?.currentHp,
  );

const isPlayerAlive = (player: any) => {
  if (!player) return false;
  if (isTrue(player?.hasRecalled) || player?.status === "dead") return false;

  const hp = getPlayerHp(player);
  if (hp <= 0) return false;

  return player?.status === "alive" || player?.status === "knocked" || player?.isKnocked || hp > 0;
};

export const isLiveTeamAlive = (team: any) => {
  if (!team || isTrue(team?.isEliminated) || isTrue(team?.is_eliminated)) {
    return false;
  }

  if (Array.isArray(team.players) && team.players.length > 0) {
    return team.players.some(isPlayerAlive);
  }

  return Number(team?.playersAlive ?? 0) > 0;
};

export const isLiveTeamDead = (team: any) =>
  team?.isPlaying !== false && !isLiveTeamAlive(team);
