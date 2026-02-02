// import { Server } from 'socket.io';
// import type { Socket } from 'socket.io';
// import { supabase } from '../db';

// // Room name builders
// function buildGeneralRoom(patientId: number, doctorId: number) {
//   return `room_general_patient_${patientId}_doctor_${doctorId}`;
// }
// function buildAppointmentRoom(appointmentType: 'virtual'|'home_visit'|'in_person', appointmentId: number) {
//   return `room_appointment_${appointmentType}_${appointmentId}`;
// }
// function toAppointmentType(x: any): 'virtual'|'home_visit'|'in_person' {
//   const v = String(x);
//   if (v === 'virtual' || v === 'home_visit' || v === 'in_person') return v;
//   return 'virtual';
// }

// // History loaders
// async function loadHistory(payload: any) {
//   const { chatContext } = payload || {};
//   if (chatContext === 'general') {
//     const { patientId, doctorId } = payload;
//     // Both directions between patient and doctor
//     const { data, error } = await supabase
//       .from('chat_messages')
//       .select('*')
//       .eq('chat_context', 'general')
//       .or(
//         `and(sender_id.eq.${patientId},receiver_id.eq.${doctorId}),and(sender_id.eq.${doctorId},receiver_id.eq.${patientId})`
//       )
//       .order('created_at', { ascending: true });
//     if (error) throw error;
//     return data || [];
//   }

//   if (chatContext === 'appointment') {
//     const { appointmentType, appointmentId, patientId, doctorId } = payload;
//     const { data, error } = await supabase
//       .from('chat_messages')
//       .select('*')
//       .eq('chat_context', 'appointment')
//       .eq('appointment_type', appointmentType)
//       .eq('appointment_id', Number(appointmentId))
//       .or(
//         `and(sender_id.eq.${patientId},receiver_id.eq.${doctorId}),and(sender_id.eq.${doctorId},receiver_id.eq.${patientId})`
//       )
//       .order('created_at', { ascending: true });
//     if (error) throw error;
//     return data || [];
//   }

//   return [];
// }

// function computeRoom(payload: any) {
//   const { chatContext } = payload || {};
//   if (chatContext === 'general') {
//     const { patientId, doctorId } = payload;
//     return buildGeneralRoom(Number(patientId), Number(doctorId));
//   }
//   if (chatContext === 'appointment') {
//     const { appointmentType, appointmentId } = payload;
//     return buildAppointmentRoom(toAppointmentType(appointmentType), Number(appointmentId));
//   }
//   throw new Error('Invalid chatContext');
// }

// export function initChatSocket(io: Server) {
//   io.on('connection', (socket: Socket) => {
//     // join_room
//     socket.on('join_room', async (payload: any) => {
//       try {
//         const room = computeRoom(payload);
//         socket.join(room);

//         // Load and send chat history to the joining client
//         const history = await loadHistory(payload);
//         socket.emit('room_joined', { room });
//         socket.emit('room_history', { room, messages: history });
//       } catch (e: any) {
//         socket.emit('error_message', { message: e?.message || 'Failed to join room' });
//       }
//     });

//     // send_message
//     socket.on('send_message', async (payload: any) => {
//       try {
//         const {
//           chatContext,
//           appointmentType, // nullable for general
//           appointmentId,   // nullable for general
//           senderType,      // 'patient' | 'doctor'
//           senderId,
//           receiverId,
//           message,
//           patientId,
//           doctorId,
//         } = payload || {};

//         if (!chatContext || !senderType || !senderId || !receiverId || !message) {
//           return socket.emit('error_message', { message: 'Missing required fields' });
//         }

//         const insertRow: any = {
//           chat_context: chatContext,
//           appointment_type: chatContext === 'appointment' ? appointmentType : null,
//           appointment_id: chatContext === 'appointment' ? Number(appointmentId) : null,
//           sender_type: senderType,
//           sender_id: Number(senderId),
//           receiver_id: Number(receiverId),
//           message: String(message),
//         };

//         const { data, error } = await supabase
//           .from('chat_messages')
//           .insert([insertRow])
//           .select('*')
//           .single();
//         if (error) throw error;

//         const saved = data as any;
//         const room = computeRoom({ chatContext, appointmentType, appointmentId, patientId, doctorId });
//         io.to(room).emit('new_message', { room, message: saved });
//       } catch (e: any) {
//         socket.emit('error_message', { message: e?.message || 'Failed to send message' });
//       }
//     });

//     // typing
//     socket.on('typing', (payload: any) => {
//       try {
//         const room = computeRoom(payload);
//         socket.to(room).emit('typing', { room, from: payload?.senderId });
//       } catch {}
//     });

//     // stop_typing
//     socket.on('stop_typing', (payload: any) => {
//       try {
//         const room = computeRoom(payload);
//         socket.to(room).emit('stop_typing', { room, from: payload?.senderId });
//       } catch {}
//     });

//     socket.on('disconnect', () => {
//       // noop; could log socket.id
//     });
//   });
// }
import { Server, Socket } from "socket.io";
import { supabase } from "../db";

// ---------------------
// Room name builders
// ---------------------
function buildGeneralRoom(patientId: number, doctorId: number) {
  return `room_general_patient_${patientId}_doctor_${doctorId}`;
}

function buildAppointmentRoom(
  appointmentType: "virtual" | "home_visit" | "in_person",
  appointmentId: number
) {
  return `room_appointment_${appointmentType}_${appointmentId}`;
}

function toAppointmentType(x: any): "virtual" | "home_visit" | "in_person" {
  const v = String(x);
  if (v === "virtual" || v === "home_visit" || v === "in_person") return v;
  return "virtual";
}

// ----------------------------------------------------
// Load Chat History
// ----------------------------------------------------
async function loadHistory(payload: any) {
  const { chatContext } = payload || {};

  console.log("📥 Loading history for payload:", payload);

  if (chatContext === "general") {
    const { patientId, doctorId } = payload;

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_context", "general")
      .or(
        `and(sender_id.eq.${patientId},receiver_id.eq.${doctorId}),and(sender_id.eq.${doctorId},receiver_id.eq.${patientId})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Error loading general history:", error);
      throw error;
    }

    console.log("📤 General history loaded:", data);
    return data || [];
  }

  if (chatContext === "appointment") {
    const { appointmentType, appointmentId, patientId, doctorId } = payload;

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_context", "appointment")
      .eq("appointment_type", appointmentType)
      .eq("appointment_id", Number(appointmentId))
      .or(
        `and(sender_id.eq.${patientId},receiver_id.eq.${doctorId}),and(sender_id.eq.${doctorId},receiver_id.eq.${patientId})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Error loading appointment history:", error);
      throw error;
    }

    console.log("📤 Appointment history loaded:", data);
    return data || [];
  }

  return [];
}

// Compute which room to join
function computeRoom(payload: any) {
  const { chatContext } = payload || {};
  if (chatContext === "general") {
    const { patientId, doctorId } = payload;
    return buildGeneralRoom(Number(patientId), Number(doctorId));
  }
  if (chatContext === "appointment") {
    const { appointmentType, appointmentId } = payload;
    return buildAppointmentRoom(
      toAppointmentType(appointmentType),
      Number(appointmentId)
    );
  }
  throw new Error("Invalid chatContext");
}

// ----------------------------------------------------
// EXPORT: initChatSocket
// ----------------------------------------------------
export function initChatSocket(io: Server) {
  console.log("⚡ Chat socket initialized...");

  io.on("connection", (socket: Socket) => {
    console.log("🟢 New client connected:", socket.id);

    // JOIN ROOM
    socket.on("join_room", async (payload: any) => {
      console.log("📥 join_room payload:", payload);

      try {
        const room = computeRoom(payload);
        console.log(`📌 Joining room: ${room}`);

        socket.join(room);

        const history = await loadHistory(payload);

        console.log(`📤 Sending history to ${socket.id}`);

        socket.emit("room_joined", { room });
        socket.emit("room_history", { room, messages: history });
      } catch (e: any) {
        console.error("❌ join_room error:", e);
        socket.emit("error_message", { message: e?.message || "Failed to join room" });
      }
    });

    // SEND MESSAGE
    socket.on("send_message", async (payload: any) => {
      console.log("📥 send_message payload:", payload);

      try {
        const {
          chatContext,
          appointmentType,
          appointmentId,
          senderType,
          senderId,
          receiverId,
          message,
          patientId,
          doctorId,
        } = payload || {};

        if (!chatContext || !senderType || !senderId || !receiverId || !message) {
          return socket.emit("error_message", { message: "Missing required fields" });
        }

        const insertRow = {
          chat_context: chatContext,
          appointment_type: chatContext === "appointment" ? appointmentType : null,
          appointment_id: chatContext === "appointment" ? Number(appointmentId) : null,
          sender_type: senderType,
          sender_id: Number(senderId),
          receiver_id: Number(receiverId),
          message: String(message),
        };

        const { data, error } = await supabase
          .from("chat_messages")
          .insert([insertRow])
          .select("*")
          .single();

        if (error) {
          console.error("❌ Error saving message:", error);
          throw error;
        }

        const saved = data;

        const room = computeRoom({
          chatContext,
          appointmentType,
          appointmentId,
          patientId,
          doctorId,
        });

        console.log("📤 Broadcasting to room:", room);

        io.to(room).emit("new_message", { room, message: saved });
      } catch (e: any) {
        console.error("❌ send_message error:", e);
        socket.emit("error_message", { message: e?.message || "Failed to send message" });
      }
    });

    // TYPING
    socket.on("typing", (payload: any) => {
      try {
        const room = computeRoom(payload);
        socket.to(room).emit("typing", { room, from: payload?.senderId });
      } catch {}
    });

    socket.on("stop_typing", (payload: any) => {
      try {
        const room = computeRoom(payload);
        socket.to(room).emit("stop_typing", { room, from: payload?.senderId });
      } catch {}
    });

    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
    });
  });
}
