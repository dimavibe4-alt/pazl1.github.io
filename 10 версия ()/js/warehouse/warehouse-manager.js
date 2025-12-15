// warehouse-manager.js - ОБНОВЛЕННАЯ ВЕРСИЯ С ИНТЕГРАЦИЕЙ
class WarehouseManager {
    constructor() {
        this.container = null;
        this.currentWarehouse = null;
        this.warehouses = [];
        this.isInitialized = false;
        this.tireContainers = [];
        
        console.log('🔄 Менеджер склада создан');
    }

    /**
     * ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ СКЛАДА
     */
    async initialize() {
        try {
            console.log('🔄 Начинаем инициализацию системы склада...');
            
            this.findContainers();
            
            if (!this.container) {
                throw new Error('❌ Не найден контейнер склада');
            }
            
            console.log('✅ Основные контейнеры найдены');
            
            this.setupInitialState();
            
            // ЗАГРУЗКА ДАННЫХ
            await this.loadWarehouseData();
            
            // ОТОБРАЖЕНИЕ ПАНЕЛИ УПРАВЛЕНИЯ
            this.renderWarehouseControls();
            
            this.attachEventListeners();
            
            if (this.warehouses.length > 0) {
                await this.loadWarehouseData(this.warehouses[0].id);
            }
            
            this.isInitialized = true;
            console.log('✅ Система склада успешно инициализирована');
            
        } catch (error) {
            console.error('❌ Ошибка инициализации системы склада:', error);
            this.showErrorState(error.message);
        }
    }

    /**
     * ЗАГРУЗКА ДАННЫХ СКЛАДА
     */
    async loadWarehouseData() {
        try {
            console.log('📂 Загружаем данные склада...');
            
            // Используем TireDataManager если он доступен
            if (window.tireDataManager) {
                console.log('✅ Используем TireDataManager для загрузки складов');
                this.loadFromDataManager();
            } else {
                // Загружаем из JSON файлов
                await this.loadFromJsonFiles();
            }
            
            console.log(`✅ Загружено складов: ${this.warehouses.length}`);
            
        } catch (error) {
            console.error('❌ Ошибка загрузки данных склада:', error);
            this.warehouses = this.generateDemoWarehouses();
        }
    }
    
    /**
     * ЗАГРУЗКА ИЗ TIRE DATA MANAGER
     */
    loadFromDataManager() {
        try {
            // Получаем склады из менеджера данных
            const dataWarehouses = window.tireDataManager.currentPositions.warehouses || [];
            
            this.warehouses = dataWarehouses.map(warehouse => ({
                id: warehouse.id,
                name: warehouse.name || warehouse.id,
                code: warehouse.code || `WH-${warehouse.id}`,
                description: `Склад из системы учета (${warehouse.tires?.length || 0} шин)`,
                tireCount: warehouse.tires?.length || 0,
                tires: this.getTiresForWarehouse(warehouse.id),
                _source: 'tire_data_manager'
            }));
            
            // Добавляем справочные склады если есть
            this.addCatalogWarehouses();
            
        } catch (error) {
            console.error('❌ Ошибка загрузки из TireDataManager:', error);
            this.warehouses = [];
        }
    }
    
    /**
     * ПОЛУЧЕНИЕ ШИН ДЛЯ СКЛАДА
     */
    getTiresForWarehouse(warehouseId) {
        if (!window.tireDataManager) return [];
        
        try {
            return window.tireDataManager.getTiresForWarehouse(warehouseId);
        } catch (error) {
            console.error(`❌ Ошибка получения шин для склада ${warehouseId}:`, error);
            return [];
        }
    }
    
    /**
     * ДОБАВЛЕНИЕ СКЛАДОВ ИЗ КАТАЛОГА
     */
    async addCatalogWarehouses() {
        try {
            // Загружаем справочник складов
            const warehousesCatalog = await this.loadJsonFile('json/Warehouses.json');
            if (warehousesCatalog && window.warehouseParser) {
                const parsedWarehouses = window.warehouseParser.parseWarehouseData(warehousesCatalog, 'warehouses_catalog');
                
                parsedWarehouses.forEach(warehouse => {
                    // Проверяем, нет ли уже такого склада
                    const exists = this.warehouses.some(w => w.id === warehouse.id);
                    if (!exists) {
                        this.warehouses.push({
                            ...warehouse,
                            _source: 'catalog'
                        });
                    }
                });
                
                console.log(`✅ Добавлено складов из каталога: ${parsedWarehouses.length}`);
            }
        } catch (error) {
            console.warn('⚠️ Не удалось загрузить каталог складов:', error);
        }
    }
    
    /**
     * ЗАГРУЗКА ИЗ JSON ФАЙЛОВ (резервный метод)
     */
    async loadFromJsonFiles() {
        try {
            let allWarehouses = [];
            
            // 1. Загружаем склады из каталога
            const warehousesCatalog = await this.loadJsonFile('json/Warehouses.json');
            if (warehousesCatalog && window.warehouseParser) {
                const parsedWarehouses = window.warehouseParser.parseWarehouseData(warehousesCatalog, 'warehouses_catalog');
                allWarehouses = allWarehouses.concat(parsedWarehouses);
                console.log(`📊 Склады из каталога: ${parsedWarehouses.length}`);
            }
            
            // 2. Загружаем шины из каталога
            const tiresCatalog = await this.loadJsonFile('json/Tires.json');
            if (tiresCatalog && window.warehouseParser) {
                const parsedTiresWarehouses = window.warehouseParser.parseWarehouseData(tiresCatalog, 'tires_catalog');
                
                // Собираем ВСЕ шины из всех складов парсера
                parsedTiresWarehouses.forEach(warehouse => {
                    if (warehouse.tires && Array.isArray(warehouse.tires)) {
                        allWarehouses = allWarehouses.concat(warehouse.tires);
                        console.log(`📦 Добавлено шин из ${warehouse.name}: ${warehouse.tires.length}`);
                    }
                });
            }
            
            this.warehouses = allWarehouses.length > 0 ? allWarehouses : this.generateDemoWarehouses();
            
        } catch (error) {
            console.error('❌ Ошибка загрузки из JSON файлов:', error);
            throw error;
        }
    }

    /**
     * ЗАГРУЗКА JSON ФАЙЛА
     */
    async loadJsonFile(url) {
        try {
            console.log(`🔍 Пробуем загрузить: ${url}`);
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Файл загружен: ${url}`);
                return data;
            } else {
                console.warn(`⚠️ Файл не найден: ${url}, статус: ${response.status}`);
            }
        } catch (error) {
            console.warn(`⚠️ Ошибка загрузки из ${url}:`, error.message);
        }
        return null;
    }

    /**
     * ГЕНЕРАЦИЯ ДЕМО-ДАННЫХ
     */
    generateDemoWarehouses() {
        console.log('🔄 Генерация демо-данных складов...');
        
        return [
            {
                id: 'demo-main',
                name: 'Демо склад',
                code: 'WH-DEMO',
                description: 'Демонстрационный склад',
                tireCount: 2,
                tires: [
                    {
                        id: 'demo-tire-1',
                        subwarehouse: 'А-1',
                        row: '1',
                        place: '1',
                        number: 'ДЕМО-001',
                        brand: 'Bridgestone',
                        size: '33.00R51',
                        oppPlan: '78%',
                        repair: 'Нет',
                        model: 'VRLS',
                        mileage: '0 км',
                        oppActual: '78%',
                        pattern: 'E4',
                        condition: 'Новое',
                        wear: '0%',
                        damage: 'I'
                    },
                    {
                        id: 'demo-tire-2',
                        subwarehouse: 'А-1',
                        row: '1',
                        place: '2',
                        number: 'ДЕМО-002',
                        brand: 'Michelin',
                        size: '33.00R51',
                        oppPlan: '82%',
                        repair: 'Нет',
                        model: 'XDR2',
                        mileage: '0 км',
                        oppActual: '82%',
                        pattern: 'E3',
                        condition: 'Новое',
                        wear: '0%',
                        damage: 'I'
                    }
                ],
                _source: 'demo_data'
            }
        ];
    }

    /**
     * ПОИСК ОСНОВНЫХ КОНТЕЙНЕРОВ
     */
    findContainers() {
        this.container = document.querySelector('.warehouse-system-container');
        this.tabsContainer = document.getElementById('warehouseTabs');
        this.contentContainer = document.getElementById('warehouseContent');
        
        console.log('🔍 Поиск контейнеров:', {
            container: !!this.container,
            tabsContainer: !!this.tabsContainer,
            contentContainer: !!this.contentContainer
        });

        if (!this.tabsContainer) {
            this.tabsContainer = document.querySelector('.warehouse-bottom-row');
        }
        
        if (!this.contentContainer) {
            this.contentContainer = document.querySelector('.warehouse-content');
        }
    }

    /**
     * НАСТРОЙКА НАЧАЛЬНОГО СОСТОЯНИЯ
     */
    setupInitialState() {
        if (this.contentContainer) {
            this.showLoadingState('Инициализация системы склада...');
        }
    }

    /**
     * ОТОБРАЖЕНИЕ ПАНЕЛИ УПРАВЛЕНИЯ СКЛАДАМИ
     */
    renderWarehouseControls() {
        if (!this.tabsContainer) {
            console.error('❌ Контейнер вкладок не найден');
            return;
        }
        
        this.tabsContainer.innerHTML = '';
        
        this.warehouses.forEach((warehouse, index) => {
            const button = document.createElement('button');
            button.className = 'warehouse-tab';
            button.setAttribute('data-warehouse-id', warehouse.id);
            button.setAttribute('title', warehouse.description || warehouse.name);
            
            const realTireCount = warehouse.tireCount || (warehouse.tires ? warehouse.tires.length : 0);
            
            button.innerHTML = `
                <span class="warehouse-tab-name">${warehouse.name}</span>
                <span class="warehouse-tab-count">${realTireCount}</span>
            `;
            
            if (index === 0) {
                button.classList.add('active');
            }
            
            this.tabsContainer.appendChild(button);
        });
        
        console.log(`✅ Создано кнопок складов: ${this.warehouses.length}`);
    }

    /**
     * ПОДКЛЮЧЕНИЕ ОБРАБОТЧИКОВ СОБЫТИЙ
     */
    attachEventListeners() {
        console.log('🔄 Подключаем обработчики событий...');
        this.attachWarehouseButtonsEvents();
        console.log('✅ Обработчики событий подключены');
    }

    /**
     * ОБРАБОТЧИКИ ДЛЯ КНОПОК ПЕРЕКЛЮЧЕНИЯ СКЛАДОВ
     */
    attachWarehouseButtonsEvents() {
        if (!this.tabsContainer) return;
        
        this.tabsContainer.addEventListener('click', (event) => {
            const button = event.target.closest('.warehouse-tab');
            if (button) {
                this.handleWarehouseButtonClick(button);
            }
        });
    }

    /**
     * ОБРАБОТКА КЛИКА ПО КНОПКЕ СКЛАДА
     */
    async handleWarehouseButtonClick(button) {
        const warehouseId = button.dataset.warehouseId;
        console.log('🔘 Выбран склад:', warehouseId);
        
        const allButtons = this.tabsContainer.querySelectorAll('.warehouse-tab');
        allButtons.forEach(btn => btn.classList.remove('active'));
        
        button.classList.add('active');
        
        await this.loadWarehouseContents(warehouseId);
    }

    /**
     * ЗАГРУЗКА СОДЕРЖИМОГО СКЛАДА
     */
    async loadWarehouseContents(warehouseId) {
        try {
            console.log(`📂 Загружаем содержимое склада: ${warehouseId}`);
            
            const warehouse = this.warehouses.find(w => w.id === warehouseId);
            if (!warehouse) {
                throw new Error(`Склад с ID ${warehouseId} не найден`);
            }
            
            this.showLoadingState(`Загрузка данных склада "${warehouse.name}"...`);
            
            // Получаем шины для этого склада
            let tires = warehouse.tires;
            
            // Если шин нет в данных склада, пытаемся получить из менеджера данных
            if ((!tires || tires.length === 0) && window.tireDataManager) {
                tires = window.tireDataManager.getTiresForWarehouse(warehouseId);
            }
            
            // Имитация загрузки для плавности
            await new Promise(resolve => setTimeout(resolve, 300));
            
            this.renderTires(tires, warehouse.name);
            
            this.currentWarehouse = {
                ...warehouse,
                tires: tires
            };
            
            console.log(`✅ Данные склада "${warehouse.name}" загружены, шин: ${tires?.length || 0}`);
            
        } catch (error) {
            console.error(`❌ Ошибка загрузки содержимого склада ${warehouseId}:`, error);
            this.showErrorState(`Не удалось загрузить данные склада: ${error.message}`);
        }
    }

    /**
     * ОТОБРАЖЕНИЕ ШИН
     */
    renderTires(tires, warehouseName) {
        if (!this.contentContainer) {
            console.error('❌ Контейнер контента не найден');
            return;
        }
        
        if (!tires || tires.length === 0) {
            this.contentContainer.innerHTML = `
                <div class="warehouse-empty-state">
                    <i class="fas fa-box-open"></i>
                    <div>На этом складе пока нет шин</div>
                </div>
            `;
            return;
        }
        
        this.clearTireContainers();
        
        let tiresHTML = `
            <div class="warehouse-tires-container">
        `;
        
        tires.forEach((tire, index) => {
            try {
                if (window.WarehouseTireContainer) {
                    const tireContainer = new WarehouseTireContainer(tire);
                    const tireElement = tireContainer.render();
                    tiresHTML += tireElement.outerHTML;
                    this.tireContainers.push(tireContainer);
                } else {
                    // Fallback если контейнер не загружен
                    tiresHTML += this.createSimpleTireElement(tire, index);
                }
            } catch (error) {
                console.error('❌ Ошибка создания контейнера шины:', error);
                tiresHTML += this.createSimpleTireElement(tire, index);
            }
        });
        
        tiresHTML += '</div>';
        this.contentContainer.innerHTML = tiresHTML;
        
        console.log(`✅ Отображено ${tires.length} шин для склада "${warehouseName}"`);
    }

    /**
     * СОЗДАНИЕ ПРОСТОГО ЭЛЕМЕНТА ШИНЫ (FALLBACK)
     */
    createSimpleTireElement(tire, index) {
        return `
            <div class="warehouse-tire-item simple-tire" data-tire-id="${tire.id || 'tire-' + index}">
                <div class="tire-basic-info">
                    <strong>${tire.brand || 'Бренд'}</strong> - ${tire.size || 'Размер'} 
                    (${tire.subwarehouse || 'А-1'}-${tire.row || '1'}-${tire.place || index + 1})
                </div>
                <div class="tire-details">
                    Модель: ${tire.model || '—'}, Состояние: ${tire.condition || '—'}
                </div>
            </div>
        `;
    }

    /**
     * ОЧИСТКА КОНТЕЙНЕРОВ ШИН
     */
    clearTireContainers() {
        this.tireContainers.forEach(container => {
            if (container && typeof container.destroy === 'function') {
                container.destroy();
            }
        });
        this.tireContainers = [];
    }

    /**
     * ПОКАЗАТЬ СОСТОЯНИЕ ЗАГРУЗКИ
     */
    showLoadingState(message = 'Загрузка данных...') {
        if (this.contentContainer) {
            this.contentContainer.innerHTML = `
                <div class="warehouse-loading">
                    <div class="loading-spinner"></div>
                    <div>${message}</div>
                </div>
            `;
        }
    }

    /**
     * ПОКАЗАТЬ СОСТОЯНИЕ ОШИБКИ
     */
    showErrorState(message) {
        if (this.contentContainer) {
            this.contentContainer.innerHTML = `
                <div class="warehouse-error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>${message}</div>
                    <button class="btn-retry" onclick="window.warehouseManager.initialize()">
                        Повторить попытку
                    </button>
                </div>
            `;
        }
    }
    
    /**
     * ОБНОВЛЕНИЕ ОТОБРАЖЕНИЯ СКЛАДА
     */
    refreshWarehouseDisplay() {
        if (this.currentWarehouse) {
            this.loadWarehouseContents(this.currentWarehouse.id);
        }
    }
}

// Создаем глобальный экземпляр менеджера
window.warehouseManager = new WarehouseManager();