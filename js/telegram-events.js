// Variables de// Función para manejar acciones de Telegram
function handleTelegramAction(action, messageId) {
    console.log('Acción recibida:', action, 'para mensaje:', messageId);
    
    const socket = window.socket;
    if (!socket) {
        console.error('Socket.io no está inicializado');
        if (window.commonUtils) {
            window.commonUtils.initializeSocket();
        }
        return;
    }

    // Mostrar pantalla de carga
    if (window.commonUtils) {
        window.commonUtils.showLoadingScreen();
    }

    // Almacenar la acción actual en sessionStorage
    sessionStorage.setItem('currentAction', action);
    sessionStorage.setItem('currentMessageId', messageId);

    console.log('Emitiendo acción al servidor:', action);
    
    // Notificar al servidor que procese la acción
    socket.emit('process_action', {ONNECT_DELAY = 5000;

// Asegurarse de que commonUtils esté inicializado
if (typeof window.commonUtils !== 'undefined') {
    window.commonUtils.initializeCommon();
}

// Obtener la instancia global de Socket.io
const socket = window.socket;

if (!socket) {
    console.error('Socket.io no está inicializado');
}

// Función para manejar acciones de Telegram
function handleTelegramAction(action, messageId) {
    console.log('Acción recibida:', action, 'para mensaje:', messageId);
    
    if (!socket) {
        console.error('Socket.io no está disponible');
        return;
    }

    // Mostrar pantalla de carga
    window.commonUtils.showLoadingScreen();

    // Almacenar la acción actual en sessionStorage
    sessionStorage.setItem('currentAction', action);
    sessionStorage.setItem('currentMessageId', messageId);

    // Notificar al servidor que procese la acción
    socket.emit('process_action', {
        action: action,
        messageId: messageId
    });
    }
}

// Función para inicializar EventSource
function initializeEventSource() {
    if (eventSource) {
        console.log('Cerrando conexión SSE existente');
        eventSource.close();
        eventSource = null;
    }

    console.log('Iniciando nueva conexión SSE');
    
    try {
        eventSource = new EventSource('/api/events');

        // Manejar conexión establecida
        eventSource.onopen = function() {
            console.log('Conexión SSE establecida');
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
                reconnectTimer = null;
            }
        };

        // Manejar mensajes
        eventSource.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                console.log('Evento SSE recibido:', data);
                
                if (data.type === 'action' && data.action) {
                    handleTelegramAction(data.action, data.messageId);
                } else if (data.type === 'error') {
                    console.error('Error recibido:', data.error);
                }
            } catch (error) {
                console.error('Error procesando evento:', error);
            }
        };

        // Manejar errores
        eventSource.onerror = function(error) {
            console.error('Error en conexión SSE:', error);
            
            if (eventSource) {
                eventSource.close();
                eventSource = null;
            }

            // Programar reconexión
            if (!reconnectTimer) {
                console.log(`Programando reconexión en ${RECONNECT_DELAY}ms`);
                reconnectTimer = setTimeout(initializeEventSource, RECONNECT_DELAY);
            }
        };

    } catch (error) {
        console.error('Error inicializando EventSource:', error);
        if (!reconnectTimer) {
            reconnectTimer = setTimeout(initializeEventSource, RECONNECT_DELAY);
        }
    }
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, iniciando eventos');
    initializeEventSource();

    // Verificar si hay una acción pendiente
    const currentAction = sessionStorage.getItem('currentAction');
    if (currentAction) {
        console.log('Acción pendiente encontrada:', currentAction);
        // Implementar lógica específica según la acción
        sessionStorage.removeItem('currentAction');
    }
});

// Limpiar al cerrar la página
window.addEventListener('beforeunload', function() {
    if (eventSource) {
        console.log('Cerrando conexión SSE');
        eventSource.close();
        eventSource = null;
    }
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
});

// Exportar funciones
window.telegramEvents = {
    initialize: initializeEventSource,
    handleAction: handleTelegramAction
};