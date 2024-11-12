import React, { useState, useEffect } from "react";
import axios from "axios";
import cloud from "./assets/cloud.png";
import humidity from "./assets/humidity.png";
import wind from "./assets/wind.png";
import search from "./assets/search.png";
import location from "./assets/location.png";
import loadingimg from "./assets/loading.gif";
import { useNavigate } from "react-router-dom";

const API_KEY = "d1845658f92b31c64bd94f06f7188c9c";

const Weatherapp = () => {
  const navigate = useNavigate();
  const [oldTab, setOldTab] = useState("userWeather");
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [weatherData, setWeatherData] = useState([]);
  const [loader, setLoader] = useState(true);

  const getUserIdFromToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userId;
  };

  const fetchWeatherData = async () => {
    try {
      const userId = getUserIdFromToken();
      if (!userId) return;

      const response = await axios.get(`http://localhost:5000/getWeatherData/${userId}`);
      setWeatherData(response.data);
      setLoader(false);
    } catch (err) {
      console.error("Error fetching weather data:", err);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, []);

  useEffect(() => {
    getFromSessionStorage();
  }, []);

  const switchTab = (newTab) => {
    if (newTab !== oldTab) {
      setOldTab(newTab);
      if (newTab === "userWeather") {
        getFromSessionStorage();
      }
    }
  };

  // Handle deleting a weather record
  const handleDelete = async (user_id, timestamp) => {
    try {
      // Send DELETE request to the backend to delete the data
      await axios.delete(`http://localhost:5000/deleteWeatherData/${user_id}/${timestamp}`);
      // Update state to remove the deleted item
      setWeatherData(weatherData.filter(item => item.timestamp !== timestamp));
    } catch (err) {
      console.error("Error deleting weather data:", err);
    }
  };

  const getFromSessionStorage = () => {
    const localCoordinates = sessionStorage.getItem("user-coordinates");
    if (localCoordinates) {
      const coordinates = JSON.parse(localCoordinates);
      fetchUserWeatherInfo(coordinates);
    }

    const savedSearches = JSON.parse(sessionStorage.getItem("recent-searches")) || [];
    setRecentSearches(savedSearches);
  };

  const fetchUserWeatherInfo = async (coordinates) => {
    const { lat, lon } = coordinates;
    setLoading(true);
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );
      setWeatherInfo(response.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchSearchWeatherInfo = async (city) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
      );
      setWeatherInfo(response.data);

      const userId = getUserIdFromToken();
      if (userId) {
        await axios.post("http://localhost:5000/saveWeatherData", {
          user_id: userId,
          ...response.data,
        });
      }

      const updatedSearches = [
        { city, weather: response.data },
        ...recentSearches.filter(search => search.city !== city),
      ].slice(0, 5);
      setRecentSearches(updatedSearches);
      sessionStorage.setItem("recent-searches", JSON.stringify(updatedSearches));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(showPosition);
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const showPosition = (position) => {
    const userCoordinates = {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
    };
    sessionStorage.setItem("user-coordinates", JSON.stringify(userCoordinates));
    fetchUserWeatherInfo(userCoordinates);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };


  return (
    <div className="wrapper">
      <h1>Weather App</h1>
      <div className="weather-container">
        {oldTab === "userWeather" && !weatherInfo && (
          <div className="sub-container grant-location-container active">
            <img src={location} alt="Location" />
            <p>Grant Location Access</p>
            <button className="btn" onClick={getLocation}>
              Grant Access
            </button>
          </div>
        )}

        {loading && (
          <div className="sub-container loading-container active">
            <img src={loadingimg} alt="Loading" className="loading-image" />
            <p>Loading</p>
          </div>
        )}

        {weatherInfo && (
          <div className="sub-container user-info-container active">
            <div className="tab-container">
              <p
                className={`tab ${!oldTab === "userWeather" ? "current-tab" : ""}`}
                onClick={() => switchTab("userWeather")}
              >
                Your Weather
              </p>
              <p
                className={`tab ${!oldTab === "searchWeather" ? "current-tab" : ""}`}
                onClick={() => switchTab("searchWeather")}
              >
                Search Weather
              </p>
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
            <div className="name">
              <p>{weatherInfo.name}</p>
              <img
                src={`https://flagcdn.com/144x108/${weatherInfo.sys.country.toLowerCase()}.png`}
                alt="Country Flag"
              />
            </div>
            <p>{weatherInfo.weather[0].description}</p>
            <img
              src={`http://openweathermap.org/img/w/${weatherInfo.weather[0].icon}.png`}
              alt="Weather Icon"
            />
            <p data-temp>{weatherInfo.main.temp} °C</p>
            <div className="parameter-container">
              <div className="parameter">
                <img src={wind} alt="Wind" />
                <p>Windspeed</p>
                <p>{weatherInfo.wind.speed} m/s</p>
              </div>
              <div className="parameter">
                <img src={humidity} alt="Humidity" />
                <p>Humidity</p>
                <p>{weatherInfo.main.humidity}%</p>
              </div>
              <div className="parameter">
                <img src={cloud} alt="Clouds" />
                <p>Cloudiness</p>
                <p>{weatherInfo.clouds.all}%</p>
              </div>
            </div>
          </div>
        )}

        {oldTab === "searchWeather" && (
          <form
            className="form-container active"
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery) fetchSearchWeatherInfo(searchQuery);
            }}
          >
            <input
              type="text"
              placeholder="Search for City..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-button">
              <img src={search} alt="Search" className="search" />
            </button>
          </form>
        )}

        {oldTab === "searchWeather" && recentSearches.length > 0 && (
          <div className="recent-searches">
            <h3>Recent Searches</h3>
            <table className="searches-table">
              <thead>
                <tr>
                  <th>City</th>
                  <th>Temperature</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {recentSearches.map((searchItem, index) => (
                  <tr key={index} onClick={() => fetchSearchWeatherInfo(searchItem.city)}>
                    <td>{searchItem.city}</td>
                    <td>{searchItem.weather.main.temp} °C</td>
                    <td>{searchItem.weather.weather[0].description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="weather-app">
          <h3>Recent Weather Data</h3>
          {loader ? (
            <p>Loading...</p>
          ) : (
            <div className="recent-searches">
              <table className="searches-table">
                <thead>
                  <tr>
                    <th>City</th>
                    <th>Temperature (°C)</th>
                    <th>Feels Like (°C)</th>
                    <th>Min Temp (°C)</th>
                    <th>Max Temp (°C)</th>
                    <th>Weather</th>
                    <th>Wind Speed (m/s)</th>
                    <th>Humidity (%)</th>
                    <th>Pressure (hPa)</th>
                    <th>Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {weatherData.map((searchItem, index) => (
                    <tr key={index}>
                      <td>{searchItem.name}</td>
                      <td>{searchItem.main.temp}</td>
                      <td>{searchItem.main.feels_like}</td>
                      <td>{searchItem.main.temp_min}</td>
                      <td>{searchItem.main.temp_max}</td>
                      <td>{searchItem.weather[0].description}</td>
                      <td>{searchItem.wind.speed}</td>
                      <td>{searchItem.main.humidity}</td>
                      <td>{searchItem.main.pressure}</td>
                      <td>
                        {new Date(searchItem.timestamp).toLocaleString("en-US", {
                          hour: "numeric",
                          minute: "numeric",
                          second: "numeric",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <button
                          onClick={() => handleDelete(searchItem.user_id, searchItem.timestamp)}
                          className="delete-button"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Weatherapp;
