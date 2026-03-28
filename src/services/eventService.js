import api from './api';

class EventService {
  constructor() {
    this.eventSource = null;
    this.reconnectAttempts = 0;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.eventSource) {
      this.disconnect();
    }

    try {
      const baseURL = api.defaults.baseURL;
      const url = `${baseURL}/events/logs?token=${token}`;
      
      console.log('Connecting to SSE:', url);
      
      this.eventSource = new EventSource(url);
      
      this.eventSource.onopen = () => {
        console.log('SSE Connection established');
        this.reconnectAttempts = 0;
        this.dispatchEvent('connected', { status: 'connected' });
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE Connection error:', error);
        this.dispatchEvent('error', { error: 'Connection error' });
        
        if (this.eventSource.readyState === EventSource.CLOSED) {
          this.reconnect(token);
        }
      };

      // Handle specific event types
      ['log', 'response', 'reminder', 'reminderError', 'connected', 'error'].forEach(eventType => {
        this.eventSource.addEventListener(eventType, (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log(`${eventType} event received:`, data);
            this.dispatchEvent(eventType, data);
          } catch (error) {
            console.error(`Error processing ${eventType} event:`, error);
          }
        });
      });

      return this.eventSource;
    } catch (error) {
      console.error('Error creating EventSource:', error);
      this.reconnect(token);
    }
  }

  addEventListener(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(callback);
    return () => this.removeEventListener(type, callback);
  }

  removeEventListener(type, callback) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).delete(callback);
    }
  }

  dispatchEvent(type, data) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${type} event handler:`, error);
        }
      });
    }
  }

  reconnect(token) {
    if (this.reconnectAttempts >= 5) {
      console.error('Max reconnection attempts reached');
      this.dispatchEvent('error', { error: 'Max reconnection attempts reached' });
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/5)...`);
    
    setTimeout(() => {
      this.connect(token);
    }, 1000 * Math.pow(2, this.reconnectAttempts)); // Exponential backoff
  }

  disconnect() {
    if (this.eventSource) {
      console.log('Disconnecting SSE');
      this.eventSource.close();
      this.eventSource = null;
      this.dispatchEvent('disconnected', { status: 'disconnected' });
    }
  }
}

export default new EventService();