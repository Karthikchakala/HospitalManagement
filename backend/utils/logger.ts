// backend/utils/logger.ts
import { supabase } from '../db';
import { Request } from 'express';

interface LogData {
    userId: number | null;
    action: string;
    ipAddress: string;
}

/**
 * Writes an event to the AuditLogs table.
 */
export const logAuditAction = async ({ userId, action, ipAddress }: LogData) => {
    try {
        // Ensure userId is null if it comes as 0 or undefined (safety check)
        const finalUserId = userId || null; 

        const { error } = await supabase
            .from('AuditLogs')
            .insert([{
                user_id: finalUserId,
                action: action,
                ip_address: ipAddress,
            }]);

        if (error) {
            console.error('Audit Logging Failed:', error);
        }
    } catch (e) {
        console.error('Fatal Logging Error:', e);
    }
};

/**
 * Helper to get IP address from Express request headers.
 */
export const getIpAddress = (req: Request): string => {
    // Check common headers for the client's true IP
    // req.headers['x-forwarded-for'] is standard when behind a proxy/load balancer
    return (
        req.headers['x-forwarded-for'] || 
        req.socket.remoteAddress || 
        '127.0.0.1' // Fallback IP
    ) as string;
};