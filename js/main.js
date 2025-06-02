/**
 * Script de inicialização
 * Este arquivo é carregado por último e garante que a aplicação seja inicializada corretamente
 */
document.addEventListener('DOMContentLoaded', () => {
    // Verificar suporte a localStorage
    if (!window.localStorage) {
        alert('Seu navegador não suporta armazenamento local. Esta aplicação pode não funcionar corretamente.');
    }

    // Inicializar tooltips do Bootstrap
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    
    console.log('Aplicação inicializada com sucesso!');
});

// Detectar mudanças de orientação em dispositivos móveis
window.addEventListener('orientationchange', () => {
    // Pequeno atraso para garantir que a orientação foi alterada completamente
    setTimeout(() => {
        app.setupResponsiveEvents();
    }, 100);
});