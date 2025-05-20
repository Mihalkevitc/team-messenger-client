import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Form, Button, Container, Alert } from 'react-bootstrap';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // https://team-messenger.onrender.com

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://team-messenger.onrender.com/api/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      // Принудительно обновляем страницу для всех компонентов
      window.location.href = '/home';
    } catch (err) {
        setError(err.response?.data?.error || 'Ошибка авторизации');
    }
  };

  return (
    <Container className="mt-5" style={{ maxWidth: '400px' }}>
      <h2 className="text-center mb-4">Вход</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            placeholder="Введите email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Пароль</Form.Label>
          <Form.Control
            type="password"
            placeholder="Введите пароль"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
        </Form.Group>

        <Button variant="primary" type="submit" className="w-100">
          Войти
        </Button>
      </Form>
    </Container>
  );
}