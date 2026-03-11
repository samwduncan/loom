/**
 * Shell WebSocket protocol types.
 *
 * Defines the message protocol between the frontend terminal and the
 * backend /shell endpoint. Separate from the chat /ws protocol.
 *
 * Constitution: Named exports only (2.2), no default export.
 */

// ---------------------------------------------------------------------------
// Connection state
// ---------------------------------------------------------------------------

/**
 * Shell WS does NOT auto-reconnect (unlike chat WS). User clicks Reconnect.
 * Therefore no 'reconnecting' state.
 */
export type ShellConnectionState = 'disconnected' | 'connecting' | 'connected';

// ---------------------------------------------------------------------------
// Client -> Server messages
// ---------------------------------------------------------------------------

export type ShellClientMessage =
  | {
      type: 'init';
      projectPath: string;
      cols: number;
      rows: number;
    }
  | {
      type: 'input';
      data: string;
    }
  | {
      type: 'resize';
      cols: number;
      rows: number;
    };

// ---------------------------------------------------------------------------
// Server -> Client messages
// ---------------------------------------------------------------------------

export type ShellServerMessage =
  | {
      type: 'output';
      data: string;
    }
  | {
      type: 'auth_url';
      url: string;
      autoOpen: boolean;
    };
