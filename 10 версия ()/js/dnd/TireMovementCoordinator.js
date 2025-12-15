// js/dnd/TireMovementCoordinator.js
class TireMovementCoordinator {
    constructor() {
        this.dataManager = null;
        this.dndManager = null;
        this.modal = null;
        this.isProcessing = false;
    }
    
    async init() {
        console.log('🚀 Инициализация координатора перемещений...');
        
        // Ждем менеджер данных
        await this.waitForDataManager();
        
        // Инициализируем DnD и модалки
        this.dndManager = new TireDnDManager();
        this.modal = new TireDnDModal();
        await this.modal.loadDictionaries();
        
        // Интегрируем DnD
        this.integrateDnD();
        
        console.log('✅ Координатор перемещений готов');
    }
    
    async waitForDataManager() {
        return new Promise((resolve) => {
            const check = () => {
                if (window.tireDataManager) {
                    this.dataManager = window.tireDataManager;
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }
    
    integrateDnD() {
        // Переопределяем обработчики модалок
        const originalShowConfirmation = this.dndManager.showConfirmationModal.bind(this.dndManager);
        const originalShowReplacement = this.dndManager.showReplacementModal.bind(this.dndManager);
        
        this.dndManager.showConfirmationModal = async (fromContainer, toContainer) => {
            if (this.isProcessing) return;
            this.isProcessing = true;
            try {
                await this.handleMovement(fromContainer, toContainer, false);
            } finally {
                this.isProcessing = false;
            }
        };
        
        this.dndManager.showReplacementModal = async (fromContainer, toContainer) => {
            if (this.isProcessing) return;
            this.isProcessing = true;
            try {
                await this.handleMovement(fromContainer, toContainer, true);
            } finally {
                this.isProcessing = false;
            }
        };
    }
    
    async handleMovement(fromContainer, toContainer, isReplacement) {
        const tireData = this.dndManager.currentTireData;
        
        // Показываем модалку
        const params = {
            tire: tireData,
            from: fromContainer,
            to: toContainer,
            isReplacement: isReplacement
        };
        
        const formData = isReplacement 
            ? await this.modal.showReplacement(params)
            : await this.modal.showConfirmation(params);
        
        if (!formData) {
            console.log('❌ Пользователь отменил перемещение');
            return;
        }
        
        // Обрабатываем перемещение
        await this.processMovement(params, formData, isReplacement);
    }
    
    async processMovement(params, formData, isReplacement) {
        try {
            const movementData = {
                id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date().toISOString(),
                tireId: params.tire.id,
                from: {
                    type: params.from.type,
                    id: params.from.id,
                    position: params.tire.position
                },
                to: {
                    type: params.to.type,
                    id: params.to.id,
                    ...(params.to.type === 'truck' ? { 
                        position: this.getNextTruckPosition(params.to.id, params.tire.position)
                    } : {
                        subwarehouse: 'А-1',
                        row: '1',
                        place: this.getNextWarehousePlace(params.to.id)
                    })
                },
                formData: formData,
                isReplacement: isReplacement
            };
            
            // Если это замена на самосвале
            if (isReplacement && params.to.type === 'truck') {
                const existingTire = this.getTireAtPosition(params.to.id, params.tire.position);
                if (existingTire && !existingTire.isEmpty) {
                    movementData.replacedTire = {
                        tireId: existingTire.id,
                        to: {
                            type: 'warehouse',
                            id: formData.replacement?.warehouse || 'unassigned',
                            subwarehouse: 'А-1',
                            row: '1',
                            place: this.getNextWarehousePlace(formData.replacement?.warehouse || 'unassigned')
                        },
                        formData: {
                            reason: formData.replacement?.oldReason,
                            state: formData.replacement?.oldState,
                            comments: formData.replacement?.oldComments
                        }
                    };
                }
            }
            
            // Добавляем перемещение
            if (this.dataManager) {
                this.dataManager.addPendingMovement(movementData);
            }
            
            // Обновляем интерфейс
            await this.updateInterface(params, movementData);
            
            // Показываем уведомление
            this.showSuccessNotification(movementData);
            
        } catch (error) {
            console.error('❌ Ошибка при обработке перемещения:', error);
            this.showErrorNotification(error.message);
        }
    }
    
    getNextTruckPosition(truckId, preferredPosition = null) {
        // Проверяем предпочтительную позицию
        if (preferredPosition) {
            const tires = this.dataManager.getTiresForTruck(truckId);
            const tireAtPosition = tires.find(t => t.position === preferredPosition);
            if (!tireAtPosition || tireAtPosition.isEmpty) {
                return preferredPosition;
            }
        }
        
        // Ищем первую пустую позицию
        const positions = ['ПЛ', 'ПП', '2ЛН', '2ЛВ', '3ЛН', '3ЛВ'];
        const tires = this.dataManager.getTiresForTruck(truckId);
        
        for (const position of positions) {
            const tire = tires.find(t => t.position === position);
            if (!tire || tire.isEmpty) {
                return position;
            }
        }
        
        // Все позиции заняты - возвращаем первую (будет замена)
        return positions[0];
    }
    
    getNextWarehousePlace(warehouseId) {
        const tires = this.dataManager.getTiresForWarehouse(warehouseId);
        return (tires.length + 1).toString();
    }
    
    getTireAtPosition(truckId, position) {
        const tires = this.dataManager.getTiresForTruck(truckId);
        return tires.find(t => t.position === position);
    }
    
    async updateInterface(params, movementData) {
        // Определяем, что нужно обновить
        const updates = new Set();
        
        if (movementData.from.type === 'truck') {
            updates.add(`truck-${movementData.from.id}`);
        }
        if (movementData.to.type === 'truck') {
            updates.add(`truck-${movementData.to.id}`);
        }
        if (movementData.from.type === 'warehouse' || movementData.to.type === 'warehouse') {
            updates.add('warehouse');
        }
        
        // Обновляем интерфейс
        for (const update of updates) {
            if (update.startsWith('truck-')) {
                const truckId = update.replace('truck-', '');
                this.updateTruckDisplay(truckId);
            } else if (update === 'warehouse') {
                this.updateWarehouseDisplay();
            }
        }
    }
    
    updateTruckDisplay(truckId) {
        // Находим контейнер самосвала
        const truckContainer = document.querySelector(`[data-container-id="truck-${truckId}"]`);
        if (truckContainer) {
            // Помечаем для перерисовки
            truckContainer.classList.add('needs-update');
            console.log(`🔄 Требуется обновление самосвала ${truckId}`);
        }
    }
    
    updateWarehouseDisplay() {
        // Находим текущий склад
        const currentTab = document.querySelector('.warehouse-tab.active');
        if (currentTab) {
            const warehouseId = currentTab.dataset.warehouseId;
            console.log(`🔄 Требуется обновление склада ${warehouseId}`);
        }
    }
    
    showSuccessNotification(movementData) {
        const notification = document.createElement('div');
        notification.className = 'tire-dnd-notification success';
        
        let message = '';
        if (movementData.isReplacement) {
            message = `🔄 Выполнена замена на самосвале ${movementData.to.id}`;
        } else {
            message = `✅ Шина перемещена: ${this.getLocationName(movementData.from)} → ${this.getLocationName(movementData.to)}`;
        }
        
        notification.innerHTML = `
            <div>${message}</div>
            <div><small>Изменения пока не сохранены</small></div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    showErrorNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'tire-dnd-notification error';
        notification.textContent = `❌ Ошибка: ${message}`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 3000);
        }, 3000);
    }
    
    getLocationName(location) {
        if (location.type === 'truck') {
            return `Самосвал ${location.id}`;
        } else if (location.type === 'warehouse') {
            return `Склад ${location.id}`;
        }
        return 'Неизвестно';
    }
}

window.TireMovementCoordinator = TireMovementCoordinator;