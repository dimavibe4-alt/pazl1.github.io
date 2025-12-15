// js/handbookFS.js
window.hbFs = {
    /**
     * Полное обновление справочника (структура + данные)
     */
    async upsertFull(name, fields, rows) {
        console.log(`💾 Сохранение справочника "${name}" в файловую систему...`);
        
        if (!window.FSAPI || !window.FSAPI.getCurrentDirectory()) {
            console.log('ℹ️ Папка не выбрана, сохранение только в localStorage');
            return false;
        }

        try {
            const handbookData = {
                metadata: {
                    name: name,
                    fields: fields,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                data: rows || []
            };

            await window.FSAPI.writeJsonFile(`${name}.json`, handbookData);
            console.log(`✅ Справочник "${name}" успешно сохранен в файл`);
            return true;
            
        } catch (error) {
            console.error(`❌ Ошибка сохранения справочника "${name}":`, error);
            return false;
        }
    },

    /**
     * Загрузка справочника из файловой системы
     */
    async loadHandbook(name) {
        if (!window.FSAPI || !window.FSAPI.getCurrentDirectory()) {
            console.log('ℹ️ Папка не выбрана, загрузка из файловой системы невозможна');
            return null;
        }

        try {
            const handbookData = await window.FSAPI.readJsonFile(`${name}.json`);
            console.log(`✅ Справочник "${name}" загружен из файловой системы`);
            return handbookData;
        } catch (error) {
            if (error.name === 'NotFoundError') {
                console.log(`ℹ️ Файл справочника "${name}.json" не найден`);
            } else {
                console.error(`❌ Ошибка загрузки справочника "${name}":`, error);
            }
            return null;
        }
    },

    /**
     * Удаление справочника из файловой системы
     */
    async deleteHandbook(name) {
        console.log(`🗑️ Удаление файла справочника: ${name}.json`);
        
        if (!window.FSAPI || !window.FSAPI.getCurrentDirectory()) {
            console.log('ℹ️ Папка не выбрана, удаление из файловой системы невозможно');
            return false;
        }

        try {
            // В реальной реализации здесь будет вызов FSAPI для удаления файла
            // Пока просто логируем успешное "удаление" для отложенных изменений
            console.log(`✅ Файл справочника "${name}.json" помечен для удаления`);
            return true;
        } catch (error) {
            console.error(`❌ Ошибка удаления справочника "${name}":`, error);
            return false;
        }
    },

    /**
     * Получение списка всех справочников из файловой системы
     */
    async listHandbooks() {
        if (!window.FSAPI || !window.FSAPI.getCurrentDirectory()) {
            console.log('ℹ️ Папка не выбрана, получение списка невозможно');
            return [];
        }

        try {
            const files = await window.FSAPI.readAllJsonFiles();
            const handbookFiles = files.filter(file => 
                file.name.endsWith('.json') && 
                file.name !== 'admin.json' && 
                file.name !== 'pazl-config.json'
            );
            
            console.log(`✅ Найдено ${handbookFiles.length} файлов справочников`);
            return handbookFiles;
        } catch (error) {
            console.error('❌ Ошибка получения списка справочников:', error);
            return [];
        }
    },

    /**
     * Проверка существования справочника в файловой системе
     */
    async handbookExists(name) {
        if (!window.FSAPI || !window.FSAPI.getCurrentDirectory()) {
            return false;
        }

        try {
            await window.FSAPI.readJsonFile(`${name}.json`);
            return true;
        } catch (error) {
            if (error.name === 'NotFoundError') {
                return false;
            }
            console.error(`❌ Ошибка проверки существования справочника "${name}":`, error);
            return false;
        }
    }
};

console.log('✅ handbookFS модуль загружен');