// API Configuration
const apiKey = "fcb5d6ea67955c86a7fa55a450b22dc7";
const weatherApiUrl = "https://api.openweathermap.org/data/2.5/weather";
const forecastApiUrl = "https://api.openweathermap.org/data/2.5/forecast";


const searchBox = document.querySelector(".search input");
const searchBtn = document.querySelector(".search button");
const weatherIcon = document.querySelector(".weather-icon");
const weatherDiv = document.querySelector(".weather");
const forecastDiv = document.querySelector(".forecast");
const errorDiv = document.querySelector(".error");
const loaderDiv = document.querySelector(".loader");
const initialStateDiv = document.querySelector(".initial-state");
const recentSearchesDiv = document.querySelector(".recent-searches");
const recentListDiv = document.querySelector(".recent-list");
const unitButtons = document.querySelectorAll(".unit-btn");
const forecastContainer = document.querySelector(".forecast-container");


let currentUnit = "metric";
let recentSearches = JSON.parse(localStorage.getItem("recentSearches")) || [];


function initApp() {

    showInitialState();
    
    setupEventListeners();
    
   
    updateRecentSearches();

    tryGetUserLocation();
}


function setupEventListeners() {

    searchBtn.addEventListener("click", () => {
        if (searchBox.value.trim()) {
            getWeatherData(searchBox.value);
        }
    });

   
    searchBox.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && searchBox.value.trim()) {
            getWeatherData(searchBox.value);
        }
    });

   
    unitButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            if (!btn.classList.contains("active")) {
                unitButtons.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                currentUnit = btn.dataset.unit;
                
                if (weatherDiv.classList.contains("active")) {
                    getWeatherData(document.querySelector(".city").textContent);
                }
            }
        });
    });
}


function tryGetUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                getWeatherByCoords(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                console.log("Geolocation error:", error);
                
            }
        );
    }
}


async function getWeatherByCoords(lat, lon) {
    showLoader();
    
    try {
        const response = await fetch(`${weatherApiUrl}?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${apiKey}`);
        
        if (!response.ok) {
            showError();
            return;
        }
        
        const data = await response.json();
        displayWeather(data);
        getForecastData(data.name);
        addToRecentSearches(data.name);
        
    } catch (error) {
        console.error("Error fetching weather data:", error);
        showError();
    }
}


async function getWeatherData(city) {
    showLoader();
    
    try {
        const response = await fetch(`${weatherApiUrl}?q=${city}&units=${currentUnit}&appid=${apiKey}`);
        
        if (!response.ok) {
            showError();
            return;
        }
        
        const data = await response.json();
        displayWeather(data);
        getForecastData(city);
        addToRecentSearches(city);
        
    } catch (error) {
        console.error("Error fetching weather data:", error);
        showError();
    }
}


async function getForecastData(city) {
    try {
        const response = await fetch(`${forecastApiUrl}?q=${city}&units=${currentUnit}&appid=${apiKey}`);
        
        if (!response.ok) {
            return;
        }
        
        const data = await response.json();
        displayForecast(data);
        
    } catch (error) {
        console.error("Error fetching forecast data:", error);
    }
}


function displayWeather(data) {
 
    document.querySelector(".city").textContent = data.name;
    document.querySelector(".temp").textContent = `${Math.round(data.main.temp)}°${currentUnit === 'metric' ? 'C' : 'F'}`;
    document.querySelector(".weather-description").textContent = data.weather[0].description;
    

    document.querySelector(".date").textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });
    
   
    document.querySelector(".humidity").textContent = `${data.main.humidity}%`;
    document.querySelector(".wind").textContent = `${data.wind.speed} ${currentUnit === 'metric' ? 'km/h' : 'mph'}`;
    document.querySelector(".feels-like").textContent = `${Math.round(data.main.feels_like)}°${currentUnit === 'metric' ? 'C' : 'F'}`;
    document.querySelector(".pressure").textContent = `${data.main.pressure} hPa`;
    
 
    document.querySelector(".visibility").textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    document.querySelector(".cloudiness").textContent = `${data.clouds.all}%`;
    
   
    const sunriseTime = new Date(data.sys.sunrise * 1000);
    const sunsetTime = new Date(data.sys.sunset * 1000);
    
    document.querySelector(".sunrise").textContent = sunriseTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    
    document.querySelector(".sunset").textContent = sunsetTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    
   
    const weatherMain = data.weather[0].main;
    setWeatherIcon(weatherMain);
    
   
    hideLoader();
    initialStateDiv.style.display = "none";
    errorDiv.classList.remove("active");
    weatherDiv.classList.add("active");
    
   
    setWeatherBackground(weatherMain);
}


function displayForecast(data) {
   
    forecastContainer.innerHTML = "";
    
   
    const dailyForecasts = data.list.filter(item => {
        const date = new Date(item.dt * 1000);
        return date.getHours() >= 12 && date.getHours() <= 15;
    }).slice(0, 5);
    
 
    dailyForecasts.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const forecastItem = document.createElement("div");
        forecastItem.className = "forecast-item";
        
        forecastItem.innerHTML = `
            <div class="day">${dayName}</div>
            <img src="images/${getForecastIcon(forecast.weather[0].main)}.png" alt="${forecast.weather[0].description}">
            <div class="forecast-temp">${Math.round(forecast.main.temp)}°${currentUnit === 'metric' ? 'C' : 'F'}</div>
            <div class="forecast-description">${forecast.weather[0].description}</div>
        `;
        
        forecastContainer.appendChild(forecastItem);
    });
    

    forecastDiv.classList.add("active");
}


function setWeatherIcon(weatherMain) {
    const lowerWeatherMain = weatherMain.toLowerCase();
    
    if (lowerWeatherMain.includes("cloud")) {
        weatherIcon.src = "images/clouds.png";
    } else if (lowerWeatherMain.includes("clear")) {
        weatherIcon.src = "images/clear.png";
    } else if (lowerWeatherMain.includes("rain")) {
        weatherIcon.src = "images/rain.png";
    } else if (lowerWeatherMain.includes("drizzle")) {
        weatherIcon.src = "images/drizzle.png";
    } else if (lowerWeatherMain.includes("mist") || lowerWeatherMain.includes("fog") || lowerWeatherMain.includes("haze")) {
        weatherIcon.src = "images/mist.png";
    } else if (lowerWeatherMain.includes("snow")) {
        weatherIcon.src = "images/snow.png";
    } else if (lowerWeatherMain.includes("thunder")) {
        weatherIcon.src = "images/thunderstorm.png";
    } else {
        weatherIcon.src = "images/clouds.png";
    }
}


function getForecastIcon(weatherMain) {
    const lowerWeatherMain = weatherMain.toLowerCase();
    
    if (lowerWeatherMain.includes("cloud")) {
        return "clouds";
    } else if (lowerWeatherMain.includes("clear")) {
        return "clear";
    } else if (lowerWeatherMain.includes("rain")) {
        return "rain";
    } else if (lowerWeatherMain.includes("drizzle")) {
        return "drizzle";
    } else if (lowerWeatherMain.includes("mist") || lowerWeatherMain.includes("fog") || lowerWeatherMain.includes("haze")) {
        return "mist";
    } else if (lowerWeatherMain.includes("snow")) {
        return "snow";
    } else if (lowerWeatherMain.includes("thunder")) {
        return "thunderstorm";
    } else {
        return "clouds";
    }
}


function setWeatherBackground(weatherMain) {
    const lowerWeatherMain = weatherMain.toLowerCase();
    
  
    weatherDiv.className = "weather active";
    

    if (lowerWeatherMain.includes("cloud")) {
        weatherDiv.classList.add("clouds");
    } else if (lowerWeatherMain.includes("clear")) {
        weatherDiv.classList.add("clear");
    } else if (lowerWeatherMain.includes("rain")) {
        weatherDiv.classList.add("rain");
    } else if (lowerWeatherMain.includes("drizzle")) {
        weatherDiv.classList.add("drizzle");
    } else if (lowerWeatherMain.includes("mist") || lowerWeatherMain.includes("fog") || lowerWeatherMain.includes("haze")) {
        weatherDiv.classList.add("mist");
    } else if (lowerWeatherMain.includes("snow")) {
        weatherDiv.classList.add("snow");
    } else if (lowerWeatherMain.includes("thunder")) {weatherDiv.classList.add("thunderstorm");
    } else {
        weatherDiv.classList.add("clouds");
    }
}


function addToRecentSearches(city) {
  
    const cityIndex = recentSearches.indexOf(city);
    
   
    if (cityIndex !== -1) {
        recentSearches.splice(cityIndex, 1);
    }
    
   
    recentSearches.unshift(city);
    
  
    if (recentSearches.length > 5) {
        recentSearches = recentSearches.slice(0, 5);
    }
    

    localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
    
   
    updateRecentSearches();
}


function updateRecentSearches() {
  
    recentListDiv.innerHTML = "";
    

    if (recentSearches.length > 0) {
        recentSearches.forEach(city => {
            const recentItem = document.createElement("div");
            recentItem.className = "recent-item";
            recentItem.textContent = city;
            
            
            recentItem.addEventListener("click", () => {
                getWeatherData(city);
            });
            
            recentListDiv.appendChild(recentItem);
        });
        
       
        recentSearchesDiv.classList.add("active");
    } else {
        recentSearchesDiv.classList.remove("active");
    }
}


function showLoader() {
    initialStateDiv.style.display = "none";
    errorDiv.classList.remove("active");
    weatherDiv.classList.remove("active");
    forecastDiv.classList.remove("active");
    loaderDiv.style.display = "flex";
}


function hideLoader() {
    loaderDiv.style.display = "none";
}


function showError() {
    hideLoader();
    initialStateDiv.style.display = "none";
    weatherDiv.classList.remove("active");
    forecastDiv.classList.remove("active");
    errorDiv.classList.add("active");
}


function showInitialState() {
    loaderDiv.style.display = "none";
    errorDiv.classList.remove("active");
    weatherDiv.classList.remove("active");
    forecastDiv.classList.remove("active");
    initialStateDiv.style.display = "flex";
    

    if (recentSearches.length > 0) {
        recentSearchesDiv.classList.add("active");
    } else {
        recentSearchesDiv.classList.remove("active");
    }
}


document.addEventListener("DOMContentLoaded", initApp);