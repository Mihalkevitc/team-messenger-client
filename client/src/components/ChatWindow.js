import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, ListGroup, Badge } from 'react-bootstrap';
import { io } from 'socket.io-client'; // подключение к WebSocket через socket.io-client.
import axios from 'axios';


const ChatWindow = ({ chat, user, onMessageSent }) => {
  const [messages, setMessages] = useState([]); // список всех сообщений.
  const [newMessage, setNewMessage] = useState(''); // текст текущего сообщения, которое вводит пользователь.
  const [socket, setSocket] = useState(null); // объект подключения WebSocket.
  const messagesEndRef = useRef(null); // ссылка на последний элемент в списке сообщений (для прокрутки вниз).

  // Обработчик обновления списка чатов при отправке сообщения
  useEffect(() => {
    if (!chat || !socket) return;

    // Обработчик обновления чатов
    const handleChatUpdate = () => {
      if (onMessageSent) {
        onMessageSent();
      }
    };

    socket.on('chatUpdated', handleChatUpdate);

    return () => {
      socket.off('chatUpdated', handleChatUpdate);
    };
  }, [socket, chat, onMessageSent]);

  // Загрузка истории сообщений
  // Срабатывает при изменении chat (то есть при выборе нового чата).
  useEffect(() => {
    const loadMessages = async () => {
      try {
        // Загружает историю сообщений с бэкенда через HTTP-запрос.
        console.log('Загрузка истории сообщений для чата:', chat.id);
        const response = await axios.get(`https://team-messenger.onrender.com/api/chats/${chat.id}/messages`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setMessages(response.data); // Записывает полученные сообщения в состояние messages.
      } catch (error) {
        console.error('Ошибка загрзки истории сообщений:', error);
      }
    };

    if (chat) {
      loadMessages(); // Вызываем соответсвенно функцию
    }
  }, [chat]);

  // Подключение к WebSocket
  useEffect(() => {
    if (!chat) return; // Если чат не выбран, то ничего не делаем.

    // Создаём новое подключение к WebSocket/ Передаётся token из localStorage для авторизации.
    const newSocket = io('https://team-messenger.onrender.com', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    setSocket(newSocket);
    console.log('Подключение к WebSocket установлено', newSocket, chat.id);

    // Подписываемся на чат, чтобы  сервер знал, в каком мы чате
    newSocket.on('connect', () => {
        console.log('WebSocket подключён успешно', newSocket);
        newSocket.emit('subscribe', chat.id);
        console.log('Подписан на чат', chat.id);
    });
    console.log('Подписан на чат', chat.id);

    newSocket.on('connect_error', (err) => {
        console.error('Ошибка подключения к WebSocket:', err.message);
    });

    // Обработчик новых сообщений
    // При получении нового сообщения от сервера, обновляет состояние messages.
    newSocket.on('message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    // При размонтировании компонента — соединение закрывается.
    return () => {
      newSocket.disconnect();
    };
  }, [chat]);

  // Прокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

    // Функция отправки сообщения на сервер
    const handleSendMessage = async (e) => {
    // Предотвращает стандартное поведение формы (перезагрузка страницы).
    e.preventDefault();
    // Если есть новое сообщение и есть подключение к WebSocket, то отправляет сообщение на сервер.
    // trim() удаляет пробелы в начале и конце строки.
    if (newMessage.trim() && socket) {
        try {
        // Отправляет сообщение на сервер через WebSocket.
        console.log('Отправка сообщения:', chat.id, newMessage);
        socket.emit('message', { 
            chatId: chat.id, 
            content: newMessage 
        });
        // Очищает поле ввода и состояние newMessage.
        setNewMessage('');
        // Вызываем колбэк для обновления списка чатов
        if (onMessageSent) {
          onMessageSent();
        }
        } catch (err) {
        console.error('Ошибка при отправке сообщения:', err);
        }
    }
    };


    
  return (
    <div className="d-flex flex-column h-100">
      {/* Заголовок чата */}
      {/* <div className="p-3 border-bottom">
        <h4>{chat.name}</h4>
      </div> */}

      {/* Список сообщений */}
      <div className="flex-grow-1 overflow-auto p-3">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg.id} className="mb-3 p-2 bg-light rounded">
              <div className="d-flex justify-content-between align-items-start">
                {/* Левая часть - аватар и информация об отправителе */}
                <div className="d-flex" style={{ flex: 1 }}>
                  <div 
                    className="rounded-circle bg-primary text-white d-flex justify-content-center align-items-center" 
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      fontSize: '0.8em',
                      flexShrink: 0 
                    }}
                  >
                    {msg.sender.firstName.charAt(0)}{msg.sender.lastName.charAt(0)}
                  </div>
                  
                  <div className="ms-2" style={{ flex: 1 }}>
                    {/* Первая строка - имя и роль */}
                    <div className="d-flex align-items-center">
                      <strong>
                        {msg.sender.firstName} {msg.sender.lastName}
                      </strong>
                      {msg.sender.role && (
                        <span 
                          className="badge bg-primary bg-opacity-10 text-primary ms-2" 
                          style={{ 
                            fontSize: '0.7em',
                            fontWeight: 'normal',
                            padding: '2px 6px'
                          }}
                        >
                          {msg.sender.role}
                        </span>
                      )}
                    </div>
                    
                    {/* Текст сообщения */}
                    <div className="mt-1">{msg.content}</div>
                  </div>
                </div>
                
                {/* Время в правом верхнем углу */}
                <small className="text-muted" style={{ flexShrink: 0 }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </small>
              </div>
            </div>
          ))
        ) : (
          <div className="text-muted text-center mt-5">Нет сообщений</div>
        )}
        {/* // Этот пустой div используется как «якорь» для прокрутки вниз. */}
        <div ref={messagesEndRef} />
      </div>


      {/* Форма ввода сообщения */}
      <div className="p-3 border-top">
        <Form onSubmit={handleSendMessage} className="d-flex">
          <Form.Control
            type="text"
            placeholder="Введите сообщение..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="me-2"
          />
          <Button variant="primary" type="submit">
            Отправить
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default ChatWindow;