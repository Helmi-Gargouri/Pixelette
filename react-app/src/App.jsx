import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import StaticPage from './components/StaticPage'
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';
import UsersList from './pages/UsersList';

export default function App() {
  return (
    <div>
      {/* App-level nav removed to avoid showing a small placeholder before template header loads. */}
      <Routes>
  <Route path="/about" element={<StaticPage page="about.html" />} />
  <Route path="/blog-details" element={<StaticPage page="blog-details.html" />} />
  <Route path="/blog" element={<StaticPage page="blog.html" />} />
  <Route path="/contact" element={<StaticPage page="contact.html" />} />
  <Route path="/error" element={<StaticPage page="error.html" />} />
  <Route path="/event-2" element={<StaticPage page="event-2.html" />} />
  <Route path="/event-3" element={<StaticPage page="event-3.html" />} />
  <Route path="/event-4" element={<StaticPage page="event-4.html" />} />
  <Route path="/event-details" element={<StaticPage page="event-details.html" />} />
  <Route path="/event" element={<StaticPage page="event.html" />} />
  <Route path="/home-2" element={<StaticPage page="home-2.html" />} />
  <Route path="/home-3" element={<StaticPage page="home-3.html" />} />
  <Route path="/home-4" element={<StaticPage page="home-4.html" />} />
  <Route path="/home-5" element={<StaticPage page="home-5.html" />} />
  <Route path="/" element={<StaticPage page="index.html" />} />
  <Route path="/location" element={<StaticPage page="location.html" />} />
  <Route path="/mail" element={<StaticPage page="mail.php" />} />
  <Route path="/opening-hour" element={<StaticPage page="opening-hour.html" />} />
  <Route path="/project-2" element={<StaticPage page="project-2.html" />} />
  <Route path="/project-3" element={<StaticPage page="project-3.html" />} />
  <Route path="/project-4" element={<StaticPage page="project-4.html" />} />
  <Route path="/project-details" element={<StaticPage page="project-details.html" />} />
  <Route path="/project" element={<StaticPage page="project.html" />} />
  <Route path="/shop-2" element={<StaticPage page="shop-2.html" />} />
  <Route path="/shop-details" element={<StaticPage page="shop-details.html" />} />
  <Route path="/shop" element={<StaticPage page="shop.html" />} />
  <Route path="/team-details" element={<StaticPage page="team-details.html" />} />
  <Route path="/team" element={<StaticPage page="team.html" />} />
  <Route path="/register" element={<Register />} />
  <Route path="/login" element={<Login />} />
  <Route path="/profile" element={<Profile />} />
    <Route path="/users" element={<UsersList />} />

  <Route path="*" element={<div>Not Found</div>} />
      </Routes>
    </div>
  )
}
