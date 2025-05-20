import { Navbar, Container, Nav, Button, Modal, Card, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function MainNavbar() {
  const [isAuth, setIsAuth] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showModal, setShowModal] = useState(false); // Состояние модального окна

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuth(false);
        setAuthChecked(true);
        return;
      }

      try {
        const res = await axios('https://team-messenger.onrender.com/api/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 200) {
          console.log('Консольный вывод', res.data.user);
          setIsAuth(true);
          setUserData(res.data.user);
        } else {
          localStorage.removeItem('token');
          setIsAuth(false);
        }
      } catch (err) {
        console.error('Ошибка при проверке авторизации:', err);
        setIsAuth(false);
      }

      setAuthChecked(true);
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuth(false);
    setUserData(null);
    window.location.href = '/login';
  };

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  if (!authChecked) return null;

  return (
    <>
      <Navbar bg="light" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/home">Team Chat</Navbar.Brand>
          <Nav className="ms-auto">
            {isAuth ? (
              <>
                {userData && (
                  <Navbar.Text
                    className="me-3"
                    style={{ cursor: 'pointer' }}
                    onClick={handleShowModal}
                  >
                    {userData.firstName} {userData.lastName}
                  </Navbar.Text>
                )}
                <Button variant="outline-danger" onClick={handleLogout} className="ms-2">
                  Выйти
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Вход</Nav.Link>
                <Nav.Link as={Link} to="/register">Регистрация</Nav.Link>
              </>
            )}
          </Nav>
        </Container>
      </Navbar>

      {/* Модальное окно */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Профиль пользователя</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {userData && (
            <Card>
              <Card.Body>
                <Card.Title className="text-center mb-4">👤 Личная информация</Card.Title>
                <ListGroup variant="flush">
                  <ListGroup.Item><strong>Имя:</strong> {userData.firstName}</ListGroup.Item>
                  <ListGroup.Item><strong>Фамилия:</strong> {userData.lastName}</ListGroup.Item>
                  <ListGroup.Item><strong>Email:</strong> {userData.email}</ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Закрыть
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
