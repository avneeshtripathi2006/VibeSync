import { useEffect, useRef, useState, useCallback } from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import { getSockJsUrl } from "../config/env.js";

const MAX_ATTEMPTS = 16;

/**
 * STOMP over SockJS for /topic/messages/{myId}. Retries with backoff (cold Render + GitHub Pages).
 */
export function useStompConnection(myId, onInboundMessage) {
  const stompRef = useRef(null);
  const onMessageRef = useRef(onInboundMessage);
  const [status, setStatus] = useState("idle"); // idle | connecting | connected | error

  useEffect(() => {
    onMessageRef.current = onInboundMessage;
  }, [onInboundMessage]);

  useEffect(() => {
    if (myId == null) {
      setStatus("idle");
      return;
    }

    let cancelled = false;
    const timers = [];
    let attempts = 0;

    const schedule = (fn, ms) => {
      const t = window.setTimeout(fn, ms);
      timers.push(t);
      return t;
    };

    const connectOnce = () => {
      if (cancelled || attempts >= MAX_ATTEMPTS) {
        if (!cancelled && attempts >= MAX_ATTEMPTS) setStatus("error");
        return;
      }
      attempts += 1;
      setStatus("connecting");

      try {
        if (stompRef.current?.connected) {
          setStatus("connected");
          return;
        }
        const url = getSockJsUrl();
        const socket = new SockJS(url);
        const client = Stomp.over(socket);
        client.debug = null;
        stompRef.current = client;

        client.connect(
          {},
          () => {
            if (cancelled) return;
            setStatus("connected");
            const topic = "/topic/messages/" + myId;
            client.subscribe(topic, (msg) => {
              try {
                const body = JSON.parse(msg.body);
                onMessageRef.current?.(body);
              } catch (_) {
                /* ignore malformed */
              }
            });
          },
          () => {
            stompRef.current = null;
            if (cancelled) return;
            setStatus("connecting");
            const delay = Math.min(20_000, 400 + attempts * 550);
            schedule(connectOnce, delay);
          }
        );
      } catch {
        stompRef.current = null;
        if (cancelled) return;
        const delay = Math.min(20_000, 400 + attempts * 550);
        schedule(connectOnce, delay);
      }
    };

    schedule(() => {
      requestAnimationFrame(() => requestAnimationFrame(connectOnce));
    }, 0);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      try {
        stompRef.current?.disconnect?.();
      } catch (_) {
        /* ignore */
      }
      stompRef.current = null;
    };
  }, [myId]);

  const sendChat = useCallback((payloadObject) => {
    const client = stompRef.current;
    if (!client?.connected) return false;
    try {
      client.send("/app/chat.send", {}, JSON.stringify(payloadObject));
      return true;
    } catch {
      return false;
    }
  }, []);

  return { stompRef, status, sendChat };
}
