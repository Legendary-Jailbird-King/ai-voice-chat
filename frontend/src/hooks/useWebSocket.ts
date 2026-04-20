import { useEffect, useRef, useState, useCallback } from "react";

export interface WsMessage {
  type: "audio" | "text" | "ai_response" | "error" | "status";
  payload: unknown;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  send: (msg: WsMessage) => void;
  lastMessage: WsMessage | null;
  connect: () => void;
  disconnect: () => void;
}

export default function useWebSocket(
  url: string = "ws://localhost:3001"
): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WsMessage | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intentionalClose = useRef(false);
  const urlRef = useRef(url);
  urlRef.current = url;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    intentionalClose.current = false;
    const ws = new WebSocket(urlRef.current);

    ws.onopen = () => setIsConnected(true);

    ws.onclose = () => {
      setIsConnected(false);
      if (!intentionalClose.current) {
        reconnectTimer.current = setTimeout(() => connect(), 3000);
      }
    };

    ws.onerror = () => {
      ws.close();
    };

    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);
        setLastMessage(msg);
      } catch {
        // ignore non-JSON messages
      }
    };

    wsRef.current = ws;
  }, []);

  const disconnect = useCallback(() => {
    intentionalClose.current = true;
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const send = useCallback((msg: WsMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return { isConnected, send, lastMessage, connect, disconnect };
}
