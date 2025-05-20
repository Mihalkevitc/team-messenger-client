// client/src/pages/HomePage.js
// Главная страница приложения с чатами и командами

import { io } from 'socket.io-client'; // подключение к WebSocket через socket.io-client.
import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, Row, Col, Form, Button, ListGroup, Badge, Tab, Tabs,
  Modal, Alert
} from 'react-bootstrap';
import { Search, PlusCircle, PeopleFill, ChatLeftText } from 'react-bootstrap-icons';
import ChatWindow from '../components/ChatWindow';

export default function HomePage() {
// Добавим в HomePage.js, рядом с другими хуками
const [socket, setSocket] = useState(null);

// Подключение к WebSocket
useEffect(() => {
  const newSocket = io('https://team-messenger-server.onrender.com', {
    auth: {
      token: localStorage.getItem('token')
    }
  });

  setSocket(newSocket);

  // Обработчик обновления чатов
  newSocket.on('chatUpdated', ({ chatId }) => {
    if (activeTab === 'chats') {
      fetchData(); // Обновляем список чатов
    }
  });

  return () => {
    newSocket.disconnect();
  };
}, []);
  // Добавляем состояние для текущего пользователя
  const [user, setUser] = useState(null);

  useEffect(() => {
  const fetchUser = async () => {
    try {
      const res = await axios.get('https://team-messenger-server.onrender.com/api/users/me', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setUser(res.data);
    } catch (err) {
      console.error('Ошибка при получении пользователя', err);
    }
  };

  fetchUser();
}, []);


  // Состояния для управления интерфейсом
  const [items, setItems] = useState([{
    id: null,
    name: '',
    description: '',
    members: [],
    creator: {},
    messages: []
  }]); // Массив всех команд (или чатов)	Чтобы отобразить список слева (например, все команды)
  const [searchQuery, setSearchQuery] = useState('');
  const [activeItem, setActiveItem] = useState(null); // 	Одна выбранная команда	Чтобы отобразить её подробности (участники, кнопки и т.д.)
  const [activeTab, setActiveTab] = useState('chats');
  const [containerHeight, setContainerHeight] = useState('90vh');
  const [error, setError] = useState(null); // Для отображения ошибок
  
  // Состояния для модального окна создания
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');

  // Состояния для управления командами
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('frontend');
  const [showTeamSettings, setShowTeamSettings] = useState(false);
  const [teamSettingsData, setTeamSettingsData] = useState({
    name: '',
    description: ''
  });

  // Состояние для формы поиска пользователей
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Состояния для формы поиска членов чата
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [participantSearchEmail, setParticipantSearchEmail] = useState('');
  const [participantSearchResults, setParticipantSearchResults] = useState([]);
  const [isParticipantSearching, setIsParticipantSearching] = useState(false);

  // Состояния для управления модальным окном чата
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [chatSettingsData, setChatSettingsData] = useState({
    participants: []
  });
  

  // Загрузка данных при изменении активной вкладки
  // UseEffect для загрузки данных при изменении активной вкладки
  // Памятка по useEffect:
  // 1. Первый параметр - функция, которая будет выполнена после рендера компонента.
  // 2. Второй параметр - массив зависимостей. 
  // Про массив зависимостей:
  // Если массив пуст, функция будет выполнена только один раз при монтировании компонента. [] - это значит, что функция будет выполнена только при первом рендере компонента.
  // Если массив не пуст, функция будет выполнена при изменении значения любого из элементов массива. [a, b] - Выполняется при первом рендере и каждый раз, когда a или b изменяется
  // Если вообще без массива - Выполняется при каждом рендере компонента.
  // 
  //   useEffect(() => {
  //   // тут код, который выполнится
  // }, [зависимости]);

  // Про стрелочные функции:
  // Стрелочные функции - это более короткая форма записи функций в JavaScript. Они были добавлены в JavaScript в ECMAScript 6 (ES6).
  // Пример, как выглядит стрелочная функция: (парметры) => {тело функции}
  // Но если паремтр один и тело функции простое, то она может выглядить вот так: res => res.json()
  // парметр стрелочной функции (слева от стрелки) => тело функции (справа от стрелки) 
  // Стрелочные функции возвращают результат своего выполнения. то есть, вот эта штука: res => res.json() вернёт какой-то результат
  // в виде распакованного объекта в формате json. Эти результаты можно использовать в цеочных функциях, типа
  // fetch('https://api.example.com/data').then(res => res.json()).then(data => console.log(data)); 
  // data - это результат выполнения функции res => res.json()


// const fetchData = async () => { ... }
    // Объявляется асинхронная функция fetchData
    // Мы не можем сделать сам useEffect async, поэтому объявляем async-функцию внутри и сразу вызываем её
    const fetchData = async () => {
      try {
        const endpoint = activeTab === 'chats' ? '/api/chats' : '/api/teams'; // Определяем endpoint, Если активная вкладка — chats, то получаем чаты
        // Формируем тело ответа <<response>> на запрос
        // await по англ. - жди. Это значит, что мы ждём, пока сервер не одаст нам данные.
        //
        // axios — это библиотека для отправки HTTP-запросов (GET, POST и др.) с фронтенда на сервер.
        // Альтернатива fetch, но более удобная:
        // умеет автоматически превращать JSON в объект (не надо делать распаковку как тут: fetch('...').then(res => res.json()).then(data => console.log(data)))
        // легче настраивать заголовки, таймауты, перехватчики ошибок (Важно!)
        // работает с async/await без лишней мороки

        console.log('Запрос к серверу...');

        const response = await axios.get(`https://team-messenger-server.onrender.com${endpoint}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        console.log('Сообщение после axios.get');

        // Логирование
        console.log('Ответ сервера (response):', response);

        console.log('Тип данных response.data:', typeof response.data);
        console.log('response.data:', response.data);

        setItems(response.data); // Сохраняем данные, полученные от axios в состояние items (хук React)

        // Обновляем активный чат, если он есть
        if (activeItem && activeTab === 'chats') {
          const updatedChat = response.data.find(chat => chat.id === activeItem.id);
          if (updatedChat) {
            setActiveItem(updatedChat);
          }
        }

        return response.data; // <<< Возвращаем данные, чтобы можно было использовать их в других местах кода
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        setError('Не удалось загрузить данные');
        return []; // чтобы избежать undefined
      }
    };

    const getChats = async () => {
      try {
        const response = await axios.get('https://team-messenger-server.onrender.com/api/chats', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        return response.data;
      } catch (error) {
        console.error('Ошибка загрузки чатов:', error);
      }
    }
  
  // Теперь, про конкретно эту useEffect:
  // 1. Первый параметр - это большая стрелочная функция, которая будет выполнена после рендера компонента.
  // 2. Второй параметр - массив зависимостей. Он с параметром, то есть useEffect будет выполняться каждый раз, при изменении параметра activeTab
  // tab по англ. - вкладка. (activeTab написан как переменная состояния (хук) выше в хуках React (оно меняется при нажатии на кнопки переключения пользователем))
  // То есть это как "следи за вкладкой, и если она поменяется — загрузи данные"
  useEffect(() => {
    
    // Вызываем функции: fetchData
    fetchData();
    setActiveItem(null); // Сбрасываем активный элемент при переключении вкладки
  }, [activeTab]);

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Полезные штуки:
  // 1. Функция, которая обрезает строку до указанной длины и добавляет многоточие, если строка длиннее указанной длины
  const truncate = (text, maxLength = 30) =>
  text?.length > maxLength ? text.slice(0, maxLength) + '…' : text;

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  // Обработчик создания нового чата/команды
  const handleCreateItem = async () => {
    try {
      // Валидация названия
      if (!newItemName.trim()) { // newItemName - переменная состояния (хук React, написан вначале кода)
        setError('Название не может быть пустым');
        return;
      }
      console.log('Выбранный участник selectedParticipant:', selectedParticipant);
      const endpoint = activeTab === 'chats' ? '/api/chats' : '/api/teams';
      const payload = activeTab === 'chats' 
        ? { name: newItemName,
            participantId: selectedParticipant?.id // Используем одного участника
          }
        : { 
            name: newItemName, 
            description: newItemDescription,
            // Не передаём пустой массив, инчае ломается отображение создателя в кратк. описании и в участиниках команды
          };
      
      let response = await axios.post(
        `https://team-messenger-server.onrender.com${endpoint}`,
        payload,
        { 
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      response = await fetchData(); // Обновляем данные после создания
      //Выполнение функции axios.post() вернёт:
      //объект response со следующей структурой:
      // {
      //   data: { ... },         // ответ от сервера (данные)
      //   status: 200,           // HTTP-статус (например, 200 OK, 201 Created и т.д.)
      //   statusText: 'OK',
      //   headers: { ... },      // заголовки ответа
      //   config: { ... },       // конфигурация запроса (то, что ты отправлял)
      //   request: { ... }       // объект запроса (внутренний, редко используется)
      // }

      // Обновляем интерфейс
      // ...items - Это оператор расширения (spread operator) в JavaScript.
      // [...items, response.data] означает: 
      // Создай новый массив, в который:
      // добавь все текущие элементы из items (с помощью ...items)
      // и в конце добавь новый элемент — response.data (это то, что вернул сервер после создания)
      // К примеру,
      // Если items = ['A', 'B'], а response.data = 'C', то: [...items, response.data]  будет  ['A', 'B', 'C']
      // setItems([...items, response.data]);
      setItems(response); 
      setActiveItem(response.data);
      setShowCreateModal(false); // Закрываем модальное окно создания элемента.
      setNewItemName(''); // Очищаем поля ввода
      setNewItemDescription(''); //Очищаем поля ввода
      setSelectedParticipant(null);
      setError(null);
    } catch (error) {
      console.error('Ошибка создания:', error);
      setError(error.response?.data?.error || 'Ошибка при создании');
    }
  };

  // Рассчитываем высоту контейнера с учетом навбара
  useEffect(() => {
    const navbarHeight = document.querySelector('nav')?.offsetHeight || 60;
    setContainerHeight(`calc(100vh - ${navbarHeight}px)`);
  }, []);


  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Обработчики окна поиска пользователей:
  const searchUsers = async (email) => {
    try {
      setIsSearching(true);
      const response = await axios.get(`https://team-messenger-server.onrender.com/api/users/search?email=${email}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Ошибка поиска пользователей:', error);
      setError('Не удалось выполнить поиск');
    } finally {
      setIsSearching(false);
    }
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setNewMemberEmail(email);
    
    // Ищем пользователей при вводе 3+ символов
    if (email.length >= 3) {
      searchUsers(email);
    } else {
      setSearchResults([]);
    }
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Обработчики окна управления командами:

  // Добавим в начало компонента HomePage, перед return
  const getCurrentUserId = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Токен не найден');
      return null;
    }
    
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      return decoded.id;
    } catch (error) {
      console.error('Ошибка при декодировании токена:', error);
      return null;
    }
  };

  const handleAddMember = async () => {
    try {
      if (!activeItem) {
        setError('Не выбрана команда');
        return;
      }

      if (!newMemberEmail) {
        setError('Введите email участника');
        return;
      }

      await axios.post(
        `https://team-messenger-server.onrender.com/api/teams/${activeItem.id}/members`,
        { email: newMemberEmail, role: newMemberRole },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Загрузим все команды и найдем нужную
      const updatedItems = await fetchData();
      const updatedTeam = updatedItems.find(item => item.id === activeItem.id);

      if (updatedTeam) {
        setActiveItem(updatedTeam);
      }

      setShowAddMemberModal(false);
      setNewMemberEmail('');
      setError(null);
    } catch (error) {
      console.error('Ошибка при добавлении участника:', error);
      setError(error.response?.data?.error || 'Не удалось добавить участника');
    }
  };


  const handleRemoveMember = async (userId) => {
    try {
      if (!activeItem) {
        setError('Не выбрана команда');
        return;
      }

      await axios.delete(
        `https://team-messenger-server.onrender.com/api/teams/${activeItem.id}/members/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Загружаем обновлённые данные
      const updatedItems = await fetchData(); // Получаем из fetchData все обновлёенные команды и чаты
      const updatedTeam = updatedItems.find(item => item.id === activeItem.id); // Находим среди них нужную нам (обновлёенную)

      if (updatedTeam) { // ОБновляем данные изменённой команды
        setActiveItem(updatedTeam);
      }

      setError(null);
    } catch (error) {
      console.error('Ошибка при удалении участника:', error);
      setError(error.response?.data?.error || 'Не удалось удалить участника');
    }
  };


  const handleUpdateTeam = async () => {
    try {

      if (!activeItem) {
        setError('Не выбрана команда');
        return;
      }

      const updatedName = teamSettingsData.name;
      const updatedDescription = teamSettingsData.description

      const response = await axios.put(
        `https://team-messenger-server.onrender.com/api/teams/${activeItem.id}`,
        teamSettingsData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
    // Обновляем activeItem, чтобы он отразил изменения и кнопка "Настройки" не пропала
      setActiveItem({
        ...activeItem,
        name: updatedName,
        description: updatedDescription,
      });

      // 2. Обновляем список команд
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === activeItem.id ? response.data : item
        )
      );
      setShowTeamSettings(false);
      setError(null);
    } catch (error) {
      console.error('Ошибка при обновлении команды:', error);
      setError(error.response?.data?.error || 'Не удалось обновить команду');
    }
  };

  const handleDeleteTeam = async () => {
    try {

      if (!activeItem) {
        setError('Не выбрана команда');
        return;
      }

      await axios.delete(
        `https://team-messenger-server.onrender.com/api/teams/${activeItem.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Обновляем список команд
      const response = await axios.get(
        'https://team-messenger-server.onrender.com/api/teams',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setItems(response.data);
      setActiveItem(null);
      setShowTeamSettings(false);
    } catch (error) {
      console.error('Ошибка при удалении команды:', error);
      setError(error.response?.data?.error || 'Не удалось удалить команду');
    }
  };
  
  // Функция для перхода в чат команды из команды
  const handleGoToTeamChat = async () => {
    console.log('handleGoToTeamChat called');
    const teamChatId = activeItem?.teamChats?.[0]?.id;

    if (!teamChatId) {
      console.warn('Чат команды не найден');
      return;
    }

    try {
      const allChats = await getChats(); 
      console.log('allChats:', allChats);
      console.log('teamChatId:', teamChatId);
      const fullChat = allChats.find(c => c.id === teamChatId);

      if (fullChat) {
        setActiveTab('chats');
        setTimeout(() => {
          setActiveItem(fullChat);
        }, 50);
      } else {
        console.warn('Полный чат не найден');
      }
    } catch (error) {
      console.error('Ошибка при загрузке чатов:', error);
    }
  };


  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Обработчики чатов

  // Функция для поиска участников чата
  const searchParticipant = async (email) => {
    try {
      setIsParticipantSearching(true);
      const response = await axios.get(`https://team-messenger-server.onrender.com/api/users/search?email=${email}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setParticipantSearchResults(response.data);
    } catch (error) {
      console.error('Ошибка поиска пользователей:', error);
      setError('Не удалось выполнить поиск');
    } finally {
      setIsParticipantSearching(false);
    }
  };

  const handleParticipantSearchChange = (e) => {
    const email = e.target.value;
    setParticipantSearchEmail(email);
    
    if (email.length >= 3) {
      searchParticipant(email);
    } else {
      setParticipantSearchResults([]);
    }
  };

  const selectParticipant = (user) => {
    setSelectedParticipant(user);
    setParticipantSearchEmail('');
    setParticipantSearchResults([]);
  };

  const removeSelectedParticipant = () => {
    setSelectedParticipant(null);
  };

  // Обработчик удаления чата
  const handleDeleteChat = async () => {
    try {
      if (!activeItem) {
        setError('Не выбран чат');
        return;
      }

      await axios.delete(
        `https://team-messenger-server.onrender.com/api/chats/${activeItem.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Обновляем список чатов
      const response = await axios.get(
        'https://team-messenger-server.onrender.com/api/chats',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setItems(response.data);
      setActiveItem(null);
      setShowChatSettings(false);
    } catch (error) {
      console.error('Ошибка при удалении чата:', error);
      setError(error.response?.data?.error || 'Не удалось удалить чат');
    }
  };


  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <Container fluid className="p-0" style={{ height: containerHeight }}>
      {/* Модальное окно создания */}
      <Modal show={showCreateModal} onHide={() => {
        setShowCreateModal(false);
        setError(null);
        setSelectedParticipant(null);
        setParticipantSearchEmail('');
      }}>
        <Modal.Header closeButton>
          <Modal.Title>
            {activeTab === 'chats' ? 'Создать чат' : 'Создать команду'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Название *</Form.Label>
              <Form.Control
                type="text"
                placeholder={`Введите название ${activeTab === 'chats' ? 'чата' : 'команды'}`}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                required
              />
            </Form.Group>
            
            {activeTab === 'chats' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Добавить участника</Form.Label>
                  {selectedParticipant ? (
                    <div className="d-flex align-items-center mb-2 p-2 bg-light rounded">
                      <div className="flex-grow-1">
                        {selectedParticipant.firstName} {selectedParticipant.lastName} ({selectedParticipant.email})
                      </div>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={removeSelectedParticipant}
                      >
                        Удалить
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Form.Control
                        type="email"
                        placeholder="Введите email участника"
                        value={participantSearchEmail}
                        onChange={handleParticipantSearchChange}
                      />
                      {isParticipantSearching && <small>Поиск...</small>}
                    </>
                  )}
                </Form.Group>
                
                {participantSearchResults.length > 0 && !selectedParticipant && (
                  <div className="mb-3">
                    <ListGroup>
                      {participantSearchResults.map(user => (
                        <ListGroup.Item 
                          key={user.id}
                          action
                          onClick={() => selectParticipant(user)}
                        >
                          <div>{user.firstName} {user.lastName} ({user.email})</div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </div>
                )}
              </>
            )}
            
            {activeTab === 'teams' && (
              <Form.Group className="mb-3">
                <Form.Label>Описание</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Краткое описание команды"
                  value={newItemDescription}
                  onChange={(e) => setNewItemDescription(e.target.value)}
                />
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowCreateModal(false);
            setSelectedParticipant(null);
          }}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleCreateItem}>
            Создать
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Основной интерфейс */}
      <Row className="g-0 h-100">
        {/* Левая колонка - список */}
        <Col md={4} className="border-end h-100 d-flex flex-column">
          {/* Вкладки чаты/команды */}
          <Tabs activeKey={activeTab} onSelect={(k) => {
            setActiveTab(k);
            setSearchQuery(''); // Сбрасываем поисковый запрос при переключении вкладок
            }} className="px-3 pt-2">
            <Tab eventKey="chats" title={<><ChatLeftText className="me-1" /> Чаты</>} />
            <Tab eventKey="teams" title={<><PeopleFill className="me-1" /> Команды</>} />
          </Tabs>

          {/* Панель управления с поиском и кнопкой создания */}
          <div className="p-3 border-bottom">
            <div className="d-flex align-items-center">
              <Form.Control
                type="search"
                placeholder={`Поиск ${activeTab === 'chats' ? 'чатов' : 'команд'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="me-2"
              />
              <Button 
                variant="outline-primary" 
                className="rounded-circle p-1"
                title={activeTab === 'chats' ? 'Создать чат' : 'Создать команду'}
                style={{ width: '38px', height: '38px' }}
                onClick={() => {
                  setNewItemName('');
                  setNewItemDescription('');
                  setError(null);
                  setShowCreateModal(true); // Открываем модальное окно создания
                }}
              >
                <PlusCircle size={27} />
              </Button>
            </div>
          </div>
          
          {/* Список чатов/команд с прокруткой */}
          <ListGroup variant="flush" className="flex-grow-1 overflow-auto">
            {items?.filter(item => 
              item && item?.name && item?.name.toLowerCase().includes(searchQuery.toLowerCase())
            ).map(item => (
              <ListGroup.Item 
                key={item.id}
                action 
                active={activeItem?.id === item.id}
                onClick={() => setActiveItem(item)}
                className="d-flex justify-content-between align-items-start"
              >
                <div>
                  <strong>{item.name}</strong>
                  <div className="text-muted small">
                    {activeTab === 'chats'
                      ? truncate(item.lastMessage?.text || 'Нет сообщений')
                      : truncate(item.description || 'Нет описания')}
                  </div>
                </div>
                {activeTab === 'chats' && item.unreadCount > 0 && (
                  <Badge bg="primary" pill>{item.unreadCount}</Badge>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>

        {/* Правая колонка - рабочая область */}
        <Col md={8} className="h-100 d-flex flex-column">
          {activeItem ? (
            <>
              {/* Шапка с названием чата/команды */}
              <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                <h4 className="mb-0">
                  {activeTab === 'chats' ? (
                    <ChatLeftText className="me-2" />
                  ) : (
                    <PeopleFill className="me-2" />
                  )}
                  {activeItem.name}
                </h4>
                
                {/* Кнопки управления в зависимости от типа элемента */}
                {activeTab === 'teams' && activeItem?.teamChats?.length > 0 ? (
                  <Button 
                    variant="outline-primary"
                    size="sm"
                    onClick={handleGoToTeamChat}
                  >
                    <ChatLeftText className="me-1" />
                    Перейти в чат
                  </Button>
                ) : activeTab === 'chats' && (
                  <Button 
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      console.log('activeItem при переходе в настройки чата:', activeItem);
                      setChatSettingsData({
                        participants: activeItem.participants || []
                      });
                      setShowChatSettings(true);
                    }}
                  >
                    Управление чатом
                  </Button>
                )}
              </div>



              {/* Основное содержимое */}
              <div className="flex-grow-1 overflow-auto p-3">
                {activeTab === 'chats' ? (
                  <ChatWindow chat={activeItem} 
                  user={user} 
                  onMessageSent={fetchData} // Эта функция будет вызываться при обновлении чатов
                  />
                  // Отображение сообщений чата
                  // activeItem.messages?.length > 0 ? (
                  //   activeItem.messages.map(message => (
                  //     <div key={message.id} className="mb-3">
                  //       <div className="d-flex">
                  //         <strong className="me-2">{message.sender.name}:</strong>
                  //         <span>{message.text}</span>
                  //       </div>
                  //       <small className="text-muted">
                  //         {new Date(message.createdAt).toLocaleTimeString()}
                  //       </small>
                  //     </div>
                  //   ))
                  // ) : (
                  //   <div className="text-muted text-center mt-5">Нет сообщений</div>
                  // )
                ) : (
                  // Отображение информации о команде
                  // Отображение краткой информации о команде
                                    // <div className="mb-4">
                                    //   <h5>Описание команды</h5>
                                    //   <p className="text-muted">
                                    //     {activeItem.description || 'Описание отсутствует'}
                                    //   </p>
                                    //   <div className="d-flex justify-content-between align-items-center">
                                    //     <small className="text-muted">
                                    //       Создатель: {activeItem.creator?.firstName} {activeItem.creator?.lastName}
                                    //     </small>
                                    //     <small className="text-muted">
                                    //       Дата создания: {new Date(activeItem.createdAt).toLocaleDateString()}
                                    //     </small>
                                    //   </div>
                                    // </div>

                  <div>
                    {console.log('activeItem', activeItem)}
                    {/* Блок с описанием команды */}
                    {activeItem.description && (
                      <div className="mb-4 p-3 bg-light rounded">
                        <h5>Описание команды:</h5>
                        <p>{activeItem.description}</p>
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            Создатель: {activeItem.creator?.firstName} {activeItem.creator?.lastName}
                          </small>
                          <small className="text-muted">
                            Дата создания: {new Date(activeItem.createdAt).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                    )}
                    {/* Блок с отображением участников команды */}
                    <h5 className="mt-4 d-flex justify-content-between align-items-center">
                      Участники ({activeItem?.members?.length})
                      {activeItem?.creator?.id === getCurrentUserId() && (
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => setShowAddMemberModal(true)}
                        >
                          Добавить
                        </Button>
                      )}
                    </h5>
                    {console.log('activeItem.members', activeItem.members)}
                    <ListGroup>
                      {activeItem.members?.filter(
                        m => m && m.user && m.user.id !== undefined
                      ).length > 0 ? (
                        activeItem.members
                          .filter(m => m && m.user && m.user.id !== undefined)
                          .map((member, index) => {
                            console.log(`member[${index}]`, member);

                            const memberUserId = member.user.id;
                            const currentUserId = getCurrentUserId();
                            const creatorId = activeItem?.creator?.id;

                            return (
                              <ListGroup.Item
                                key={memberUserId}
                                className="d-flex justify-content-between align-items-center"
                              >
                                <div>
                                  {member.user.firstName} {member.user.lastName}
                                  {member.role && (
                                    <Badge bg="secondary" className="ms-2">
                                      {member.role}
                                    </Badge>
                                  )}
                                </div>

                                {creatorId === currentUserId &&
                                  memberUserId !== currentUserId && (
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => handleRemoveMember(memberUserId)}
                                    >
                                      Удалить
                                    </Button>
                                  )}
                              </ListGroup.Item>
                            );
                          })
                      ) : (
                        <ListGroup.Item className="text-muted">
                          Нет участников
                        </ListGroup.Item>
                      )}
                    </ListGroup>



                    {/* Добавим кнопку настроек команды рядом с названием */}
                    <div className="p-3 mt-3 bottom-0 d-flex justify-content-end align-items-center">
                      {activeTab === 'teams' && activeItem?.creator?.id === getCurrentUserId() && (
                        <Button 
                          variant="outline-secondary"
                          onClick={() => {
                            setTeamSettingsData({
                              name: activeItem.name,
                              description: activeItem.description
                            });
                            setShowTeamSettings(true);
                          }}
                        >
                          Настройки команды
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Форма ввода сообщения (только для чатов) */}
              {/* {activeTab === 'chats' && (
                <div className="p-3 border-top">
                  <Form className="d-flex">
                    <Form.Control
                      type="text"
                      placeholder="Введите сообщение..."
                      className="me-2"
                    />
                    <Button variant="primary">Отправить</Button>
                  </Form>
                </div>
              )} */}
            </>
          ) : (
            // Заглушка при отсутствии выбранного чата/команды
            <div className="d-flex flex-column align-items-center justify-content-center h-100">
              <h4 className="text-muted">
                {activeTab === 'chats' 
                  ? 'Выберите чат' 
                  : 'Выберите команду'}
              </h4>
            </div>
          )}
        </Col>
      </Row>


      {/* Модальное окно добавления участника */}
      <Modal show={showAddMemberModal} onHide={() => {
        setShowAddMemberModal(false);
        setSearchResults([]);
        setError(null);
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Добавить участника</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Email участника *</Form.Label>
              <Form.Control
                type="email"
                placeholder="Введите email участника"
                value={newMemberEmail}
                onChange={handleEmailChange}
                required
              />
              {isSearching && <small>Поиск...</small>}
            </Form.Group>
            
            {/* Список результатов поиска */}
            {searchResults.length > 0 && (
              <div className="mb-3">
                <h6>Найденные пользователи:</h6>
                <ListGroup>
                  {searchResults.map(user => (
                    <ListGroup.Item 
                      key={user.id}
                      action
                      onClick={() => {
                        setNewMemberEmail(user.email);
                        setSearchResults([]);
                      }}
                    >
                      <div>{user.name} ({user.email})</div>
                      <small className="text-muted">{user.position || 'Должность не указана'}</small>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Роль</Form.Label>
              <Form.Select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
              >
                <option value="admin">Администратор</option>
                <option value="backend">Бэкенд-разработчик</option>
                <option value="frontend">Фронтенд-разработчик</option>
                <option value="designer">Дизайнер</option>
                <option value="manager">Менеджер</option>
                <option value="qa">Тестировщик</option>
                <option value="devops">DevOps-инженер</option>
                <option value="analyst">Аналитик</option>
                <option value="product_owner">Владелец продукта</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowAddMemberModal(false);
            setSearchResults([]);
          }}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleAddMember}>
            Добавить
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Модальное окно настроек команды */}
      <Modal show={showTeamSettings} onHide={() => setShowTeamSettings(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Настройки команды</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Название команды *</Form.Label>
              <Form.Control
                type="text"
                value={teamSettingsData.name}
                onChange={(e) => setTeamSettingsData({...teamSettingsData, name: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Описание</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={teamSettingsData.description}
                onChange={(e) => setTeamSettingsData({...teamSettingsData, description: e.target.value})}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleDeleteTeam}>
            Удалить команду
          </Button>
          <Button variant="secondary" onClick={() => setShowTeamSettings(false)}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleUpdateTeam}>
            Сохранить
          </Button>
        </Modal.Footer>
      </Modal>


      {/* Модальное окно настроек чата */}
      {/* Модальное окно настроек чата */}
<Modal show={showChatSettings} onHide={() => setShowChatSettings(false)}>
  <Modal.Header closeButton>
    <Modal.Title>
      {activeItem?.teamId ? 'Чат команды' : 'Настройки чата'}
    </Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {error && <Alert variant="danger">{error}</Alert>}
    
    <h5>Участники чата:</h5>
    <ListGroup>
      {chatSettingsData.participants?.length > 0 ? (
        chatSettingsData.participants.map(participant => (
          <ListGroup.Item key={participant.id}>
            {participant.firstName} {participant.lastName} ({participant.email})
          </ListGroup.Item>
        ))
      ) : (
        <ListGroup.Item className="text-muted">
          Нет участников
        </ListGroup.Item>
      )}
    </ListGroup>
  </Modal.Body>
  <Modal.Footer>
    {/* Показываем кнопку удаления только для НЕ командных чатов */}
    {!activeItem?.teamId && (
      <Button variant="danger" onClick={handleDeleteChat}>
        Удалить чат
      </Button>
    )}
    <Button variant="secondary" onClick={() => setShowChatSettings(false)}>
      Закрыть
    </Button>
  </Modal.Footer>
</Modal>

    </Container>
  );
}