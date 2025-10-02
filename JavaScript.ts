const API_KEY = 'YOUR_API_KEY';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/';

const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationElement = document.getElementById('location');
const dateElement = document.getElementById('date');
const tempElement = document.getElementById('temperature');
const iconElement = document.getElementById('weather-icon');
const descriptionElement = document.getElementById('description');
const humidityElement = document.getElementById('humidity');
const windSpeedElement = document.getElementById('wind-speed');
const forecastContainer = document.getElementById('forecast-container');
const errorMsg = document.getElementById('error-message');

/**
 * Helper function to format the date
 */
const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
};

/**
 * Fetches and displays the current weather data.
 * @param {string} url - The URL for the current weather API call.
 */
async function getCurrentWeather(url) {
    try {
        errorMsg.textContent = ''; // Clear previous error
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 404) {
                errorMsg.textContent = "City not found. Please try again.";
            } else {
                errorMsg.textContent = "An error occurred fetching weather data.";
            }
            // Clear previous data on error
            locationElement.textContent = '---';
            dateElement.textContent = '';
            tempElement.innerHTML = '---';
            iconElement.src = '';
            descriptionElement.textContent = '';
            humidityElement.textContent = '---';
            windSpeedElement.textContent = '---';
            forecastContainer.innerHTML = '';
            return;
        }

        const data = await response.json();
        
        // Update current weather elements
        locationElement.textContent = ${data.name}, ${data.sys.country};
        dateElement.textContent = formatDate(data.dt);
        // Convert Kelvin to Celsius and use the degree symbol
        const tempCelsius = (data.main.temp - 273.15).toFixed(1); 
        tempElement.innerHTML = ${tempCelsius} &deg;C; 
        descriptionElement.textContent = data.weather[0].description
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        iconElement.src = https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png;
        iconElement.alt = data.weather[0].description;
        humidityElement.textContent = ${data.main.humidity}%;
        windSpeedElement.textContent = ${data.wind.speed} m/s;

        // Fetch forecast based on city name (or lat/lon from current data)
        getForecast(data.coord.lat, data.coord.lon);
        
    } catch (error) {
        console.error("Fetch current weather error:", error);
        errorMsg.textContent = "Network error. Please check your connection.";
    }
}

/**
 * Fetches and displays the 5-day forecast.
 * @param {number} lat - Latitude.
 * @param {number} lon - Longitude.
 */
async function getForecast(lat, lon) {
    const forecastUrl = ${BASE_URL}forecast?lat=${lat}&lon=${lon}&appid=${API_KEY};
    
    try {
        const response = await fetch(forecastUrl);
        const data = await response.json();
        
        forecastContainer.innerHTML = ''; // Clear previous forecast

        // OpenWeatherMap provides data every 3 hours, so we filter for one data point per day (e.g., 12:00:00)
        const dailyForecasts = data.list.filter(item => item.dt_txt.includes("12:00:00"));

        dailyForecasts.slice(0, 5).forEach(item => { // Show 5 days
            const date = new Date(item.dt * 1000);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const tempCelsius = (item.main.temp - 273.15).toFixed(0);

            const forecastItem = document.createElement('div');
            forecastItem.classList.add('forecast-item');
            forecastItem.innerHTML = `
                <p>${dayName}</p>
                <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="${item.weather[0].description}">
                <p>${tempCelsius}&deg;C</p>
            `;
            forecastContainer.appendChild(forecastItem);
        });

    } catch (error) {
        console.error("Fetch forecast error:", error);
        // Display a message, but don't overwrite the main weather error if there was one
    }
}

/**
 * Gets the current weather based on the city entered by the user.
 */
const getWeatherByCity = () => {
    const city = cityInput.value.trim();
    if (city) {
        const url = ${BASE_URL}weather?q=${city}&appid=${API_KEY};
        getCurrentWeather(url);
    }
};

/**
 * Gets the current weather based on the user's geolocation.
 */
const getWeatherByGeolocation = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            const url = ${BASE_URL}weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY};
            getCurrentWeather(url);
        }, error => {
            console.error("Geolocation error:", error);
            errorMsg.textContent = "Could not get your location. Please use the search bar.";
            // Default to a known major city if geolocation fails
            const defaultCityUrl = ${BASE_URL}weather?q=London&appid=${API_KEY};
            getCurrentWeather(defaultCityUrl);
        });
    } else {
        errorMsg.textContent = "Geolocation not supported by this browser. Please use the search bar.";
        // Default to a known major city if geolocation fails
        const defaultCityUrl = ${BASE_URL}weather?q=New York&appid=${API_KEY};
        getCurrentWeather(defaultCityUrl);
    }
};

// Event Listeners
searchBtn.addEventListener('click', getWeatherByCity);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        getWeatherByCity();
    }
});

// Load weather data on page load using geolocation
window.onload = getWeatherByGeolocation;