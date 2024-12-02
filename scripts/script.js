const card = document.querySelector('.card');

card.addEventListener('mousemove', (event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const deltaX = (x - centerX) / centerX;
    const deltaY = (y - centerY) / centerY;

    const rotationX = deltaY * 30;
    const rotationY = deltaX * -30;

    card.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg) translateZ(-5px)`;
    card.style.boxShadow = `${-deltaX * 20}px ${-deltaY * 20}px 40px rgba(0, 0, 0, 0.4)`;
});

card.addEventListener('mouseleave', () => {
    card.style.transform = 'rotateX(0) rotateY(0)';
    card.style.boxShadow = '0 20px 30px rgba(0, 0, 0, 0.2)';
});