/**
 * @fileoverview Simple notification system for user feedback
 */

export class NotificationSystem {
  private container: HTMLElement;

  constructor() {
    this.container = this.createContainer();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
    return container;
  }

  show(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      background: ${this.getBackgroundColor(type)};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      font-size: 14px;
      font-weight: 500;
      max-width: 300px;
      pointer-events: auto;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    const icon = this.getIcon(type);
    notification.innerHTML = `${icon} ${message}`;

    this.container.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);

    // Auto remove
    setTimeout(() => {
      this.remove(notification);
    }, duration);

    // Click to dismiss
    notification.addEventListener('click', () => {
      this.remove(notification);
    });
  }

  private remove(notification: HTMLElement): void {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }

  private getBackgroundColor(type: string): string {
    switch (type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  }

  private getIcon(type: string): string {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  }

  success(message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number): void {
    this.show(message, 'error', duration);
  }

  info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }
}

// Global instance
export const notifications = new NotificationSystem();