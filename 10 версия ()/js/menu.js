/* === Инициализация меню === */
function initMenu(){
    const btn = document.getElementById('menuButton');
    const dd = document.getElementById('menuDropdown');
    
    if (btn && dd) {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            dd.classList.toggle('show');
        });
        
        document.addEventListener('click', e => {
            if (!btn.contains(e.target) && !dd.contains(e.target)) {
                dd.classList.remove('show');
            }
        });
        
        // Добавляем обработчики для пунктов меню
        const menuItems = dd.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Убираем активный класс у всех пунктов
                menuItems.forEach(i => i.classList.remove('active'));
                
                // Добавляем активный класс текущему пункту
                this.classList.add('active');
                
                // Закрываем меню
                dd.classList.remove('show');
                
                // Выполняем навигацию
                const pageUrl = this.getAttribute('data-page') || this.getAttribute('onclick');
                if (pageUrl) {
                    if (pageUrl.includes('window.location.href')) {
                        // Извлекаем URL из onclick
                        const urlMatch = pageUrl.match(/window\.location\.href='([^']+)'/);
                        if (urlMatch && urlMatch[1]) {
                            window.location.href = urlMatch[1];
                        }
                    } else if (pageUrl.startsWith('http')) {
                        window.location.href = pageUrl;
                    }
                }
            });
        });
    }
}

/* === Инициализация при загрузке === */
document.addEventListener('DOMContentLoaded', function() {
    initMenu();
    
    // Отмечаем текущую страницу как активную
    const currentPage = window.location.pathname.split('/').pop() || 'monitoring.html';
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        const pageUrl = item.getAttribute('data-page') || item.getAttribute('onclick');
        if (pageUrl && pageUrl.includes(currentPage)) {
            item.classList.add('active');
        }
    });
});