// Контейнер для отображения данных о шине
class TireContainer {
    constructor(tireData) {
        this.data = tireData;
        this.element = null;
        this.isSelected = false;
        
        this.onClick = this.onClick.bind(this);
    }

    render() {
        const tireElement = document.createElement('div');
        tireElement.className = 'tire-item';
        tireElement.setAttribute('data-tire-id', this.data.id || this.data.position);
        
        // УБРАН ЗАГОЛОВОК ТАБЛИЦЫ
        tireElement.innerHTML = `
            <table class="tire-data-table">
                <tbody>
                    <tr>
                        <td class="tire-position-cell">${this.data.position}</td>
                        <td>${this.data.brand}</td>
                        <td>${this.data.model}</td>
                        <td>${this.data.size}</td>
                        <td>${this.data.oppPlan}</td>
                    </tr>
                    <tr>
                        <td>${this.data.number || '—'}</td>
                        <td>—</td>
                        <td>—</td>
                        <td>${this.data.actualTread || '—'}</td>
                        <td>${this.data.oppActual || '—'}</td>
                    </tr>
                    <tr>
                        <td>${this.data.inspectionDate || '—'}</td>
                        <td>—</td>
                        <td>—</td>
                        <td>${this.data.wearPercent || '—'}</td>
                        <td>${this.data.damageClass}</td>
                    </tr>
                </tbody>
            </table>
        `;

        this.element = tireElement;
        this.attachEvents();
        return tireElement;
    }

    attachEvents() {
        if (this.element) {
            this.element.addEventListener('click', this.onClick);
        }
    }

    onClick(event) {
        event.stopPropagation();
        window.trucksEventSystem.emit('tireSelect', this);
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