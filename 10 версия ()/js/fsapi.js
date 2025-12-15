// js/FSAPI.js
class FSAPI {
    constructor() {
        this.directoryHandle = null;
        this.supported = 'showDirectoryPicker' in window;
        this.init();
    }

    init() {
        console.log('📁 FSAPI инициализирован');
        if (!this.supported) {
            console.warn('❌ File System API не поддерживается в этом браузере');
        }
    }

    // Проверка поддержки API
    isSupported() {
        return this.supported;
    }

    // Выбор папки
    async selectDirectory() {
        if (!this.supported) {
            throw new Error('File System API не поддерживается в этом браузере');
        }

        try {
            this.directoryHandle = await window.showDirectoryPicker();
            console.log('✅ Папка выбрана:', this.directoryHandle.name);
            return this.directoryHandle;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('❌ Ошибка выбора папки:', error);
                throw error;
            }
            return null;
        }
    }

    // Получение текущей директории
    getCurrentDirectory() {
        return this.directoryHandle;
    }

    // Проверка существования файла
    async fileExists(fileName) {
        if (!this.directoryHandle) {
            throw new Error('Папка не выбрана');
        }

        try {
            await this.directoryHandle.getFileHandle(fileName);
            return true;
        } catch (error) {
            if (error.name === 'NotFoundError') {
                return false;
            }
            throw error;
        }
    }

    // Чтение файла
    async readFile(fileName) {
        // HTTP fallback when folder not selected: try to fetch from /json/ relative path
        if (!this.directoryHandle) {
            // Try multiple HTTP/relative paths to be robust against server layout
            const candidates = [
                'json/' + fileName,
                '/json/' + fileName,
                './json/' + fileName,
                '../json/' + fileName,
                encodeURI('json/' + fileName),
                encodeURI('/json/' + fileName)
            ];
            for (const url of candidates) {
                try {
                    console.warn('FSAPI: directory not selected — attempting HTTP fallback for', url);
                    const resp = await fetch(url);
                    if (resp && resp.ok) {
                        const text = await resp.text();
                        console.log('FSAPI: HTTP fallback success:', url);
                        return text;
                    } else {
                        console.warn('FSAPI HTTP fallback: not found', url, resp && resp.status);
                    }
                } catch (e) {
                    console.warn('FSAPI HTTP fallback error for', url, e);
                }
            }
            console.warn('FSAPI HTTP fallback: все попытки не увенчались успехом, папка не выбрана');
            throw new Error('Папка не выбрана');
        }

        try {
            const fileHandle = await this.directoryHandle.getFileHandle(fileName);
            const file = await fileHandle.getFile();
            const content = await file.text();
            return content;
        } catch (error) {
            console.error(`❌ Ошибка чтения файла ${fileName}:`, error);
            throw error;
        }
    }

    // Чтение JSON файла
    async readJsonFile(fileName) {
        try {
            const content = await this.readFile(fileName);
            return JSON.parse(content);
        } catch (error) {
            console.error(`❌ Ошибка парсинга JSON из файла ${fileName}:`, error);
            throw error;
        }
    }

    // Запись файла
    async writeFile(fileName, content) {
        if (!this.directoryHandle) {
            throw new Error('Папка не выбрана');
        }

        try {
            const fileHandle = await this.directoryHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
            console.log(`✅ Файл ${fileName} записан`);
            return true;
        } catch (error) {
            console.error(`❌ Ошибка записи файла ${fileName}:`, error);
            throw error;
        }
    }

    // Запись JSON файла
    async writeJsonFile(fileName, data) {
        try {
            const content = JSON.stringify(data, null, 2);
            return await this.writeFile(fileName, content);
        } catch (error) {
            console.error(`❌ Ошибка записи JSON в файл ${fileName}:`, error);
            throw error;
        }
    }

    // Чтение всех JSON файлов в директории
    async readAllJsonFiles() {
        if (!this.directoryHandle) {
            throw new Error('Папка не выбрана');
        }

        try {
            const files = [];
            
            for await (const entry of this.directoryHandle.values()) {
                if (entry.kind === 'file' && entry.name.endsWith('.json')) {
                    try {
                        const file = await entry.getFile();
                        const content = await file.text();
                        const jsonData = JSON.parse(content);
                        
                        files.push({
                            name: entry.name,
                            data: jsonData,
                            size: file.size,
                            lastModified: file.lastModified
                        });
                        
                        console.log(`✅ Загружен файл: ${entry.name}`);
                    } catch (error) {
                        console.warn(`⚠️ Не удалось прочитать файл ${entry.name}:`, error);
                    }
                }
            }
            
            console.log(`📂 Загружено ${files.length} JSON файлов`);
            return files;
            
        } catch (error) {
            console.error('❌ Ошибка чтения файлов из директории:', error);
            throw error;
        }
    }

    // Создание нескольких тестовых файлов
    async createTestFiles() {
        const files = [
            { name: '1.json', content: { 
                id: 1, 
                name: 'Файл 1', 
                description: 'Первый тестовый файл',
                created: new Date().toISOString()
            }},
            { name: '2.json', content: { 
                id: 2, 
                name: 'Файл 2', 
                description: 'Второй тестовый файл',
                created: new Date().toISOString()
            }},
            { name: '3.json', content: { 
                id: 3, 
                name: 'Файл 3', 
                description: 'Третий тестовый файл',
                created: new Date().toISOString()
            }}
        ];

        for (const file of files) {
            await this.writeJsonFile(file.name, file.content);
        }

        console.log('✅ Тестовые файлы созданы');
    }

    // Получение информации о директории
    getDirectoryInfo() {
        if (!this.directoryHandle) {
            return null;
        }

        return {
            name: this.directoryHandle.name,
            kind: this.directoryHandle.kind
        };
    }
}

// Инициализация глобального объекта
window.FSAPI = new FSAPI();