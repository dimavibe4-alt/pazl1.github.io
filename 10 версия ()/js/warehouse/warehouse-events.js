// warehouse-events.js - ОБРАБОТЧИКИ СОБЫТИЙ ДЛЯ СИСТЕМЫ СКЛАДА

// Система событий для склада
class WarehouseEventSystem {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    off(event, callback) {
        if (!this.events[event]) return;
        
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    emit(event, data) {
        if (!this.events[event]) return;
        
        this.events[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Ошибка в обработчике события ${event}:`, error);
            }
        });
    }
}

// Создаем глобальную систему событий
window.warehouseEventSystem = new WarehouseEventSystem();

/**
 * ИНИЦИАЛИЗАЦИЯ СОБЫТИЙ ДЛЯ ШИН СКЛАДА
 */
function initializeWarehouseEvents() {
    // Находим все элементы шин в складе
    const tireItems = document.querySelectorAll('.warehouse-tire-item');
    
    // Для каждой шины добавляем обработчик клика
    tireItems.forEach(tire => {
        tire.addEventListener('click', handleTireClick);
    });
    
    console.log('✅ Инициализированы события для шин склада');
}

/**
 * ОБРАБОТЧИК КЛИКА ПО ШИНЕ
 */
function handleTireClick(event) {
    // Предотвращаем всплытие события
    event.stopPropagation();
    
    // Получаем элемент шины, на которую кликнули
    const clickedTire = event.currentTarget;
    
    // TOGGLE логика выделения
    if (clickedTire.classList.contains('selected')) {
        // Шина уже выделена - СНИМАЕМ выделение
        clickedTire.classList.remove('selected');
        console.log('🔘 Выделение снято с шины');
    } else {
        // Шина не выделена - ВЫДЕЛЯЕМ её
        
        // Сначала снимаем выделение со ВСЕХ шин
        const allTires = document.querySelectorAll('.warehouse-tire-item');
        allTires.forEach(tire => {
            tire.classList.remove('selected');
        });
        
        // Затем выделяем текущую шину
        clickedTire.classList.add('selected');
        
        const tireId = clickedTire.getAttribute('data-tire-id');
        console.log('🔘 Выделена шина:', tireId);
    }
}

/**
 * СНЯТИЕ ВЫДЕЛЕНИЯ СО ВСЕХ ШИН
 */
function clearTireSelection() {
    const allTires = document.querySelectorAll('.warehouse-tire-item');
    allTires.forEach(tire => {
        tire.classList.remove('selected');
    });
}

/**
 * ПОЛУЧЕНИЕ ВЫБРАННОЙ ШИНЫ
 */
function getSelectedTire() {
    return document.querySelector('.warehouse-tire-item.selected');
}

/**
 * ПОЛУЧЕНИЕ ID ВЫБРАННОЙ ШИНЫ
 */
function getSelectedTireId() {
    const selectedTire = getSelectedTire();
    return selectedTire ? selectedTire.getAttribute('data-tire-id') : null;
}

// Инициализация событий при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    initializeWarehouseEvents();
});

// Экспортируем функции для использования в других модулях
window.warehouseEvents = {
    initializeWarehouseEvents,
    handleTireClick,
    clearTireSelection,
    getSelectedTire,
    getSelectedTireId
};