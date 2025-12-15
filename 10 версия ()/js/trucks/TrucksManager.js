// Основной менеджер системы грузовиков
class TrucksManager {
    constructor(containerElement) {
        this.container = containerElement;
        this.trucks = [];
        this.truckContainers = [];
        this.selectedTire = null;
        this.expandedTruck = null;
        
        this.onTruckExpand = this.onTruckExpand.bind(this);
        this.onTruckCollapse = this.onTruckCollapse.bind(this);
        this.onTireSelected = this.onTireSelected.bind(this);
    }

    initialize(trucksData) {
        try {
            this.validateData(trucksData);
            this.trucks = trucksData;
            this.render();
            this.attachEventListeners();
            
            console.log('✅ Система грузовиков инициализирована', this.trucks.length);
        } catch (error) {
            console.error('❌ Ошибка инициализации системы грузовиков:', error);
            this.showError('Ошибка загрузки данных самосвалов');
        }
    }

    validateData(trucksData) {
        if (!Array.isArray(trucksData)) {
            throw new Error('Данные должны быть массивом');
        }

        trucksData.forEach((truck, index) => {
            if (!truck.id || !truck.number) {
                throw new Error(`Самосвал с индексом ${index} не имеет ID или номера`);
            }
        });
    }

    render() {
        if (!this.container) {
            throw new Error('Контейнер не найден');
        }

        this.container.innerHTML = '';
        this.container.className = 'trucks-system-container';
        
        const listContainer = document.createElement('div');
        listContainer.className = 'trucks-list-container';
        
        this.truckContainers = [];
        
        this.trucks.forEach(truckData => {
            const truckContainer = new TruckContainer(truckData);
            const truckElement = truckContainer.render();
            listContainer.appendChild(truckElement);
            this.truckContainers.push(truckContainer);
        });
        
        this.container.appendChild(listContainer);
    }

    attachEventListeners() {
        window.trucksEventSystem.on('truckExpand', this.onTruckExpand);
        window.trucksEventSystem.on('truckCollapse', this.onTruckCollapse);
        window.trucksEventSystem.on('tireSelected', this.onTireSelected);
    }

    onTruckExpand(expandedTruck) {
        this.expandedTruck = expandedTruck;
        
        // Показываем только активный самосвал, остальные скрываем
        this.truckContainers.forEach(container => {
            if (container.data.id !== expandedTruck.id) {
                container.element.style.display = 'none';
            } else {
                container.element.style.display = 'block';
                // Фиксируем активный самосвал вверху
                container.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });

        console.log('✅ Самосвал развернут:', expandedTruck.number);
    }

    onTruckCollapse(collapsedTruck) {
        this.expandedTruck = null;
        
        // Показываем все самосвалы снова
        this.truckContainers.forEach(container => {
            container.element.style.display = 'block';
        });

        console.log('✅ Самосвал свернут:', collapsedTruck.number);
    }

    onTireSelected({ tire, truck }) {
        this.selectedTire = { tire, truck };
        console.log('✅ Выбрана шина:', tire.position, 'на самосвале:', truck.number);
    }

    getSelectedTire() {
        return this.selectedTire;
    }

    getExpandedTruck() {
        return this.expandedTruck;
    }

    showError(message) {
        if (this.container) {
            this.container.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #dc2626;">
                    <strong>Ошибка:</strong> ${message}
                </div>
            `;
        }
    }

    destroy() {
        this.truckContainers.forEach(container => {
            container.destroy();
        });
        
        window.trucksEventSystem.off('truckExpand', this.onTruckExpand);
        window.trucksEventSystem.off('truckCollapse', this.onTruckCollapse);
        window.trucksEventSystem.off('tireSelected', this.onTireSelected);
        
        this.truckContainers = [];
        this.trucks = [];
        this.selectedTire = null;
        this.expandedTruck = null;
        
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}