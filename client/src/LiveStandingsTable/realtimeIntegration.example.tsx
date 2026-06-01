/**
 * ⚡ EXAMPLE: WebSocket Integration with Optimized Realtime
 * 
 * Shows how to integrate the optimized socket wrapper and frontend component
 * into an existing realtime provider or hook.
 * 
 * Usage:
 * 1. Copy this to your GlobalWebsocket or realtime provider file
 * 2. Update imports to match your project structure
 * 3. Replace existing socket handlers with these
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { socketWrapper, SocketTeamData } from './realtimeSocketWrapper';

/**
 * Example 1: Hook Pattern (Recommended)
 */
export function useRealtimeStandings(matchId: string) {
  const [teams, setTeams] = useState<SocketTeamData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!matchId) return;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/realtime/${matchId}`;
        
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('✅ WebSocket connected');
          setIsConnected(true);
          setError(null);
        };

        wsRef.current.onmessage = async (event) => {
          try {
            // Parse message (either string or blob)
            let data = event.data;
            if (data instanceof Blob) {
              // Handle binary frames if needed
              data = await data.text();
            }

            // Use socket wrapper for automatic decompression
            const teams = socketWrapper.handleMessage(data);
            setTeams(teams);
          } catch (err) {
            console.error('Message handling error:', err);
          }
        };

        wsRef.current.onerror = (err) => {
          console.error('❌ WebSocket error:', err);
          setError(new Error('WebSocket connection error'));
          setIsConnected(false);
        };

        wsRef.current.onclose = () => {
          console.log('🔌 WebSocket closed');
          setIsConnected(false);
          
          // Attempt reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };
      } catch (err) {
        console.error('WebSocket connection failed:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [matchId]);

  const getMetrics = useCallback(() => socketWrapper.getMetrics(), []);
  
  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
  }, []);

  return {
    teams,
    isConnected,
    error,
    getMetrics,
    reconnect,
  };
}

/**
 * Example 2: React Context Provider
 */
interface RealtimeContextType {
  teams: SocketTeamData[];
  isConnected: boolean;
  error: Error | null;
  metrics: ReturnType<typeof socketWrapper.getMetrics>;
}

const RealtimeContext = React.createContext<RealtimeContextType | null>(null);

export function RealtimeProvider({
  matchId,
  children,
}: {
  matchId: string;
  children: React.ReactNode;
}) {
  const [teams, setTeams] = useState<SocketTeamData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [metrics, setMetrics] = useState(socketWrapper.getMetrics());
  const wsRef = useRef<WebSocket | null>(null);
  const metricsIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!matchId) return;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/realtime/${matchId}`;
        
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('✅ WebSocket connected');
          setIsConnected(true);
          setError(null);
        };

        wsRef.current.onmessage = (event) => {
          const data = event.data;
          const teams = socketWrapper.handleMessage(data);
          setTeams(teams);
          setMetrics(socketWrapper.getMetrics());
        };

        wsRef.current.onerror = (err) => {
          console.error('❌ WebSocket error:', err);
          setError(new Error('WebSocket connection error'));
          setIsConnected(false);
        };

        wsRef.current.onclose = () => {
          console.log('🔌 WebSocket closed');
          setIsConnected(false);
          setTimeout(connectWebSocket, 3000);
        };

        // Update metrics periodically
        metricsIntervalRef.current = setInterval(() => {
          setMetrics(socketWrapper.getMetrics());
        }, 5000);
      } catch (err) {
        console.error('WebSocket connection failed:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, [matchId]);

  return (
    <RealtimeContext.Provider value={{ teams, isConnected, error, metrics }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = React.useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
}

/**
 * Example 3: Component Usage
 */
export function StandingsPage({ matchId }: { matchId: string }) {
  const { teams, isConnected, error, metrics } = useRealtime();

  // Import your optimized component
  // import LiveStandings2 from './LiveStandingsTable/View/LiveStandings2-optimized';

  return (
    <div>
      {/* Status indicator */}
      <div
        style={{
          position: 'fixed',
          top: 10,
          left: 10,
          padding: '8px 12px',
          background: isConnected ? '#2fbf4a' : '#e52e45',
          color: '#fff',
          borderRadius: '4px',
          zIndex: 1000,
        }}
      >
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      {/* Error display */}
      {error && (
        <div
          style={{
            position: 'fixed',
            top: 50,
            left: 10,
            padding: '10px 15px',
            background: '#e52e45',
            color: '#fff',
            borderRadius: '4px',
            fontSize: '12px',
            maxWidth: '200px',
          }}
        >
          Error: {error.message}
        </div>
      )}

      {/* Metrics display (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'fixed',
            bottom: 10,
            left: 10,
            padding: '10px',
            background: 'rgba(0,0,0,0.8)',
            color: '#0f0',
            fontSize: '10px',
            fontFamily: 'monospace',
            maxWidth: '250px',
            borderRadius: '4px',
          }}
        >
          <div>Updates: {metrics.updateCount}</div>
          <div>Avg: {metrics.averageUpdateMs.toFixed(1)}ms</div>
          <div>Last: {metrics.lastUpdateMs.toFixed(1)}ms</div>
          <div>Payload: {metrics.avgPayloadKB} KB</div>
          <div>Delta: {metrics.avgPayloadDeltaKB} KB</div>
          <div>Teams: {metrics.currentTeamCount}</div>
          <div>Full: {metrics.fullSnapshots}</div>
          <div>Delta: {metrics.deltaUpdates}</div>
        </div>
      )}

      {/* Standings table (uncomment when ready) */}
      {/* <LiveStandings2 teams={teams} maxRows={18} /> */}
    </div>
  );
}

/**
 * Example 4: Full Page Integration
 * 
 * Usage in main App component:
 * 
 * import { RealtimeProvider } from './path/to/this/file';
 * 
 * function App() {
 *   const matchId = useParams().matchId; // from React Router
 *   
 *   return (
 *     <RealtimeProvider matchId={matchId}>
 *       <StandingsPage matchId={matchId} />
 *     </RealtimeProvider>
 *   );
 * }
 */

/**
 * Example 5: Debugging Metrics
 * 
 * To view metrics in console:
 */
export function setupDebugMetrics() {
  if (process.env.NODE_ENV === 'development') {
    // Expose to window for DevTools console access
    (window as any).standingsMetrics = () => {
      socketWrapper.logMetrics();
    };
    
    console.log(
      '%c⚡ Call standingsMetrics() in console to view metrics',
      'color: #62df63; font-weight: bold; font-size: 14px'
    );
  }
}

/**
 * Example 6: Migration Checklist
 * 
 * [ ] Install react-window: npm install react-window
 * [ ] Copy dataTransformer.ts to project
 * [ ] Copy realtimeSocketWrapper.ts to project
 * [ ] Copy LiveStandings2-optimized.tsx to project
 * [ ] Update your WebSocket handler to use socketWrapper
 * [ ] Replace old LiveStandings2.tsx with optimized version
 * [ ] Test in development first
 * [ ] Monitor metrics with setupDebugMetrics()
 * [ ] Deploy to production with feature flag
 * [ ] Monitor for 48 hours
 * [ ] Remove feature flag after validation
 */
