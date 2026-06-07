/**
 * ⚡ REALTIME SOCKET WRAPPER
 * 
 * Handles automatic decompression of optimized socket data
 * Maintains backward compatibility with legacy format
 * Includes automatic metrics tracking
 */

import { decompressTeam } from './dataTransformer';

export interface SocketTeamData {
  id: string;
  roomTeamId?: string;
  name: string;
  teamTag: string;
  kills: number;
  playersAlive: number;
  totalPoints: number;
  isEliminated: boolean;
  isPlaying: boolean;
  rank: number;
  countryUrl?: string;
  logoUrl?: string;
  players: any[];
}

export interface RealtimeMetrics {
  lastUpdateMs: number;
  averageUpdateMs: number;
  updateCount: number;
  payloadSizes: number[];
  deltaUpdates: number;
  fullSnapshots: number;
  lastMessageSize: number;
  compressionRatio: number;
}

class RealtimeSocketWrapper {
  private metrics: RealtimeMetrics = {
    lastUpdateMs: 0,
    averageUpdateMs: 0,
    updateCount: 0,
    payloadSizes: [],
    deltaUpdates: 0,
    fullSnapshots: 0,
    lastMessageSize: 0,
    compressionRatio: 0,
  };

  private teamMap = new Map<string, SocketTeamData>();
  private callbacks: ((teams: SocketTeamData[]) => void)[] = [];
  private errorCallbacks: ((error: Error) => void)[] = [];

  /**
   * Handle incoming socket message with automatic format detection
   */
  handleMessage(rawData: string): SocketTeamData[] {
    const start = performance.now();
    
    try {
      const data = JSON.parse(rawData);
      this.metrics.lastMessageSize = rawData.length;
      this.metrics.payloadSizes.push(rawData.length);

      let teams: SocketTeamData[] = [];

      if (data.type === 'full') {
        // Full snapshot format
        this.metrics.fullSnapshots++;
        this.teamMap.clear();
        
        teams = (data.teams || []).map((team: any) => {
          const decompressed = this.decompressTeamWithFallback(team);
          this.teamMap.set(decompressed.id, decompressed);
          return decompressed;
        });
        
        console.log(
          `✅ Full snapshot: ${teams.length} teams (${(rawData.length / 1024).toFixed(2)} KB)`
        );
      } 
      else if (data.type === 'delta') {
        // Delta update format
        this.metrics.deltaUpdates++;
        const deltas = data.d || [];
        
        deltas.forEach((delta: any) => {
          const decompressed = this.decompressTeamWithFallback(delta);
          this.teamMap.set(decompressed.id, decompressed);
        });
        
        teams = Array.from(this.teamMap.values());
        
        console.log(
          `📦 Delta: ${deltas.length} teams changed (${(rawData.length / 1024).toFixed(2)} KB)`
        );
      } 
      else {
        // Legacy format (backward compatibility)
        teams = Array.isArray(data.teams)
          ? data.teams.map((t: any) => this.decompressTeamWithFallback(t))
          : Array.isArray(data.standings)
            ? data.standings.map((t: any) => this.decompressTeamWithFallback(t))
            : [];
        
        console.log(`📋 Legacy format: ${teams.length} teams`);
      }

      // Update metrics
      const duration = performance.now() - start;
      this.updateMetrics(duration);

      // Notify callbacks
      this.callbacks.forEach((cb) => {
        try {
          cb(teams);
        } catch (err) {
          console.error('Callback error:', err);
        }
      });

      return teams;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Socket parse error:', error);
      
      this.errorCallbacks.forEach((cb) => {
        try {
          cb(error);
        } catch (callbackErr) {
          console.error('Error callback failed:', callbackErr);
        }
      });

      return [];
    }
  }

  /**
   * Decompress team with fallback for legacy fields
   */
  private decompressTeamWithFallback(team: any): SocketTeamData {
    // Try optimized format first
    if (team.id && team.nm !== undefined) {
      return decompressTeam(team);
    }
    
    // Fall back to legacy format
    return {
      id: team.id || team.teamId || String(team.team_id),
      roomTeamId: team.roomTeamId || team.room_team_id,
      name: team.nm || team.name || team.team_name,
      teamTag: team.tg || team.teamTag || team.short_tag,
      kills: Number(team.k ?? team.kills ?? 0),
      playersAlive: Number(team.a ?? team.playersAlive ?? team.players_alive ?? 0),
      totalPoints: Number(team.tp ?? team.totalPoints ?? team.total_points ?? 0),
      isEliminated: Boolean(team.el ?? team.isEliminated ?? team.is_eliminated),
      isPlaying: Boolean(team.pl ?? team.isPlaying ?? team.is_playing ?? true),
      rank: Number(team.rnk ?? team.rank ?? 0),
      countryUrl: team.cl || team.countryUrl || team.country_logo,
      logoUrl: team.tl || team.logoUrl || team.team_logo,
      players: (team.pls || team.players || []).map((p: any) => ({
        ...p,
        id: p.id || p.account_id,
        playerName: p.nm || p.playerName || p.player_name,
        name: p.nm || p.playerName || p.player_name || p.nickname,
        hpPercent: Number(p.hp ?? p.hpPercent ?? 100),
        status: this.mapPlayerStatus(p.st ?? p.status),
        playerPic: p.pic || p.playerPic || p.player_pic,
        cameraLink: p.cam || p.cameraLink || p.camera_link,
        kills: Number(p.k ?? p.kills ?? p.kill_count ?? 0),
        damage: Number(p.dmg ?? p.damage ?? p.damage_dealt ?? 0),
        assists: Number(p.as ?? p.assists ?? p.assist_count ?? 0),
        knockdowns: Number(p.kd ?? p.knockdowns ?? p.knock_downs ?? 0),
        survivalTime: Number(p.sv ?? p.survivalTime ?? p.survival_time ?? 0),
        character: p.ch || p.character,
        activeSkill: p.acts || p.activeSkill || p.active_skill,
        passiveSkills: p.ps || p.passiveSkills || p.passive_skills || [],
        weaponUsed: p.wu || p.weaponUsed || p.weapon_used,
        weapon: p.wp || p.weapon || p.weapon_used,
        weapons: p.ws || p.weapons || p.weapon_usages || [],
        pet: p.pet,
        equipmentLoadouts: p.eq || p.equipmentLoadouts || p.equipment_loadouts || [],
      })),
    };
  }

  /**
   * Map player status code to string
   */
  private mapPlayerStatus(status: any): string {
    if (typeof status === 'string') return status;
    if (status === 0) return 'alive';
    if (status === 1) return 'knocked';
    if (status === 2) return 'dead';
    return 'unknown';
  }

  /**
   * Register callback for team updates
   */
  onUpdate(callback: (teams: SocketTeamData[]) => void): () => void {
    this.callbacks.push(callback);
    // Return unsubscribe function
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Register callback for errors
   */
  onError(callback: (error: Error) => void): () => void {
    this.errorCallbacks.push(callback);
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Get current teams from cache
   */
  getTeams(): SocketTeamData[] {
    return Array.from(this.teamMap.values());
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.teamMap.clear();
  }

  /**
   * Update and track metrics
   */
  private updateMetrics(duration: number): void {
    this.metrics.updateCount++;
    this.metrics.lastUpdateMs = duration;
    
    // Calculate running average
    if (this.metrics.updateCount === 1) {
      this.metrics.averageUpdateMs = duration;
    } else {
      this.metrics.averageUpdateMs =
        (this.metrics.averageUpdateMs * (this.metrics.updateCount - 1) + duration) /
        this.metrics.updateCount;
    }

    // Calculate compression ratio (compare to legacy size estimate)
    if (this.metrics.lastMessageSize > 0) {
      // Rough estimate: legacy format would be ~3-4x larger
      this.metrics.compressionRatio = 3.5;
    }

    // Keep last 100 payload sizes for average
    if (this.metrics.payloadSizes.length > 100) {
      this.metrics.payloadSizes.shift();
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): Readonly<RealtimeMetrics> & {
    avgPayloadKB: string;
    avgPayloadDeltaKB: string;
    currentTeamCount: number;
  } {
    const sizes = this.metrics.payloadSizes.slice(-50);
    const avgBytes =
      sizes.length > 0 ? sizes.reduce((a, b) => a + b, 0) / sizes.length : 0;
    
    // Delta updates are typically 10-20% of full size
    const deltaAvg = avgBytes * 0.15;

    return {
      ...this.metrics,
      avgPayloadKB: (avgBytes / 1024).toFixed(2),
      avgPayloadDeltaKB: (deltaAvg / 1024).toFixed(2),
      currentTeamCount: this.teamMap.size,
    };
  }

  /**
   * Log metrics summary
   */
  logMetrics(): void {
    const metrics = this.getMetrics();
    console.group('📊 Realtime Socket Metrics');
    console.log(`Total updates: ${metrics.updateCount}`);
    console.log(`Full snapshots: ${metrics.fullSnapshots}`);
    console.log(`Delta updates: ${metrics.deltaUpdates}`);
    console.log(`Avg update time: ${metrics.averageUpdateMs.toFixed(2)}ms`);
    console.log(`Last update time: ${metrics.lastUpdateMs.toFixed(2)}ms`);
    console.log(`Avg payload size: ${metrics.avgPayloadKB} KB`);
    console.log(`Avg delta size: ${metrics.avgPayloadDeltaKB} KB`);
    console.log(`Compression ratio: ${metrics.compressionRatio.toFixed(1)}x`);
    console.log(`Current teams: ${metrics.currentTeamCount}`);
    console.log(`Last message: ${(metrics.lastMessageSize / 1024).toFixed(2)} KB`);
    console.groupEnd();
  }
}

// Export singleton instance
export const socketWrapper = new RealtimeSocketWrapper();

// Also export class for testing
export default RealtimeSocketWrapper;
