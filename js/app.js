// ============================================
// ShoreSquad - Main JavaScript
// ============================================

'use strict';

// ============================================
// Configuration & Constants
// ============================================
const CONFIG = {
    MAP: {
        DEFAULT_CENTER: [34.0522, -118.2437], // Los Angeles
        DEFAULT_ZOOM: 10,
        MAX_ZOOM: 18,
        MIN_ZOOM: 3
    },
    WEATHER: {
        API_KEY: 'demo', // Replace with actual API key
        BASE_URL: 'https://api.openweathermap.org/data/2.5'
    },
    ANIMATION: {
        DURATION: 2000,
        COUNTER_SPEED: 50
    }
};

// ============================================
// State Management
// ============================================
const AppState = {
    map: null,
    markers: [],
    userLocation: null,
    events: [],
    weather: null
};

// ============================================
// DOM Elements
// ============================================
const DOM = {
    navToggle: document.querySelector('.nav-toggle'),
    navMenu: document.querySelector('.nav-menu'),
    header: document.querySelector('.header'),
    scrollTopBtn: document.getElementById('scrollTop'),
    mapContainer: document.getElementById('mapContainer'),
    weatherWidget: document.getElementById('weatherWidget'),
    eventsGrid: document.getElementById('eventsGrid'),
    joinForm: document.getElementById('joinForm'),
    searchBtn: document.getElementById('searchBtn'),
    locationSearch: document.getElementById('locationSearch'),
    findCleanupBtn: document.getElementById('findCleanupBtn'),
    createEventBtn: document.getElementById('createEventBtn')
};

// ============================================
// Utility Functions
// ============================================
const Utils = {
    // Debounce function for performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Animate counter numbers
    animateCounter(element, target) {
        const duration = CONFIG.ANIMATION.DURATION;
        const start = 0;
        const increment = target / (duration / CONFIG.ANIMATION.COUNTER_SPEED);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target.toLocaleString();
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current).toLocaleString();
            }
        }, CONFIG.ANIMATION.COUNTER_SPEED);
    },

    // Show notification
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 1rem 2rem;
            background: ${type === 'success' ? '#4ECDC4' : '#FF6B6B'};
            color: white;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    // Get user's geolocation
    getUserLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                position => resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                }),
                error => reject(error)
            );
        });
    }
};

// ============================================
// Navigation Functions
// ============================================
const Navigation = {
    init() {
        // Mobile menu toggle
        DOM.navToggle?.addEventListener('click', this.toggleMobileMenu.bind(this));

        // Smooth scroll for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', this.smoothScroll.bind(this));
        });

        // Header scroll effect
        window.addEventListener('scroll', Utils.debounce(this.handleScroll.bind(this), 10));

        // Scroll to top button
        DOM.scrollTopBtn?.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    },

    toggleMobileMenu() {
        DOM.navMenu?.classList.toggle('active');
        const isExpanded = DOM.navMenu?.classList.contains('active');
        DOM.navToggle?.setAttribute('aria-expanded', isExpanded);
    },

    smoothScroll(e) {
        const href = e.currentTarget.getAttribute('href');
        if (href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.offsetTop;
                const offsetPosition = elementPosition - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                DOM.navMenu?.classList.remove('active');
            }
        }
    },

    handleScroll() {
        // Header shadow on scroll
        if (window.scrollY > 50) {
            DOM.header?.classList.add('scrolled');
        } else {
            DOM.header?.classList.remove('scrolled');
        }

        // Show/hide scroll to top button
        if (window.scrollY > 500) {
            DOM.scrollTopBtn?.classList.add('visible');
        } else {
            DOM.scrollTopBtn?.classList.remove('visible');
        }
    }
};

// ============================================
// Map Functions
// ============================================
const MapModule = {
    async init() {
        if (!DOM.mapContainer) return;

        try {
            // Google Maps iframe is embedded, no initialization needed
            // Just load the sample events for the events list
            this.loadSampleEvents();

        } catch (error) {
            console.error('Map initialization error:', error);
            Utils.showNotification('Failed to load map', 'error');
        }
    },

    loadSampleEvents() {
        const sampleEvents = [
            {
                name: 'Pasir Ris Beach Cleanup',
                lat: 1.381497,
                lng: 103.955574,
                date: '2025-12-07',
                participants: 25
            },
            {
                name: 'East Coast Park Squad',
                lat: 1.3008,
                lng: 103.9282,
                date: '2025-12-08',
                participants: 18
            },
            {
                name: 'Sentosa Beach Cleanup',
                lat: 1.2494,
                lng: 103.8303,
                date: '2025-12-10',
                participants: 32
            }
        ];

        AppState.events = sampleEvents;
        this.displayEvents();
    },

    displayEvents() {
        if (!DOM.eventsGrid) return;

        DOM.eventsGrid.innerHTML = AppState.events.map(event => `
            <div class="event-card">
                <div class="event-date">
                    📅 ${new Date(event.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                    })}
                </div>
                <h4 class="event-title">${event.name}</h4>
                <div class="event-participants">
                    👥 ${event.participants} squad members joined
                </div>
                <button class="btn btn-primary" style="margin-top: 1rem; width: 100%;">
                    Join Cleanup
                </button>
            </div>
        `).join('');
    }
};

// ============================================
// Weather Functions
// ============================================
const WeatherModule = {
    async init() {
        if (!DOM.weatherWidget) return;

        try {
            // Use user location or default
            const location = AppState.userLocation || {
                lat: CONFIG.MAP.DEFAULT_CENTER[0],
                lng: CONFIG.MAP.DEFAULT_CENTER[1]
            };

            // For demo purposes, create sample weather data
            // In production, you'd fetch from actual weather API
            const weatherData = this.generateSampleWeather();
            this.displayWeather(weatherData);

        } catch (error) {
            console.error('Weather fetch error:', error);
            Utils.showNotification('Failed to load weather data', 'error');
        }
    },

    generateSampleWeather() {
        return {
            temp: 72,
            description: 'Partly Cloudy',
            icon: '⛅',
            humidity: 65,
            windSpeed: 12,
            uvIndex: 6,
            conditions: 'Perfect for beach cleanup!'
        };
    },

    displayWeather(data) {
        DOM.weatherWidget.innerHTML = `
            <div class="weather-current">
                <div class="weather-main">
                    <div class="weather-icon">${data.icon}</div>
                    <div>
                        <div class="weather-temp">${data.temp}°F</div>
                        <div class="weather-description">${data.description}</div>
                    </div>
                </div>
            </div>
            <div class="weather-details">
                <div class="weather-detail">
                    <div class="weather-detail-label">Humidity</div>
                    <div class="weather-detail-value">${data.humidity}%</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-label">Wind Speed</div>
                    <div class="weather-detail-value">${data.windSpeed} mph</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-label">UV Index</div>
                    <div class="weather-detail-value">${data.uvIndex}</div>
                </div>
                <div class="weather-detail" style="grid-column: 1 / -1; background: #4ECDC4; color: white;">
                    <div class="weather-detail-label">Cleanup Conditions</div>
                    <div class="weather-detail-value">${data.conditions}</div>
                </div>
            </div>
        `;
    }
};

// ============================================
// Form Handling
// ============================================
const FormHandler = {
    init() {
        DOM.joinForm?.addEventListener('submit', this.handleJoinForm.bind(this));
        DOM.searchBtn?.addEventListener('click', this.handleSearch.bind(this));
        DOM.findCleanupBtn?.addEventListener('click', () => {
            document.querySelector('#map')?.scrollIntoView({ behavior: 'smooth' });
        });
        DOM.createEventBtn?.addEventListener('click', () => {
            Utils.showNotification('Event creation coming soon! 🎉', 'success');
        });
    },

    handleJoinForm(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            location: formData.get('location')
        };

        // Simulate form submission
        console.log('Form submitted:', data);
        Utils.showNotification(`Welcome to the squad, ${data.name}! 🌊`, 'success');
        e.target.reset();
    },

    handleSearch() {
        const query = DOM.locationSearch?.value;
        if (!query) {
            Utils.showNotification('Please enter a location', 'error');
            return;
        }

        Utils.showNotification(`Searching for cleanups near ${query}...`, 'success');
        // In production, implement actual geocoding and search
    }
};

// ============================================
// Animation & Effects
// ============================================
const Animations = {
    init() {
        this.animateStats();
        this.setupIntersectionObserver();
    },

    animateStats() {
        const statNumbers = document.querySelectorAll('.stat-number[data-count]');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.target.textContent === '0') {
                    const target = parseInt(entry.target.dataset.count);
                    Utils.animateCounter(entry.target, target);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(stat => observer.observe(stat));
    },

    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
                }
            });
        }, observerOptions);

        // Observe sections and cards
        document.querySelectorAll('section, .feature-card, .event-card').forEach(el => {
            observer.observe(el);
        });
    }
};

// ============================================
// Performance Optimization
// ============================================
const Performance = {
    init() {
        // Lazy load images
        if ('loading' in HTMLImageElement.prototype) {
            const images = document.querySelectorAll('img[loading="lazy"]');
            images.forEach(img => {
                img.src = img.dataset.src;
            });
        }

        // Preload critical resources
        this.preloadResources();
    },

    preloadResources() {
        // Preload fonts and critical assets
        const resources = [
            { href: 'https://fonts.googleapis.com', as: 'font' }
        ];

        resources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.href;
            link.as = resource.as;
            if (resource.crossorigin) link.crossOrigin = resource.crossorigin;
            document.head.appendChild(link);
        });
    }
};

// ============================================
// App Initialization
// ============================================
const App = {
    async init() {
        console.log('🌊 ShoreSquad initializing...');

        try {
            // Initialize modules
            Navigation.init();
            FormHandler.init();
            Animations.init();
            Performance.init();

            // Initialize async modules
            await Promise.all([
                MapModule.init(),
                WeatherModule.init()
            ]);

            console.log('✅ ShoreSquad ready!');
        } catch (error) {
            console.error('❌ Initialization error:', error);
        }
    }
};

// ============================================
// Start App on DOM Ready
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}

// ============================================
// Service Worker Registration (PWA Support)
// ============================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment when service worker is implemented
        // navigator.serviceWorker.register('/sw.js')
        //     .then(reg => console.log('Service Worker registered'))
        //     .catch(err => console.log('Service Worker registration failed'));
    });
}

// ============================================
// Export for module usage
// ============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { App, Utils, MapModule, WeatherModule };
}
