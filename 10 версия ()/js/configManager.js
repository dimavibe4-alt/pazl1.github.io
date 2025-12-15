// js/configManager.js
class ConfigManager {
    constructor() {
        this.configFileName = 'pazl-config.json';
        this.defaultConfig = {
            dataFolder: '',
            lastUsed: new Date().toISOString()
        };
    }

    async getDataFolder() {
        try {
            const savedConfig = localStorage.getItem(this.configFileName);
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                if (config && config.dataFolder) {
                    console.log('📁 Найден сохраненный путь к папке:', config.dataFolder);
                    return config.dataFolder;
                }
            }
            
            console.log('📁 Сохраненный путь не найден');
            return null;
            
        } catch (error) {
            console.error('❌ Ошибка загрузки конфигурации:', error);
            return null;
        }
    }

    async saveDataFolder(folderHandle) {
        try {
            const config = {
                dataFolder: folderHandle.name,
                lastUsed: new Date().toISOString(),
                folderInfo: await this.getFolderInfo(folderHandle)
            };

            await this.saveConfigToLocalStorage(config);
            console.log('✅ Путь к папке сохранен в конфиг');
            
        } catch (error) {
            console.error('❌ Ошибка сохранения конфига:', error);
        }
    }

    async loadConfig() {
        return await this.loadConfigFromLocalStorage();
    }

    async loadConfigFromLocalStorage() {
        const saved = localStorage.getItem(this.configFileName);
        return saved ? JSON.parse(saved) : null;
    }

    async saveConfigToLocalStorage(config) {
        localStorage.setItem(this.configFileName, JSON.stringify(config));
    }

    async getFolderInfo(folderHandle) {
        return {
            name: folderHandle.name,
            kind: folderHandle.kind,
        };
    }

    async createDefaultConfig() {
        const defaultConfig = {
            ...this.defaultConfig,
            created: new Date().toISOString(),
            version: '1.0'
        };
        await this.saveConfigToLocalStorage(defaultConfig);
        return defaultConfig;
    }
}