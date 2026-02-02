"use client";
import { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export type ChatContext = 'general' | 'appointment';
export type AppointmentType = 'virtual' | 'home_visit' | 'in_person';
export type SenderType = 'patient' | 'doctor';

export type JoinPayload = {
  chatContext: ChatContext;
  // general
  patientId?: number;
  doctorId?: number;
  // appointment
  appointmentType?: AppointmentType;
  appointmentId?: number;
  // sender
  senderType: SenderType;
  senderId: number;
};

export type ChatMessage = {
  message_id?: string | number;
  sender_id: number;
  sender_type: SenderType;
  message: string;
  created_at?: string | number;
};

export function useChat(serverUrl: string, joinPayload: JoinPayload) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingFrom, setTypingFrom] = useState<number | null>(null);

  const socket: Socket = useMemo(() => io(serverUrl, {
    transports: ['websocket', 'polling'],
    path: '/socket.io',
    reconnection: true,
    reconnectionAttempts: 10,
    timeout: 20000,
    withCredentials: false,
  }), [serverUrl]);

  useEffect(() => {
    const onConnect = () => {
      socket.emit('join_room', joinPayload);
    };
    const onConnectError = (err: unknown) => {
      console.error('socket connect_error', err instanceof Error ? err.message : err);
    };
    const onError = (err: unknown) => {
      console.error('socket error', err instanceof Error ? err.message : err);
    };
    const onHistory = (data: { messages: ChatMessage[] }) => {
      setMessages(data?.messages || []);
    };
    const onNewMessage = (data: { message: ChatMessage }) => {
      setMessages(prev => [...prev, data.message]);
    };
    const onTyping = (data: { from: number }) => setTypingFrom(data?.from || null);
    const onStopTyping = () => setTypingFrom(null);
    const onErrorMsg = (e: unknown) => console.error('chat error', e);

    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
    socket.on('error', onError);
    socket.on('room_history', onHistory);
    socket.on('new_message', onNewMessage);
    socket.on('typing', onTyping);
    socket.on('stop_typing', onStopTyping);
    socket.on('error_message', onErrorMsg);

    // Ensure we join immediately on payload changes even if already connected
    socket.emit('join_room', joinPayload);

    return () => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
      socket.off('error', onError);
      socket.off('room_history', onHistory);
      socket.off('new_message', onNewMessage);
      socket.off('typing', onTyping);
      socket.off('stop_typing', onStopTyping);
      socket.off('error_message', onErrorMsg);
    };
  }, [socket, joinPayload]);

  const sendMessage = (payload: {
    message: string;
    receiverId: number;
    patientId?: number;
    doctorId?: number;
    appointmentType?: AppointmentType;
    appointmentId?: number;
  }) => {
    socket.emit('send_message', {
      ...joinPayload,
      ...payload,
    });
  };

  const typing = () => socket.emit('typing', joinPayload);
  const stopTyping = () => socket.emit('stop_typing', joinPayload);

  return { messages, typingFrom, sendMessage, typing, stopTyping };
}
