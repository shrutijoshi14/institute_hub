document.addEventListener('DOMContentLoaded', () => {
    const isLogin = window.location.pathname.includes('login.html');
    const isDashboard = window.location.pathname.includes('dashboard.html');

    // Auth logic simplified
    // Standard template
    const header = `
    <nav class="navbar navbar-expand-lg glass-nav py-3 sticky-top shadow-sm navbar-dark">
        <div class="container">
            <a class="navbar-brand d-flex align-items-center position-relative" style="left: -15px;" href="index.html">
                <img src="assets/logo.png" alt="Ambition logo" width="40" height="40" class="me-2 rounded-circle shadow-sm" style="object-fit: cover;" onerror="this.src='assets/ambition_logo.png'"/>
                <div class="d-flex flex-column text-white" style="white-space: nowrap;">
                    <span class="fw-bold fs-5 line-height-1">AMBITION</span>
                    <small class="text-gold fw-bold" style="font-size: 0.6rem; letter-spacing: 0.1em; margin-top: -1px;">TUTORIALS</small>
                </div>
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#basic-navbar-nav" aria-controls="basic-navbar-nav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="basic-navbar-nav">
                <ul class="navbar-nav ms-auto align-items-center">
                    <li class="nav-item"><a class="nav-link mx-2" href="index.html">Home</a></li>
                    <li class="nav-item"><a class="nav-link mx-2" href="about.html">About</a></li>
                    <li class="nav-item"><a class="nav-link mx-2" href="courses.html">Courses</a></li>
                    <li class="nav-item"><a class="nav-link mx-2" href="faculty.html">Faculty</a></li>
                    <li class="nav-item"><a class="nav-link mx-2" href="results.html">Results</a></li>
                    <li class="nav-item"><a class="nav-link mx-2" href="enquiry.html">Enquiry</a></li>
                    <li class="nav-item d-none d-lg-block"><a href="enquiry.html" class="btn btn-gold-custom ms-lg-3 text-nowrap">Enroll Now</a></li>
                </ul>
            </div>
        </div>
    </nav>`;

    const footer = `
    <footer class="bg-navy pt-5 pb-3 mt-auto">
        <div class="container">
            <div class="row gy-4">
                <div class="col-lg-4 col-md-6">
                    <div class="d-flex align-items-center gap-3 mb-4">
                        <img src="assets/logo.png" alt="Logo" width="45" height="45" class="rounded-circle" style="object-fit: cover;" onerror="this.src='assets/ambition_logo.png'" />
                        <h5 class="text-gold fw-bold mb-0">AMBITION TUTORIALS</h5>
                    </div>
                    <p class="text-white-50">
                        We help you achieve your academic dreams through quality education and expert guidance in School and Commerce streams.
                    </p>
                    <div class="d-flex gap-3 mt-3">
                        <a href="#" class="text-white hover-gold"><i data-lucide="facebook" width="20"></i></a>
                        <a href="#" class="text-white hover-gold"><i data-lucide="instagram" width="20"></i></a>
                        <a href="#" class="text-white hover-gold"><i data-lucide="twitter" width="20"></i></a>
                    </div>
                </div>
                <div class="col-lg-2 col-md-6">
                    <h5 class="text-gold fw-bold mb-4">Quick Links</h5>
                    <ul class="list-unstyled">
                        <li><a href="index.html" class="text-white-50 text-decoration-none hover-white">Home</a></li>
                        <li><a href="courses.html" class="text-white-50 text-decoration-none hover-white">Courses</a></li>
                        <li><a href="faculty.html" class="text-white-50 text-decoration-none hover-white">Faculty</a></li>
                        <li><a href="results.html" class="text-white-50 text-decoration-none hover-white">Results</a></li>
                    </ul>
                </div>
                <div class="col-lg-3 col-md-6">
                    <h5 class="text-gold fw-bold mb-4">Courses</h5>
                    <ul class="list-unstyled text-white-50">
                        <li>Class 5th – 8th</li>
                        <li>Class 9th – 10th</li>
                        <li>CET Preparation</li>
                    </ul>
                </div>
                <div class="col-lg-3 col-md-6">
                    <h5 class="text-gold fw-bold mb-4">Contact Us</h5>
                    <ul class="list-unstyled text-white-50">
                        <li class="mb-2 d-flex align-items-center gap-2">
                            <i data-lucide="phone" width="18" class="text-gold"></i> +91 98765 43210
                        </li>
                        <li class="mb-2 d-flex align-items-center gap-2">
                            <i data-lucide="mail" width="18" class="text-gold"></i> info@ambition.com
                        </li>
                        <li class="mb-2 d-flex align-items-center gap-2">
                            <i data-lucide="map-pin" width="18" class="text-gold"></i> Pune, Maharashtra
                        </li>
                    </ul>
                </div>
            </div>
            <hr class="bg-white opacity-25" />
            <div class="text-center text-white-50 small">
                &copy; ${new Date().getFullYear()} Ambition Tutorials. All rights reserved.
            </div>
        </div>
    </footer>`;

    // Inject header and footer
    const headerPlaceholder = document.getElementById('header-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');

    if (headerPlaceholder) headerPlaceholder.outerHTML = header;
    if (footerPlaceholder) footerPlaceholder.outerHTML = footer;

    // Active Link Highlighting
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

    // Initialize Lucide icons if available
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});
