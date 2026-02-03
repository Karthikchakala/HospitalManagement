'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL;

type Role = 'caller' | 'callee';

export default function VideoRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [muted, setMuted] = useState(false);
  const [role, setRole] = useState<Role>('caller');
  const [status, setStatus] = useState('Connecting…');



  const iceServers = useMemo(() => ({ iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }] }), []);

  const pollAnswer = React.useCallback(async (pc: RTCPeerConnection) => {
    let tries = 0;
    while (tries < 60) { // ~60s
      await new Promise((r) => setTimeout(r, 1000));
      const res = await fetch(`${API_BASE}/api/video/room/${roomId}/answer`);
      const data = await res.json();
      if (data?.answer) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        setStatus('Connected');
        return;
      }
      tries++;
    }
    setStatus('Peer did not join.');
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    let active = true;
    let cleanupFn: (() => void) | undefined;

    const setup = async () => {
      try {
        setStatus('Getting media…');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        setStatus('Joining room…');
        const r = await fetch(`${API_BASE}/api/video/room/${roomId}`);
        const info = await r.json();

        const pc = new RTCPeerConnection(iceServers);
        pcRef.current = pc;

        // Local tracks
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        // Remote track
        pc.ontrack = (ev) => {
          const remote = ev.streams?.[0];
          if (remote && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remote;
          }
        };

        // ICE
        pc.onicecandidate = async (ev) => {
          if (ev.candidate) {
            await fetch(`${API_BASE}/api/video/room/${roomId}/candidate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(ev.candidate),
            });
          }
        };

        // Determine role
        const amCaller = !info.offer; // first joiner becomes caller
        setRole(amCaller ? 'caller' : 'callee');

        if (amCaller) {
          setStatus('Creating offer…');
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await fetch(`${API_BASE}/api/video/room/${roomId}/offer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(offer),
          });

          // Wait for answer polling
          await pollAnswer(pc);
        } else {
          setStatus('Fetching offer…');
          const offRes = await fetch(`${API_BASE}/api/video/room/${roomId}/offer`);
          const { offer } = await offRes.json();
          if (offer) {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await fetch(`${API_BASE}/api/video/room/${roomId}/answer`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(answer),
            });
          }
        }

        // Periodically pull remote ICE candidates
        const candidInterval = setInterval(async () => {
          try {
            const res = await fetch(`${API_BASE}/api/video/room/${roomId}/candidates`);
            const data = await res.json();
            const candidates = Array.isArray(data?.candidates) ? data.candidates : [];
            for (const c of candidates) {
              try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch { }
            }
          } catch { }
        }, 1000);

        setStatus('Waiting for peer…');

        const cleanup = () => clearInterval(candidInterval);
        if (!active) cleanup();
        return cleanup;
      } catch {
        setStatus('Failed to initialize media.');
      }
    };

    setup().then((fn) => { if (typeof fn === 'function') cleanupFn = fn; }).catch(() => { });
    return () => {
      active = false;
      if (cleanupFn) cleanupFn();
      if (pcRef.current) pcRef.current.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [roomId, iceServers, pollAnswer]);



  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const enabled = !muted;
    stream.getAudioTracks().forEach((t) => (t.enabled = !enabled));
    setMuted(enabled);
  };

  const endCall = async () => {
    try { await fetch(`${API_BASE}/api/video/room/${roomId}`, { method: 'DELETE' }); } catch { }
    if (pcRef.current) pcRef.current.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    router.back();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-2">Virtual Appointment</h1>
      <p className="text-sm text-slate-300 mb-6">Room: <span className="font-mono">{String(roomId)}</span> · Role: {role} · {status}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
        <video ref={localVideoRef} autoPlay playsInline muted className="w-full rounded-lg bg-black aspect-video" />
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full rounded-lg bg-black aspect-video" />
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button onClick={toggleMute} className={`px-4 py-2 rounded-lg border ${muted ? 'bg-red-600 border-red-500' : 'bg-slate-800 border-slate-700'}`}>{muted ? 'Unmute' : 'Mute'}</button>
        <button onClick={endCall} className="px-4 py-2 rounded-lg bg-red-600 border border-red-500">End Call</button>
      </div>
    </div>
  );
}
