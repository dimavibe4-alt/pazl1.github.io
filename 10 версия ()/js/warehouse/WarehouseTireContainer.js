// WarehouseTireContainer.js - С УЛУЧШЕННЫМ ОТОБРАЖЕНИЕМ
class WarehouseTireContainer {
    constructor(tireData) {
        this.data = tireData || {};
        this.element = null;
        this.isSelected = false;
        
        console.log('🔧 Создан контейнер шины:', this.data);
        
        this.onClick = this.onClick.bind(this);
    }

    render() {
        const tireElement = document.createElement('div');
        tireElement.className = 'warehouse-tire-item';
        tireElement.setAttribute('data-tire-id', this.data.id || 'unknown');
        
        const tireInfo = this.getTireInfo();
        
        console.log('📊 Данные для отображения шины:', tireInfo);
        
        tireElement.innerHTML = `
            <table class="warehouse-tire-table">
                <tbody>
                    <tr>
                        <td rowspan="3" class="vertical-cell" title="Подсклад">${tireInfo.subwarehouse}</td>
                        <td rowspan="3" class="vertical-cell" title="Ряд">${tireInfo.row}</td>
                        <td rowspan="3" class="vertical-cell" title="Место">${tireInfo.place}</td>
                        <td rowspan="3" class="vertical-cell" title="Номер">${tireInfo.number}</td>
                        <td title="Бренд">${tireInfo.brand}</td>
                        <td title="Размер">${tireInfo.size}</td>
                        <td title="ОГП план">${tireInfo.oppPlan}</td>
                        <td title="Ремонт">${tireInfo.repair}</td>
                    </tr>
                    <tr>
                        <td title="Модель">${tireInfo.model}</td>
                        <td title="Пробег">${tireInfo.mileage}</td>
                        <td title="ОГП факт">${tireInfo.oppActual}</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td title="Рисунок">${tireInfo.pattern}</td>
                        <td title="Состояние">${tireInfo.condition}</td>
                        <td title="Износ">${tireInfo.wear}</td>
                        <td title="Повреждение">${tireInfo.damage}</td>
                    </tr>
                </tbody>
            </table>
        `;

        this.element = tireElement;
        this.attachEvents();
        return tireElement;
    }

    getTireInfo() {
        return {
            subwarehouse: this.getSafeValue(this.data.subwarehouse, 'А-1'),
            row: this.getSafeValue(this.data.row, '1'),
            place: this.getSafeValue(this.data.place, '1'),
            number: this.getSafeValue(this.data.number, this.data.serial, 'ТШ-001'),
            brand: this.getSafeValue(this.data.brand, 'Бренд'),
            size: this.getSafeValue(this.data.size, 'Размер'),
            oppPlan: this.getSafeValue(this.data.oppPlan, 'ОГП план'),
            repair: this.getSafeValue(this.data.repair, 'Нет'),
            model: this.getSafeValue(this.data.model, 'Модель'),
            mileage: this.getSafeValue(this.data.mileage, '0 км'),
            oppActual: this.getSafeValue(this.data.oppActual, 'ОГП факт'),
            pattern: this.getSafeValue(this.data.pattern, 'Рисунок'),
            condition: this.getSafeValue(this.data.condition, 'Состояние'),
            wear: this.getSafeValue(this.data.wear, '0%'),
            damage: this.getSafeValue(this.data.damage, 'I')
        };
    }

    getSafeValue(...values) {
        for (let value of values) {
            if (value !== undefined && value !== null && value !== '') {
                return value;
            }
        }
        return '—';
    }

    attachEvents() {
        if (this.element) {
            this.element.addEventListener('click', this.onClick);
        }
    }

    onClick(event) {
        event.stopPropagation();
        
        if (this.isSelected) {
            this.setSelected(false);
        } else {
            const allTires = document.querySelectorAll('.warehouse-tire-item');
            allTires.forEach(tire => {
                tire.classList.remove('selected');
            });
            
            this.setSelected(true);
        }
        
        if (window.warehouseEventSystem) {
            window.warehouseEventSystem.emit('warehouseTireSelect', this);
        }
        
        console.log('🔘 Выбрана шина:', this.data.id || 'unknown');
    }

    setSelected(selected) {
        this.isSelected = selected;
        if (this.element) {
            if (selected) {
                this.element.classList.add('selected');
            } else {
                this.element.classList.remove('selected');
            }
        }
    }

    destroy() {
        if (this.element) {
            this.element.removeEventListener('click', this.onClick);
            this.element.remove();
            this.element = null;
        }
    }
}

window.WarehouseTireContainer = WarehouseTireContainer;