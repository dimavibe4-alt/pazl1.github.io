// js/warehouse/warehouse-data.js
class WarehouseData {
    constructor() {
        this.warehouses = [];
        this.currentWarehouse = null;
    }

    async loadWarehouses() {
        try {
            // Загрузка данных из JSON файла
            const data = await window.FSAPI.readJsonFile('Warehouses.json');
            this.warehouses = data.warehouses;
            this.renderWarehouses();
            this.switchWarehouse(this.warehouses[0].id);
        } catch (error) {
            console.error('Ошибка загрузки данных складов:', error);
            this.loadDemoData();
        }
    }

    loadDemoData() {
        this.warehouses = [
            {
                id: "main",
                name: "Основной",
                code: "WH001",
                tireCount: 156,
                description: "Главный склад предприятия с полным ассортиментом",
                tires: [
                    {
                        position: "A",
                        mbt: "1",
                        number: "19",
                        size: "33.00x51",
                        brand: "GOODYEAR",
                        model: "XDR3",
                        serial: "SERIAL-WH001-1",
                        mileage: "38 508 км",
                        status: "Новая",
                        depth: "27.0 мм",
                        date: "01.01.2024",
                        location: "Позиция 1",
                        category: "I"
                    },
                    {
                        position: "B",
                        mbt: "2",
                        number: "24",
                        size: "35.00x51",
                        brand: "MICHELIN",
                        model: "XDS2",
                        serial: "SERIAL-WH001-2",
                        mileage: "83 428 км",
                        status: "Б/У",
                        depth: "15.7 мм",
                        date: "02.02.2024",
                        location: "Позиция 2",
                        category: "II"
                    }
                ]
            },
            {
                id: "reserve",
                name: "Резервный",
                code: "WHO02",
                tireCount: 78,
                description: "Резервный склад для хранения сезонных шин",
                tires: [
                    {
                        position: "A",
                        mbt: "1",
                        number: "18",
                        size: "33.00x51",
                        brand: "GOODYEAR",
                        model: "XDR3",
                        serial: "SERIAL-WHO02-1",
                        mileage: "19 179 км",
                        status: "Новая",
                        depth: "19.5 мм",
                        date: "01.01.2024",
                        location: "Позиция 1",
                        category: "I"
                    }
                ]
            },
            {
                id: "workshop",
                name: "Цеха",
                code: "WH003",
                tireCount: 45,
                description: "Склад шинного цеха",
                tires: []
            },
            {
                id: "seasonal",
                name: "Сезонный",
                code: "WH004",
                tireCount: 32,
                description: "Склад сезонного хранения",
                tires: []
            }
        ];
        
        this.renderWarehouses();
        this.switchWarehouse(this.warehouses[0].id);
    }

    renderWarehouses() {
        const buttonsContainer = document.querySelector('.warehouse-bottom-row');
        if (!buttonsContainer) return;

        buttonsContainer.innerHTML = '';

        this.warehouses.forEach(warehouse => {
            const button = document.createElement('button');
            button.className = 'warehouse-tab';
            button.innerHTML = `
                <span class="warehouse-tab-name">${warehouse.name}</span>
                <span class="warehouse-tab-count">${warehouse.tireCount}</span>
            `;
            button.addEventListener('click', () => {
                this.switchWarehouse(warehouse.id);
            });
            buttonsContainer.appendChild(button);
        });
    }

    switchWarehouse(warehouseId) {
        // Убираем активный класс у всех кнопок
        document.querySelectorAll('.warehouse-tab').forEach(btn => {
            btn.classList.remove('active');
        });

        // Находим и активируем нужную кнопку
        const buttons = document.querySelectorAll('.warehouse-tab');
        const warehouseIndex = this.warehouses.findIndex(w => w.id === warehouseId);
        if (warehouseIndex >= 0 && buttons[warehouseIndex]) {
            buttons[warehouseIndex].classList.add('active');
        }

        // Находим склад
        const warehouse = this.warehouses.find(w => w.id === warehouseId);
        if (!warehouse) return;

        this.currentWarehouse = warehouse;
        this.renderWarehouseContent(warehouse);
    }

    renderWarehouseContent(warehouse) {
        const contentContainer = document.querySelector('.warehouse-content');
        if (!contentContainer) return;

        contentContainer.innerHTML = `
            <div class="warehouse-info">
                <h3>${warehouse.name} склад</h3>
                <p>Код: ${warehouse.code} | Шин: ${warehouse.tireCount} | ${warehouse.description}</p>
            </div>
            <div class="warehouse-tires-container">
                ${this.renderTiresTable(warehouse.tires)}
            </div>
        `;
    }

    renderTiresTable(tires) {
        if (!tires || tires.length === 0) {
            return '<div class="warehouse-empty-state">Нет данных о шинах</div>';
        }

        let html = '<table class="warehouse-tire-table">';
        
        tires.forEach(tire => {
            html += `
                <tr>
                    <td rowspan="3">${tire.position}</td>
                    <td rowspan="3">${tire.mbt}</td>
                    <td rowspan="3">${tire.number}</td>
                    <td rowspan="3">${tire.size}</td>
                    <td>${tire.brand}</td>
                    <td>${tire.model}</td>
                    <td>${tire.serial}</td>
                    <td>${tire.mileage}</td>
                </tr>
                <tr>
                    <td>${tire.status}</td>
                    <td></td>
                    <td>${tire.depth}</td>
                </tr>
                <tr>
                    <td>${tire.date}</td>
                    <td>${tire.location}</td>
                    <td>${tire.category}</td>
                </tr>
            `;
        });
        
        html += '</table>';
        return html;
    }
}

// Создаем и экспортируем экземпляр
window.warehouseData = new WarehouseData();