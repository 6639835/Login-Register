// Main JS file for animations and interactive features

// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // Preloader
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        window.addEventListener('load', function() {
            preloader.classList.add('loaded');
            // Enable scrolling after preloader is gone
            setTimeout(() => {
                document.body.style.overflow = '';
            }, 500);
        });
        // Disable scrolling while preloader is active
        document.body.style.overflow = 'hidden';
    }
    
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
    
    // Reveal animations on scroll
    const revealElements = document.querySelectorAll('.reveal');
    if (revealElements.length > 0) {
        const revealOnScroll = function() {
            for (let i = 0; i < revealElements.length; i++) {
                const elementTop = revealElements[i].getBoundingClientRect().top;
                const elementVisible = 150;
                
                if (elementTop < window.innerHeight - elementVisible) {
                    revealElements[i].classList.add('active');
                }
            }
        };
        
        window.addEventListener('scroll', revealOnScroll);
        // Trigger once on load
        revealOnScroll();
    }
    
    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            darkModeToggle.checked = true;
        }
        
        darkModeToggle.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
            }
        });
    }
    
    // Form validation with visual feedback
    const forms = document.querySelectorAll('.needs-validation');
    if (forms.length > 0) {
        Array.from(forms).forEach(form => {
            form.addEventListener('submit', event => {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                
                form.classList.add('was-validated');
                
                // Add animation to invalid inputs
                const invalidInputs = form.querySelectorAll(':invalid');
                invalidInputs.forEach(input => {
                    input.classList.add('shake-animation');
                    setTimeout(() => {
                        input.classList.remove('shake-animation');
                    }, 600);
                });
            }, false);
            
            // Add visual feedback on input focus
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('focus', () => {
                    input.parentElement.classList.add('input-focused');
                });
                
                input.addEventListener('blur', () => {
                    input.parentElement.classList.remove('input-focused');
                    
                    // Show success icon for valid inputs
                    if (input.checkValidity() && input.value !== '') {
                        input.classList.add('is-valid');
                    } else {
                        input.classList.remove('is-valid');
                    }
                });
            });
        });
    }
    
    // Custom tooltips initialization
    const tooltipTriggers = document.querySelectorAll('[data-tooltip]');
    if (tooltipTriggers.length > 0) {
        tooltipTriggers.forEach(trigger => {
            trigger.classList.add('custom-tooltip');
        });
    }
    
    // Smooth scroll for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]:not([data-bs-toggle])');
    if (anchorLinks.length > 0) {
        anchorLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                if (this.getAttribute('href') === '#') return;
                
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    // Smooth scroll to target
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                    
                    // Update URL hash without scrolling
                    history.pushState(null, null, targetId);
                }
            });
        });
    }
    
    // Card hover effects
    const cards = document.querySelectorAll('.card.interactive');
    if (cards.length > 0) {
        cards.forEach(card => {
            card.addEventListener('mouseenter', function(e) {
                // 3D tilt effect based on mouse position
                card.addEventListener('mousemove', function(e) {
                    const cardRect = card.getBoundingClientRect();
                    const cardCenterX = cardRect.left + cardRect.width / 2;
                    const cardCenterY = cardRect.top + cardRect.height / 2;
                    const mouseX = e.clientX - cardCenterX;
                    const mouseY = e.clientY - cardCenterY;
                    
                    // Calculate rotation (max 10 degrees)
                    const rotateY = mouseX / (cardRect.width / 2) * 5;
                    const rotateX = -mouseY / (cardRect.height / 2) * 5;
                    
                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
                });
            });
            
            card.addEventListener('mouseleave', function() {
                // Reset transform on mouse leave
                card.style.transform = '';
                // Remove mousemove event listener
                card.removeEventListener('mousemove', () => {});
            });
        });
    }
    
    // Initialize countup animations
    const countElements = document.querySelectorAll('.count-up');
    if (countElements.length > 0) {
        const countUp = function(el) {
            const target = parseInt(el.getAttribute('data-target'));
            const duration = parseInt(el.getAttribute('data-duration')) || 2000;
            const step = target / (duration / 16); // 60fps (1000ms / 60fps = ~16ms per frame)
            
            let current = 0;
            const timer = setInterval(() => {
                current += step;
                el.textContent = Math.floor(current);
                
                if (current >= target) {
                    el.textContent = target;
                    clearInterval(timer);
                }
            }, 16);
        };
        
        // Count up when element is in viewport
        const handleIntersect = function(entries, observer) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    countUp(entry.target);
                    observer.unobserve(entry.target); // Only animate once
                }
            });
        };
        
        const observer = new IntersectionObserver(handleIntersect, {
            threshold: 0.5
        });
        
        countElements.forEach(el => {
            observer.observe(el);
        });
    }
    
    // Add parallax effect to hero section
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        window.addEventListener('scroll', function() {
            const scrollPosition = window.scrollY;
            heroSection.style.backgroundPosition = `center ${scrollPosition * 0.4}px`;
        });
    }
    
    // Initialize toast messages
    const toastTriggers = document.querySelectorAll('[data-toast]');
    if (toastTriggers.length > 0) {
        toastTriggers.forEach(trigger => {
            trigger.addEventListener('click', function() {
                const toastId = this.getAttribute('data-toast');
                const toast = document.getElementById(toastId);
                
                if (toast) {
                    const bsToast = new bootstrap.Toast(toast);
                    bsToast.show();
                }
            });
        });
    }
    
    // Add copy functionality
    const copyButtons = document.querySelectorAll('.btn-copy');
    if (copyButtons.length > 0) {
        copyButtons.forEach(button => {
            button.addEventListener('click', function() {
                const target = document.getElementById(this.getAttribute('data-copy-target'));
                if (target) {
                    navigator.clipboard.writeText(target.value || target.textContent).then(() => {
                        // Show success feedback
                        const originalText = this.textContent;
                        this.innerHTML = '<i class="fas fa-check me-1"></i>Copied!';
                        setTimeout(() => {
                            this.textContent = originalText;
                        }, 2000);
                    });
                }
            });
        });
    }
}); 