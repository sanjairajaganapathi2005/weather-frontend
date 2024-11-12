import WeatherApp from "./Weatherapp";
import  { BrowserRouter, Route, Routes } from "react-router-dom";
import Register from './Register';
import Login from './login';
import Whether from './weather';


function App() {
  return (
    <div className="App">
      <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/wheather" element={<WeatherApp />} />
        <Route path="/" element={<Whether/>} />
      </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
