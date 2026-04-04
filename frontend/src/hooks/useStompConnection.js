import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getSockJsUrl } from "../config/env.js";

/**
 * STOMP over SockJS using @stomp/stompjs (browser-safe). Legacy `stompjs` breaks under Vite.
 */
export function useStompConnection(myId, onInboundMessage) {
  const clientRef = useRef(null);
  const onMessageRef = useRef(onInboundMessage);
  const [status, setStatus] = useState("idle"); // idle | connecting | connected

  useEffect(() => {
    onMessageRef.current = onInboundMessage;
  }, [onInboundMessage]);

  useEffect(() => {
    if (myId == null) {
      setStatus("idle");
      return;
    }

    let cancelled = false;
    const url = getSockJsUrl();

    const client = new Client({
      webSocketFactory: () => new SockJS(url),
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {},
      onConnect: () => {
        if (cancelled) return;
        setStatus("connected");
        client.subscribe(`/topic/messages/${myId}`, (stompMsg) => {
          try {
            const body = JSON.parse(stompMsg.body);
            onMessageRef.current?.(body);
          } catch (_) {
            /* ignore */
          }
        });
      },
      onDisconnect: () => {
        if (!cancelled) setStatus("connecting");
      },
      onStompError: () => {
        if (!cancelled) setStatus("connecting");
      },
      onWebSocketClose: () => {
        if (!cancelled) setStatus("connecting");
      },
    });

    clientRef.current = client;
    setStatus("connecting");
    client.activate();

    return () => {
      cancelled = true;
      try {
        client.deactivate();
      } catch (_) {
        /* ignore */
      }
      clientRef.current = null;
    };
  }, [myId]);

  const sendChat = useCallback((payloadObject) => {
    const c = clientRef.current;
    if (!c?.connected) return false;
    try {
      c.publish({
        destination: "/app/chat.send",
        body: JSON.stringify(payloadObject),
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  return { clientRef, status, sendChat };
}
