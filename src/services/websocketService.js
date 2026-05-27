import api from './api';

class WebSocketService {
  constructor() {
    this.eventSource = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isConnecting = false;
    this.reconnectTimeout = null;
    this.lastKeepAliveTime = null;
    this.keepAliveInterval = null;
  }

  connect() {
    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      this.eventSource?.close();

      // This service currently consumes Server-Sent Events; the auth cookie is
      // sent by the browser and is never placed in a URL or JavaScript state.
      const url = `${api.defaults.baseURL}/websocket/handler?ts=${Date.now()}`;
      this.eventSource = new EventSource(url, { withCredentials: true });

      ['newLog', 'newResponse', 'reminder', 'reminderError'].forEach((eventType) => {
        this.eventSource.addEventListener(eventType, this.createEventHandler(eventType));
      });

      this.eventSource.addEventListener('connection', () => {
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.startKeepAliveMonitor();
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      });

      this.eventSource.onerror = this.handleError.bind(this);
      this.eventSource.onmessage = (event) => {
        this.lastKeepAliveTime = Date.now();
        if (event.data.startsWith('keepalive')) return;

        try {
          const data = JSON.parse(event.data);
          this.listeners.get(event.type)?.forEach((callback) => callback(data));
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };
    } catch (error) {
      console.error('Error creating connection:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  startKeepAliveMonitor() {
    this.lastKeepAliveTime = Date.now();
    clearInterval(this.keepAliveInterval);

    this.keepAliveInterval = setInterval(() => {
      if (Date.now() - this.lastKeepAliveTime > 30000) {
        this.reconnect();
      }
    }, 5000);
  }

  getStatus() {
    if (!this.eventSource) return 'Disconnected';
    if (this.eventSource.readyState === EventSource.CONNECTING) return 'Connecting';
    if (this.eventSource.readyState === EventSource.OPEN) return 'Connected';
    return 'Disconnected';
  }

  createEventHandler(eventType) {
    return (event) => {
      try {
        const data = JSON.parse(event.data);
        this.listeners.get(eventType)?.forEach((callback) => callback(data));
      } catch (error) {
        console.error(`Error processing ${eventType} event:`, error);
      }
    };
  }

  handleError() {
    this.isConnecting = false;
    clearInterval(this.keepAliveInterval);
    this.keepAliveInterval = null;
    this.scheduleReconnect();
  }

  addEventListener(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(callback);
  }

  removeEventListener(type, callback) {
    this.listeners.get(type)?.delete(callback);
  }

  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectTimeout = setTimeout(
        () => this.reconnect(),
        1000 * Math.min(this.reconnectAttempts + 1, 30)
      );
    }
  }

  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts += 1;
    this.connect();
  }

  disconnect() {
    clearInterval(this.keepAliveInterval);
    clearTimeout(this.reconnectTimeout);
    this.eventSource?.close();
    this.eventSource = null;
    this.listeners.clear();
  }
}

export default new WebSocketService();
