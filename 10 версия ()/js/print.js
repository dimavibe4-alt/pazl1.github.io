// js/print.js
class PrintModule {
    constructor() {
        this.init();
    }

    init() {
        const printBtn = document.getElementById('printBtn');
        
        if (printBtn) {
            printBtn.addEventListener('click', () => this.handlePrint());
        }

        this.addPrintStyles();
        console.log('🖨️ Модуль печати инициализирован');
    }

    handlePrint() {
        console.log('🖨️ Запуск печати');
        window.print();
    }

    addPrintStyles() {
        const printStyles = `
            @media print {
                .header, .menu-button, .controls button:not(#printBtn) {
                    display: none !important;
                }
                body {
                    padding: 20px;
                    font-size: 12px;
                }
                .block {
                    break-inside: avoid;
                    margin-bottom: 20px;
                }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = printStyles;
        document.head.appendChild(styleSheet);
    }
}