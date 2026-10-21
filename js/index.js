// ============================================
// WEATHER APP - Enhanced Version
// ============================================

// Configuration
const CONFIG = {
    API_KEY: 'cd85e45575070e6dd12423575e748da2',
    DEFAULT_VALUE: '--',
    DEFAULT_CITY: 'Ho Chi Minh',
    STORAGE_KEYS: {
        THEME: 'weather-app-theme',
        HISTORY: 'weather-app-history',
        LOCATIONS: 'weather-app-locations'
    },
    MAX_HISTORY: 5,
    POPULAR_CITIES: [
        'Ho Chi Minh', 'Hanoi', 'Da Nang', 'Nha Trang', 'Can Tho',
        'Hai Phong', 'Hue', 'Vung Tau', 'Da Lat', 'Phu Quoc'
    ]
};

// DOM Elements
const elements = {
    searchInput: document.querySelector('#search-input'),
    searchBtn: document.querySelector('#search-btn'),
    searchSuggestions: document.querySelector('#search-suggestions'),
    searchHistory: document.querySelector('#search-history'),
    
    cityName: document.querySelector('.city-name'),
    weatherState: document.querySelector('.weather-state'),
    weatherIcon: document.querySelector('.weather-icon'),
    temperature: document.querySelector('.temperature'),
    feelsLikeTemp: document.querySelector('.feels-like-temp'),
    
    sunrise: document.querySelector('.sunrise'),
    sunset: document.querySelector('.sunset'),
    humidity: document.querySelector('.humidity'),
    windSpeed: document.querySelector('.wind-speed'),
    pressure: document.querySelector('.pressure'),
    visibility: document.querySelector('.visibility'),
    
    loadingSpinner: document.querySelector('.loading-spinner'),
    themeToggle: document.querySelector('#theme-toggle'),
    currentLocationBtn: document.querySelector('#current-location-btn'),
    unitToggleBtn: document.querySelector('#unit-toggle-btn'),
    unitIndicator: document.querySelector('#unit-indicator'),
    headerInstallBtn: document.querySelector('#header-install-btn'),
    
    toast: document.querySelector('#toast'),
    hourlyContainer: document.querySelector('#hourly-container'),
    forecastContainer: document.querySelector('#forecast-container'),
    savedLocationsContainer: document.querySelector('#saved-locations-container'),
    addLocationBtn: document.querySelector('#add-location-btn'),
    
    // PWA Modal
    pwaModalOverlay: document.querySelector('#pwa-modal-overlay'),
    pwaModalClose: document.querySelector('#pwa-modal-close'),
    pwaModalCloseBtn: document.querySelector('#pwa-modal-close-btn'),
    pwaModalActionBtn: document.querySelector('#pwa-modal-action-btn'),
    pwaModalBody: document.querySelector('#pwa-modal-body')
};

// State
let currentWeatherData = null;
let currentForecastData = null;
let currentUnit = localStorage.getItem('weather-app-unit') || 'C'; // 'C' or 'F'
let searchTimeout = null;

// ============================================
// INITIALIZATION
// ============================================

function init() {
    loadTheme();
    loadUnit();
    setupEventListeners();
    setupPWA();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    loadInitialWeather();
    loadSavedLocations();
}

function loadInitialWeather() {
    const urlParams = new URLSearchParams(window.location.search);
    const cityParam = urlParams.get('city');
    if (cityParam) {
        fetchWeatherByCity(cityParam);
        return;
    }

    getCurrentLocationWeather(true);
}

function getCurrentLocationWeather(silentFallback = false) {
    if (navigator.geolocation) {
        if (!silentFallback) showLoading();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeatherByCoords(lat, lon);
                if (!silentFallback) showToast('Đã định vị vị trí của bạn!', 'success');
            },
            (error) => {
                if (!silentFallback) {
                    hideLoading();
                    showToast('Không lấy được GPS, đang tải vị trí mặc định', 'info');
                }
                fetchWeatherByCity(CONFIG.DEFAULT_CITY);
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    } else {
        fetchWeatherByCity(CONFIG.DEFAULT_CITY);
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Search functionality
    elements.searchInput.addEventListener('input', handleSearchInput);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    elements.searchInput.addEventListener('focus', showSearchHistory);
    elements.searchBtn.addEventListener('click', handleSearch);
    
    // Theme toggle (Optimized for mobile touch & click)
    if (elements.themeToggle) {
        elements.themeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            toggleTheme();
        });
    }
    
    // Current GPS Location
    if (elements.currentLocationBtn) {
        elements.currentLocationBtn.addEventListener('click', (e) => {
            e.preventDefault();
            getCurrentLocationWeather(false);
        });
    }
    
    // Unit Toggle (°C / °F)
    if (elements.unitToggleBtn) {
        elements.unitToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleUnit();
        });
    }

    // Header Install PWA button
    if (elements.headerInstallBtn) {
        elements.headerInstallBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleInstallClick();
        });
    }

    // PWA Modal handlers
    if (elements.pwaModalClose) elements.pwaModalClose.addEventListener('click', closeInstallModal);
    if (elements.pwaModalCloseBtn) elements.pwaModalCloseBtn.addEventListener('click', closeInstallModal);
    if (elements.pwaModalOverlay) {
        elements.pwaModalOverlay.addEventListener('click', (e) => {
            if (e.target === elements.pwaModalOverlay) closeInstallModal();
        });
    }
    if (elements.pwaModalActionBtn) {
        elements.pwaModalActionBtn.addEventListener('click', () => {
            if (deferredPrompt) {
                closeInstallModal();
                deferredPrompt.prompt();
            } else {
                closeInstallModal();
                showToast('Vui lòng làm theo hướng dẫn trên màn hình', 'info');
            }
        });
    }
    
    // Add location
    elements.addLocationBtn.addEventListener('click', addCurrentLocation);
    
    // Click outside to close suggestions
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            hideSearchSuggestions();
            hideSearchHistory();
        }
    });
}

// ============================================
// THEME & UNIT MANAGEMENT
// ============================================

function loadTheme() {
    const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (elements.themeToggle) elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    if (elements.themeToggle) {
        elements.themeToggle.innerHTML = isDark 
            ? '<i class="fas fa-sun"></i>' 
            : '<i class="fas fa-moon"></i>';
    }
    localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
    showToast(isDark ? 'Đã bật chế độ Tối (Dark Mode)' : 'Đã bật chế độ Sáng (Light Mode)', 'info');
}

function loadUnit() {
    if (elements.unitIndicator) {
        elements.unitIndicator.textContent = `°${currentUnit}`;
    }
}

function toggleUnit() {
    currentUnit = currentUnit === 'C' ? 'F' : 'C';
    localStorage.setItem('weather-app-unit', currentUnit);
    loadUnit();
    if (currentWeatherData) updateWeatherUI(currentWeatherData);
    if (currentForecastData) {
        updateForecastUI(currentForecastData);
        updateHourlyUI(currentForecastData);
    }
    showToast(`Đã chuyển sang độ ${currentUnit === 'C' ? 'Celsius (°C)' : 'Fahrenheit (°F)'}`, 'info');
}

function formatTemp(celsius) {
    if (celsius === undefined || celsius === null) return CONFIG.DEFAULT_VALUE;
    if (currentUnit === 'F') {
        return Math.round((celsius * 9) / 5 + 32);
    }
    return Math.round(celsius);
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

function handleSearchInput(e) {
    const query = e.target.value.trim();
    
    clearTimeout(searchTimeout);
    
    if (query.length >= 2) {
        searchTimeout = setTimeout(() => {
            showSearchSuggestions(query);
        }, 300);
    } else {
        hideSearchSuggestions();
    }
}

function handleSearch() {
    const city = elements.searchInput.value.trim();
    if (city) {
        fetchWeatherByCity(city);
        addToSearchHistory(city);
        elements.searchInput.value = '';
        hideSearchSuggestions();
        hideSearchHistory();
    }
}

function showSearchSuggestions(query) {
    const filtered = CONFIG.POPULAR_CITIES.filter(city => 
        city.toLowerCase().includes(query.toLowerCase())
    );
    
    if (filtered.length > 0) {
        elements.searchSuggestions.innerHTML = filtered.map(city => `
            <div class="suggestion-item" onclick="selectCity('${city}')">
                <i class="fas fa-map-marker-alt"></i>
                <span>${city}</span>
            </div>
        `).join('');
        elements.searchSuggestions.classList.add('show');
    } else {
        hideSearchSuggestions();
    }
}

function hideSearchSuggestions() {
    elements.searchSuggestions.classList.remove('show');
}

function showSearchHistory() {
    const history = getSearchHistory();
    if (history.length > 0) {
        elements.searchHistory.innerHTML = history.map(city => `
            <div class="history-item">
                <div onclick="selectCity('${city}')">
                    <i class="fas fa-history"></i>
                    <span>${city}</span>
                </div>
                <button class="delete-btn" onclick="removeFromHistory('${city}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        elements.searchHistory.classList.add('show');
    }
}

function hideSearchHistory() {
    elements.searchHistory.classList.remove('show');
}

function selectCity(city) {
    elements.searchInput.value = city;
    handleSearch();
}

// ============================================
// SEARCH HISTORY MANAGEMENT
// ============================================

function getSearchHistory() {
    const history = localStorage.getItem(CONFIG.STORAGE_KEYS.HISTORY);
    return history ? JSON.parse(history) : [];
}

function addToSearchHistory(city) {
    let history = getSearchHistory();
    history = history.filter(c => c.toLowerCase() !== city.toLowerCase());
    history.unshift(city);
    history = history.slice(0, CONFIG.MAX_HISTORY);
    localStorage.setItem(CONFIG.STORAGE_KEYS.HISTORY, JSON.stringify(history));
}

function removeFromHistory(city) {
    let history = getSearchHistory();
    history = history.filter(c => c !== city);
    localStorage.setItem(CONFIG.STORAGE_KEYS.HISTORY, JSON.stringify(history));
    showSearchHistory();
}

// ============================================
// WEATHER API CALLS
// ============================================

function fetchWeatherByCoords(lat, lon) {
    showLoading();
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=metric&lang=vi`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=metric&lang=vi`;
    
    Promise.all([
        fetch(weatherUrl).then(res => res.json()),
        fetch(forecastUrl).then(res => res.json())
    ])
    .then(([weatherData, forecastData]) => {
        if (weatherData.cod === 200) {
            currentWeatherData = weatherData;
            currentForecastData = forecastData;
            updateWeatherUI(weatherData);
            updateForecastUI(forecastData);
            updateHourlyUI(forecastData);
        } else {
            showToast('Không thể lấy dữ liệu thời tiết', 'error');
        }
        hideLoading();
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Lỗi kết nối. Vui lòng thử lại!', 'error');
        hideLoading();
    });
}

function fetchWeatherByCity(city) {
    showLoading();
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${CONFIG.API_KEY}&units=metric&lang=vi`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${CONFIG.API_KEY}&units=metric&lang=vi`;
    
    Promise.all([
        fetch(weatherUrl).then(res => res.json()),
        fetch(forecastUrl).then(res => res.json())
    ])
    .then(([weatherData, forecastData]) => {
        if (weatherData.cod === 200) {
            currentWeatherData = weatherData;
            currentForecastData = forecastData;
            updateWeatherUI(weatherData);
            updateForecastUI(forecastData);
            updateHourlyUI(forecastData);
            showToast(`Đã cập nhật thời tiết cho ${weatherData.name}`, 'success');
        } else {
            showToast('Không tìm thấy thành phố. Vui lòng thử lại!', 'error');
        }
        hideLoading();
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Lỗi kết nối. Vui lòng thử lại!', 'error');
        hideLoading();
    });
}

// ============================================
// UI UPDATES
// ============================================

function updateWeatherUI(data) {
    elements.cityName.textContent = data.name || CONFIG.DEFAULT_VALUE;
    elements.weatherState.textContent = data.weather?.[0]?.description || CONFIG.DEFAULT_VALUE;
    elements.weatherIcon.src = data.weather?.[0]?.icon
        ? `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`
        : '';
    elements.temperature.textContent = data.main?.temp !== undefined
        ? formatTemp(data.main.temp)
        : CONFIG.DEFAULT_VALUE;
    elements.feelsLikeTemp.textContent = data.main?.feels_like !== undefined
        ? formatTemp(data.main.feels_like)
        : CONFIG.DEFAULT_VALUE;
    elements.humidity.textContent = data.main?.humidity !== undefined
        ? data.main.humidity
        : CONFIG.DEFAULT_VALUE;
    elements.windSpeed.textContent = data.wind?.speed !== undefined
        ? (data.wind.speed * 3.6).toFixed(2)
        : CONFIG.DEFAULT_VALUE;
    elements.pressure.textContent = data.main?.pressure !== undefined
        ? data.main.pressure
        : CONFIG.DEFAULT_VALUE;
    elements.visibility.textContent = data.visibility !== undefined
        ? (data.visibility / 1000).toFixed(1)
        : CONFIG.DEFAULT_VALUE;
    elements.sunrise.textContent = data.sys?.sunrise
        ? moment.unix(data.sys.sunrise).format('H:mm')
        : CONFIG.DEFAULT_VALUE;
    elements.sunset.textContent = data.sys?.sunset
        ? moment.unix(data.sys.sunset).format('H:mm')
        : CONFIG.DEFAULT_VALUE;
}

function updateHourlyUI(data) {
    if (!data || !data.list || !elements.hourlyContainer) return;
    
    // Take the next 8 intervals (24 hours: 3h intervals)
    const hourlyList = data.list.slice(0, 8);
    
    elements.hourlyContainer.innerHTML = hourlyList.map((item, index) => {
        const date = new Date(item.dt * 1000);
        const timeStr = index === 0 ? 'Bây giờ' : moment(date).format('HH:mm');
        const temp = formatTemp(item.main.temp);
        const icon = item.weather?.[0]?.icon || '01d';
        const desc = item.weather?.[0]?.description || '';
        const pop = Math.round((item.pop || 0) * 100);
        
        return `
            <div class="hourly-item">
                <div class="hourly-time">${timeStr}</div>
                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}" class="hourly-icon" loading="lazy">
                <div class="hourly-temp">${temp}°</div>
                ${pop > 0 ? `<div class="hourly-pop"><i class="fas fa-droplet"></i> ${pop}%</div>` : ''}
            </div>
        `;
    }).join('');
}

function updateForecastUI(data) {
    if (!data.list) return;
    
    // Group forecasts by day
    const dailyData = {};
    const today = new Date().toDateString();
    
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateKey = date.toDateString();
        
        // Skip today, only show future days
        if (dateKey === today) return;
        
        if (!dailyData[dateKey]) {
            dailyData[dateKey] = {
                temps: [],
                weather: item.weather[0],
                date: date
            };
        }
        dailyData[dateKey].temps.push(item.main.temp);
    });
    
    // Convert to array and take first 5 days
    const dailyForecasts = Object.values(dailyData).slice(0, 5);
    
    elements.forecastContainer.innerHTML = dailyForecasts.map(forecast => {
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const dayName = days[forecast.date.getDay()];
        const dateStr = forecast.date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        
        // Calculate min and max temperature for the day
        const maxTemp = formatTemp(Math.max(...forecast.temps));
        const minTemp = formatTemp(Math.min(...forecast.temps));
        
        return `
            <div class="forecast-item">
                <div class="forecast-day">${dayName}</div>
                <div class="forecast-date">${dateStr}</div>
                <img src="https://openweathermap.org/img/wn/${forecast.weather.icon}@2x.png" 
                     alt="${forecast.weather.description}" 
                     class="forecast-icon">
                <div class="forecast-temp">${maxTemp}° / ${minTemp}°</div>
                <div class="forecast-desc">${forecast.weather.description}</div>
            </div>
        `;
    }).join('');
}

function updateDateTime() {
    const now = new Date();
    const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const day = days[now.getDay()];
    const date = now.toLocaleDateString('vi-VN');
    const time = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('current-date').textContent = `${day}, ${date}`;
    document.getElementById('current-time').textContent = time;
}

// ============================================
// SAVED LOCATIONS
// ============================================

function getSavedLocations() {
    const locations = localStorage.getItem(CONFIG.STORAGE_KEYS.LOCATIONS);
    return locations ? JSON.parse(locations) : [];
}

function saveLocation(locationData) {
    let locations = getSavedLocations();
    
    // Check if location already exists
    const exists = locations.some(loc => 
        loc.name.toLowerCase() === locationData.name.toLowerCase()
    );
    
    if (exists) {
        showToast('Địa điểm đã được lưu trước đó!', 'error');
        return;
    }
    
    locations.push(locationData);
    localStorage.setItem(CONFIG.STORAGE_KEYS.LOCATIONS, JSON.stringify(locations));
    loadSavedLocations();
    showToast(`Đã lưu ${locationData.name}`, 'success');
}

function deleteLocation(cityName) {
    let locations = getSavedLocations();
    locations = locations.filter(loc => loc.name !== cityName);
    localStorage.setItem(CONFIG.STORAGE_KEYS.LOCATIONS, JSON.stringify(locations));
    loadSavedLocations();
    showToast(`Đã xóa ${cityName}`, 'success');
}

function loadSavedLocations() {
    const locations = getSavedLocations();
    
    if (locations.length === 0) {
        elements.savedLocationsContainer.innerHTML = `
            <div class="empty-locations">
                <i class="fas fa-map-marked-alt" style="font-size: 30px; margin-bottom: 10px;"></i>
                <p>Chưa có địa điểm nào được lưu</p>
            </div>
        `;
        return;
    }
    
    // Fetch current weather for each saved location
    Promise.all(
        locations.map(loc => 
            fetch(`https://api.openweathermap.org/data/2.5/weather?q=${loc.name}&appid=${CONFIG.API_KEY}&units=metric&lang=vi`)
                .then(res => res.json())
        )
    ).then(weatherDataArray => {
        elements.savedLocationsContainer.innerHTML = weatherDataArray.map(data => {
            if (data.cod !== 200) return '';
            
            return `
                <div class="location-card" onclick="selectCity('${data.name}')">
                    <div class="location-info">
                        <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}.png" 
                             alt="${data.weather[0].description}" 
                             class="location-weather-icon">
                        <div class="location-details">
                            <div class="location-name">${data.name}</div>
                            <div class="location-temp">${formatTemp(data.main.temp)}° - ${data.weather[0].description}</div>
                        </div>
                    </div>
                    <div class="location-actions">
                        <button class="delete-location-btn" onclick="event.stopPropagation(); deleteLocation('${data.name}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    });
}

function addCurrentLocation() {
    if (!currentWeatherData) {
        showToast('Vui lòng tìm kiếm một thành phố trước!', 'error');
        return;
    }
    
    const locationData = {
        name: currentWeatherData.name,
        lat: currentWeatherData.coord.lat,
        lon: currentWeatherData.coord.lon
    };
    
    saveLocation(locationData);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showLoading() {
    elements.loadingSpinner.style.display = 'flex';
}

function hideLoading() {
    elements.loadingSpinner.style.display = 'none';
}

function showToast(message, type = 'info') {
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// ============================================
// PWA (PROGRESSIVE WEB APP) SETUP
// ============================================

let deferredPrompt = null;

function setupPWA() {
    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then((registration) => {
                    console.log('PWA ServiceWorker registered with scope:', registration.scope);
                })
                .catch((error) => {
                    console.error('PWA ServiceWorker registration failed:', error);
                });
        });
    }

    // 2. Install Prompt (Android / Chrome / Desktop)
    const installBanner = document.getElementById('pwa-install-banner');
    const installBtn = document.getElementById('pwa-install-btn');
    const dismissBtn = document.getElementById('pwa-dismiss-btn');

    if (installBanner && installBtn && dismissBtn) {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;

            const isDismissed = sessionStorage.getItem('pwa-install-dismissed');
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
            
            if (!isDismissed && !isStandalone) {
                setTimeout(() => {
                    installBanner.style.display = 'flex';
                }, 1500);
            }
        });

        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            installBanner.style.display = 'none';
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                showToast('Đang cài đặt ứng dụng Thời Tiết...', 'success');
            }
            deferredPrompt = null;
        });

        dismissBtn.addEventListener('click', () => {
            installBanner.style.display = 'none';
            sessionStorage.setItem('pwa-install-dismissed', 'true');
        });

        window.addEventListener('appinstalled', () => {
            installBanner.style.display = 'none';
            showToast('Ứng dụng đã được thêm vào Màn hình chính! 🎉', 'success');
        });
    }

    // 3. iOS Safari Guide Prompt
    const iosPrompt = document.getElementById('ios-install-prompt');
    const iosCloseBtn = document.getElementById('ios-prompt-close');
    
    if (iosPrompt && iosCloseBtn) {
        const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        const isIosDismissed = sessionStorage.getItem('ios-pwa-dismissed');

        if (isIos && !isStandalone && !isIosDismissed) {
            setTimeout(() => {
                iosPrompt.style.display = 'block';
            }, 3000);
        }

        iosCloseBtn.addEventListener('click', () => {
            iosPrompt.style.display = 'none';
            sessionStorage.setItem('ios-pwa-dismissed', 'true');
        });
    }

    // 4. Online / Offline listeners
    window.addEventListener('online', () => {
        showToast('Đã kết nối lại Internet', 'success');
    });

    window.addEventListener('offline', () => {
        showToast('Mất kết nối Internet. Đang dùng dữ liệu ngoại tuyến', 'error');
    });
}

function handleInstallClick() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                showToast('Đang cài đặt ứng dụng Thời Tiết...', 'success');
            }
            deferredPrompt = null;
        });
    } else {
        openInstallModal();
    }
}

function openInstallModal() {
    const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    if (isStandalone) {
        showToast('Ứng dụng đã được cài đặt trên thiết bị của bạn!', 'success');
        return;
    }

    let guideHtml = '';
    if (isIos) {
        guideHtml = `
            <div class="pwa-step-card">
                <div class="pwa-step-num">1</div>
                <div class="pwa-step-text">Bấm biểu tượng <strong>Chia sẻ (Share) <i class="fas fa-arrow-up-from-bracket"></i></strong> ở thanh công cụ dưới Safari.</div>
            </div>
            <div class="pwa-step-card">
                <div class="pwa-step-num">2</div>
                <div class="pwa-step-text">Cuộn xuống và chọn <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong>.</div>
            </div>
            <div class="pwa-step-card">
                <div class="pwa-step-num">3</div>
                <div class="pwa-step-text">Bấm <strong>Thêm (Add)</strong> ở góc trên bên phải là hoàn tất!</div>
            </div>
        `;
        if (elements.pwaModalActionBtn) elements.pwaModalActionBtn.style.display = 'none';
    } else {
        guideHtml = `
            <div class="pwa-step-card">
                <div class="pwa-step-num">1</div>
                <div class="pwa-step-text">Bấm nút <strong>Menu 3 chấm <i class="fas fa-ellipsis-vertical"></i></strong> trên thanh công cụ của trình duyệt.</div>
            </div>
            <div class="pwa-step-card">
                <div class="pwa-step-num">2</div>
                <div class="pwa-step-text">Chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào MH chính"</strong>.</div>
            </div>
        `;
        if (elements.pwaModalActionBtn) {
            elements.pwaModalActionBtn.style.display = 'block';
            elements.pwaModalActionBtn.textContent = 'Cài đặt ngay';
        }
    }

    if (elements.pwaModalBody) elements.pwaModalBody.innerHTML = guideHtml;
    if (elements.pwaModalOverlay) elements.pwaModalOverlay.style.display = 'flex';
}

function closeInstallModal() {
    if (elements.pwaModalOverlay) elements.pwaModalOverlay.style.display = 'none';
}

// ============================================
// START APP
// ============================================

window.addEventListener('DOMContentLoaded', init);


