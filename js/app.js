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
        // NEA Singapore data.gov.sg APIs
        FORECAST_URL: 'https://api.data.gov.sg/v1/environment/4-day-weather-forecast',
        READINGS_URL: 'https://api.data.gov.sg/v1/environment/2-hour-weather-forecast',
        TEMP_URL: 'https://api.data.gov.sg/v1/environment/air-temperature',
        HUMIDITY_URL: 'https://api.data.gov.sg/v1/environment/relative-humidity',
        WIND_URL: 'https://api.data.gov.sg/v1/environment/wind-speed'
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
            // Fetch real weather data from NEA
            const [forecastData, currentData] = await Promise.all([
                this.fetchForecast(),
                this.fetchCurrentWeather()
            ]);

            this.displayWeather(forecastData, currentData);

        } catch (error) {
            console.error('Weather fetch error:', error);
            Utils.showNotification('Using sample weather data', 'error');
            // Fallback to sample data if API fails
            this.displayFallbackWeather();
        }
    },

    async fetchForecast() {
        try {
            const response = await fetch(CONFIG.WEATHER.FORECAST_URL);
            if (!response.ok) throw new Error('Forecast API error');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Forecast fetch error:', error);
            throw error;
        }
    },

    async fetchCurrentWeather() {
        try {
            const [tempRes, humidityRes, windRes] = await Promise.all([
                fetch(CONFIG.WEATHER.TEMP_URL),
                fetch(CONFIG.WEATHER.HUMIDITY_URL),
                fetch(CONFIG.WEATHER.WIND_URL)
            ]);

            const [tempData, humidityData, windData] = await Promise.all([
                tempRes.json(),
                humidityRes.json(),
                windRes.json()
            ]);

            return {
                temperature: this.getEastAverage(tempData),
                humidity: this.getEastAverage(humidityData),
                windSpeed: this.getEastAverage(windData)
            };
        } catch (error) {
            console.error('Current weather fetch error:', error);
            return null;
        }
    },

    getEastAverage(data) {
        // Get readings from East region stations (Pasir Ris, Changi, etc.)
        if (!data.items || !data.items[0] || !data.items[0].readings) return null;
        
        const readings = data.items[0].readings;
        const eastStations = ['Pasir Ris', 'Changi', 'East Coast Parkway'];
        
        const relevantReadings = readings.filter(r => 
            eastStations.some(station => r.station_id?.includes(station.toLowerCase().replace(/\s+/g, '_')))
        );

        if (relevantReadings.length === 0) {
            // If no east stations, use all readings
            const values = readings.map(r => r.value).filter(v => v != null);
            return values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
        }

        const values = relevantReadings.map(r => r.value).filter(v => v != null);
        return values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
    },

    getWeatherIcon(forecast) {
        const description = forecast.toLowerCase();
        if (description.includes('thunder')) return '⛈️';
        if (description.includes('rain') || description.includes('showers')) return '🌧️';
        if (description.includes('cloudy')) return '☁️';
        if (description.includes('partly')) return '⛅';
        if (description.includes('fair') || description.includes('sunny')) return '☀️';
        return '🌤️';
    },

    getCleanupConditions(forecast, temp) {
        const description = forecast.toLowerCase();
        if (description.includes('thunder') || description.includes('heavy rain')) {
            return { text: 'Not ideal - storms expected', color: '#FF6B6B' };
        }
        if (description.includes('rain') || description.includes('showers')) {
            return { text: 'Fair - light rain possible', color: '#FFA500' };
        }
        if (temp && temp > 32) {
            return { text: 'Good - stay hydrated!', color: '#4ECDC4' };
        }
        return { text: 'Perfect for beach cleanup!', color: '#4ECDC4' };
    },

    displayWeather(forecastData, currentData) {
        if (!forecastData || !forecastData.items || !forecastData.items[0]) {
            this.displayFallbackWeather();
            return;
        }

        const forecasts = forecastData.items[0].forecasts;
        const today = forecasts[0];
        const conditions = this.getCleanupConditions(
            today.forecast,
            currentData?.temperature
        );

        // Build current weather section
        let currentHTML = `
            <div class="weather-current">
                <div class="weather-main">
                    <div class="weather-icon" style="font-size: 5rem;">${this.getWeatherIcon(today.forecast)}</div>
                    <div>
                        <div class="weather-temp">${currentData?.temperature || today.temperature.high}°C</div>
                        <div class="weather-description">${today.forecast}</div>
                    </div>
                </div>
                <div class="weather-today-details">
                    <div class="weather-detail-inline">
                        <span>💧 ${currentData?.humidity || 75}%</span>
                        <span>💨 ${currentData?.windSpeed || 15} km/h</span>
                        <span>🌡️ ${today.temperature.low}°C - ${today.temperature.high}°C</span>
                    </div>
                </div>
            </div>
            <div class="weather-detail" style="grid-column: 1 / -1; background: ${conditions.color}; color: white; padding: 1rem; border-radius: 0.5rem; text-align: center; margin: 1rem 0;">
                <div class="weather-detail-label" style="color: white; opacity: 1;">Cleanup Conditions</div>
                <div class="weather-detail-value" style="color: white; font-weight: 600;">${conditions.text}</div>
            </div>
        `;

        // Build 4-day forecast section
        let forecastHTML = `
            <div class="forecast-section">
                <h3 style="margin-bottom: 1rem; color: var(--charcoal);">4-Day Forecast</h3>
                <div class="forecast-grid">
        `;

        forecasts.forEach(day => {
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const icon = this.getWeatherIcon(day.forecast);

            forecastHTML += `
                <div class="forecast-card">
                    <div class="forecast-day">${dayName}</div>
                    <div class="forecast-date">${dateStr}</div>
                    <div class="forecast-icon">${icon}</div>
                    <div class="forecast-temps">
                        <span class="temp-high">${day.temperature.high}°</span>
                        <span class="temp-low">${day.temperature.low}°</span>
                    </div>
                    <div class="forecast-condition">${day.forecast}</div>
                </div>
            `;
        });

        forecastHTML += `
                </div>
            </div>
        `;

        DOM.weatherWidget.innerHTML = currentHTML + forecastHTML;
    },

    displayFallbackWeather() {
        const conditions = { text: 'Perfect for beach cleanup!', color: '#4ECDC4' };
        DOM.weatherWidget.innerHTML = `
            <div class="weather-current">
                <div class="weather-main">
                    <div class="weather-icon" style="font-size: 5rem;">⛅</div>
                    <div>
                        <div class="weather-temp">28°C</div>
                        <div class="weather-description">Partly Cloudy</div>
                    </div>
                </div>
                <div class="weather-today-details">
                    <div class="weather-detail-inline">
                        <span>💧 75%</span>
                        <span>💨 15 km/h</span>
                        <span>🌡️ 26°C - 32°C</span>
                    </div>
                </div>
            </div>
            <div class="weather-detail" style="grid-column: 1 / -1; background: ${conditions.color}; color: white; padding: 1rem; border-radius: 0.5rem; text-align: center; margin: 1rem 0;">
                <div class="weather-detail-label" style="color: white; opacity: 1;">Cleanup Conditions</div>
                <div class="weather-detail-value" style="color: white; font-weight: 600;">${conditions.text}</div>
            </div>
            <p style="text-align: center; color: var(--gray); font-size: 0.9rem; margin-top: 1rem;">
                <em>Sample data - API unavailable</em>
            </p>
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
