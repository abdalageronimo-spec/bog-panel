document.addEventListener('DOMContentLoaded', () => {
    // Carousel functionality
    const images = document.querySelectorAll('.carousel-img');
    const dots = document.querySelectorAll('.carousel-dots .dot');
    let currentIndex = 0;

    // Show first image initially
    images[0].style.display = 'block';
    
    function showImage(index) {
        images.forEach(img => img.style.display = 'none');
        dots.forEach(dot => dot.classList.remove('active'));
        
        images[index].style.display = 'block';
        dots[index].classList.add('active');
    }

    // Auto-advance carousel
    setInterval(() => {
        currentIndex = (currentIndex + 1) % images.length;
        showImage(currentIndex);
    }, 3000);

    // Click handlers for dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentIndex = index;
            showImage(currentIndex);
        });
    });

    // Salida segura button handler
    const salidaSeguraBtn = document.querySelector('.icon-btn:last-child');
    salidaSeguraBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
});