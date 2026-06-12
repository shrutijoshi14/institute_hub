/**
 * Main JavaScript File for Ambition Tutorials
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize AOS (Animate On Scroll)
    if (typeof AOS !== 'undefined') {
        AOS.init({
            once: true,
            offset: 50,
            duration: 800,
            easing: 'ease-in-out',
        });
    }

    // 2. Custom ScrollSpy removed as it conflicted with multi-page navigation

    // 3. Navbar Shrink / Glassmorphism strictly on scroll
    const navbar = document.getElementById('mainNav');
    if (navbar) {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
                navbar.style.boxShadow = '0 4px 30px rgba(0,0,0,0.35)';
            } else {
                navbar.classList.remove('scrolled');
                navbar.style.boxShadow = '';
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
    }

    // Hero image floating animation
    const heroImg = document.querySelector('.hero-section img');
    if (heroImg) {
        heroImg.style.transition = 'transform 0.1s ease-out';
        let floatY = 0, floatDir = 1;
        setInterval(() => {
            floatY += 0.08 * floatDir;
            if (Math.abs(floatY) >= 10) floatDir *= -1;
            heroImg.style.transform = `translateY(${floatY}px)`;
        }, 16);
    }

    // 3D tilt on premium cards
    document.querySelectorAll('.premium-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            const tiltX = (y / rect.height) * 6;
            const tiltY = -(x / rect.width) * 6;
            card.style.transform = `translateY(-10px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
            card.style.transition = 'transform 0.1s ease';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.transition = 'all 0.35s cubic-bezier(0.4,0,0.2,1)';
        });
    });

    // 4. Number Counters Animation
    const counters = document.querySelectorAll('.counter');
    let counted = false;

    const animateCounters = () => {
        if (counted) return;
        counted = true;

        counters.forEach(counter => {
            const updateCount = () => {
                const target = +counter.getAttribute('data-target');
                const count = +counter.innerText;
                const increment = target / 50; // Adjust for speed

                if (count < target) {
                    counter.innerText = Math.ceil(count + increment);
                    setTimeout(updateCount, 30);
                } else {
                    counter.innerText = target;
                }
            };
            updateCount();
        });
    };

    const statsObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const statsContainer = document.querySelector('.stats-container');
    if (statsContainer) {
        statsObserver.observe(statsContainer);
    }

    // 5. Smooth scrolling for internal anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            // Allow default for empty or just "#"
            if (targetId === '#') return;
            
            // Check if it's pointing to element on same page
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();

                // Close mobile navbar if open
                const navCollapse = document.getElementById('navbarNav');
                if (navCollapse && navCollapse.classList.contains('show')) {
                    const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
                    if (bsCollapse) {
                        bsCollapse.hide();
                    }
                }

                // Scroll to target
                const offset = 80; // Height of the fixed navbar
                const bodyRect = document.body.getBoundingClientRect().top;
                const elementRect = targetElement.getBoundingClientRect().top;
                const elementPosition = elementRect - bodyRect;
                const offsetPosition = elementPosition - offset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Review Read More / Read Less smooth transition logic
    document.querySelectorAll('.review-wrapper').forEach(wrapper => {
        const textElement = wrapper.querySelector('.review-text');
        if (!textElement) return;
        
        const fullText = textElement.innerHTML;
        const limit = 120; // character limit

        if (fullText.length > limit) {
            // CSS setup for smooth expansion
            textElement.style.display = '-webkit-box';
            textElement.style.webkitLineClamp = '3';
            textElement.style.webkitBoxOrient = 'vertical';
            textElement.style.overflow = 'hidden';
            textElement.style.transition = 'max-height 0.6s ease-in-out';
            textElement.style.maxHeight = '85px'; // Approximate 3-line height based on 1.7 line height

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'btn btn-link p-0 text-navy fw-bold text-decoration-none mt-2 d-inline-block read-more-btn';
            toggleBtn.style.fontSize = '0.9rem';
            toggleBtn.style.transition = 'color 0.3s ease';
            toggleBtn.innerText = 'Read More';
            wrapper.appendChild(toggleBtn);

            let isExpanded = false;
            toggleBtn.addEventListener('click', () => {
                isExpanded = !isExpanded;
                if (isExpanded) {
                    textElement.style.webkitLineClamp = 'unset';
                    textElement.style.maxHeight = textElement.scrollHeight + 'px';
                } else {
                    textElement.style.maxHeight = '85px';
                    // Delay restoring line-clamp to allow height transition to finish smoothly
                    setTimeout(() => {
                        if (!isExpanded) textElement.style.webkitLineClamp = '3';
                    }, 500);
                }
                toggleBtn.innerText = isExpanded ? 'Read Less' : 'Read More';
            });
        }
    });
});

// 4. Mock Form Submission (Handling Google Forms logic locally for UI)
function submitGoogleForm(formType) {
    if (formType === 'registration') {
        const btn = document.querySelector('#registrationForm button[type="submit"]');
        const successMsg = document.getElementById('regSuccess');
        
        // Mock loading state
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> Submitting...';
        btn.disabled = true;

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
            successMsg.classList.remove('d-none');
            document.getElementById('registrationForm').reset();
            
            // Hide message after 5 seconds
            setTimeout(() => {
                successMsg.classList.add('d-none');
            }, 5000);
        }, 1500);
        
    } else if (formType === 'enquiry') {
        const btn = document.querySelector('#enquiryForm button[type="submit"]');
        const successMsg = document.getElementById('enqSuccess');
        
        // Mock loading state
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> Submitting...';
        btn.disabled = true;

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
            successMsg.classList.remove('d-none');
            document.getElementById('enquiryForm').reset();

            // Hide message after 5 seconds
            setTimeout(() => {
                successMsg.classList.add('d-none');
            }, 5000);
        }, 1500);
    }
}
