import { Navigate } from 'react-router-dom';

// Компонент для защиты маршрутов
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  
  // Если нет токена - перенаправляем на логин
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  // Если токен есть - показываем запрошенный компонент
  return children;
}