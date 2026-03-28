import api from './api';
class WebSocketService {
  constructor() {
    this.eventSource = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isConnecting = false;
    this.token = null;
    this.reconnectTimeout = null;
    this.lastKeepAliveTime = null;
    this.keepAliveInterval = null;
  }

  connect(token) {
    if (this.isConnecting) return;
    this.isConnecting = true;
    this.token = token;

    try {
      if (this.eventSource) {
        this.eventSource.close();
      }

      const baseUrl = api.defaults.baseURL;
      const url = `${baseUrl}/websocket/handler/${encodeURIComponent(token)}/${Date.now()}`;


      console.log('Connecting to SSE:', url);

      this.eventSource = new EventSource(url, {
        withCredentials: false
      });

      const eventTypes = ['newLog', 'newResponse', 'reminder', 'reminderError'];
      eventTypes.forEach(eventType => {
        this.eventSource.addEventListener(eventType, this.createEventHandler(eventType));
      });

      // Connection handling
      this.eventSource.addEventListener('connection', (event) => {
        console.log('Connection established:', event.data);
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.startKeepAliveMonitor();
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      });

      // Error handling
      this.eventSource.onerror = this.handleError.bind(this);

      // Handle general messages
      this.eventSource.onmessage = (event) => {
        try {
          // Update keepalive timestamp for any message
          this.lastKeepAliveTime = Date.now();
          
          if (event.data.startsWith('keepalive')) {
            return; // Don't process keepalive as regular message
          }

          console.log('Message received:', event.data);
          const data = JSON.parse(event.data);
          if (this.listeners.has(event.type)) {
            this.listeners.get(event.type).forEach(callback => callback(data));
          }
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
    
    // Clear existing interval if any
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }

    // Monitor for keepalive messages
    this.keepAliveInterval = setInterval(() => {
      const timeSinceLastKeepAlive = Date.now() - this.lastKeepAliveTime;
      if (timeSinceLastKeepAlive > 30000) { // 30 seconds
        console.log('No keepalive received, reconnecting...');
        this.reconnect();
      }
    }, 5000); // Check every 5 seconds
  }


  getStatus() {
    if (!this.eventSource) return 'Disconnected';
    switch (this.eventSource.readyState) {
      case EventSource.CONNECTING:
        return 'Connecting';
      case EventSource.OPEN:
        return 'Connected';
      case EventSource.CLOSED:
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  }


  createEventHandler(eventType) {
    return (event) => {
      try {
        console.log(`${eventType} event received:`, event.data);
        const data = JSON.parse(event.data);
        if (this.listeners.has(eventType)) {
          this.listeners.get(eventType).forEach(callback => {
            try {
              callback(data);
            } catch (callbackError) {
              console.error(`Error in ${eventType} callback:`, callbackError);
            }
          });
        }
      } catch (error) {
        console.error(`Error processing ${eventType} event:`, error);
      }
    };
  }

  handleError(error) {
    console.error('EventSource error:', error);
    this.isConnecting = false;

    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }

    if (this.eventSource?.readyState === EventSource.CLOSED) {
      console.log('Connection closed, attempting reconnect...');
      this.scheduleReconnect();
    } else {
      console.log('Connection error but not closed, waiting for recovery...');
      // Schedule reconnect anyway after a timeout
      setTimeout(() => {
        if (this.eventSource?.readyState !== EventSource.OPEN) {
          this.scheduleReconnect();
        }
      }, 5000);
    }
  }

  addEventListener(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(callback);
  }

  removeEventListener(type, callback) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).delete(callback);
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => this.reconnect(), 1000 * Math.min(this.reconnectAttempts + 1, 30));
    }
  }

  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    if (this.token) {
      this.connect(this.token);
    }
  }

  disconnect() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.listeners.clear();
  }
}

export default new WebSocketService();