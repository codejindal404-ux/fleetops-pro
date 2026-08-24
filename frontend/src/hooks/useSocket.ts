import { useEffect, useState } from 'react';
import { socketClient } from '../services/socketClient.ts';

export function useSocket() {
  const [connected, setConnected] = useState<boolean>(socketClient.getConnected());

  useEffect(() => {
    const token = localStorage.getItem('fleetops_token');
    if (token) {
      socketClient.init(token);
    }

    const unsubscribe = socketClient.subscribeStatus((status) => {
      setConnected(status);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    socket: socketClient.getSocket(),
    connected
  };
}
