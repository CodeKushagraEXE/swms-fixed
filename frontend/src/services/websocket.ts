import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { wsURL } from '../config/env';

class WebSocketService {
  private client: Client | null = null;
  private handlers: Map<string, Function[]> = new Map();
  private subscriptions: Map<string, any> = new Map();

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = new Client({
        webSocketFactory: () => new SockJS(wsURL),
        connectHeaders: { Authorization: `Bearer ${token}` },
        onConnect: () => { this.resubscribeAll(); resolve(); },
        onStompError: reject,
        reconnectDelay: 5000,
      });
      this.client.activate();
    });
  }

  private resubscribeAll() {
    this.handlers.forEach((handlers, topic) => {
      if (!this.subscriptions.has(topic)) this.doSubscribe(topic);
    });
  }

  private doSubscribe(topic: string) {
    if (!this.client?.connected) return;
    const sub = this.client.subscribe(topic, (msg: any) => {
      const event = JSON.parse(msg.body);
      this.handlers.get(topic)?.forEach(h => h(event));
    });
    this.subscriptions.set(topic, sub);
  }

  subscribeToProject(projectId: number, handler: Function) {
    const topic = `/topic/project/${projectId}`;
    if (!this.handlers.has(topic)) this.handlers.set(topic, []);
    this.handlers.get(topic)!.push(handler);
    if (this.client?.connected) this.doSubscribe(topic);
  }

  unsubscribeFromProject(projectId: number) {
    const topic = `/topic/project/${projectId}`;
    this.subscriptions.get(topic)?.unsubscribe();
    this.subscriptions.delete(topic);
    this.handlers.delete(topic);
  }

  disconnect() { this.client?.deactivate(); }
  isConnected() { return this.client?.connected ?? false; }
}

export const wsService = new WebSocketService();
