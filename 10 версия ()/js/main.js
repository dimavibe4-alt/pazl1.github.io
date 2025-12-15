// js/main.js
class PAZLApp {
    constructor() {
        this.modules = {};
        this.init();
    }

    // Compatibility wrapper: ensure older calls to loadDnDComponents() work
    loadDnDComponents(...args) {
        if (typeof this.initDnDModules === 'function') {
            try { return this.initDnDModules(...args); } catch(e) { console.warn('initDnDModules failed in wrapper', e); }
        }
        if (typeof this.initDnD === 'function') {
            try { return this.initDnD(...args); } catch(e) { console.warn('initDnD failed in wrapper', e); }
        }
        console.warn('loadDnDComponents wrapper: no DnD init function found');
        return null;
    }


    init() {
        console.log('🚀 ПАЗЛ система инициализируется...');
        
        this.initConfigManager();
        this.initSystemSettings();
        this.initAuthModule();
        this.initUserManager();
        this.initHandbookModules();
        this.initSettings();
        this.initPrint();
        this.initTrucksModule();
        this.initWarehouseModule();
        this.initDnDSystem();
        this.initAdmin();
        
        this.setupModuleConnections();
        this.initGlobalHandlers();
        
        console.log('✅ ПАЗЛ система готова к работе');
        console.log('📋 Загруженные модули:', Object.keys(this.modules));
    }

    initConfigManager() {
        try {
            if (typeof ConfigManager !== 'undefined') {
                this.modules.configManager = new ConfigManager();
                console.log('✅ ConfigManager загружен');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки ConfigManager:', error);
        }
    }

    initSystemSettings() {
        try {
            if (typeof SystemSettingsModule !== 'undefined') {
                this.modules.systemSettings = new SystemSettingsModule();
                console.log('✅ Модуль системных настроек загружен');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки модуля системных настроек:', error);
        }
    }

    initAuthModule() {
        try {
            if (typeof AuthModule !== 'undefined') {
                this.modules.auth = new AuthModule();
                console.log('✅ AuthModule загружен');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки AuthModule:', error);
        }
    }

    initUserManager() {
        try {
            if (typeof UserManager !== 'undefined') {
                this.modules.userManager = new UserManager();
                console.log('✅ UserManager загружен');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки UserManager:', error);
        }
    }

    initHandbookModules() {
        try {
            if (typeof window.PendingChanges !== 'undefined' && window.PendingChanges.init) {
                window.PendingChanges.init();
                console.log('✅ PendingChanges инициализирован');
            }
            console.log('✅ Модули справочников загружены');
        } catch (error) {
            console.error('❌ Ошибка загрузки модулей справочников:', error);
        }
    }

    initSettings() {
        try {
            if (typeof SettingsModule !== 'undefined') {
                this.modules.settings = new SettingsModule();
                console.log('✅ Модуль настроек загружен');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки модуля настроек:', error);
        }
    }

    initPrint() {
        try {
            if (typeof PrintModule !== 'undefined') {
                this.modules.print = new PrintModule();
                console.log('✅ Модуль печати загружен');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки модуля печати:', error);
        }
    }

    initTrucksModule() {
        try {
            if (typeof TrucksIntegration !== 'undefined') {
                this.modules.trucks = new TrucksIntegration();
                setTimeout(() => {
                    this.modules.trucks.init().then(() => {
                        console.log('✅ Модуль грузовиков инициализирован');
                    }).catch(error => {
                        console.error('❌ Ошибка инициализации модуля грузовиков:', error);
                    });
                }, 500);
                console.log('✅ Модуль грузовиков загружен');
            } else {
                console.warn('⚠️ TrucksIntegration не доступен');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки модуля грузовиков:', error);
        }
    }

    initWarehouseModule() {
        try {
            if (typeof WarehouseIntegration !== 'undefined') {
                this.modules.warehouse = new WarehouseIntegration();
                setTimeout(() => {
                    this.modules.warehouse.init().then(() => {
                        console.log('✅ Модуль склада инициализирован');
                    }).catch(error => {
                        console.error('❌ Ошибка инициализации модуля склада:', error);
                    });
                }, 700);
                console.log('✅ Модуль склада загружен');
            } else {
                console.warn('⚠️ WarehouseIntegration не доступен');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки модуля склада:', error);
        }
    }

    initDnDSystem() {
        try {
            if (typeof DnDEngine !== 'undefined' && 
                typeof MovementAPI !== 'undefined' && 
                typeof DnDIntegration !== 'undefined') {
                
                setTimeout(() => {
                    this.initDnDModules();
                }, 1500);
                
                console.log('✅ Система D&D загружена');
            } else {
                console.warn('⚠️ Компоненты системы D&D не полностью загружены');
                this.loadDnDComponents();
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки системы D&D:', error);
        }
    }

    async initDnDModules() {
        try {
            console.log('🚀 Инициализация системы D&D...');
            
            // Загружаем модули
            if (typeof RulesEngine !== 'undefined') {
                this.modules.rulesEngine = new RulesEngine();
                await this.modules.rulesEngine.loadRules();
                window.rulesEngine = this.modules.rulesEngine;
                console.log('✅ RulesEngine инициализирован');
            }
            
            if (typeof MovementHistoryManager !== 'undefined') {
                this.modules.historyManager = new MovementHistoryManager();
                await this.modules.historyManager.initialize();
                window.historyManager = this.modules.historyManager;
                console.log('✅ MovementHistoryManager инициализирован');
            }
            
            if (typeof MovementAPI !== 'undefined') {
                this.modules.movementAPI = new MovementAPI();
                await this.modules.movementAPI.initialize();
                window.movementAPI = this.modules.movementAPI;
                console.log('✅ MovementAPI инициализирован');
            }
            
            // Инициализируем DnDEngine и DnDIntegration
            if (typeof DnDEngine !== 'undefined') {
                this.modules.dndEngine = new DnDEngine();
                await this.modules.dndEngine.initialize();
                window.dndEngine = this.modules.dndEngine;
                console.log('✅ DnDEngine инициализирован');
            }
            
            if (typeof DnDIntegration !== 'undefined') {
                this.modules.dndIntegration = new DnDIntegration();
                await this.modules.dndIntegration.initialize();
                window.dndIntegration = this.modules.dndIntegration;
                console.log('✅ DnDIntegration инициализирован');
            }
            
            // Применяем историю к текущему UI
            if (this.modules.dndIntegration) {
                setTimeout(() => {
                    this.modules.dndIntegration.applyHistoryToUI();
                }, 1000);
            }
            
            this.setupDnDConnections();
            this.addDnDUIElements();
            
            console.log('✅ Система D&D полностью инициализирована');
            this.emitDnDReady();
            
        } catch (error) {
            console.error('❌ Ошибка инициализации системы D&D:', error);
            this.showDnDError(error);
        }
    }

    setupDnDConnections() {
        console.log('🔗 Настраиваю связи системы D&D...');
        
        if (this.modules.trucks && this.modules.dndIntegration) {
            console.log('✅ D&D связан с модулем грузовиков');
        }
        
        if (this.modules.warehouse && this.modules.dndIntegration) {
            console.log('✅ D&D связан с модулем склада');
        }
        
        if (this.modules.systemSettings && this.modules.historyManager) {
            this.modules.historyManager.configManager = this.modules.systemSettings;
            console.log('✅ HistoryManager связан с SystemSettings');
        }
        
        console.log('🔗 Все связи системы D&D установлены');
    }

    addDnDUIElements() {
        // Добавляем панель уведомлений
        if (!document.getElementById('dnd-notification-panel')) {
            const panel = document.createElement('div');
            panel.id = 'dnd-notification-panel';
            document.body.appendChild(panel);
        }
        
        console.log('✅ UI элементы D&D добавлены');
    }

    emitDnDReady() {
        const event = new CustomEvent('dnd:systemReady', {
            detail: { timestamp: new Date().toISOString() }
        });
        document.dispatchEvent(event);
        
        this.showDnDNotification('Система перетаскивания готова к работе', 'success');
    }

    showDnDError(error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'dnd-error-modal';
        errorDiv.innerHTML = `
            <h3 class="dnd-error-title">Ошибка системы D&D</h3>
            <p class="dnd-error-message">${error.message || 'Неизвестная ошибка'}</p>
            <div class="dnd-error-buttons">
                <button class="dnd-error-btn dnd-error-btn-close" onclick="this.parentElement.parentElement.remove()">
                    Закрыть
                </button>
                <button class="dnd-error-btn dnd-error-btn-reload" onclick="location.reload()">
                    Перезагрузить
                </button>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }

    showDnDNotification(message, type = 'info') {
        const panel = document.getElementById('dnd-notification-panel');
        if (!panel) return;
        
        const notification = document.createElement('div');
        notification.className = `dnd-notification dnd-notification-${type}`;
        notification.textContent = message;
        
        panel.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    initAdmin() {
        try {
            if (typeof AdminModule !== 'undefined') {
                this.modules.admin = new AdminModule();
                console.log('✅ Модуль админки загружен');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки модуля админки:', error);
        }
    }

    setupModuleConnections() {
        console.log('🔗 Настраиваю связи между модулями...');

        if (this.modules.systemSettings && this.modules.configManager) {
            this.modules.systemSettings.configManager = this.modules.configManager;
            console.log('✅ Связь между SystemSettingsModule и ConfigManager установлена');
        }

        if (this.modules.auth && this.modules.systemSettings) {
            this.modules.auth.setSystemSettings(this.modules.systemSettings);
            console.log('✅ SystemSettings установлен в AuthModule');
        }

        if (this.modules.auth && this.modules.userManager) {
            this.modules.auth.setUserManager(this.modules.userManager);
            console.log('✅ UserManager установлен в AuthModule');
        }

        if (this.modules.admin && this.modules.systemSettings) {
            this.modules.admin.setSystemSettings(this.modules.systemSettings);
            console.log('✅ SystemSettings установлен в AdminModule');
        }

        if (this.modules.admin && this.modules.userManager) {
            this.modules.admin.setUserManager(this.modules.userManager);
            console.log('✅ UserManager установлен в AdminModule');
        }

        if (this.modules.dndIntegration) {
            console.log('✅ Модуль D&D подключен к системе');
        }

        if (this.modules.historyManager && this.modules.systemSettings) {
            console.log('✅ HistoryManager имеет доступ к SystemSettings');
        }

        if (this.modules.systemSettings && this.modules.admin) {
            this.modules.systemSettings.setAdminModule(this.modules.admin);
            console.log('✅ Обратная связь SystemSettings -> Admin установлена');
        }

        console.log('🔗 Все связи между модулями установлены');
    }

    initGlobalHandlers() {
        window.addEventListener('error', (e) => {
            console.error('Глобальная ошибка:', e.error);
        });

        const menuButton = document.getElementById('menuButton');
        if (menuButton) {
            menuButton.addEventListener('click', () => {
                console.log('Меню системы - функционал в разработке');
            });
        }

        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                console.log('Экспорт данных - функционал в разработке');
            });
        }

        const regionSelect = document.getElementById('regionSelect');
        const enterpriseSelect = document.getElementById('enterpriseSelect');
        
        if (regionSelect) {
            regionSelect.addEventListener('change', function() {
                console.log('Выбран регион:', this.value);
            });
        }
        
        if (enterpriseSelect) {
            enterpriseSelect.addEventListener('change', function() {
                console.log('Выбрано предприятие:', this.value);
            });
        }

        this.initGlobalSaveHandler();
        this.initDnDGlobalHandlers();
    }

    initDnDGlobalHandlers() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.dnd-history-btn')) {
                this.toggleHistoryPanel();
            }
        });
        
        document.addEventListener('dnd:movementRecorded', (e) => {
            this.handleDnDMovement(e.detail.movement);
        });
        
        document.addEventListener('dnd:operationComplete', (e) => {
            this.handleDnDOperationComplete(e.detail);
        });
        
        console.log('✅ Глобальные обработчики D&D установлены');
    }

    toggleHistoryPanel() {
        let panel = document.getElementById('dnd-history-panel');
        
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'dnd-history-panel';
            panel.className = 'dnd-history-panel';
            panel.innerHTML = `
                <div class="dnd-history-header">
                    <h4>История перемещений</h4>
                    <button class="dnd-history-close" onclick="window.pazlApp.toggleHistoryPanel()">×</button>
                </div>
                <div class="dnd-history-content" id="dnd-history-content">
                    <div class="dnd-history-empty">
                        История перемещений пуста
                    </div>
                </div>
            `;
            document.body.appendChild(panel);
        }
        
        panel.classList.toggle('visible');
        
        if (panel.classList.contains('visible')) {
            this.updateHistoryPanel();
        }
    }

    updateHistoryPanel() {
        const content = document.getElementById('dnd-history-content');
        if (!content || !this.modules.historyManager) return;
        
        const movements = this.modules.historyManager.getMovements({ limit: 10 });
        
        if (movements.length === 0) {
            content.innerHTML = `
                <div class="dnd-history-empty">
                    История перемещений пуста
                </div>
            `;
            return;
        }
        
        content.innerHTML = movements.map(movement => `
            <div class="dnd-history-item ${movement.operation}">
                <div class="dnd-history-item-header">
                    ${this.getOperationIcon(movement.operation)} ${movement.tireNumber}
                </div>
                <div class="dnd-history-item-description">
                    ${this.formatMovementDescription(movement)}
                </div>
                <div class="dnd-history-item-time">
                    ${new Date(movement.timestamp).toLocaleString()}
                </div>
            </div>
        `).join('');
    }

    getOperationIcon(operation) {
        const icons = {
            'install': '🔧',
            'remove': '⬇️',
            'move': '🔄'
        };
        return icons[operation] || '📝';
    }

    formatMovementDescription(movement) {
        const from = movement.fromType === 'truck' ? 
            `Самосвал ${movement.fromName}` : 
            `Склад "${movement.fromName}"`;
        
        const to = movement.toType === 'truck' ? 
            `Самосвал ${movement.toName}` : 
            `Склад "${movement.toName}"`;
        
        return `${from} → ${to}`;
    }

    handleDnDMovement(movement) {
        console.log('📝 Запись перемещения:', movement.id);
        
        if (document.getElementById('dnd-history-panel')?.classList.contains('visible')) {
            this.updateHistoryPanel();
        }
        
        this.showDnDNotification(
            `Шина ${movement.tireNumber} перемещена`,
            'success'
        );
    }

    handleDnDOperationComplete(detail) {
        const { operationData, movementRecord } = detail;
        console.log('✅ Операция завершена:', operationData.operation);
        
        this.updateDnDCounters(operationData);
    }

    updateDnDCounters(operationData) {
        console.log('🔄 Обновление счетчиков для операции:', operationData.operation);
    }

    initGlobalSaveHandler() {
        const saveAllChangesBtn = document.getElementById('saveAllChangesBtn');
        if (saveAllChangesBtn) {
            saveAllChangesBtn.addEventListener('click', async () => {
                await this.saveAllChanges();
            });
        }
    }

    async saveAllChanges() {
        try {
            if (!this.modules.admin) {
                throw new Error('Admin module not available');
            }

            const hasUserChanges = this.modules.userManager && this.modules.userManager.hasPendingChanges();
            const hasFolderChanges = this.modules.systemSettings && this.modules.systemSettings.pendingFolderChange;
            const hasHandbookChanges = window.PendingChanges && window.PendingChanges.hasPendingChanges();
            const hasTruckChanges = this.modules.trucks && this.modules.trucks.hasPendingChanges ? this.modules.trucks.hasPendingChanges() : false;
            const hasDnDHistoryChanges = this.modules.historyManager && this.modules.historyManager.hasPendingChanges ? 
                this.modules.historyManager.hasPendingChanges() : false;

            if (!hasUserChanges && !hasFolderChanges && !hasHandbookChanges && !hasTruckChanges && !hasDnDHistoryChanges) {
                alert('ℹ️ Нет изменений для сохранения');
                return;
            }

            const saveBtn = document.getElementById('saveAllChangesBtn');
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
            saveBtn.disabled = true;

            let successCount = 0;
            let totalCount = 0;

            if (hasFolderChanges && this.modules.systemSettings) {
                totalCount++;
                try {
                    await this.modules.systemSettings.saveFolderSettings();
                    successCount++;
                    console.log('✅ Настройки папки сохранены');
                } catch (error) {
                    console.error('❌ Ошибка сохранения настроек папки:', error);
                }
            }

            if (hasUserChanges && this.modules.userManager) {
                totalCount++;
                try {
                    await this.modules.userManager.saveUsers();
                    successCount++;
                    console.log('✅ Пользователи сохранены');
                } catch (error) {
                    console.error('❌ Ошибка сохранения пользователей:', error);
                }
            }

            if (hasHandbookChanges && window.PendingChanges) {
                totalCount++;
                try {
                    const success = await window.PendingChanges.saveAllChanges();
                    if (success) {
                        successCount++;
                        console.log('✅ Справочники сохранены');
                    } else {
                        console.error('❌ Не все справочники удалось сохранить');
                    }
                } catch (error) {
                    console.error('❌ Ошибка сохранения справочников:', error);
                }
            }

            if (hasTruckChanges && this.modules.trucks && this.modules.trucks.saveChanges) {
                totalCount++;
                try {
                    await this.modules.trucks.saveChanges();
                    successCount++;
                    console.log('✅ Данные грузовиков сохранены');
                } catch (error) {
                    console.error('❌ Ошибка сохранения данных грузовиков:', error);
                }
            }

            if (hasDnDHistoryChanges && this.modules.historyManager && this.modules.historyManager.saveToFile) {
                totalCount++;
                try {
                    await this.modules.historyManager.saveToFile();
                    successCount++;
                    console.log('✅ История перемещений сохранена');
                } catch (error) {
                    console.error('❌ Ошибка сохранения истории перемещений:', error);
                }
            }

            this.modules.admin.updateSaveButtonState();

            if (successCount === totalCount) {
                alert('✅ Все изменения успешно сохранены');
            } else if (successCount > 0) {
                alert(`⚠️ Сохранено ${successCount} из ${totalCount} изменений. Некоторые операции завершились с ошибкой.`);
            } else {
                alert('❌ Не удалось сохранить изменения');
            }

        } catch (error) {
            console.error('Ошибка при сохранении всех изменений:', error);
            alert('❌ Ошибка при сохранении изменений: ' + error.message);
            this.modules.admin.updateSaveButtonState();
        }
    }

    registerModule(name, moduleClass) {
        try {
            this.modules[name] = new moduleClass();
            console.log(`✅ Модуль ${name} зарегистрирован`);
        } catch (error) {
            console.error(`❌ Ошибка регистрации модуля ${name}:`, error);
        }
    }

    getModule(name) {
        return this.modules[name];
    }

    callModuleMethod(moduleName, methodName, ...args) {
        const module = this.getModule(moduleName);
        if (module && typeof module[methodName] === 'function') {
            return module[methodName](...args);
        } else {
            console.error(`❌ Метод ${methodName} не найден в модуле ${moduleName}`);
            return null;
        }
    }

    async refreshTrucksData() {
        if (this.modules.trucks && this.modules.trucks.refreshData) {
            try {
                await this.modules.trucks.refreshData();
                console.log('✅ Данные грузовиков обновлены');
                return true;
            } catch (error) {
                console.error('❌ Ошибка обновления данных грузовиков:', error);
                return false;
            }
        }
        return false;
    }
    
    async refreshWarehouseData() {
        if (this.modules.warehouse && this.modules.warehouse.refreshData) {
            try {
                await this.modules.warehouse.refreshData();
                console.log('✅ Данные склада обновлены');
                return true;
            } catch (error) {
                console.error('❌ Ошибка обновления данных склада:', error);
                return false;
            }
        }
        return false;
    }
    
    async getMovementHistory(filters = {}) {
        if (this.modules.historyManager) {
            return this.modules.historyManager.getMovements(filters);
        }
        return [];
    }
    
    async exportMovementHistory(format = 'json') {
        if (this.modules.movementAPI && this.modules.movementAPI.exportHistory) {
            return await this.modules.movementAPI.exportHistory(format);
        }
        return null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.pazlApp = new PAZLApp();
});

window.PAZL = {
    getApp: () => window.pazlApp,
    getModules: () => window.pazlApp?.modules,
    reloadModule: (moduleName) => {
        if (window.pazlApp && window.pazlApp.modules[moduleName]) {
            console.log(`🔄 Перезагрузка модуля ${moduleName}`);
        }
    },
    saveAllChanges: () => {
        if (window.pazlApp) {
            return window.pazlApp.saveAllChanges();
        }
    },
    refreshTrucksData: () => {
        if (window.pazlApp) {
            return window.pazlApp.refreshTrucksData();
        }
    },
    refreshWarehouseData: () => {
        if (window.pazlApp) {
            return window.pazlApp.refreshWarehouseData();
        }
    },
    getSelectedTruckTire: () => {
        if (window.pazlApp && window.pazlApp.modules.trucks) {
            return window.pazlApp.modules.trucks.getSelectedTire();
        }
        return null;
    },
    getMovementHistory: (filters) => {
        if (window.pazlApp) {
            return window.pazlApp.getMovementHistory(filters);
        }
        return [];
    },
    exportMovementHistory: (format) => {
        if (window.pazlApp) {
            return window.pazlApp.exportMovementHistory(format);
        }
        return null;
    },
    showDnDNotification: (message, type) => {
        if (window.pazlApp && window.pazlApp.showDnDNotification) {
            window.pazlApp.showDnDNotification(message, type);
        }
    },
    toggleHistoryPanel: () => {
        if (window.pazlApp && window.pazlApp.toggleHistoryPanel) {
            window.pazlApp.toggleHistoryPanel();
        }
    }
};