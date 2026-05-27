import api from './api';

class EventService {
  constructor() {
    this.eventSource = null;
    this.reconnectAttempts = 0;
    this.listeners = new Map();
  }

  connect() {
    if (this.eventSource) {
      this.disconnect();
    }

    try {
      const url = `${api.defaults.baseURL}/events/logs`;

      this.eventSource = new EventSource(url, { withCredentials: true });

      this.eventSource.onopen = () => {
        this.reconnectAttempts = 0;
        this.dispatchEvent('connected', { status: 'connected' });
      };

      this.eventSource.onerror = () => {
        this.dispatchEvent('error', { error: 'Connection error' });

        if (this.eventSource.readyState === EventSource.CLOSED) {
          this.reconnect();
        }
      };

      ['log', 'response', 'reminder', 'reminderError', 'connected', 'error'].forEach((eventType) => {
        this.eventSource.addEventListener(eventType, (event) => {
          try {
            this.dispatchEvent(eventType, JSON.parse(event.data));
          } catch (error) {
            console.error(`Error processing ${eventType} event:`, error);
          }
        });
      });

      return this.eventSource;
    } catch (error) {
      console.error('Error creating EventSource:', error);
      this.reconnect();
      return null;
    }
  }

  addEventListener(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(callback);
    return () => this.removeEventListener(type, callback);
  }

  removeEventListener(type, callback) {
    this.listeners.get(type)?.delete(callback);
  }

  dispatchEvent(type, data) {
    this.listeners.get(type)?.forEach((callback) => callback(data));
  }

  reconnect() {
    if (this.reconnectAttempts >= 5) {
      this.dispatchEvent('error', { error: 'Max reconnection attempts reached' });
      return;
    }

    this.reconnectAttempts += 1;
    setTimeout(() => this.connect(), 1000 * Math.pow(2, this.reconnectAttempts));
  }

  disconnect() {
    this.eventSource?.close();
    this.eventSource = null;
    this.dispatchEvent('disconnected', { status: 'disconnected' });
  }
}

export default new EventService();
