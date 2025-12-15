// Загрузка данных из JSON
async function loadTrucksData() {
    try {
        const data = await window.FSAPI.readJsonFile('Trucks.json');
        renderTrucks(data.trucks);
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        // Показываем демо-данные при ошибке
        showDemoData();
    }
}

function showDemoData() {
    const demoData = [{
        id: "demo-001",
        number: "001",
        model: "БелАЗ 7513D",
        wheelbase: "2*4",
        tiresCount: "6/6",
        status: "!!!",
        tires: [
            {
                position: "ПЛ",
                brand: "GOODYEAR",
                model: "XDR3",
                size: "33.00х51",
                depth: "100 мм",
                serial: "ДЕМО-001",
                mileage: "50 000 км",
                wear: "50%",
                date: "01.01.2025",
                category: "I"
            },
            {
                position: "ПП",
                brand: "",
                model: "",
                size: "",
                depth: "",
                serial: "",
                mileage: "",
                wear: "",
                date: "",
                category: ""
            },
            {
                position: "2ЛН",
                brand: "",
                model: "",
                size: "",
                depth: "",
                serial: "",
                mileage: "",
                wear: "",
                date: "",
                category: ""
            },
            {
                position: "2ЛВ",
                brand: "",
                model: "",
                size: "",
                depth: "",
                serial: "",
                mileage: "",
                wear: "",
                date: "",
                category: ""
            },
            {
                position: "3ЛН",
                brand: "",
                model: "",
                size: "",
                depth: "",
                serial: "",
                mileage: "",
                wear: "",
                date: "",
                category: ""
            },
            {
                position: "3ЛВ",
                brand: "",
                model: "",
                size: "",
                depth: "",
                serial: "",
                mileage: "",
                wear: "",
                date: "",
                category: ""
            }
        ]
    }];
    
    renderTrucks(demoData);
}

function renderTrucks(trucks) {
    const container = document.getElementById('trucksSystem');
    
    if (!trucks || trucks.length === 0) {
        container.innerHTML = '<div class="error">Нет данных о самосвалах</div>';
        return;
    }
    
    let html = '<div class="trucks-list-container">';
    
    trucks.forEach((truck, index) => {
        const isActive = index === 0 ? 'active' : '';
        const tiresActive = index === 0 ? 'active' : '';
        
        html += `
            <div class="truck-item ${isActive}" data-truck-id="${truck.id}">
                <div class="truck-header">
                    <div class="truck-number">${truck.number}</div>
                    <div class="truck-model">${truck.model}</div>
                    <div class="truck-wheelbase">${truck.wheelbase}</div>
                    <div class="truck-tires">${truck.tiresCount}</div>
                    <div class="truck-status">${truck.status}</div>
                </div>
                <div class="tires-container ${tiresActive}">
                    <div class="tires-list">
                        ${truck.tires.map(tire => `
                            <div class="tire-item" data-tire-id="${tire.position}">
                                <table class="tire-data-table">
                                    <tbody>
                                        <tr>
                                            <td class="tire-position-cell">${tire.position}</td>
                                            <td>${tire.brand || '—'}</td>
                                            <td>${tire.model || '—'}</td>
                                            <td>${tire.size || '—'}</td>
                                            <td>${tire.depth || '—'}</td>
                                        </tr>
                                        <tr>
                                            <td>${tire.serial || '—'}</td>
                                            <td>—</td>
                                            <td>—</td>
                                            <td>${tire.mileage || '—'}</td>
                                            <td>50 мм</td>
                                        </tr>
                                        <tr>
                                            <td>${tire.date || '—'}</td>
                                            <td>—</td>
                                            <td>—</td>
                                            <td>${tire.wear || '—'}</td>
                                            <td>${tire.category || '—'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Инициализируем события после рендеринга
    if (window.initializeTruckEvents) {
        window.initializeTruckEvents();
    }
}

// Загружаем данные при загрузке страницы
document.addEventListener('DOMContentLoaded', loadTrucksData);