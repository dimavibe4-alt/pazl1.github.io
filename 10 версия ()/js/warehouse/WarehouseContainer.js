// Контейнер для отображения склада
class WarehouseContainer {
    constructor(warehouseData) {
        this.data = warehouseData;
        this.element = null;
        this.tiresContainer = null;
        this.tireContainers = [];
        this.selectedTire = null;
        
        this.onTireSelect = this.onTireSelect.bind(this);
    }

    render() {
        const warehouseElement = document.createElement('div');
        warehouseElement.className = 'warehouse-container';
        warehouseElement.setAttribute('data-warehouse-id', this.data.id);

        warehouseElement.innerHTML = `
            <div class="warehouse-tires-list" id="warehouseTiresList-${this.data.id}"></div>
        `;

        this.element = warehouseElement;
        this.tiresContainer = warehouseElement.querySelector(`#warehouseTiresList-${this.data.id}`);
        
        this.attachEvents();
        this.renderTires();
        return warehouseElement;
    }

    attachEvents() {
        window.warehouseEventSystem.on('warehouseTireSelect', this.onTireSelect);
    }

    onTireSelect(selectedTire) {
        // Снимаем выделение с предыдущей выбранной шины
        if (this.selectedTire && this.selectedTire !== selectedTire) {
            this.selectedTire.setSelected(false);
        }
        
        // Устанавливаем новую выбранную шину
        this.selectedTire = selectedTire;
        this.selectedTire.setSelected(true);
        
        window.warehouseEventSystem.emit('warehouseTireSelected', {
            tire: selectedTire.data,
            warehouse: this.data
        });
    }

    renderTires() {
        if (!this.tiresContainer) return;

        // ЗАМЕНА: Удалены контейнеры шин, показываем сообщение
        this.tiresContainer.innerHTML = `
            <div class="warehouse-empty">
                <div>
                    <i class="fas fa-wrench" style="font-size: 2rem; margin-bottom: 10px; opacity: 0.5;"></i>
                    <div>Склад "${this.data.name}" - контейнеры шин удалены</div>
                    <div style="font-size: 0.8rem; margin-top: 5px; color: #666;">
                        Функциональность временно недоступна
                    </div>
                </div>
            </div>
        `;
    }

    clearTires() {
        if (this.tiresContainer) {
            this.tiresContainer.innerHTML = '';
        }
        this.tireContainers.forEach(container => {
            container.destroy();
        });
        this.tireContainers = [];
    }

    destroy() {
        if (this.element) {
            window.warehouseEventSystem.off('warehouseTireSelect', this.onTireSelect);
            this.clearTires();
            this.element.remove();
            this.element = null;
            this.tiresContainer = null;
        }
    }
}