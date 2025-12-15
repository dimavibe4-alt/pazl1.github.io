// Контейнер для отображения данных самосвала
class TruckContainer {
    constructor(truckData) {
        this.data = truckData;
        this.element = null;
        this.tiresContainer = null;
        this.isExpanded = false;
        this.tireContainers = [];
        this.selectedTire = null;
        
        this.onClick = this.onClick.bind(this);
        this.onTireSelect = this.onTireSelect.bind(this);
    }

    render() {
        const truckElement = document.createElement('div');
        truckElement.className = 'truck-item';
        truckElement.setAttribute('data-truck-id', this.data.id);

        const statusClass = this.data.status === '!!!' ? '' : 'normal';
        
        truckElement.innerHTML = `
            <div class="truck-header">
                <div class="truck-number">${this.data.number}</div>
                <div class="truck-model">${this.data.model}</div>
                <div class="truck-wheelbase">${this.data.wheelbase}</div>
                <div class="truck-tires">${this.data.tires.actual}/${this.data.tires.planned}</div>
                <div class="truck-status ${statusClass}">${this.data.status}</div>
            </div>
            <div class="tires-container"></div>
        `;

        this.element = truckElement;
        this.tiresContainer = truckElement.querySelector('.tires-container');
        
        this.attachEvents();
        return truckElement;
    }

    attachEvents() {
        if (this.element) {
            this.element.addEventListener('click', this.onClick);
        }
        
        window.trucksEventSystem.on('tireSelect', this.onTireSelect);
    }

    onClick(event) {
        // Предотвращаем срабатывание на контейнере шин
        if (event.target.closest('.tires-container')) {
            return;
        }

        if (this.isExpanded) {
            this.collapse();
        } else {
            this.expand();
        }
    }

    onTireSelect(selectedTire) {
        // Снимаем выделение с предыдущей выбранной шины
        if (this.selectedTire && this.selectedTire !== selectedTire) {
            this.selectedTire.setSelected(false);
        }
        
        // Устанавливаем новую выбранную шину
        this.selectedTire = selectedTire;
        this.selectedTire.setSelected(true);
        
        window.trucksEventSystem.emit('tireSelected', {
            tire: selectedTire.data,
            truck: this.data
        });
    }

    expand() {
        if (!this.tiresContainer) return;

        window.trucksEventSystem.emit('truckExpand', this.data);

        this.isExpanded = true;
        this.element.classList.add('active');
        
        this.renderTires();
        this.tiresContainer.classList.add('active');
    }

    collapse() {
        if (!this.tiresContainer) return;

        window.trucksEventSystem.emit('truckCollapse', this.data);

        this.isExpanded = false;
        this.element.classList.remove('active');
        this.tiresContainer.classList.remove('active');
        
        // Сбрасываем выбранную шину
        if (this.selectedTire) {
            this.selectedTire.setSelected(false);
            this.selectedTire = null;
        }
        
        this.clearTires();
    }

    renderTires() {
        if (!this.tiresContainer || !this.data.tiresData) return;

        const tiresList = document.createElement('div');
        tiresList.className = 'tires-list';

        // Рендерим 6 контейнеров шин (даже если данных меньше)
        for (let i = 0; i < 6; i++) {
            const tireData = this.data.tiresData[i] || this.getEmptyTireData(i);
            const tireContainer = new TireContainer(tireData);
            const tireElement = tireContainer.render();
            tiresList.appendChild(tireElement);
            this.tireContainers.push(tireContainer);
        }

        this.tiresContainer.appendChild(tiresList);
    }

    getEmptyTireData(index) {
        const positions = ['ПЛ', 'ПП', '2ЛН', '2ЛВ', '3ЛН', '3ЛВ'];
        return {
            position: positions[index] || `П${index + 1}`,
            brand: '—',
            model: '—',
            size: '—',
            number: '—',
            inspectionDate: '—',
            actualTread: '—',
            oppPlan: '—',
            oppActual: '—',
            wearPercent: '—',
            damageClass: '—',
            isEmpty: true
        };
    }

    clearTires() {
        if (this.tiresContainer) {
            this.tiresContainer.innerHTML = '';
        }
        this.tireContainers.forEach(container => {
            container.destroy();
        });
        this.tireContainers = [];
    }

    destroy() {
        if (this.element) {
            this.element.removeEventListener('click', this.onClick);
            window.trucksEventSystem.off('tireSelect', this.onTireSelect);
            this.clearTires();
            this.element.remove();
            this.element = null;
            this.tiresContainer = null;
        }
    }
}