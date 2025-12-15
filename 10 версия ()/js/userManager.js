// js/userManager.js
class UserManager {
    constructor() {
        this.users = [];
        this.pendingChanges = false;
        this.init();
    }

    init() {
        console.log('👥 UserManager инициализирован');
        this.loadUsers().catch(error => {
            console.log('ℹ️ Не удалось загрузить пользователей при инициализации:', error.message);
        });
    }

    // Хэширование пароля (совместимо с AuthModule)
    hashPassword(password) {
        if (!password) return '';
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    // Добавление пользователя
    addUser(username, password, role = 'user') {
        if (this.users.find(u => u.username === username)) {
            throw new Error('Пользователь с таким именем уже существует');
        }

        if (!username || !password) {
            throw new Error('Имя пользователя и пароль обязательны');
        }

        const user = {
            username: username,
            password: password,
            role: role,
            created: new Date().toISOString()
        };
        
        this.users.push(user);
        this.pendingChanges = true;
        console.log(`✅ Пользователь ${username} добавлен (ожидает сохранения)`);
        return user;
    }

    // Удаление пользователя
    deleteUser(username) {
        const initialLength = this.users.length;
        this.users = this.users.filter(user => user.username !== username);
        
        if (this.users.length !== initialLength) {
            this.pendingChanges = true;
            console.log(`✅ Пользователь ${username} удален (ожидает сохранения)`);
            return true;
        }
        return false;
    }

    // Получение списка пользователей
    getUsers() {
        return this.users.slice();
    }

    // Проверка существования пользователя
    userExists(username) {
        return this.users.some(user => user.username === username);
    }

    // Проверка логина и пароля
    verifyCredentials(username, password) {
        const user = this.users.find(u => u.username === username);
        if (!user) return false;
        
        return user.password === password;
    }

    // Загрузка пользователей из файла
    async loadUsers() {
        try {
            if (!window.FSAPI || !window.FSAPI.getCurrentDirectory()) {
                console.log('ℹ️ FSAPI не доступен для загрузки пользователей');
                return false;
            }

            const fileExists = await window.FSAPI.fileExists('admin.json');
            if (!fileExists) {
                console.log('ℹ️ Файл admin.json не существует');
                this.users = [];
                return false;
            }

            const adminData = await window.FSAPI.readJsonFile('admin.json');
            if (adminData && adminData.users && Array.isArray(adminData.users)) {
                this.users = adminData.users;
                this.pendingChanges = false;
                console.log(`✅ Загружено ${this.users.length} пользователей из admin.json`);
                return true;
            } else {
                console.log('ℹ️ Файл admin.json пустой или имеет неверный формат');
                this.users = [];
                return false;
            }
        } catch (error) {
            console.log('ℹ️ Файл пользователей не найден или недоступен:', error.message);
            this.users = [];
            return false;
        }
    }

    // Сохранение пользователей в файл
    async saveUsers() {
        try {
            if (!window.FSAPI || !window.FSAPI.getCurrentDirectory()) {
                throw new Error('Папка не выбрана. Сначала выберите папку в системных настройках.');
            }

            const adminData = {
                users: this.users,
                updated: new Date().toISOString(),
                version: '1.0',
                totalUsers: this.users.length
            };

            if (!adminData.created) {
                adminData.created = new Date().toISOString();
            }

            await window.FSAPI.writeJsonFile('admin.json', adminData);
            this.pendingChanges = false;
            console.log(`✅ Пользователи сохранены в admin.json (${this.users.length} пользователей)`);
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка сохранения пользователей:', error);
            throw error;
        }
    }

    // Экспорт пользователей в формате как в примере
    async exportUsers() {
        try {
            if (this.users.length === 0) {
                throw new Error('Нет пользователей для экспорта');
            }

            const exportData = {
                username: "",
                password: "", 
                created: new Date().toISOString(),
                users: this.users,
                updated: new Date().toISOString(),
                initialized: true,
                firstSetup: new Date().toISOString()
            };

            // Создаем blob для скачивания
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Стандартное диалоговое окно сохранения файла
            const a = document.createElement('a');
            a.href = url;
            a.download = `pazl-users-export-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('✅ Пользователи экспортированы в файл');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка экспорта пользователей:', error);
            throw error;
        }
    }

    // Импорт пользователей из JSON файла
    async importUsersFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    
                    // Проверяем структуру файла
                    if (!jsonData.users || !Array.isArray(jsonData.users)) {
                        throw new Error('Неверный формат файла. Ожидается объект с массивом "users"');
                    }

                    // Проверяем каждого пользователя
                    const validUsers = [];
                    jsonData.users.forEach((user, index) => {
                        if (!user.username || !user.password) {
                            console.warn(`⚠️ Пользователь №${index + 1} пропущен: отсутствует username или password`);
                            return;
                        }
                        
                        // Проверяем дубликаты
                        if (this.users.find(u => u.username === user.username)) {
                            console.warn(`⚠️ Пользователь "${user.username}" уже существует и будет пропущен`);
                            return;
                        }
                        
                        validUsers.push({
                            username: user.username,
                            password: user.password,
                            role: user.role || 'user',
                            created: user.created || new Date().toISOString()
                        });
                    });

                    if (validUsers.length === 0) {
                        throw new Error('Нет валидных пользователей для импорта');
                    }

                    // Добавляем пользователей
                    this.users.push(...validUsers);
                    this.pendingChanges = true;
                    
                    console.log(`✅ Импортировано ${validUsers.length} пользователей из файла ${file.name}`);
                    resolve({
                        total: jsonData.users.length,
                        imported: validUsers.length,
                        skipped: jsonData.users.length - validUsers.length
                    });
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Ошибка чтения файла'));
            reader.readAsText(file);
        });
    }

    // Имеются ли несохраненные изменения
    hasPendingChanges() {
        return this.pendingChanges;
    }

    // Сброс флага изменений
    resetChanges() {
        this.pendingChanges = false;
    }

    // Получение пользователя по имени
    getUser(username) {
        return this.users.find(user => user.username === username);
    }
}

window.UserManager = UserManager;