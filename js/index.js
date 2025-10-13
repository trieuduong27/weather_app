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
    toast: document.querySelector('#toast'),
    
    forecastContainer: document.querySelector('#forecast-container'),
    savedLocationsContainer: document.querySelector('#saved-locations-container'),
    addLocationBtn: document.querySelector('#add-location-btn')
};

// State
let currentWeatherData = null;
let searchTimeout = null;

// ============================================
// INITIALIZATION
// ============================================

function init() {
    loadTheme();
    setupEventListeners();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    loadInitialWeather();
    loadSavedLocations();
}

function loadInitialWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeatherByCoords(lat, lon);
            },
            () => {
                fetchWeatherByCity(CONFIG.DEFAULT_CITY);
            }
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
    
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
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
// THEME MANAGEMENT
// ============================================

function loadTheme() {
    const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    elements.themeToggle.innerHTML = isDark 
        ? '<i class="fas fa-sun"></i>' 
        : '<i class="fas fa-moon"></i>';
    localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
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
            updateWeatherUI(weatherData);
            updateForecastUI(forecastData);
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
            updateWeatherUI(weatherData);
            updateForecastUI(forecastData);
            showToast(`Đã tìm thấy thời tiết cho ${weatherData.name}`, 'success');
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
        ? Math.round(data.main.temp)
        : CONFIG.DEFAULT_VALUE;
    elements.feelsLikeTemp.textContent = data.main?.feels_like !== undefined
        ? Math.round(data.main.feels_like)
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
        const maxTemp = Math.round(Math.max(...forecast.temps));
        const minTemp = Math.round(Math.min(...forecast.temps));
        
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
                            <div class="location-temp">${Math.round(data.main.temp)}° - ${data.weather[0].description}</div>
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
// START APP
// ============================================

window.addEventListener('DOMContentLoaded', init);
