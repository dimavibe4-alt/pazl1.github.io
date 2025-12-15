// js/dnd/integration.js
class TireDnDIntegration {
    constructor() {
        this.coordinator = null;
    }
    
    async init() {
        console.log('🚀 Инициализация системы DnD...');
        
        try {
            // 1. Создаем координатор
            this.coordinator = new TireMovementCoordinator();
            await this.coordinator.init();
            
            console.log('✅ Система DnD готова к работе');
            
            // Показываем уведомление
            this.showReadyNotification();
            
        } catch (error) {
            console.error('❌ Ошибка инициализации DnD:', error);
        }
    }
    
    showReadyNotification() {
        const notification = document.createElement('div');
        notification.className = 'tire-dnd-notification info';
        notification.innerHTML = `
            <div>🚀 Система перетаскивания готова</div>
            <div><small>Перетаскивайте шины между контейнерами</small></div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 3000);
        }, 3000);
    }
}

// Глобальная инициализация
if (typeof window !== 'undefined') {
    window.tireDnDIntegration = new TireDnDIntegration();
    
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (window.tireDnDIntegration) {
                window.tireDnDIntegration.init();
            }
        }, 1000);
    });
}