import { useEffect, useRef } from "react";
import { supabase, SUPABASE_READY } from "../lib/supabase";

/* Real-time co-presence over a Supabase broadcast channel.
   - You broadcast your controlled character's target position.
   - The partner's browser receives it and moves the OTHER character to match.
   No DB writes — broadcast is ephemeral and low-latency.

   Returns { remoteRef, broadcast }:
   - remoteRef.current = latest {x,y,z} the partner sent (or null)
   - broadcast(pos) = send your position (call throttled) */
export function usePresence(controlledChar) {
  const remoteRef = useRef(null);
  const channelRef = useRef(null);
  const partnerOnlineRef = useRef(false); // true while partner is broadcasting
  const lastSeen = useRef(0);

  useEffect(() => {
    if (!SUPABASE_READY) return;
    const channel = supabase.channel("our-world", {
      config: { broadcast: { self: false } }, // don't echo our own messages
    });
    channel
      .on("broadcast", { event: "move" }, ({ payload }) => {
        // only react to the partner's character (not our own id)
        if (payload && payload.char && payload.char !== controlledChar) {
          remoteRef.current = { x: payload.x, y: payload.y, z: payload.z };
          partnerOnlineRef.current = true;
          lastSeen.current = Date.now();
        }
      })
      .subscribe();
    channelRef.current = channel;

    // mark partner offline if we haven't heard from them in 5s
    const t = setInterval(() => {
      if (Date.now() - lastSeen.current > 5000) partnerOnlineRef.current = false;
    }, 1000);

    return () => {
      clearInterval(t);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [controlledChar]);

  const broadcast = (pos) => {
    const ch = channelRef.current;
    if (!ch) return;
    ch.send({
      type: "broadcast",
      event: "move",
      payload: { char: controlledChar, x: pos.x, y: pos.y, z: pos.z },
    });
  };

  return { remoteRef, broadcast, partnerOnlineRef };
}
