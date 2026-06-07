import { useEffect, useRef } from "react";
import { supabase, SUPABASE_READY } from "../lib/supabase";

/* Real-time co-presence over a Supabase broadcast channel.
   - You broadcast your controlled character's position (+ a heartbeat so the
     partner still counts you "online" even while you stand still).
   - You can also broadcast a one-off "contact" event so BOTH devices play the
     cutscene together (regardless of who detected the contact).

   Returns { remoteRef, broadcast, partnerOnlineRef, sendContact, onContact } */
export function usePresence(controlledChar, onContactRef) {
  const remoteRef = useRef(null);
  const channelRef = useRef(null);
  const partnerOnlineRef = useRef(false);
  const lastSeen = useRef(0);
  const lastBeat = useRef(0);

  useEffect(() => {
    if (!SUPABASE_READY) return;
    const channel = supabase.channel("our-world", {
      config: { broadcast: { self: false } },
    });
    channel
      .on("broadcast", { event: "move" }, ({ payload }) => {
        if (payload && payload.char && payload.char !== controlledChar) {
          if (payload.x != null) remoteRef.current = { x: payload.x, y: payload.y, z: payload.z };
          partnerOnlineRef.current = true;
          lastSeen.current = Date.now();
        }
      })
      .on("broadcast", { event: "contact" }, ({ payload }) => {
        // partner says they touched us → play the cutscene on this device too
        if (payload && payload.char && payload.char !== controlledChar) {
          onContactRef?.current?.();
        }
      })
      .subscribe();
    channelRef.current = channel;

    const t = setInterval(() => {
      if (Date.now() - lastSeen.current > 6000) partnerOnlineRef.current = false;
    }, 1000);

    return () => {
      clearInterval(t);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [controlledChar, onContactRef]);

  // Broadcast position when it changed, OR a heartbeat every ~2s while still, so
  // a stationary player still registers as "online" to their partner.
  const broadcast = (pos) => {
    const ch = channelRef.current;
    if (!ch) return;
    ch.send({
      type: "broadcast",
      event: "move",
      payload: { char: controlledChar, x: pos.x, y: pos.y, z: pos.z },
    });
  };

  const heartbeat = () => {
    const ch = channelRef.current;
    if (!ch) return;
    const now = Date.now();
    if (now - lastBeat.current < 2000) return;
    lastBeat.current = now;
    ch.send({ type: "broadcast", event: "move", payload: { char: controlledChar } });
  };

  const sendContact = () => {
    const ch = channelRef.current;
    if (!ch) return;
    ch.send({ type: "broadcast", event: "contact", payload: { char: controlledChar } });
  };

  return { remoteRef, broadcast, heartbeat, partnerOnlineRef, sendContact };
}
