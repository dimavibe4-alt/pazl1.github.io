// js/admin.js
class AdminModule {
    constructor() {
        this.adminLoginForm = document.getElementById('adminLoginForm');
        this.adminMenuItems = document.querySelectorAll('.admin-menu-item');
        this.adminTabContents = document.querySelectorAll('.admin-tab-content');
        this.saveAllChangesBtn = document.getElementById('saveAllChangesBtn');
        this.configManager = new ConfigManager();
        this.systemSettings = null;
        this.userManager = null;
        this.userChangesCount = 0;
        this.folderChangesCount = 0;
        this.pendingChanges = false;
        this.fileInput = null; // Для импорта файлов
        this.init();
    }

    init() {
        if (this.adminLoginForm) {
            this.adminLoginForm.addEventListener('submit', (e) => this.handleAdminLogin(e));
        }
        
        this.bindAdminMenuEvents();
        this.updateSaveButtonState();
        this.createFileInput(); // Создаем скрытый input для файлов

        if (this.saveAllChangesBtn) {
            this.saveAllChangesBtn.addEventListener('click', () => this.saveAllChanges());
        }

        console.log('🔐 Модуль админки инициализирован');
    }

    // Создаем скрытый input для выбора файлов
    createFileInput() {
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = '.json';
        this.fileInput.style.display = 'none';
        this.fileInput.addEventListener('change', (e) => this.handleFileImport(e));
        document.body.appendChild(this.fileInput);
    }

    setUserManager(userManager) {
        this.userManager = userManager;
        console.log('✅ UserManager установлен в AdminModule');
    }

    setSystemSettings(systemSettings) {
        this.systemSettings = systemSettings;
        console.log('✅ SystemSettings module установлен в AdminModule');
    }

    getTotalChangesCount() {
        let count = 0;
        
        if (this.userManager && this.userManager.hasPendingChanges()) {
            count++;
        }
        
        if (this.systemSettings && this.systemSettings.pendingFolderChange) {
            count++;
        }
        
        if (window.PendingChanges && window.PendingChanges.hasPendingChanges()) {
            count += window.PendingChanges.getChangesCount();
        }
        
        return count;
    }

    updateSaveButtonState() {
        if (!this.saveAllChangesBtn) return;
        
        const totalChanges = this.getTotalChangesCount();
        this.pendingChanges = totalChanges > 0;
        
        this.saveAllChangesBtn.classList.remove('btn-save--active', 'btn-save--inactive', 'btn-save--pulse');
        
        if (totalChanges > 0) {
            this.saveAllChangesBtn.classList.add('btn-save--active', 'btn-save--pulse');
            this.saveAllChangesBtn.disabled = false;
            
            const icon = '<i class="fas fa-save"></i>';
            this.saveAllChangesBtn.innerHTML = `${icon} Сохранить изменения (${totalChanges})`;
            
        } else {
            this.saveAllChangesBtn.classList.add('btn-save--inactive');
            this.saveAllChangesBtn.disabled = true;
            
            const icon = '<i class="fas fa-save"></i>';
            this.saveAllChangesBtn.innerHTML = `${icon} Сохранить изменения`;
        }
    }

    incrementUserChanges() {
        this.userChangesCount++;
        this.updateSaveButtonState();
        console.log(`📊 Изменения пользователей: ${this.userChangesCount}`);
    }

    decrementUserChanges() {
        if (this.userChangesCount > 0) {
            this.userChangesCount--;
            this.updateSaveButtonState();
        }
    }

    resetUserChanges() {
        this.userChangesCount = 0;
        this.updateSaveButtonState();
        console.log('🔄 Счетчик изменений пользователей сброшен');
    }

    setFolderChangesCount(count) {
        this.folderChangesCount = count;
        this.updateSaveButtonState();
        console.log(`📊 Изменения папки: ${this.folderChangesCount}`);
    }

    bindAdminMenuEvents() {
        this.adminMenuItems.forEach(item => {
            item.addEventListener('click', () => {
                const tabName = item.getAttribute('data-tab');
                this.switchAdminTab(tabName);
            });
        });

        this.bindSecurityEvents();
    }

    bindSecurityEvents() {
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => this.showAddUserForm());
        }

        const exportUsersBtn = document.getElementById('exportUsersBtn');
        if (exportUsersBtn) {
            exportUsersBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.exportUsers();
            });
        }

        // Добавляем обработчик для импорта пользователей
        const importUsersBtn = document.getElementById('importUsersBtn');
        if (importUsersBtn) {
            importUsersBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.importUsers();
            });
        }

        const saveUserBtn = document.getElementById('saveUserBtn');
        if (saveUserBtn) {
            saveUserBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.addUserToPending();
            });
        }

        const cancelUserBtn = document.getElementById('cancelUserBtn');
        if (cancelUserBtn) {
            cancelUserBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideAddUserForm();
            });
        }
    }

    switchAdminTab(tabName) {
        this.adminTabContents.forEach(content => {
            content.style.display = 'none';
        });

        this.adminMenuItems.forEach(item => {
            item.classList.remove('active');
        });

        const activeTab = document.getElementById(tabName);
        if (activeTab) {
            activeTab.style.display = 'block';
        }

        const activeMenuItem = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeMenuItem) {
            activeMenuItem.classList.add('active');
        }

        if (tabName === 'security') {
            this.loadUsers();
        } else if (tabName === 'handbooks') {
            if (window.HandbookUI) {
                window.HandbookUI.init();
            }
        }
    }

    async handleAdminLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;

        console.log(`🔐 Попытка входа в админку: ${username}`);

        try {
            const authModule = window.pazlApp?.getModule('auth');
            if (authModule) {
                const result = await authModule.authenticate(username, password);
                
                if (result.success) {
                    console.log('✅ Успешный вход в админку');
                    await this.openAdminPanel();
                } else {
                    alert('❌ ' + (result.error || 'Неверный логин или пароль'));
                    document.getElementById('adminPassword').value = '';
                }
            } else {
                console.log('⚠️ AuthModule не доступен, используем прямую проверку');
                await this.fallbackAdminLogin(username, password);
            }
        } catch (error) {
            console.log('⚠️ Ошибка входа в админку, вход без проверки:', error);
            await this.openAdminPanel();
        }
    }

    async fallbackAdminLogin(username, password) {
        let adminData = await this.loadAdminFromFileSystem();
        
        if (adminData && adminData.users && adminData.users.length > 0) {
            if (this.userManager) {
                if (this.userManager.verifyCredentials(username, password)) {
                    await this.openAdminPanel();
                } else {
                    alert('❌ Неверный логин или пароль');
                    document.getElementById('adminPassword').value = '';
                }
            } else {
                const user = adminData.users.find(u => u.username === username && u.password === password);
                if (user) {
                    await this.openAdminPanel();
                } else {
                    alert('❌ Неверный логин или пароль');
                    document.getElementById('adminPassword').value = '';
                }
            }
        } else {
            console.log('⚠️ Пользователи не найдены, первый вход в админку');
            await this.openAdminPanel();
        }
    }

    async loadAdminFromFileSystem() {
        try {
            if (!window.FSAPI || !window.FSAPI.getCurrentDirectory()) {
                console.warn('FSAPI not available or no directory selected');
                return null;
            }

            return await window.FSAPI.readJsonFile('admin.json');
            
        } catch (error) {
            if (error.name === 'NotFoundError') {
                console.log('ℹ️ admin.json не найден, будет создан новый файл');
                return null;
            }
            console.warn('Failed to load admin.json from file system:', error);
            return null;
        }
    }

    async openAdminPanel() {
        const adminLoginModal = document.getElementById('adminLoginModal');
        const adminPanelModal = document.getElementById('adminPanelModal');
        
        if (adminLoginModal) {
            adminLoginModal.style.display = 'none';
        }
        if (adminPanelModal) {
            adminPanelModal.style.display = 'flex';
        }
        
        if (this.adminLoginForm) {
            this.adminLoginForm.reset();
        }
        
        this.pendingChanges = false;
        this.userChangesCount = 0;
        this.folderChangesCount = 0;
        this.updateSaveButtonState();
        
        await this.autoOpenFolderSelection();
        await this.loadAdminSettings();
    }

    async autoOpenFolderSelection() {
        this.switchAdminTab('system');
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (this.systemSettings) {
            console.log('🔄 Автоматический запуск выбора папки...');
            
            const autoSuccess = await this.systemSettings.tryAutoSelectFolder();
            
            if (!autoSuccess) {
                console.log('📁 Запуск ручного выбора папки...');
                await this.systemSettings.selectFolder();
            }
        } else {
            console.warn('❌ SystemSettings module not available for auto folder selection');
        }
    }

    async loadAdminSettings() {
        try {
            if (this.userManager) {
                await this.userManager.loadUsers();
            }
            
            const adminData = await this.loadAdminFromFileSystem();
            if (adminData && adminData.settings) {
                console.log('📋 Загрузка настроек админки:', adminData.settings);
            }
        } catch (error) {
            console.warn('Ошибка загрузки настроек админки:', error);
        }
    }

    async loadUsers() {
        try {
            if (this.userManager) {
                await this.userManager.loadUsers();
                this.displayUsers();
            } else {
                console.warn('UserManager not available for loading users');
            }
        } catch (error) {
            console.error('Ошибка загрузки пользователей:', error);
        }
    }

    displayUsers() {
        const usersList = document.getElementById('usersList');
        if (!usersList) return;

        const users = this.userManager ? this.userManager.getUsers() : [];

        if (users.length === 0) {
            usersList.innerHTML = '<div class="no-users">Пользователи не найдены</div>';
            return;
        }

        let html = '';
        users.forEach((user) => {
            html += `
                <div class="user-item">
                    <div class="user-info">
                        <strong>${user.username}</strong>
                        <span class="user-role">${user.role || 'user'}</span>
                        <span class="user-created">Создан: ${new Date(user.created).toLocaleDateString()}</span>
                    </div>
                    <div class="user-actions">
                        <button class="btn-small btn-danger" onclick="pazlApp.getModule('admin').markUserForDeletion('${user.username}')">Удалить</button>
                    </div>
                </div>
            `;
        });

        usersList.innerHTML = html;
    }

    showAddUserForm() {
        const addUserForm = document.getElementById('addUserForm');
        if (addUserForm) {
            addUserForm.style.display = 'block';
        }
    }

    hideAddUserForm() {
        const addUserForm = document.getElementById('addUserForm');
        if (addUserForm) {
            addUserForm.style.display = 'none';
            document.getElementById('newUsername').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('newUserRole').value = 'user';
        }
    }

    addUserToPending() {
        const username = document.getElementById('newUsername').value;
        const password = document.getElementById('newPassword').value;
        const role = document.getElementById('newUserRole').value;

        if (!username || !password) {
            alert('❌ Заполните все поля');
            return;
        }

        try {
            if (this.userManager) {
                this.userManager.addUser(username, password, role);
                this.updateSaveButtonState();
                this.hideAddUserForm();
                this.displayUsers();
                console.log('✅ Пользователь добавлен в локальный список (ожидает сохранения)');
            } else {
                throw new Error('UserManager не доступен');
            }
        } catch (error) {
            alert('❌ ' + error.message);
        }
    }

    markUserForDeletion(username) {
        if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
            return;
        }

        if (this.userManager && this.userManager.deleteUser(username)) {
            this.updateSaveButtonState();
            this.displayUsers();
            console.log('✅ Пользователь помечен для удаления (ожидает сохранения)');
        }
    }

    async saveUsersToFile() {
        try {
            if (!this.userManager) {
                throw new Error('UserManager не доступен');
            }

            await this.userManager.saveUsers();
            console.log('✅ Пользователи сохранены через UserManager');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка сохранения пользователей:', error);
            throw error;
        }
    }

    // Экспорт пользователей
    async exportUsers() {
        try {
            if (!this.userManager) {
                throw new Error('UserManager не доступен');
            }

            await this.userManager.exportUsers();
            console.log('✅ Экспорт пользователей завершен');
            
        } catch (error) {
            console.error('❌ Ошибка экспорта пользователей:', error);
            alert('❌ Ошибка при экспорте пользователей: ' + error.message);
        }
    }

    // Импорт пользователей из файла
    importUsers() {
        if (!this.userManager) {
            alert('❌ UserManager не доступен');
            return;
        }

        // Запускаем выбор файла через скрытый input
        this.fileInput.click();
    }

    // Обработчик выбора файла для импорта
    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Сбрасываем значение input для возможности повторного выбора того же файла
        event.target.value = '';

        // Проверяем расширение файла
        if (!file.name.toLowerCase().endsWith('.json')) {
            alert('❌ Пожалуйста, выберите JSON файл');
            return;
        }

        try {
            // Показываем индикатор загрузки
            const importBtn = document.getElementById('importUsersBtn');
            const originalText = importBtn.innerHTML;
            importBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Импорт...';
            importBtn.disabled = true;

            const result = await this.userManager.importUsersFromFile(file);
            
            // Восстанавливаем кнопку
            importBtn.innerHTML = originalText;
            importBtn.disabled = false;

            // Обновляем интерфейс
            this.updateSaveButtonState();
            this.displayUsers();

            // Показываем результат
            let message = `✅ Импорт завершен!\nИмпортировано: ${result.imported} пользователей`;
            if (result.skipped > 0) {
                message += `\nПропущено: ${result.skipped} пользователей (дубликаты или невалидные данные)`;
            }
            alert(message);

        } catch (error) {
            console.error('❌ Ошибка импорта пользователей:', error);
            
            // Восстанавливаем кнопку
            const importBtn = document.getElementById('importUsersBtn');
            const originalText = importBtn.innerHTML;
            importBtn.innerHTML = originalText;
            importBtn.disabled = false;

            alert('❌ Ошибка при импорте пользователей: ' + error.message);
        }
    }

    async saveAllChanges() {
        try {
            const totalChanges = this.getTotalChangesCount();
            if (totalChanges === 0) {
                alert('ℹ️ Нет изменений для сохранения');
                return;
            }

            const saveBtn = document.getElementById('saveAllChangesBtn');
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
            saveBtn.disabled = true;

            let successCount = 0;
            const operations = [];

            // Сохранение настроек папки
            if (this.systemSettings && this.systemSettings.pendingFolderChange) {
                operations.push(async () => {
                    await this.systemSettings.saveFolderSettings();
                    console.log('✅ Настройки папки сохранены');
                });
            }

            // Сохранение пользователей
            if (this.userManager && this.userManager.hasPendingChanges()) {
                operations.push(async () => {
                    await this.userManager.saveUsers();
                    console.log('✅ Пользователи сохранены');
                });
            }

            // Сохранение справочников
            if (window.PendingChanges && window.PendingChanges.hasPendingChanges()) {
                operations.push(async () => {
                    const success = await window.PendingChanges.saveAllChanges();
                    if (success) {
                        console.log('✅ Справочники сохранены');
                    } else {
                        throw new Error('Не все справочники удалось сохранить');
                    }
                });
            }

            for (const operation of operations) {
                try {
                    await operation();
                    successCount++;
                } catch (error) {
                    console.error('❌ Ошибка операции:', error);
                    // Продолжаем выполнение других операций
                }
            }

            this.updateSaveButtonState();

            if (successCount === operations.length) {
                alert('✅ Все изменения успешно сохранены');
            } else if (successCount > 0) {
                alert(`⚠️ Сохранено ${successCount} из ${operations.length} изменений`);
            } else {
                alert('❌ Не удалось сохранить изменения');
            }

        } catch (error) {
            console.error('Ошибка при сохранении всех изменений:', error);
            alert('❌ Ошибка при сохранении изменений: ' + error.message);
        } finally {
            this.updateSaveButtonState();
        }
    }
}