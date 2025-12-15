// js/systemSettings.js
class SystemSettingsModule {
    constructor() {
        this.configManager = null;
        this.adminModule = null;
        this.selectFolderBtn = document.getElementById('selectFolderBtn');
        this.selectedFolderPath = document.getElementById('selectedFolderPath');
        this.saveSystemSettingsBtn = document.getElementById('saveSystemSettingsBtn');
        this.autoSelectFolderBtn = document.getElementById('autoSelectFolderBtn');
        this.loadDataBtn = document.getElementById('loadDataBtn');
        this.loadedFilesList = document.getElementById('loadedFilesList');
        this.pendingFolderChange = false;
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.displaySavedFolderInfo();
        console.log('⚙️ Модуль системных настроек инициализирован');
    }

    setAdminModule(adminModule) {
        this.adminModule = adminModule;
    }

    bindEvents() {
        if (this.selectFolderBtn) {
            this.selectFolderBtn.addEventListener('click', () => this.selectFolder());
        }

        if (this.saveSystemSettingsBtn) {
            this.saveSystemSettingsBtn.addEventListener('click', () => this.markFolderChange());
        }

        if (this.autoSelectFolderBtn) {
            this.autoSelectFolderBtn.addEventListener('click', () => this.tryAutoSelectFolder());
        }

        if (this.loadDataBtn) {
            this.loadDataBtn.addEventListener('click', () => this.loadDataFromFolder());
        }
    }

    async displaySavedFolderInfo() {
        if (!this.configManager) {
            console.warn('ConfigManager not available');
            return;
        }

        const savedPath = await this.configManager.getDataFolder();
        
        if (savedPath) {
            this.selectedFolderPath.textContent = `Найден сохраненный путь: ${savedPath}`;
            this.selectedFolderPath.style.color = 'green';
            console.log('✅ Информация о папке загружена из конфига');
        } else {
            this.selectedFolderPath.textContent = 'Сохраненный путь не найден. Выберите папку вручную.';
            this.selectedFolderPath.style.color = 'orange';
        }
    }

    async tryAutoSelectFolder() {
        console.log('🔄 Попытка автоматического выбора папки...');
        
        if (!this.configManager) {
            console.warn('ConfigManager not available');
            return false;
        }

        const savedPath = await this.configManager.getDataFolder();
        
        if (savedPath) {
            this.selectedFolderPath.textContent = `Найден сохраненный путь: ${savedPath}`;
            this.selectedFolderPath.style.color = 'green';
            
            try {
                if (window.FSAPI && window.FSAPI.isSupported()) {
                    // Автовыбор не возможен без пользовательского жеста
                    // Поэтому просто информируем пользователя
                    this.selectedFolderPath.textContent = 'Для выбора папки нажмите "Выбрать папку вручную"';
                    this.selectedFolderPath.style.color = 'blue';
                    return false;
                }
            } catch (error) {
                console.log('⚠️ Не удалось получить доступ к сохраненной папке:', error);
                this.selectedFolderPath.textContent = 'Не удалось получить доступ к сохраненной папке. Выберите заново.';
                this.selectedFolderPath.style.color = 'red';
                return false;
            }
        } else {
            this.selectedFolderPath.textContent = 'Сохраненный путь не найден. Выберите папку вручную.';
            this.selectedFolderPath.style.color = 'orange';
            console.log('❌ Автоматический выбор папки не удался');
            return false;
        }
        return false;
    }

    async selectFolder() {
        try {
            if (!window.FSAPI || !window.FSAPI.isSupported()) {
                alert('❌ Ваш браузер не поддерживает File System API. Используйте Chrome или Edge.');
                return false;
            }

            await window.FSAPI.selectDirectory();
            const directoryInfo = window.FSAPI.getDirectoryInfo();
            
            if (directoryInfo && this.selectedFolderPath) {
                this.selectedFolderPath.textContent = directoryInfo.name;
                this.selectedFolderPath.style.color = 'black';
            }
            
            this.pendingFolderChange = true;
            this.updateAdminChangesCount();
            
            console.log('📁 Выбрана папка:', directoryInfo?.name, '(ожидает сохранения)');
            
            await this.loadDataFromFolder();
            return true;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Ошибка выбора папки:', error);
                alert('❌ Ошибка при выборе папки');
            }
            return false;
        }
    }

    updateAdminChangesCount() {
        if (this.adminModule && this.adminModule.setFolderChangesCount) {
            const count = this.pendingFolderChange ? 1 : 0;
            this.adminModule.setFolderChangesCount(count);
        }
    }

    markFolderChange() {
        this.pendingFolderChange = true;
        this.updateAdminChangesCount();
        alert('ℹ️ Изменение папки будет сохранено при нажатии "Сохранить изменения"');
    }

    async saveFolderSettings() {
        if (!this.pendingFolderChange) {
            return true;
        }

        if (!window.FSAPI || !window.FSAPI.getCurrentDirectory()) {
            throw new Error('Папка не выбрана');
        }

        try {
            if (this.configManager) {
                await this.configManager.saveDataFolder(window.FSAPI.getCurrentDirectory());
            }
            
            await window.FSAPI.createTestFiles();
            
            this.pendingFolderChange = false;
            this.updateAdminChangesCount();
            console.log('✅ Настройки папки сохранены');
            return true;
        } catch (error) {
            console.error('❌ Ошибка сохранения настроек папки:', error);
            throw error;
        }
    }

    async loadDataFromFolder() {
        if (!window.FSAPI || !window.FSAPI.getCurrentDirectory()) {
            alert('❌ Сначала выберите папку для загрузки данных');
            return;
        }

        try {
            console.log('📂 Начинаем загрузку данных из папки...');
            
            if (this.selectedFolderPath) {
                this.selectedFolderPath.textContent += ' (загрузка...)';
                this.selectedFolderPath.style.color = 'blue';
            }

            const jsonFiles = await window.FSAPI.readAllJsonFiles();
            
            this.displayLoadedFiles(jsonFiles);
            
            console.log('✅ Данные успешно загружены из папки');
            
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
            alert('❌ Ошибка при загрузке данных из папки');
        }
    }

    displayLoadedFiles(files) {
        if (!this.loadedFilesList) {
            console.warn('Элемент для отображения файлов не найден');
            return;
        }

        if (files.length === 0) {
            this.loadedFilesList.innerHTML = '<div style="color: orange; padding: 10px;">Файлы не найдены в выбранной папке</div>';
            return;
        }

        let html = `
            <div style="margin-bottom: 10px; font-weight: bold; color: green;">
                ✅ Загружено ${files.length} файлов:
            </div>
        `;

        files.forEach(file => {
            html += `
                <div class="file-item" style="border: 1px solid #ddd; border-radius: 4px; padding: 8px; margin-bottom: 5px; background: #f9f9f9;">
                    <div style="font-weight: bold;">📄 ${file.name}</div>
                    <div style="font-size: 12px; color: #666;">
                        Размер: ${file.size} байт | 
                        Изменен: ${new Date(file.lastModified).toLocaleString()}
                    </div>
                    <div style="font-size: 11px; color: #888; margin-top: 4px;">
                        Данные: ${JSON.stringify(file.data).substring(0, 100)}...
                    </div>
                </div>
            `;
        });

        this.loadedFilesList.innerHTML = html;
        
        if (this.selectedFolderPath) {
            const directoryInfo = window.FSAPI.getDirectoryInfo();
            this.selectedFolderPath.textContent = `${directoryInfo?.name} (загружено ${files.length} файлов)`;
            this.selectedFolderPath.style.color = 'green';
        }
    }

    getCurrentDirectory() {
        return window.FSAPI ? window.FSAPI.getCurrentDirectory() : null;
    }
}