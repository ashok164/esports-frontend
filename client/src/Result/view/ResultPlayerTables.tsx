import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { warmImageUrls } from "../../BroadcastImageCache/imageCache";
import {
  GAME_DETAILS_UPDATED_EVENT,
  getLeagueStageResultGameDetails,
  getResultGameDetails,
} from "../../GameDetails/gameDetailsState";
import useSyncGameDetails from "../../GameDetails/useSyncGameDetails";
import { getResultByMatchIdApi } from "../repository/remote";

export type PlayerResultMode = "mvp" | "booyah-team" | "top-fraggers";

type PlayerResultTableProps = {
  mode: PlayerResultMode;
};

type NameImage = {
  name: string;
  image: string;
};

type PlayerResultRow = {
  id: string;
  playerName: string;
  playerPic: string;
  character: NameImage;
  activeSkill: NameImage;
  passiveSkills: NameImage[];
  equipmentLoadouts: NameImage[];
  kills: number;
  assists: number;
  knockdowns: number;
  damage: number;
  survivalTime: number;
  petSkill: NameImage;
  weapons: NameImage[];
  teamId: string;
  teamName: string;
  teamTag: string;
  teamLogo: string;
  countryLogo: string;
  role: NameImage;
};

const DEFAULT_MATCH_ID = "1865398120330647552";

const pick = (source: any, keys: string[], fallback: any = "") => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }

  return fallback;
};

const toNumber = (value: any) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const toBoolean = (value: any) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  return ["true", "1", "yes", "y", "win", "winner", "booyah"].includes(
    String(value ?? "").trim().toLowerCase(),
  );
};

const isPlainObject = (value: any) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const splitMatchIds = (matchIds: string) =>
  matchIds
    .split(",")
    .map((matchId) => matchId.trim())
    .filter(Boolean);

const getEnabledResultMatchId = () =>
  splitMatchIds(getResultGameDetails().matchIds)[0] || DEFAULT_MATCH_ID;

const getEnabledLeagueMatchIds = () => {
  const matchIds = splitMatchIds(getLeagueStageResultGameDetails().matchIds);
  return matchIds.length > 0 ? matchIds : [getEnabledResultMatchId()];
};

const looksLikePlayer = (row: any) =>
  Boolean(
    pick(row, ["player_id", "playerId", "account_id", "player_uid", "playerName", "player_name", "nickname"], ""),
  );

const collectTeams = (payload: any): any[] => {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data;
  if (!isPlainObject(data)) return [];

  const candidates = [
    data.team_stats,
    data.teamStats,
    data.teams,
    data.standings,
    data.results,
    data.result,
    data.rows,
    data.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (isPlainObject(candidate)) return [candidate];
  }

  return [data];
};

const collectDirectPlayers = (payload: any): any[] => {
  const data = payload?.data ?? payload;

  if (Array.isArray(data) && data.some(looksLikePlayer)) return data;
  if (!isPlainObject(data)) return [];

  const candidates = [
    data.players,
    data.player_stats,
    data.playerStats,
    data.mvp,
    data.booyahPlayers,
    data.booyah_players,
    data.booyahTeamStats,
    data.booyah_team_stats,
    data.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.some(looksLikePlayer)) return candidate;
  }

  return [];
};

const getPlayers = (team: any): any[] => {
  const players = pick(team, ["player_stats", "playerStats", "players", "members", "lineup"], []);
  if (Array.isArray(players)) return players;
  return isPlainObject(players) ? Object.values(players) : [];
};

const getNameImage = (source: any, nameKeys: string[], imageKeys: string[]): NameImage => ({
  name: String(pick(source, nameKeys, "")),
  image: String(pick(source, imageKeys, "")),
});

const getSkill = (player: any, active: boolean): NameImage => {
  const directSkill = active
    ? pick(player, ["active_skill", "activeSkill"], null)
    : pick(player, ["passive_skill", "passiveSkill"], null);

  if (isPlainObject(directSkill)) {
    return getNameImage(directSkill, ["name", "skill_name", "skillName"], ["image", "skill_image", "skillImage"]);
  }

  if (!active) {
    const passiveSkills = pick(player, ["passive_skills", "passiveSkills"], []);
    const passiveRows = Array.isArray(passiveSkills) ? passiveSkills : [];
    const namedPassive = passiveRows.find((skill: any) => pick(skill, ["name", "skill_name", "skillName"], ""));
    const firstPassive = namedPassive || passiveRows[0];

    if (firstPassive) {
      return getNameImage(firstPassive, ["name", "skill_name", "skillName"], ["image", "skill_image", "skillImage"]);
    }
  }

  const skillInfo = Array.isArray(player?.skill_info)
    ? player.skill_info
    : Array.isArray(player?.skills)
      ? player.skills
      : [];
  const skill = skillInfo.find((item: any) =>
    active
      ? toBoolean(pick(item, ["skill_active", "skillActive", "active", "isActive"], false))
      : !toBoolean(pick(item, ["skill_active", "skillActive", "active", "isActive"], false)),
  );

  return getNameImage(
    skill || player,
    active
      ? ["activeSkillName", "active_skill_name", "skill_name", "skillName"]
      : ["passiveSkillName", "passive_skill_name", "skill_name", "skillName"],
    active
      ? ["activeSkillImage", "active_skill_image", "skill_image", "skillImage", "image"]
      : ["passiveSkillImage", "passive_skill_image", "skill_image", "skillImage", "image"],
  );
};

const getPassiveSkills = (player: any): NameImage[] => {
  const passiveSkills = pick(player, ["passive_skills", "passiveSkills"], []);
  const passiveRows = Array.isArray(passiveSkills) ? passiveSkills : [];

  if (passiveRows.length > 0) {
    return passiveRows.map((skill: any) =>
      getNameImage(skill, ["name", "skill_name", "skillName"], ["image", "skill_image", "skillImage"]),
    );
  }

  const passiveSkill = getSkill(player, false);
  return passiveSkill.name || passiveSkill.image ? [passiveSkill] : [];
};

const getEquipmentLoadouts = (player: any): NameImage[] => {
  const loadouts = pick(player, ["equipment_loadouts", "equipmentLoadouts", "loadouts"], []);
  const rows = Array.isArray(loadouts) ? loadouts : loadouts ? [loadouts] : [];

  return rows
    .map((loadout: any) => {
      const source = isPlainObject(loadout) ? loadout : player;
      return {
        name: String(
          pick(source, [
            "name",
            "equipmentLoadoutName",
            "equipment_loadout_name",
            "loadoutName",
            "loadout_name",
            "equipmentName",
            "equipment_name",
          ], loadout ? String(loadout) : ""),
        ),
        image: String(
          pick(source, [
            "image",
            "equipmentLoadoutImage",
            "equipment_loadout_image",
            "loadoutImage",
            "loadout_image",
            "equipmentImage",
            "equipment_image",
          ], ""),
        ),
      };
    })
    .filter((loadout) => loadout.name || loadout.image);
};

const getWeapons = (player: any): NameImage[] => {
  const directWeapon = pick(player, ["weapon_used", "weaponUsed"], null);
  if (isPlainObject(directWeapon)) {
    const weapon = getNameImage(directWeapon, ["name", "weapon_name", "weaponName"], ["image", "weapon_image", "weaponImage"]);
    return weapon.name || weapon.image ? [weapon] : [];
  }

  const weapons = pick(player, ["weapon_usages", "weaponUsages", "weapons", "weaponLoadout"], []);
  const weaponRows = Array.isArray(weapons) ? weapons : isPlainObject(weapons) ? Object.values(weapons) : [];

  return weaponRows
    .map((weapon: any) =>
      getNameImage(
        weapon,
        ["weaponName", "weapon_name", "name"],
        ["weaponImage", "weapon_image", "image", "icon"],
      ),
    )
    .filter((weapon) => weapon.name || weapon.image);
};

const normalizePlayer = (team: any, player: any, index: number): PlayerResultRow => ({
  id: String(pick(player, ["player_id", "playerId", "account_id", "player_uid", "playerUid", "id", "_id"], index)),
  playerName: String(pick(player, ["playerName", "player_name", "nickname", "name"], "Unknown")),
  playerPic: String(pick(player, ["playerPic", "player_pic", "playerImage", "player_image", "avatar", "avatarUrl", "photoUrl"], "")),
  character: getNameImage(
    pick(player, ["character", "characterInfo"], player),
    ["name", "characterName", "character_name"],
    ["image", "characterImage", "character_image"],
  ),
  activeSkill: getSkill(player, true),
  passiveSkills: getPassiveSkills(player),
  equipmentLoadouts: getEquipmentLoadouts(player),
  kills: toNumber(pick(player, ["kills", "kill_count", "killCount"], 0)),
  assists: toNumber(pick(player, ["assists", "assist"], 0)),
  knockdowns: toNumber(pick(player, ["knockdowns", "knock_down", "knockDown", "knockdown"], 0)),
  damage: toNumber(pick(player, ["damage", "total_damage", "totalDamage"], 0)),
  survivalTime: toNumber(pick(player, ["survival_time", "survivalTime"], 0)),
  petSkill: getNameImage(
    pick(player, ["pet", "petSkill", "pet_skill"], player),
    ["name", "petSkillName", "pet_skill_name", "petName", "pet_name"],
    ["image", "petSkillImage", "pet_skill_image", "petImage", "pet_image"],
  ),
  weapons: getWeapons(player),
  teamId: String(pick(team, ["teamId", "team_id"], "")),
  teamName: String(pick(team, ["teamName", "team_name", "name"], "")),
  teamTag: String(pick(team, ["teamTag", "team_tag", "tag"], "")),
  teamLogo: String(pick(team, ["teamLogo", "team_logo", "logo", "logoUrl"], "")),
  countryLogo: String(pick(team, ["countryLogo", "country_logo", "flag", "countryUrl"], "")),
  role: getNameImage(
    player,
    ["roleName", "role_name", "playerRole", "player_role", "role"],
    ["roleImage", "role_image", "playerRoleImage", "player_role_image"],
  ),
});

const getBooyahPlayers = (payload: any): PlayerResultRow[] => {
  const directPlayers = collectDirectPlayers(payload);

  if (directPlayers.length > 0) {
    return directPlayers.map((player, index) => normalizePlayer({}, player, index));
  }

  const teams = collectTeams(payload);

  return teams.flatMap((team, teamIndex) => {
    const isBooyah = toBoolean(
      pick(team, ["booyah", "is_booyah", "isBooyah", "has_booyah", "hasBooyah", "booyahCount", "booyah_count"], false),
    );

    if (!isBooyah) return [];

    const players = getPlayers(team);
    if (players.length === 0) {
      return [normalizePlayer(team, team, teamIndex)];
    }

    return players.map((player, playerIndex) => normalizePlayer(team, player, playerIndex));
  });
};

const getAllTeamPlayers = (payload: any): PlayerResultRow[] => {
  const directPlayers = collectDirectPlayers(payload);

  if (directPlayers.length > 0) {
    return directPlayers.map((player, index) => normalizePlayer({}, player, index));
  }

  return collectTeams(payload).flatMap((team, teamIndex) => {
    const players = getPlayers(team);

    if (players.length === 0 && looksLikePlayer(team)) {
      return [normalizePlayer(team, team, teamIndex)];
    }

    return players.map((player, playerIndex) => normalizePlayer(team, player, playerIndex));
  });
};

const selectMvp = (players: PlayerResultRow[]) =>
  [...players].sort((left, right) => {
    const killsDiff = right.kills - left.kills;
    if (killsDiff !== 0) return killsDiff;
    return right.damage - left.damage;
  })[0];

const getAsset = (assets: NameImage[], index: number): NameImage =>
  assets[index] || { name: "", image: "" };

const sheetColumns: Array<{
  label: string;
  value: (row: PlayerResultRow) => string | number;
}> = [
  { label: "player name", value: (row) => row.playerName },
  { label: "player id", value: (row) => row.id },
  { label: "player pic", value: (row) => row.playerPic },
  { label: "teamname", value: (row) => row.teamName },
  { label: "team tag", value: (row) => row.teamTag },
  { label: "team logo", value: (row) => row.teamLogo },
  { label: "country logo", value: (row) => row.countryLogo },
  { label: "character name", value: (row) => row.character.name },
  { label: "character image", value: (row) => row.character.image },
  { label: "active skill name", value: (row) => row.activeSkill.name },
  { label: "active skill image", value: (row) => row.activeSkill.image },
  { label: "passive 1 name", value: (row) => getAsset(row.passiveSkills, 0).name },
  { label: "passive 1 image", value: (row) => getAsset(row.passiveSkills, 0).image },
  { label: "passive 2 name", value: (row) => getAsset(row.passiveSkills, 1).name },
  { label: "passive 2 image", value: (row) => getAsset(row.passiveSkills, 1).image },
  { label: "passive 3 name", value: (row) => getAsset(row.passiveSkills, 2).name },
  { label: "passive 3 image", value: (row) => getAsset(row.passiveSkills, 2).image },
  { label: "pet name", value: (row) => row.petSkill.name },
  { label: "pet image", value: (row) => row.petSkill.image },
  { label: "loadout name", value: (row) => getAsset(row.equipmentLoadouts, 0).name },
  { label: "loadout image", value: (row) => getAsset(row.equipmentLoadouts, 0).image },
  { label: "weapon name", value: (row) => getAsset(row.weapons, 0).name },
  { label: "weapon image", value: (row) => getAsset(row.weapons, 0).image },
  { label: "role name", value: (row) => row.role.name },
  { label: "role image", value: (row) => row.role.image },
  { label: "kills", value: (row) => row.kills },
  { label: "assists", value: (row) => row.assists },
  { label: "knockdowns", value: (row) => row.knockdowns },
  { label: "damage", value: (row) => row.damage },
  { label: "survival time", value: (row) => row.survivalTime },
];

const escapeXmlValue = (value: string | number) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const getColumnName = (index: number) => {
  let name = "";
  let value = index + 1;

  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }

  return name;
};

const createWorksheetXml = (rows: PlayerResultRow[]) => {
  const sheetRows = [
    sheetColumns.map((column) => column.label),
    ...rows.map((row) => sheetColumns.map((column) => column.value(row))),
  ];

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    ${sheetRows
      .map(
        (row, rowIndex) =>
          `<row r="${rowIndex + 1}">${row
            .map((value, columnIndex) => {
              const cellRef = `${getColumnName(columnIndex)}${rowIndex + 1}`;
              const isNumber = typeof value === "number";
              return isNumber
                ? `<c r="${cellRef}"><v>${value}</v></c>`
                : `<c r="${cellRef}" t="inlineStr"><is><t>${escapeXmlValue(value)}</t></is></c>`;
            })
            .join("")}</row>`,
      )
      .join("")}
  </sheetData>
</worksheet>`;
};

const textEncoder = new TextEncoder();

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

const crc32 = (data: Uint8Array) => {
  let crc = 0xffffffff;
  data.forEach((byte) => {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  });
  return (crc ^ 0xffffffff) >>> 0;
};

const writeUint16 = (target: Uint8Array, offset: number, value: number) => {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
};

const writeUint32 = (target: Uint8Array, offset: number, value: number) => {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
  target[offset + 2] = (value >>> 16) & 0xff;
  target[offset + 3] = (value >>> 24) & 0xff;
};

const dateToDosParts = (date: Date) => ({
  time:
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2),
  date:
    ((date.getFullYear() - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate(),
});

const createZip = (files: Array<{ name: string; content: string }>) => {
  const now = dateToDosParts(new Date());
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = textEncoder.encode(file.name);
    const dataBytes = textEncoder.encode(file.content);
    const checksum = crc32(dataBytes);
    const localHeader = new Uint8Array(30 + nameBytes.length);

    writeUint32(localHeader, 0, 0x04034b50);
    writeUint16(localHeader, 4, 20);
    writeUint16(localHeader, 6, 0);
    writeUint16(localHeader, 8, 0);
    writeUint16(localHeader, 10, now.time);
    writeUint16(localHeader, 12, now.date);
    writeUint32(localHeader, 14, checksum);
    writeUint32(localHeader, 18, dataBytes.length);
    writeUint32(localHeader, 22, dataBytes.length);
    writeUint16(localHeader, 26, nameBytes.length);
    writeUint16(localHeader, 28, 0);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, dataBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    writeUint32(centralHeader, 0, 0x02014b50);
    writeUint16(centralHeader, 4, 20);
    writeUint16(centralHeader, 6, 20);
    writeUint16(centralHeader, 8, 0);
    writeUint16(centralHeader, 10, 0);
    writeUint16(centralHeader, 12, now.time);
    writeUint16(centralHeader, 14, now.date);
    writeUint32(centralHeader, 16, checksum);
    writeUint32(centralHeader, 20, dataBytes.length);
    writeUint32(centralHeader, 24, dataBytes.length);
    writeUint16(centralHeader, 28, nameBytes.length);
    writeUint16(centralHeader, 30, 0);
    writeUint16(centralHeader, 32, 0);
    writeUint16(centralHeader, 34, 0);
    writeUint16(centralHeader, 36, 0);
    writeUint32(centralHeader, 38, 0);
    writeUint32(centralHeader, 42, offset);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + dataBytes.length;
  });

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const endRecord = new Uint8Array(22);
  writeUint32(endRecord, 0, 0x06054b50);
  writeUint16(endRecord, 4, 0);
  writeUint16(endRecord, 6, 0);
  writeUint16(endRecord, 8, files.length);
  writeUint16(endRecord, 10, files.length);
  writeUint32(endRecord, 12, centralSize);
  writeUint32(endRecord, 16, offset);
  writeUint16(endRecord, 20, 0);

  const zipSize = offset + centralSize + endRecord.length;
  const zip = new Uint8Array(zipSize);
  let cursor = 0;

  [...localParts, ...centralParts, endRecord].forEach((part) => {
    zip.set(part, cursor);
    cursor += part.length;
  });

  return zip;
};

const createXlsxWorkbook = (rows: PlayerResultRow[]) =>
  createZip([
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Result Players" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`,
    },
    {
      name: "xl/worksheets/sheet1.xml",
      content: createWorksheetXml(rows),
    },
  ]);

const downloadExcelSheet = (rows: PlayerResultRow[], filename: string) => {
  const workbook = createXlsxWorkbook(rows);
  const blob = new Blob([workbook], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const pageCopy = {
  mvp: {
    title: "MVP",
    description: "Single MVP from booyah team players, sorted by highest kills and then highest damage.",
    empty: "No MVP found. Result API must include a booyah team with player stats.",
  },
  "booyah-team": {
    title: "Booyah Team Stats",
    description: "All players from the booyah team in the result API.",
    empty: "No booyah team players found in this result.",
  },
  "top-fraggers": {
    title: "Top Fraggers",
    description: "Top 5 players by kills across enabled league stage result match IDs, with damage as tie-breaker.",
    empty: "No player rows found in the enabled league stage results.",
  },
};

const ResultPlayerTable: React.FC<PlayerResultTableProps> = ({ mode }) => {
  useSyncGameDetails();
  const [matchId, setMatchId] = useState(() =>
    mode === "top-fraggers" ? getEnabledLeagueMatchIds().join(",") : getEnabledResultMatchId(),
  );
  const [rows, setRows] = useState<PlayerResultRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const copy = pageCopy[mode];
  const visibleRows = useMemo(() => {
    if (mode === "booyah-team") return rows;
    if (mode === "top-fraggers") {
      return [...rows]
        .sort((left, right) => {
          const killsDiff = right.kills - left.kills;
          if (killsDiff !== 0) return killsDiff;
          return right.damage - left.damage;
        })
        .slice(0, 5);
    }
    const mvp = selectMvp(rows);
    return mvp ? [mvp] : [];
  }, [mode, rows]);

  const downloadRows = () => {
    const cleanTitle = copy.title.toLowerCase().replace(/\s+/g, "-");
    downloadExcelSheet(visibleRows, `${cleanTitle}-${matchId || "match"}.xlsx`);
  };

  const loadRows = useCallback(async () => {
    if (!matchId.trim()) return;

    setIsLoading(true);
    setError("");
    try {
      const matchIds = splitMatchIds(matchId);

      if (mode === "top-fraggers") {
        const payloads = await Promise.all(matchIds.map((id) => getResultByMatchIdApi(id)));
        setRows(payloads.flatMap(getAllTeamPlayers));
      } else {
        const payload = await getResultByMatchIdApi(matchIds[0]);
        setRows(getBooyahPlayers(payload));
      }
    } catch (err: any) {
      setRows([]);
      setError(err?.response?.data?.message || err?.message || "Failed to load result.");
    } finally {
      setIsLoading(false);
    }
  }, [matchId, mode]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    const syncEnabledMatchId = () => {
      setMatchId(
        mode === "top-fraggers" ? getEnabledLeagueMatchIds().join(",") : getEnabledResultMatchId(),
      );
    };

    window.addEventListener(GAME_DETAILS_UPDATED_EVENT, syncEnabledMatchId);
    window.addEventListener("storage", syncEnabledMatchId);

    return () => {
      window.removeEventListener(GAME_DETAILS_UPDATED_EVENT, syncEnabledMatchId);
      window.removeEventListener("storage", syncEnabledMatchId);
    };
  }, [mode]);

  useEffect(() => {
    if (visibleRows.length === 0) return;

    const urls: string[] = [];

    visibleRows.forEach((row) => {
      if (row.playerPic) urls.push(row.playerPic);
      if (row.teamLogo) urls.push(row.teamLogo);
      if (row.countryLogo) urls.push(row.countryLogo);
      if (row.character.image) urls.push(row.character.image);
      if (row.activeSkill.image) urls.push(row.activeSkill.image);
      if (row.petSkill.image) urls.push(row.petSkill.image);
      row.passiveSkills.forEach((skill) => {
        if (skill.image) urls.push(skill.image);
      });
      row.equipmentLoadouts.forEach((loadout) => {
        if (loadout.image) urls.push(loadout.image);
      });
      row.weapons.forEach((weapon) => {
        if (weapon.image) urls.push(weapon.image);
      });
      if (row.role.image) urls.push(row.role.image);
    });

    warmImageUrls(urls).catch(() => undefined);
  }, [visibleRows]);

  return (
    <Page>
      <GlobalStyles />
      <Shell>
        <Header>
          <TitleBlock>
            <Kicker>Result API</Kicker>
            <Title>{copy.title}</Title>
            <Subtitle>{copy.description}</Subtitle>
            <Meta>{matchId}</Meta>
          </TitleBlock>
          <Actions>
            <Input
              value={matchId}
              onChange={(event) => setMatchId(event.target.value)}
              placeholder="Match ID"
              aria-label="Match ID"
            />
            <Button type="button" onClick={loadRows} disabled={isLoading}>
              Load
            </Button>
            <Button type="button" onClick={downloadRows} disabled={visibleRows.length === 0}>
              Download Excel
            </Button>
          </Actions>
        </Header>

        {error && <Alert>{error}</Alert>}

        <Panel>
          <PanelHeader>
            <PanelTitle>{copy.title} Table</PanelTitle>
            <GhostText>{isLoading ? "Loading..." : `${visibleRows.length} row${visibleRows.length === 1 ? "" : "s"}`}</GhostText>
          </PanelHeader>

          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <th>Player Name</th>
                  <th>Player Pic</th>
                  <th>Teamname</th>
                  <th>Team Logo</th>
                  <th>Country Logo</th>
                  <th>Character Name</th>
                  <th>Character Image</th>
                  <th>Active Skill Name</th>
                  <th>Active Skill Image</th>
                  <th>Passive 1 Name</th>
                  <th>Passive 1 Image</th>
                  <th>Passive 2 Name</th>
                  <th>Passive 2 Image</th>
                  <th>Passive 3 Name</th>
                  <th>Passive 3 Image</th>
                  <th>Pet Name</th>
                  <th>Pet Image</th>
                  <th>Loadout Name</th>
                  <th>Loadout Image</th>
                  <th>Weapon Name</th>
                  <th>Weapon Image</th>
                  <th>Kills</th>
                  <th>Assists</th>
                  <th>Knockdowns</th>
                  <th>Damage</th>
                  <th>Survival</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.length === 0 ? (
                  <tr>
                    <EmptyCell colSpan={27}>{copy.empty}</EmptyCell>
                  </tr>
                ) : (
                  visibleRows.map((row) => (
                    <tr key={`${row.teamName}-${row.id}-${row.playerName}`}>
                      <td>
                        <Strong>{row.playerName}</Strong>
                        <Muted>{row.id}</Muted>
                      </td>
                      <td><ImageCell src={row.playerPic} label={row.playerName} /></td>
                      <td>
                        <Strong>{row.teamName || "-"}</Strong>
                        <Muted>{row.teamTag || row.teamId || "-"}</Muted>
                      </td>
                      <td><ImageCell src={row.teamLogo} label="Team logo" /></td>
                      <td><ImageCell src={row.countryLogo} label="Country logo" /></td>
                      <td>{row.character.name || "-"}</td>
                      <td><ImageCell src={row.character.image} label={row.character.name || "Character"} /></td>
                      <td>{row.activeSkill.name || "-"}</td>
                      <td><ImageCell src={row.activeSkill.image} label={row.activeSkill.name || "Active skill"} /></td>
                      <td>{getAsset(row.passiveSkills, 0).name || "-"}</td>
                      <td><ImageCell src={getAsset(row.passiveSkills, 0).image} label={getAsset(row.passiveSkills, 0).name || "Passive 1"} /></td>
                      <td>{getAsset(row.passiveSkills, 1).name || "-"}</td>
                      <td><ImageCell src={getAsset(row.passiveSkills, 1).image} label={getAsset(row.passiveSkills, 1).name || "Passive 2"} /></td>
                      <td>{getAsset(row.passiveSkills, 2).name || "-"}</td>
                      <td><ImageCell src={getAsset(row.passiveSkills, 2).image} label={getAsset(row.passiveSkills, 2).name || "Passive 3"} /></td>
                      <td>{row.petSkill.name || "-"}</td>
                      <td><ImageCell src={row.petSkill.image} label={row.petSkill.name || "Pet"} /></td>
                      <td>{getAsset(row.equipmentLoadouts, 0).name || "-"}</td>
                      <td><ImageCell src={getAsset(row.equipmentLoadouts, 0).image} label={getAsset(row.equipmentLoadouts, 0).name || "Loadout"} /></td>
                      <td>{getAsset(row.weapons, 0).name || "-"}</td>
                      <td><ImageCell src={getAsset(row.weapons, 0).image} label={getAsset(row.weapons, 0).name || "Weapon"} /></td>
                      <td>{row.kills}</td>
                      <td>{row.assists}</td>
                      <td>{row.knockdowns}</td>
                      <td>{row.damage}</td>
                      <td>{row.survivalTime}</td>
                      <td><AssetCell asset={row.role} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableWrap>
        </Panel>

        {visibleRows.length > 0 && (
          <Gallery aria-label={`${copy.title} visual summary`}>
            {visibleRows.map((row) => (
              <GalleryCard key={`${row.id}-${row.playerName}-gallery`}>
                <GalleryPlayer>
                  <HeroAvatar src={row.playerPic} label={row.playerName} />
                  <div>
                    <Strong>{row.playerName}</Strong>
                    <Muted>{row.kills} kills / {row.damage} damage</Muted>
                  </div>
                </GalleryPlayer>
                <GalleryAssets>
                  <VisualAsset title="Active" asset={row.activeSkill} />
                  <VisualAsset title="Character" asset={row.character} />
                  <VisualAsset title="Pet" asset={row.petSkill} />
                  {row.passiveSkills.map((skill, index) => (
                    <VisualAsset key={`passive-${skill.name}-${index}`} title="Passive" asset={skill} />
                  ))}
                  {row.equipmentLoadouts.map((loadout, index) => (
                    <VisualAsset key={`equipment-${loadout.name}-${index}`} title="Equipment" asset={loadout} />
                  ))}
                  {row.weapons.slice(0, 2).map((weapon, index) => (
                    <VisualAsset key={`${weapon.name}-${index}`} title="Weapon" asset={weapon} />
                  ))}
                </GalleryAssets>
              </GalleryCard>
            ))}
          </Gallery>
        )}
      </Shell>
    </Page>
  );
};

export default ResultPlayerTable;

const ImageCell = ({ src, label }: { src: string; label: string }) =>
  src ? <Thumb src={src} alt={label} /> : <FallbackThumb>{label.slice(0, 2).toUpperCase()}</FallbackThumb>;

const AssetCell = ({ asset }: { asset: NameImage }) => (
  <AssetWrap>
    <ImageCell src={asset.image} label={asset.name || "Asset"} />
    <span>{asset.name || "-"}</span>
  </AssetWrap>
);

const AssetList = ({ assets, emptyLabel }: { assets: NameImage[]; emptyLabel: string }) => {
  if (assets.length === 0) return <ImageCell src="" label={emptyLabel} />;

  return (
    <Stack>
      {assets.map((asset, index) => (
        <AssetCell key={`${asset.name}-${index}`} asset={asset} />
      ))}
    </Stack>
  );
};

const WeaponList = ({ weapons }: { weapons: NameImage[] }) => {
  if (weapons.length === 0) return <Muted>-</Muted>;

  return (
    <Stack>
      {weapons.map((weapon, index) => (
        <AssetWrap key={`${weapon.name}-${index}`}>
          <ImageCell src={weapon.image} label={weapon.name || "Weapon"} />
          <span>{weapon.name || "-"}</span>
        </AssetWrap>
      ))}
    </Stack>
  );
};

const HeroAvatar = ({ src, label }: { src: string; label: string }) =>
  src ? <HeroImage src={src} alt={label} /> : <HeroFallback>{label.slice(0, 2).toUpperCase()}</HeroFallback>;

const VisualAsset = ({ title, asset }: { title: string; asset: NameImage }) => (
  <VisualAssetWrap>
    <ImageCell src={asset.image} label={asset.name || title} />
    <span>{title}</span>
    <strong>{asset.name || "-"}</strong>
  </VisualAssetWrap>
);

const GlobalStyles = createGlobalStyle`
  html,
  body,
  #root {
    min-height: 100%;
    margin: 0;
    background: var(--project-background, #0a0f18);
  }
`;

const Page = styled.main`
  min-height: 100vh;
  background: linear-gradient(180deg, var(--project-background, #0a0f18), var(--project-surface, #101722));
  color: var(--project-text-primary, #e5edf8);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
`;

const Shell = styled.div`
  width: min(1460px, calc(100% - 32px));
  margin: 0 auto;
  padding: 24px 0 32px;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: end;
  margin-bottom: 18px;

  @media (max-width: 760px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const TitleBlock = styled.div`
  min-width: 0;
`;

const Kicker = styled.div`
  color: var(--project-accent, #5eead4);
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 6px 0 0;
  color: var(--project-text-primary, #ffffff);
  font-size: clamp(1.8rem, 4vw, 3rem);
  line-height: 1;
  letter-spacing: 0;
`;

const Subtitle = styled.p`
  margin: 0.6rem 0 0;
  max-width: 760px;
  color: var(--project-text-secondary, #94a3b8);
`;

const Meta = styled.div`
  margin-top: 10px;
  color: var(--project-text-secondary, #94a3b8);
  font-family: "SFMono-Regular", Consolas, monospace;
  overflow-wrap: anywhere;
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;

  @media (max-width: 760px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const Input = styled.input`
  width: min(340px, 100%);
  height: 42px;
  box-sizing: border-box;
  border: 1px solid var(--project-border, rgba(148, 163, 184, 0.28));
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.4);
  color: var(--project-text-primary, #f8fafc);
  padding: 0 12px;
`;

const Button = styled.button`
  height: 42px;
  border: 0;
  border-radius: 8px;
  background: var(--project-accent, #14b8a6);
  color: #031712;
  padding: 0 18px;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

const Alert = styled.div`
  margin-bottom: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(var(--project-danger-rgb, 239, 68, 68), 0.34);
  border-radius: 8px;
  background: rgba(var(--project-danger-rgb, 239, 68, 68), 0.12);
`;

const Panel = styled.section`
  padding: 18px;
  border: 1px solid var(--project-border, rgba(148, 163, 184, 0.22));
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.72);
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
`;

const PanelTitle = styled.h2`
  margin: 0;
  font-size: 1.1rem;
`;

const GhostText = styled.span`
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.86rem;
  font-weight: 700;
`;

const TableWrap = styled.div`
  overflow: auto;
  max-height: calc(100vh - 250px);
`;

const Table = styled.table`
  width: 100%;
  min-width: 1560px;
  border-collapse: collapse;
  table-layout: fixed;

  th,
  td {
    padding: 10px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.16);
    text-align: left;
    vertical-align: top;
    overflow-wrap: anywhere;
  }

  th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: rgba(15, 23, 42, 0.98);
    color: var(--project-text-secondary, #94a3b8);
    font-size: 0.73rem;
    text-transform: uppercase;
  }
`;

const Strong = styled.strong`
  display: block;
  color: var(--project-text-primary, #ffffff);
`;

const Muted = styled.span`
  display: block;
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.78rem;
`;

const Thumb = styled.img.attrs({
  loading: "lazy",
  decoding: "async",
  fetchPriority: "low",
})`
  width: 44px;
  height: 44px;
  display: block;
  border-radius: 6px;
  object-fit: contain;
  background: rgba(255, 255, 255, 0.08);
`;

const FallbackThumb = styled.span`
  width: 44px;
  height: 44px;
  display: inline-grid;
  place-items: center;
  border-radius: 6px;
  background: rgba(94, 234, 212, 0.12);
  color: var(--project-accent, #5eead4);
  font-size: 0.78rem;
  font-weight: 900;
`;

const AssetWrap = styled.div`
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const Stack = styled.div`
  display: grid;
  gap: 8px;
`;

const EmptyCell = styled.td`
  color: var(--project-text-secondary, #94a3b8);
  text-align: center !important;
  padding: 30px 12px !important;
`;

const Gallery = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
  margin-top: 18px;
`;

const GalleryCard = styled.article`
  min-width: 0;
  padding: 14px;
  border: 1px solid rgba(94, 234, 212, 0.24);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(20, 184, 166, 0.14), rgba(15, 23, 42, 0.84)),
    rgba(15, 23, 42, 0.86);
  animation: floatIn 420ms ease both;

  @keyframes floatIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const GalleryPlayer = styled.div`
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const HeroImage = styled.img.attrs({
  loading: "lazy",
  decoding: "async",
  fetchPriority: "auto",
})`
  width: 64px;
  height: 64px;
  display: block;
  border-radius: 8px;
  object-fit: contain;
  object-position: center bottom;
  background: rgba(255, 255, 255, 0.08);
`;

const HeroFallback = styled.span`
  width: 64px;
  height: 64px;
  display: inline-grid;
  place-items: center;
  border-radius: 8px;
  background: rgba(94, 234, 212, 0.14);
  color: var(--project-accent, #5eead4);
  font-weight: 900;
`;

const GalleryAssets = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`;

const VisualAssetWrap = styled.div`
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  grid-template-rows: auto auto;
  column-gap: 8px;
  align-items: center;
  min-width: 0;

  ${Thumb},
  ${FallbackThumb} {
    grid-row: 1 / span 2;
  }

  span {
    color: var(--project-text-secondary, #94a3b8);
    font-size: 0.68rem;
    font-weight: 800;
    text-transform: uppercase;
  }

  strong {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--project-text-primary, #ffffff);
    font-size: 0.82rem;
  }
`;
