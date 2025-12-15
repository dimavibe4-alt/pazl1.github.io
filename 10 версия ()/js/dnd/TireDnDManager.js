class TireDnDManager {
    constructor() {
        this.isDragging = false;
        this.dragElement = null;
        this.ghost = null;
        this.startX = 0;
        this.startY = 0;
        this.currentTireData = null;
        this.dropZones = [];
        this.activeDropZone = null;
        this.config = {
            ghostImage: 'css/шинаднд.png',
            ghostSize: 80,
            dragThreshold: 5
        };
    }
    
    init() {
        this.createGhost();
        this.setupEventListeners();
        this.findDropZones();
        console.log('✅ TireDnDManager инициализирован');
    }
    
    createGhost() {
        // Удаляем старый призрак если есть
        const oldGhost = document.querySelector('.tire-dnd-ghost');
        if (oldGhost) oldGhost.remove();
        
        this.ghost = document.createElement('div');
        this.ghost.className = 'tire-dnd-ghost';
        this.ghost.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 9999;
            width: ${this.config.ghostSize}px;
            height: ${this.config.ghostSize}px;
            background: url('${this.config.ghostImage}') no-repeat center center;
            background-size: contain;
            opacity: 0;
            transform: translate(-50%, -50%);
            transition: opacity 0.2s ease;
            filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
        `;
        
        document.body.appendChild(this.ghost);
    }
    
    setupEventListeners() {
        // Делегирование событий - ОДИН обработчик на document
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Для мобильных
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Отмена нативного drag
        document.addEventListener('dragstart', (e) => e.preventDefault());
    }
    
    findDropZones() {
        this.dropZones = Array.from(document.querySelectorAll(
            '[data-container-type], .dnd-drop-zone, #warehouseContent, #truckDetailTires'
        ));
        
        console.log(`Найдено ${this.dropZones.length} контейнеров для сброса`);
    }
    
    extractTireData(element) {
        // Извлекаем данные из data-атрибутов шины
        const data = {
            id: element.getAttribute('data-tire-id') || `tire-${Date.now()}`,
            number: element.getAttribute('data-tire-number') || 'Неизвестно',
            brand: element.getAttribute('data-tire-brand') || '',
            size: element.getAttribute('data-tire-size') || '',
            position: element.getAttribute('data-tire-position') || '',
            serial: element.getAttribute('data-tire-serial') || '',
            currentContainer: this.findParentContainer(element)
        };
        
        return data;
    }
    
    findParentContainer(element) {
        let parent = element;
        while (parent && !parent.hasAttribute('data-container-type')) {
            parent = parent.parentElement;
        }
        
        if (parent) {
            return {
                element: parent,
                id: parent.getAttribute('data-container-id') || parent.id || 'unknown',
                type: parent.getAttribute('data-container-type') || 
                      (parent.id === 'warehouseContent' ? 'warehouse' : 
                       parent.id === 'truckDetailTires' ? 'truck' : 'unknown'),
                name: parent.getAttribute('data-container-name') || 
                      (parent.id === 'warehouseContent' ? 'Основной склад' : 
                       parent.id === 'truckDetailTires' ? 'Самосвал' : 'Контейнер')
            };
        }
        
        return null;
    }
    
    extractContainerInfo(element) {
        if (!element) return null;
        
        return {
            element: element,
            id: element.getAttribute('data-container-id') || element.id || 'unknown',
            type: element.getAttribute('data-container-type') || 
                  (element.id === 'warehouseContent' ? 'warehouse' : 
                   element.id === 'truckDetailTires' ? 'truck' : 'unknown'),
            name: element.getAttribute('data-container-name') || 
                  (element.id === 'warehouseContent' ? 'Основной склад' : 
                   element.id === 'truckDetailTires' ? 'Самосвал' : 'Контейнер')
        };
    }
    
    handleMouseDown(e) {
        if (e.button !== 0) return; // Только левая кнопка мыши
        
        // Ищем ближайшую перетаскиваемую шину
        const tire = this.findDraggableTire(e.target);
        if (!tire) return;
        
        e.preventDefault();
        this.startDrag(e.clientX, e.clientY, tire);
    }
    
    handleTouchStart(e) {
        if (!e.touches[0]) return;
        const touch = e.touches[0];
        
        const tire = this.findDraggableTire(e.target);
        if (!tire) return;
        
        e.preventDefault();
        this.startDrag(touch.clientX, touch.clientY, tire);
    }
    
    findDraggableTire(target) {
        // Ищем элемент шины вверх по DOM
        let element = target;
        while (element && !element.hasAttribute('data-tire-id')) {
            if (element.classList && 
                (element.classList.contains('tire-item') || 
                 element.classList.contains('warehouse-tire-item'))) {
                break;
            }
            element = element.parentElement;
        }
        
        if (element && element.hasAttribute('data-tire-id')) {
            return element;
        }
        
        return null;
    }
    
    startDrag(clientX, clientY, tireElement) {
        this.isDragging = true;
        this.dragElement = tireElement;
        this.startX = clientX;
        this.startY = clientY;
        
        // Извлекаем данные шины
        this.currentTireData = this.extractTireData(tireElement);
        
        // Показываем призрака
        this.showGhost(clientX, clientY);
        
        // Добавляем класс dragging к элементу
        tireElement.classList.add('tire-dragging');
        
        // Блокируем выделение текста
        document.body.style.userSelect = 'none';
        
        console.log('Начато перетаскивание шины:', this.currentTireData.number);
    }
    
    showGhost(x, y) {
        if (!this.ghost) return;
        
        this.ghost.style.left = x + 'px';
        this.ghost.style.top = y + 'px';
        this.ghost.style.opacity = '0.95';
        
        // Анимация появления
        this.ghost.style.transform = 'translate(-50%, -50%) scale(0.5)';
        setTimeout(() => {
            this.ghost.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 50);
    }
    
    hideGhost() {
        if (!this.ghost) return;
        this.ghost.style.opacity = '0';
        this.ghost.style.transform = 'translate(-50%, -50%) scale(0.5)';
    }
    
    handleMouseMove(e) {
        if (!this.isDragging) return;
        
        this.updateGhostPosition(e.clientX, e.clientY);
        this.updateDropZoneHighlight(e.clientX, e.clientY);
    }
    
    handleTouchMove(e) {
        if (!this.isDragging || !e.touches[0]) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        this.updateGhostPosition(touch.clientX, touch.clientY);
        this.updateDropZoneHighlight(touch.clientX, touch.clientY);
    }
    
    updateGhostPosition(x, y) {
        if (!this.ghost) return;
        this.ghost.style.left = x + 'px';
        this.ghost.style.top = y + 'px';
    }
    
    updateDropZoneHighlight(x, y) {
        // Убираем подсветку у всех
        this.dropZones.forEach(zone => {
            zone.classList.remove('dnd-drop-highlight');
            zone.classList.remove('dnd-drop-occupied');
        });
        
        // Находим элемент под курсором
        const element = document.elementFromPoint(x, y);
        if (!element) return;
        
        // Ищем ближайшую drop-зону
        const dropZone = this.findDropZone(element);
        if (dropZone) {
            this.activeDropZone = dropZone;
            
            // Проверяем, занята ли позиция
            const isOccupied = this.checkIfPositionOccupied(dropZone, this.currentTireData);
            
            if (isOccupied) {
                dropZone.classList.add('dnd-drop-occupied'); // Красная подсветка для занятой
                this.showOccupiedWarning(dropZone);
            } else {
                dropZone.classList.add('dnd-drop-highlight'); // Синяя подсветка для свободной
            }
        }
    }
    
    findDropZone(element) {
        let current = element;
        while (current) {
            if (this.dropZones.includes(current)) {
                return current;
            }
            current = current.parentElement;
        }
        return null;
    }
    
    checkIfPositionOccupied(containerElement, tireData) {
        // Для склада - всегда есть место
        if (containerElement.id === 'warehouseContent' || 
            containerElement.getAttribute('data-container-type') === 'warehouse') {
            return false;
        }
        
        // Для самосвала - проверяем через менеджер данных
        if (containerElement.id === 'truckDetailTires' || 
            containerElement.getAttribute('data-container-type') === 'truck') {
            
            const truckId = containerElement.getAttribute('data-container-id')?.replace('truck-', '');
            if (!truckId) return false;
            
            // Проверяем через TireDataManager
            if (window.tireDataManager) {
                const tires = window.tireDataManager.getTiresForTruck(truckId);
                const existingTire = tires.find(t => 
                    t.position === tireData.position && !t.isEmpty
                );
                return !!existingTire;
            }
        }
        
        return false;
    }
    
    showOccupiedWarning(dropZone) {
        // Показываем предупреждение о занятой позиции
        const warningElement = dropZone.querySelector('.occupied-warning') || 
                              document.createElement('div');
        
        if (!warningElement.classList.contains('occupied-warning')) {
            warningElement.className = 'occupied-warning';
            warningElement.innerHTML = `
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: #ef4444;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                    z-index: 1000;
                    white-space: nowrap;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                ">
                    <i class="fas fa-exclamation-triangle"></i> Позиция занята (будет замена)
                </div>
            `;
            dropZone.appendChild(warningElement);
        }
    }
    
    handleMouseUp(e) {
        if (!this.isDragging) return;
        
        this.finishDrag(e.clientX, e.clientY);
    }
    
    handleTouchEnd(e) {
        if (!this.isDragging) return;
        
        const touch = e.changedTouches[0];
        this.finishDrag(touch.clientX, touch.clientY);
    }
    
    finishDrag(x, y) {
        const dropZone = this.activeDropZone;
        
        // Скрываем призрака
        this.hideGhost();
        
        // Убираем подсветку
        if (this.activeDropZone) {
            this.activeDropZone.classList.remove('dnd-drop-highlight');
            this.activeDropZone.classList.remove('dnd-drop-occupied');
            
            // Убираем предупреждение
            const warning = this.activeDropZone.querySelector('.occupied-warning');
            if (warning) warning.remove();
        }
        
        // Восстанавливаем выделение текста
        document.body.style.userSelect = '';
        
        if (this.dragElement) {
            this.dragElement.classList.remove('tire-dragging');
        }
        
        // Если нет зоны сброса - отмена
        if (!dropZone) {
            console.log('Отпущено вне зоны сброса');
            this.reset();
            return;
        }
        
        // Получаем информацию о контейнерах
        const fromContainer = this.currentTireData.currentContainer;
        const toContainer = this.extractContainerInfo(dropZone);
        
        // Проверяем, не тот же ли это контейнер
        if (fromContainer && toContainer && 
            fromContainer.id === toContainer.id) {
            console.log('Нельзя перемещать в тот же контейнер');
            this.reset();
            return;
        }
        
        // Проверяем, занята ли позиция
        const isOccupied = this.checkIfPositionOccupied(dropZone, this.currentTireData);
        
        // Определяем тип перемещения
        const isTruckToTruck = fromContainer.type === 'truck' && toContainer.type === 'truck';
        
        // Показываем соответствующее модальное окно
        if (isOccupied || isTruckToTruck) {
            // Для truck-to-truck всегда показываем модалку замены
            this.showReplacementModal(fromContainer, toContainer);
        } else {
            this.showConfirmationModal(fromContainer, toContainer);
        }
        
        this.reset();
    }
    
    showConfirmationModal(fromContainer, toContainer) {
        // Передаем управление координатору перемещений
        if (window.tireDnDIntegration && window.tireDnDIntegration.coordinator) {
            const tireData = this.currentTireData;
            tireData.currentContainer = fromContainer;
            
            window.tireDnDIntegration.coordinator.handleMovement(
                fromContainer,
                toContainer,
                false
            );
        } else {
            console.warn('Координатор перемещений не найден');
        }
    }
    
    showReplacementModal(fromContainer, toContainer) {
        // Передаем управление координатору перемещений
        if (window.tireDnDIntegration && window.tireDnDIntegration.coordinator) {
            const tireData = this.currentTireData;
            tireData.currentContainer = fromContainer;
            
            window.tireDnDIntegration.coordinator.handleMovement(
                fromContainer,
                toContainer,
                true
            );
        } else {
            console.warn('Координатор перемещений не найден');
        }
    }
    
    reset() {
        this.isDragging = false;
        this.dragElement = null;
        this.currentTireData = null;
        this.activeDropZone = null;
    }
}

// Экспорт для глобального использования
if (typeof window !== 'undefined') {
    window.TireDnDManager = TireDnDManager;
}