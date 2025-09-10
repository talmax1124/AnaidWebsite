// Enhanced Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
            
            // Add click animation
            navToggle.style.animation = 'pulse 0.3s ease';
            setTimeout(() => {
                navToggle.style.animation = '';
            }, 300);
        });
    }

    // Close mobile menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
            
            // Add click animation to link
            link.style.animation = 'bounce 0.5s ease';
            setTimeout(() => {
                link.style.animation = '';
            }, 500);
        });
    });

    // Smooth scrolling for navigation links
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Navbar background on scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });

    // Form submission
    const contactForm = document.querySelector('.contact-form form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Simple validation
            if (!data.name || !data.email || !data.service) {
                alert('Please fill in all required fields.');
                return;
            }
            
            // Email validation
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(data.email)) {
                alert('Please enter a valid email address.');
                return;
            }
            
            // Simulate form submission
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            
            submitButton.textContent = 'Sending...';
            submitButton.disabled = true;
            
            setTimeout(() => {
                alert('Thank you for your message! We will get back to you soon.');
                this.reset();
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }, 1500);
        });
    }

    // Enhanced Intersection Observer for animations
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                
                // Add special effects for different elements
                if (entry.target.classList.contains('stat-item')) {
                    animateStatNumber(entry.target);
                }
                
                if (entry.target.classList.contains('gallery-item')) {
                    entry.target.style.animationDelay = Math.random() * 0.5 + 's';
                }
            }
        });
    }, observerOptions);

    // Observe all elements with animate-on-scroll class
    const animatedElements = document.querySelectorAll('.animate-on-scroll, .service-card, .credential, .contact-item, .testimonial-card, .gallery-item, .stat-item');
    animatedElements.forEach((el, index) => {
        // Add staggered delay based on index
        el.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(el);
    });

    // Stats counter animation
    function animateStatNumber(statItem) {
        const numberElement = statItem.querySelector('.stat-number');
        const target = parseInt(numberElement.getAttribute('data-target'));
        const duration = 2000;
        const startTime = performance.now();
        
        function updateNumber(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(target * easeOutCubic(progress));
            
            numberElement.textContent = current + (target === 98 ? '%' : (target === 5 ? '' : '+'));
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        }
        
        requestAnimationFrame(updateNumber);
    }

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    // Counter animation for credentials
    const counters = document.querySelectorAll('.credential h4');
    const countObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = counter.textContent;
                
                if (target.includes('+')) {
                    const number = parseInt(target.replace(/\D/g, ''));
                    animateCounter(counter, 0, number, target);
                }
                countObserver.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => countObserver.observe(counter));

    function animateCounter(element, start, end, suffix) {
        const duration = 2000;
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(start + (end - start) * easeOutQuart(progress));
            
            if (suffix.includes('Years')) {
                element.textContent = current + ' Years';
            } else if (suffix.includes('Certified')) {
                element.textContent = 'Certified';
            } else {
                element.textContent = current + '+';
            }
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    }

    function easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }

    // Parallax effect for hero section
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        const heroImage = document.querySelector('.hero-image');
        
        if (hero && heroImage) {
            const rate = scrolled * -0.5;
            heroImage.style.transform = `translateY(${rate}px)`;
        }
    });

    // Enhanced service card hover effects
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-15px) scale(1.02)';
            
            // Add glow effect
            this.style.boxShadow = '0 20px 40px rgba(139, 115, 85, 0.3)';
            
            // Animate icon
            const icon = this.querySelector('.service-icon');
            if (icon) {
                icon.style.transform = 'scale(1.2) rotate(5deg)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            if (this.classList.contains('featured')) {
                this.style.transform = 'scale(1.05)';
                this.style.boxShadow = '0 8px 40px rgba(0, 0, 0, 0.15)';
            } else {
                this.style.transform = 'translateY(0) scale(1)';
                this.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.05)';
            }
            
            // Reset icon
            const icon = this.querySelector('.service-icon');
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0deg)';
            }
        });
    });

    // Gallery lightbox effect
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach(item => {
        item.addEventListener('click', function() {
            // Add click animation
            this.style.animation = 'pulse 0.3s ease';
            setTimeout(() => {
                this.style.animation = '';
            }, 300);
            
            // You could add a lightbox modal here
            console.log('Gallery item clicked - lightbox would open here');
        });
    });

    // Testimonial card animations
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    testimonialCards.forEach((card, index) => {
        card.addEventListener('mouseenter', function() {
            // Add floating animation
            this.style.animation = 'float 2s ease-in-out infinite';
            
            // Rotate stars
            const stars = this.querySelector('.stars');
            if (stars) {
                stars.style.animation = 'pulse 1s ease-in-out infinite';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.animation = '';
            
            const stars = this.querySelector('.stars');
            if (stars) {
                stars.style.animation = 'pulse 2s ease-in-out infinite';
            }
        });
    });

    // Subtle cursor effect (removed distracting trail)

    // Add scroll progress indicator
    const progressBar = document.createElement('div');
    progressBar.style.position = 'fixed';
    progressBar.style.top = '0';
    progressBar.style.left = '0';
    progressBar.style.width = '0%';
    progressBar.style.height = '3px';
    progressBar.style.background = 'linear-gradient(90deg, var(--primary-color), var(--accent-color))';
    progressBar.style.zIndex = '10000';
    progressBar.style.transition = 'width 0.1s ease';
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', function() {
        const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        progressBar.style.width = scrollPercent + '%';
    });

    // Subtle floating elements (removed excessive animations)
});