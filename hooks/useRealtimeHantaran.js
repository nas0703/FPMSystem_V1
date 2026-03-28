import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useRealtimeHantaran(userId, authRole) {
    const [rawData, setRawData] = useState([]);

    useEffect(() => {
        if (!authRole || !userId) return;

        let channel;
        let isActive = true;

        const setupSubscription = async () => {
            try {
                channel = supabase.channel(`hantaran-${userId}`)
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'hantaran_hasil',
                        filter: `user_id=eq.${userId}`,
                    }, (payload) => {
                        if (!isActive) return;
                        setRawData(prev => {
                            let updated = [...prev];
                            if (payload.eventType === 'INSERT') {
                                const exists = updated.some(p => p.id === payload.new.id);
                                if (!exists) updated = [payload.new, ...updated];
                            } else if (payload.eventType === 'UPDATE') {
                                updated = updated.map(p => p.id === payload.new.id ? payload.new : p);
                            } else if (payload.eventType === 'DELETE') {
                                updated = updated.filter(p => p.id !== payload.old.id);
                            }
                            return updated.slice(0, 1000);
                        });
                    })
                    .subscribe((status) => {
                        if (status === 'SUBSCRIBED') {
                            console.log('Real-time subscription active');
                        } else if (status === 'CLOSED') {
                            console.warn('Real-time subscription closed');
                        }
                    });
            } catch (error) {
                console.error('Subscription setup error:', error);
            }
        };

        setupSubscription();

        return () => {
            isActive = false;
            if (channel) {
                channel.unsubscribe().catch(err => console.error('Unsubscribe error:', err));
            }
        };
    }, [authRole, userId]);

    return { rawData, setRawData };
}