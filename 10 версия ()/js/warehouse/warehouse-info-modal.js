// warehouse-info-modal.js - МОДАЛЬНОЕ ОКНО ИНФОРМАЦИИ О СКЛАДЕ
class WarehouseInfoModal {
    constructor() {
        this.modal = null;
        this.isVisible = false;
        this.init();
    }

    /**
     * ИНИЦИАЛИЗАЦИЯ МОДАЛКИ
     */
    init() {
        this.createModal();
        this.attachEventListeners();
        console.log('✅ Модальное окно информации о складе инициализировано');
    }

    /**
     * СОЗДАНИЕ МОДАЛЬНОГО ОКНА
     */
    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'warehouse-info-modal';
        this.modal.innerHTML = `
            <div class="warehouse-info-modal-content">
                <div class="warehouse-info-modal-header">
                    <h3>Информация о складе</h3>
                </div>
                <div class="warehouse-info-modal-body">
                    <div class="warehouse-info-item">
                        <strong>Склад:</strong> 
                        <span id="modal-warehouse-name">-</span>
                    </div>
                    <div class="warehouse-info-item">
                        <strong>Код:</strong> 
                        <span id="modal-warehouse-code">-</span>
                    </div>
                    <div class="warehouse-info-item">
                        <strong>Количество шин:</strong> 
                        <span id="modal-tire-count">-</span>
                    </div>
                    <div class="warehouse-info-item">
                        <strong>Количество по размерам:</strong>
                        <div id="modal-tire-sizes" class="tire-sizes-list">-</div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.modal);
    }

    /**
     * ПОКАЗАТЬ МОДАЛКУ
     */
    show(warehouse, button) {
        if (!this.modal || !warehouse) return;
        
        // Заполняем данные
        this.fillModalData(warehouse);
        
        // Позиционируем модалку рядом с кнопкой
        this.positionModal(button);
        
        // Показываем модалку
        this.modal.classList.add('active');
        this.isVisible = true;
        
        console.log('📊 Показана информация о складе:', warehouse.name);
    }

    /**
     * СКРЫТЬ МОДАЛКУ
     */
    hide() {
        if (this.modal) {
            this.modal.classList.remove('active');
            this.isVisible = false;
        }
    }

    /**
     * ЗАПОЛНЕНИЕ ДАННЫХ МОДАЛКИ
     */
    fillModalData(warehouse) {
        const nameElement = this.modal.querySelector('#modal-warehouse-name');
        const codeElement = this.modal.querySelector('#modal-warehouse-code');
        const countElement = this.modal.querySelector('#modal-tire-count');
        const sizesElement = this.modal.querySelector('#modal-tire-sizes');
        
        nameElement.textContent = warehouse.name;
        codeElement.textContent = warehouse.code || '-';
        countElement.textContent = warehouse.tireCount || 0;
        
        // Подсчитываем шины по размерам
        const sizesCount = this.countTiresBySize(warehouse.tires);
        if (Object.keys(sizesCount).length > 0) {
            sizesElement.innerHTML = Object.entries(sizesCount)
                .map(([size, count]) => `${size} - ${count}`)
                .join('<br>');
        } else {
            sizesElement.textContent = 'Нет данных';
        }
    }

    /**
     * ПОЗИЦИОНИРОВАНИЕ МОДАЛКИ
     */
    positionModal(button) {
        if (!button) return;
        
        const rect = button.getBoundingClientRect();
        const modalContent = this.modal.querySelector('.warehouse-info-modal-content');
        
        // Позиционируем под кнопкой
        modalContent.style.position = 'fixed';
        modalContent.style.top = `${rect.bottom + 5}px`;
        modalContent.style.left = `${rect.left}px`;
    }

    /**
     * ПОДСЧЕТ ШИН ПО РАЗМЕРАМ
     */
    countTiresBySize(tires) {
        if (!tires || !Array.isArray(tires)) return {};
        
        const sizesCount = {};
        tires.forEach(tire => {
            if (tire.size) {
                sizesCount[tire.size] = (sizesCount[tire.size] || 0) + 1;
            }
        });
        
        return sizesCount;
    }

    /**
     * ПОДКЛЮЧЕНИЕ ОБРАБОТЧИКОВ СОБЫТИЙ
     */
    attachEventListeners() {
        // Скрываем модалку при клике вне её
        document.addEventListener('click', (event) => {
            if (this.isVisible && !event.target.closest('.warehouse-info-modal') && 
                !event.target.closest('.warehouse-tab')) {
                this.hide();
            }
        });

        // Скрываем модалку при наведении курсора вне её
        this.modal.addEventListener('mouseleave', () => {
            this.hide();
        });
    }
}

// Создаем глобальный экземпляр модалки
window.warehouseInfoModal = new WarehouseInfoModal();