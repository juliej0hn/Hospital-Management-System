window.addEventListener('scroll', function () {
    var navbar = document.querySelector('.navbar');
    if (navbar) {
        navbar.style.boxShadow = window.scrollY > 10
            ? '0 2px 20px rgba(0,0,0,0.08)'
            : 'none';
    }
});
