// js/auth.js
class AuthModule {
    constructor() {
        this.configManager = new ConfigManager();
        this.systemSettings = null;
        this.currentUser = null;
        this.sessionTimeout = 30 * 60 * 1000;
        this.sessionTimer = null;
        this.userManager = null;
        this.init();
    }

    init() {
        console.log('🔐 Модуль аутентификации инициализирован');
    }

    setSystemSettings(systemSettings) {
        this.systemSettings = systemSettings;
        console.log('✅ SystemSettings module установлен в AuthModule');
    }

    setUserManager(userManager) {
        this.userManager = userManager;
        console.log('✅ UserManager установлен в AuthModule');
    }

    async authenticate(username, password) {
        console.log(`🔐 Попытка аутентификации: ${username}`);

        try {
            if (this.userManager) {
                const users = this.userManager.getUsers();
                
                if (users && users.length > 0) {
                    if (this.userManager.verifyCredentials(username, password)) {
                        const user = this.userManager.getUsers().find(u => u.username === username);
                        this.currentUser = user;
                        console.log('✅ Успешная аутентификация через UserManager');
                        this.startSessionTimer();
                        return { success: true, user: user, isFirstLogin: false };
                    } else {
                        console.log('❌ Неверный логин или пароль');
                        return { success: false, error: 'Неверный логин или пароль', isFirstLogin: false };
                    }
                } else {
                    console.log('⚠️ Пользователи не найдены, первый вход в систему через UserManager');
                    this.currentUser = {
                        username: username,
                        role: 'admin',
                        isFirstLogin: true
                    };
                    this.startSessionTimer();
                    return { success: true, user: this.currentUser, isFirstLogin: true };
                }
            } else {
                console.log('⚠️ UserManager не доступен, используем fallback аутентификацию');
                return await this.fallbackAuthenticate(username, password);
            }
            
        } catch (error) {
            console.log('⚠️ Ошибка аутентификации, вход без проверки:', error);
            this.currentUser = {
                username: username,
                role: 'admin',
                isFirstLogin: true
            };
            this.startSessionTimer();
            return { success: true, user: this.currentUser, isFirstLogin: true };
        }
    }

    async fallbackAuthenticate(username, password) {
        try {
            const adminData = await this.loadAdminFromFileSystem();
            
            if (adminData && adminData.users && adminData.users.length > 0) {
                const user = adminData.users.find(u => u.username === username && u.password === password);
                if (user) {
                    this.currentUser = user;
                    console.log('✅ Успешная аутентификация (fallback)');
                    this.startSessionTimer();
                    return { success: true, user: user, isFirstLogin: false };
                } else {
                    console.log('❌ Неверный логин или пароль (fallback)');
                    return { success: false, error: 'Неверный логин или пароль', isFirstLogin: false };
                }
            } else {
                console.log('⚠️ Пользователи не найдены, первый вход в систему (fallback)');
                this.currentUser = {
                    username: username,
                    role: 'admin',
                    isFirstLogin: true
                };
                this.startSessionTimer();
                return { success: true, user: this.currentUser, isFirstLogin: true };
            }
        } catch (error) {
            console.log('⚠️ Ошибка fallback аутентификации, вход без проверки:', error);
            this.currentUser = {
                username: username,
                role: 'admin',
                isFirstLogin: true
            };
            this.startSessionTimer();
            return { success: true, user: this.currentUser, isFirstLogin: true };
        }
    }

    // Остальные методы без изменений...
    async loadAdminFromFileSystem() {
        try {
            if (!this.systemSettings) {
                console.warn('SystemSettings module not available');
                return null;
            }

            const directoryHandle = this.systemSettings.getCurrentDirectory();
            if (!directoryHandle) {
                console.warn('No directory selected');
                return null;
            }

            const adminFile = await directoryHandle.getFileHandle('admin.json', { create: false });
            const file = await adminFile.getFile();
            
            if (file.size === 0) {
                console.log('admin.json существует, но пустой');
                return null;
            }
            
            const content = await file.text();
            return JSON.parse(content);
            
        } catch (error) {
            if (error.name === 'NotFoundError') {
                console.log('admin.json не найден - первый запуск системы');
            } else {
                console.warn('Ошибка загрузки admin.json:', error);
            }
            return null;
        }
    }

    hasPermission(permission) {
        if (!this.currentUser) return false;
        if (this.currentUser.role === 'admin') return true;
        
        const permissions = {
            'user': ['view', 'basic_operations'],
            'manager': ['view', 'basic_operations', 'manage_users', 'manage_data'],
            'admin': ['all']
        };

        const userPermissions = permissions[this.currentUser.role] || permissions['user'];
        return userPermissions.includes('all') || userPermissions.includes(permission);
    }

    checkTabAccess(tabName) {
        const tabPermissions = {
            'security': 'manage_users',
            'system': 'manage_system',
            'handbooks': 'manage_data',
            'logs': 'view_logs'
        };
        
        const requiredPermission = tabPermissions[tabName];
        return !requiredPermission || this.hasPermission(requiredPermission);
    }

    getCurrentUser() {
        return this.currentUser;
    }

    logout() {
        this.currentUser = null;
        this.clearSessionTimer();
        console.log('🚪 Пользователь вышел из системы');
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    startSessionTimer() {
        this.clearSessionTimer();
        this.sessionTimer = setTimeout(() => {
            console.log('🕒 Сессия истекла по таймауту');
            this.logout();
            this.showSessionExpiredMessage();
        }, this.sessionTimeout);
    }

    clearSessionTimer() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }
    }

    resetSessionTimer() {
        this.startSessionTimer();
    }

    showSessionExpiredMessage() {
        const adminPanelModal = document.getElementById('adminPanelModal');
        if (adminPanelModal && adminPanelModal.style.display === 'flex') {
            alert('🕒 Ваша сессия истекла. Пожалуйста, войдите снова.');
            if (window.pazlApp && window.pazlApp.getModule('settings')) {
                window.pazlApp.getModule('settings').closeAdminPanel();
            }
        }
    }
}