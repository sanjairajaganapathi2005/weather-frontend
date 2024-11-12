import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from 'axios';
import './login.css';
const apiurl=process.env.REACT_APP;

export default function Login() {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${apiurl}/auth/login`, { 
        username: user,  // Ensure 'username' matches backend key
        password 
      });

      if (response.data.status === "ok") {
        localStorage.setItem('token', response.data.token); 
        alert("Login Successful");
        navigate('/wheather');
      } else {
        alert(`Error: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-inner">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
        <label>Username</label>

          <input
            type="text"
            placeholder="Username"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            required
          />

            <label>Password</label>

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
        <div className="register-link">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="register-text">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
