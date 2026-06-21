/**
 * Service to manage browser notifications for GT CRM Chat.
 */
class NotificationService {
  constructor() {
    this.hasPermission = false;
    this.isSupported = typeof window !== 'undefined' && 'Notification' in window;
    
    if (this.isSupported) {
      this.hasPermission = Notification.permission === 'granted';
    }
  }

  async requestPermission() {
    if (!this.isSupported) return false;
    
    const permission = await Notification.requestPermission();
    this.hasPermission = permission === 'granted';
    return this.hasPermission;
  }

  show(title, options = {}) {
    if (!this.isSupported || !this.hasPermission) return null;

    // Use a default icon if not provided
    const defaultOptions = {
      icon: '/logo.png', // Ensure this exists or use a generic one
      badge: '/logo.png',
      tag: 'gt-chat-notification',
      renotify: true,
      ...options
    };

    try {
      const n = new Notification(title, defaultOptions);
      n.onclick = () => {
        window.focus();
        if (options.data?.url) {
          window.location.href = options.data.url;
        }
        n.close();
      };
      return n;
    } catch (err) {
      console.error('Notification show error:', err);
      return null;
    }
  }

  notifyMessage(senderName, content, channelName, data = {}) {
    const title = channelName ? `${senderName} in ${channelName}` : `Message from ${senderName}`;
    const body = content || 'Sent an attachment';
    
    return this.show(title, {
      body,
      data
    });
  }
}

export const chatNotifications = new NotificationService();
