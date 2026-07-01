const DEFAULT_CHAT_SORT_MODE = 'newest';

const state = {
  chats: [],
  vaultLoaded: false,
  vaultRoot: '',
  vaultErrors: [],
  vaultLoadError: '',
  vaultLoadDetail: '',
  selectedChatId: null,
  mediaOnly: false,
  lightboxPhotos: [],
  lightboxIndex: -1,
  photoContexts: {},
  photoContextIndexes: {},
  mediaMode: 'all',
  isPickingFolder: false,
  activeSection: 'vault',
  conversationMode: 'chats',
  chatSearchQuery: '',
  chatSortMode: DEFAULT_CHAT_SORT_MODE,
  chatCache: {},
  senderFilterSignature: '',
  messagesRequestId: 0,
  allMessages: [],
  ownerSenderKey: '',
  selectedDay: null,
  selectedPersonKey: null,
  peopleList: [],
};

const $ = (id) => document.getElementById(id);

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

const icons = {
  messages: `
    <svg class="meta-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v6A2.5 2.5 0 0 1 16.5 14H11l-4.2 3.3A.5.5 0 0 1 6 16.9v-2.8a2.5 2.5 0 0 1-1-2V5.5Z" />
    </svg>
  `,
  media: `
    <svg class="meta-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 18.5v-13Zm3.2 1.2v8.6l2.8-3.2 2.1 2.5 1.4-1.5 2.3 2.7V6.7H8.2Z" />
    </svg>
  `,
  date: `
    <svg class="meta-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 3a1 1 0 0 1 1 1v1h8V4a1 1 0 1 1 2 0v1.1A2.9 2.9 0 0 1 20.5 8v9.1A2.9 2.9 0 0 1 17.6 20H6.4a2.9 2.9 0 0 1-2.9-2.9V8A2.9 2.9 0 0 1 6 5.1V4a1 1 0 0 1 1-1Zm-1.5 7v7.1c0 .5.4.9.9.9h11.2c.5 0 .9-.4.9-.9V10h-13Z" />
    </svg>
  `,
  folder: `
    <svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M3.8 6.3a2 2 0 0 1 2-2h4.4l2 2h6a2 2 0 0 1 2 2v1.2H3.8V6.3Z" />
      <path d="M3 10h18l-1.6 7.4a2.2 2.2 0 0 1-2.1 1.8H6.7a2.2 2.2 0 0 1-2.1-1.8L3 10Z" />
    </svg>
  `,
  file: `
    <svg class="file-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6.5 3h7.8L19 7.7v10.8a2.5 2.5 0 0 1-2.5 2.5h-10A2.5 2.5 0 0 1 4 18.5v-13A2.5 2.5 0 0 1 6.5 3Zm7 1.9V8h3.1L13.5 4.9Z" />
    </svg>
  `,
  chevronLeft: `
    <svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M15 6 9 12l6 6" />
    </svg>
  `,
  chevronRight: `
    <svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m9 6 6 6-6 6" />
    </svg>
  `,
  close: `
    <svg class="close-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 7l10 10M17 7 7 17" />
    </svg>
  `,
};

const text = {
  telegramSticker: 'стикер Telegram',
  animatedTelegramSticker: 'анимированный стикер Telegram',
  chooseFolder: 'добавить в хранилище',
  choosingFolder: 'ожидание выбора...',
  openingPicker: 'открываю системное окно выбора папки...',
  checkingStartupVault: 'проверяем последнее хранилище...',
  pasteFolderFirst: 'сначала вставь путь к папке экспорта',
  indexingVault: 'индексирую хранилище...',
  chatsFound: 'найдено чатов',
  errors: 'ошибок',
  messages: 'сообщений',
  media: 'медиа',
  noDate: 'нет даты',
  allSenders: 'все отправители',
  mediaOnly: 'только медиа',
  on: 'вкл',
  off: 'выкл',
  nothingFound: 'ничего не найдено',
  changeFilters: 'попробуй изменить поиск, фильтр или вкладку',
  system: 'system',
  systemSender: 'Системные события',
  pinnedMessage: 'закреплено сообщение',
  pinnedMessageFallback: 'сообщение',
  genericService: 'системное событие Telegram',
  requestFailed: 'не удалось выполнить запрос',
  fileMissing: 'файл не найден',
  imageUnavailable: 'изображение недоступно',
  videoUnavailable: 'видео недоступно',
  audioUnavailable: 'аудио недоступно',
  fileUnavailable: 'файл недоступен',
  stickerUnavailable: 'стикер недоступен',
  animatedStickerUnavailable: 'анимированный стикер недоступен',
  open: 'открыть',
  close: 'закрыть',
  previous: 'назад',
  next: 'вперёд',
  openOriginal: 'открыть оригинал',
  unknownType: 'тип неизвестен',
  backToTimeline: 'назад к Timeline',
  backToPeople: 'назад к людям',
  addFirstExport: 'добавь первый экспорт в хранилище',
  conversationsNotFound: 'переписки не найдены',
  conversationsEmptyBody: 'добавь экспорт, чтобы увидеть сохранённые переписки',
  chatSearchNothingFound: 'ничего не найдено',
  chatSearchNothingFoundBody: 'попробуй изменить запрос',
  chatMessagesNotFound: 'сообщений не найдено',
  chatMessagesNotFoundBody: 'попробуй другой запрос',
  chatFilterNothingFoundBody: 'попробуй изменить фильтр',
  mediaFilterNothingFoundBody: 'попробуй изменить фильтр или вкладку',
  noChatMessages: 'сообщений нет',
  noChatMessagesBody: 'в этом чате пока нечего показать',
  savedVaultMissing: 'сохранённое хранилище не найдено',
  savedVaultMissingBody: 'Последняя папка недоступна. Добавь папку экспорта Telegram ещё раз.',
  storageReady: 'хранилище открыто',
  storageLoading: 'загружаем хранилище...',
  storageNotSelected: 'хранилище не выбрано',
  storageNotSelectedBody: 'Добавь папку экспорта Telegram, чтобы увидеть переписки.',
  storageNoChatsBody: 'В выбранной папке не найдены подходящие чаты Telegram export.',
  storageLoadFailed: 'не удалось открыть хранилище',
  storageLoadFailedBody: 'Проверь, что выбрана папка экспорта Telegram.',
  storageTryAnotherFolder: 'Попробуй добавить другую папку через кнопку "добавить в хранилище".',
  storagePartialErrors: 'часть файлов не загрузилась',
  storageReadyShort: 'готово',
  storageFolderFallback: 'папка экспорта',
  chooseConversationTitle: 'Выбери переписку слева',
  chooseConversationBody: 'Хранилище загружено. Открой любую переписку, чтобы читать сообщения и медиа.',
  mediaLabels: {
    all: 'все',
    photo: 'фото',
    video: 'видео',
    audio: 'аудио',
    file: 'файлы',
  },
  mediaEmptyStates: {
    photo: {
      title: 'фото не найдены',
      body: 'в этой переписке нет фото',
    },
    video: {
      title: 'видео не найдены',
      body: 'в этой переписке нет видео',
    },
    audio: {
      title: 'аудио не найдено',
      body: 'в этой переписке нет аудио',
    },
    file: {
      title: 'файлы не найдены',
      body: 'в этой переписке нет файлов',
    },
  },
};

let audioMetadataObserver = null;
let videoMetadataObserver = null;

async function api(path, options = {}) {
  const res = await fetch(path, options);
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.error || text.requestFailed);
    error.data = data;
    throw error;
  }
  return data;
}

function setInfo(message, isError = false) {
  setLibraryMessage(message, isError ? 'error' : 'note');
}

function setLibraryMessage(message, kind = 'note', detail = '') {
  const el = $('libraryInfo');
  el.className = `hint library-info library-info--${kind}`;
  el.innerHTML = renderLibraryStatus({
    kind,
    title: message,
    body: detail,
  });
}

function setLibraryEmpty() {
  state.vaultLoaded = false;
  state.vaultRoot = '';
  state.vaultErrors = [];
  state.vaultLoadError = '';
  state.vaultLoadDetail = '';
  setLibraryMessage(text.storageNotSelected, 'empty', text.storageNotSelectedBody);
}

function setLibraryLoading(message = text.storageLoading, details = {}) {
  const stats = [];
  if (Number.isFinite(details.chats)) stats.push(`${formatNumber(details.chats)} ${pluralRu(details.chats, 'чат', 'чата', 'чатов')}`);
  if (Number.isFinite(details.messages)) stats.push(`${formatNumber(details.messages)} ${text.messages}`);
  if (Number.isFinite(details.errors) && details.errors > 0) stats.push(`${formatNumber(details.errors)} ${text.errors}`);
  $('libraryInfo').className = 'hint library-info library-info--loading';
  $('libraryInfo').innerHTML = renderLibraryStatus({
    kind: 'loading',
    title: message,
    body: details.root ? folderNameFromPath(details.root) : '',
    path: details.root || '',
    stats,
  });
}

function setLibraryReady(data, totalMessages = null) {
  const root = data.root || state.vaultRoot || data.lastVaultPath || '';
  const chats = Array.isArray(data.chats) ? data.chats : state.chats;
  const errors = Array.isArray(data.errors) ? data.errors : state.vaultErrors;
  const messageCount = Number.isFinite(totalMessages) ? totalMessages : countMessagesFromChats(chats);
  state.vaultRoot = root;
  state.vaultErrors = errors;
  state.vaultLoadError = '';
  state.vaultLoadDetail = '';
  $('libraryInfo').className = `hint library-info library-info--${errors.length ? 'warning' : 'ready'}`;
  $('libraryInfo').innerHTML = renderLibraryStatus({
    kind: errors.length ? 'warning' : 'ready',
    title: errors.length ? text.storagePartialErrors : text.storageReady,
    body: root ? folderNameFromPath(root) : text.storageFolderFallback,
    path: root,
    stats: [
      `${formatNumber(chats.length)} ${pluralRu(chats.length, 'чат', 'чата', 'чатов')}`,
      `${formatNumber(messageCount)} ${text.messages}`,
      ...(errors.length ? [`${formatNumber(errors.length)} ${text.errors}`] : []),
      text.storageReadyShort,
    ],
  });
}

function setLibraryError(error, details = {}) {
  const friendly = formatLibraryError(error);
  state.vaultLoadError = friendly.title;
  state.vaultLoadDetail = friendly.body;
  state.vaultRoot = details.root || details.lastVaultPath || state.vaultRoot || '';
  $('libraryInfo').className = 'hint library-info library-info--error';
  $('libraryInfo').innerHTML = renderLibraryStatus({
    kind: 'error',
    title: friendly.title,
    body: friendly.body,
    detail: friendly.detail,
    path: state.vaultRoot,
  });
}

function renderLibraryStatus({ kind, title, body = '', detail = '', path = '', stats = [] }) {
  const bodyHtml = body ? `<div class="library-status__body">${escapeHtml(body)}</div>` : '';
  const detailHtml = detail ? `<div class="library-status__detail">${escapeHtml(detail)}</div>` : '';
  const pathHtml = path
    ? `<div class="library-status__path" title="${escapeAttr(path)}">${escapeHtml(path)}</div>`
    : '';
  const statsHtml = stats.length
    ? `<div class="library-status__stats">${stats.map(item => `<span>${escapeHtml(item)}</span>`).join('')}</div>`
    : '';
  return `
    <div class="library-status library-status--${escapeAttr(kind)}">
      <div class="library-status__top">
        <span class="library-status__dot" aria-hidden="true"></span>
        <span class="library-status__title">${escapeHtml(title)}</span>
      </div>
      ${bodyHtml}
      ${pathHtml}
      ${statsHtml}
      ${detailHtml}
    </div>
  `;
}

function formatLibraryError(error) {
  const clean = cleanErrorMessage(error);
  const lower = clean.toLowerCase();
  if (lower.includes('папка не выбрана')) {
    return {
      title: 'папка не выбрана',
      body: 'Выбор папки отменён. Хранилище не изменилось.',
      detail: '',
    };
  }
  if (lower.includes('сохранённое хранилище') || lower.includes('папка не найдена')) {
    return {
      title: lower.includes('сохранённое') ? text.savedVaultMissing : 'папка недоступна',
      body: lower.includes('сохранённое') ? text.savedVaultMissingBody : text.storageLoadFailedBody,
      detail: clean,
    };
  }
  if (lower.includes('result.json')) {
    return {
      title: 'result.json не найден',
      body: 'Выбери папку Telegram export или папку, внутри которой есть экспорт с result.json.',
      detail: clean,
    };
  }
  if (lower.includes('не удалось прочитать') || lower.includes('ни один экспорт')) {
    return {
      title: 'экспорт не прочитан',
      body: 'Структура Telegram export не распознана или файлы повреждены.',
      detail: clean,
    };
  }
  return {
    title: text.storageLoadFailed,
    body: text.storageTryAnotherFolder,
    detail: clean,
  };
}

function cleanErrorMessage(error) {
  const raw = String(error?.message || error || text.requestFailed);
  const lines = raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !line.startsWith('Traceback') && !line.startsWith('File "'));
  return shortText((lines[0] || text.requestFailed).replace(/\s+/g, ' '));
}

function folderNameFromPath(path) {
  const parts = String(path || '').split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] || text.storageFolderFallback;
}

function countMessagesFromChats(chats) {
  return (chats || []).reduce((sum, chat) => sum + Number(chat.message_count || 0), 0);
}

function formatNumber(value) {
  return new Intl.NumberFormat('ru-RU').format(Number(value || 0));
}

function setFolderButtonLoading(isLoading) {
  state.isPickingFolder = isLoading;
  document.querySelectorAll('[data-pick-folder]').forEach(button => {
    button.disabled = isLoading;
    button.setAttribute('aria-busy', String(isLoading));
    button.innerHTML = `${icons.folder}<span>${isLoading ? text.choosingFolder : text.chooseFolder}</span>`;
  });
}

function updateMediaTabs() {
  document.querySelectorAll('[data-media-mode]').forEach(button => {
    const isActive = button.dataset.mediaMode === state.mediaMode;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function updateSectionNav() {
  document.querySelectorAll('[data-section-panel]').forEach(panel => {
    const isActive = panel.dataset.sectionPanel === state.activeSection;
    panel.hidden = !isActive;
    panel.classList.toggle('active', isActive);
  });
}

function setActiveSection(section, options = {}) {
  // TODO: advanced sections may return later; minimal vault UI keeps only saved conversations visible.
  if (section !== 'vault') return;
  state.activeSection = 'vault';
  closeLightbox();
  if (options.render !== false) renderCurrentSection();
}

function renderCurrentSection() {
  if (state.selectedChatId) loadMessages();
  else renderVaultWelcome();
}

function renderConversationList() {
  renderChats();
}

function renderChats() {
  const box = $('chatList');
  $('chatListTitle').textContent = 'Переписки';
  const chats = getVisibleChats();
  box.innerHTML = '';
  if (!chats.length) {
    const hasSearch = Boolean(state.chatSearchQuery.trim());
    const title = hasSearch
      ? text.chatSearchNothingFound
      : state.vaultLoaded
        ? text.conversationsNotFound
        : text.storageNotSelected;
    const body = hasSearch
      ? text.chatSearchNothingFoundBody
      : state.vaultLoaded
        ? text.storageNoChatsBody
        : text.storageNotSelectedBody;
    box.innerHTML = renderEmptyState(
      title,
      body,
      { className: 'empty-state--sidebar' }
    );
    return;
  }
  chats.forEach(chat => {
    const div = document.createElement('button');
    div.type = 'button';
    div.className = 'chat-card' + (chat.id === state.selectedChatId ? ' active' : '');
    const range = [chat.first_date, chat.last_date].filter(Boolean).join(' → ');
    div.innerHTML = `
      <span class="chat-card__title">${escapeHtml(chat.title)}</span>
      <span class="chat-card__stats">${chat.message_count} ${text.messages} · ${chat.media_count} ${text.media}</span>
      <span class="chat-card__date">последнее: ${escapeHtml(chat.last_date || text.noDate)}</span>
      ${range ? `<span class="chat-card__range">${escapeHtml(range)}</span>` : ''}
    `;
    div.addEventListener('click', () => {
      selectChat(chat.id);
    });
    box.appendChild(div);
  });
}

function getVisibleChats() {
  const q = state.chatSearchQuery.trim().toLowerCase();
  const chats = state.chats.filter(chat => !q || conversationSearchText(chat).includes(q));
  return chats.sort(compareChatsForSidebar);
}

function conversationSearchText(chat) {
  const cached = state.chatCache[chat.id];
  if (cached?.searchText) return cached.searchText;
  return buildConversationSearchText(chat, cached?.messages || []);
}

function buildConversationSearchText(chat, messages = []) {
  const senders = uniqueSenderNames(messages.map(messageSender)).join(' ');
  return [chat.title, chat.path, senders].map(value => String(value || '').toLowerCase()).join(' ');
}

function compareChatsForSidebar(a, b) {
  if (state.chatSortMode === 'oldest') return dateSortValue(a.last_date) - dateSortValue(b.last_date);
  if (state.chatSortMode === 'title') return String(a.title || '').localeCompare(String(b.title || ''), 'ru', { sensitivity: 'base' });
  if (state.chatSortMode === 'messages') return Number(b.message_count || 0) - Number(a.message_count || 0);
  if (state.chatSortMode === 'media') return Number(b.media_count || 0) - Number(a.media_count || 0);
  return dateSortValue(b.last_date) - dateSortValue(a.last_date);
}

function renderPeopleList() {
  const box = $('chatList');
  const people = buildPeople();
  state.peopleList = people;
  $('chatListTitle').textContent = 'Люди в переписках';
  box.innerHTML = '';
  if (!people.length) {
    box.innerHTML = '<div class="chat-list-empty">люди появятся после добавления экспорта</div>';
    return;
  }
  people.forEach(person => {
    const div = document.createElement('button');
    div.type = 'button';
    div.className = 'chat-card person-list-card' + (person.key === state.selectedPersonKey ? ' active' : '');
    div.innerHTML = `
      <span class="chat-card__title">${escapeHtml(person.name)}</span>
      <span class="chat-card__stats">
        <span>${icons.messages}${person.messages.length} ${text.messages}</span>
        <span>${icons.media}${person.mediaCount} ${text.media}</span>
      </span>
      <span class="chat-card__date">${escapeHtml(person.firstDate || text.noDate)} → ${escapeHtml(person.lastDate || text.noDate)}</span>
    `;
    div.addEventListener('click', () => {
      state.selectedPersonKey = person.key;
      setActiveSection('vault', { render: false });
      renderConversationList();
      renderPeopleSection();
    });
    box.appendChild(div);
  });
}

async function pickFolder() {
  if (state.isPickingFolder) return;
  setFolderButtonLoading(true);
  try {
    setLibraryLoading(text.openingPicker);
    if (!state.vaultLoaded && !state.selectedChatId) renderVaultWelcome({ mode: 'loading', lead: text.openingPicker });
    const data = await api('/api/pick-folder', { method: 'POST' });
    await afterLibraryLoaded(data);
  } catch (e) {
    setLibraryError(e);
    if (!state.vaultLoaded) renderVaultWelcome({ mode: 'error', error: e });
  } finally {
    setFolderButtonLoading(false);
  }
}

async function loadFolderPath() {
  try {
    const field = $('folderPath');
    const folder = field ? field.value.trim() : '';
    if (!folder) return setInfo(text.pasteFolderFirst, true);
    const data = await api('/api/load-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder }),
    });
    await afterLibraryLoaded(data);
  } catch (e) {
    setInfo(e.message, true);
  }
}

async function afterLibraryLoaded(data) {
  state.chats = data.chats || [];
  state.vaultLoaded = true;
  state.vaultRoot = data.root || data.lastVaultPath || '';
  state.vaultErrors = Array.isArray(data.errors) ? data.errors : [];
  state.vaultLoadError = '';
  state.vaultLoadDetail = '';
  state.selectedChatId = null;
  state.mediaOnly = false;
  state.mediaMode = 'all';
  state.chatCache = {};
  state.senderFilterSignature = '';
  state.messagesRequestId += 1;
  state.allMessages = [];
  state.ownerSenderKey = '';
  state.selectedDay = null;
  state.selectedPersonKey = null;
  state.conversationMode = 'chats';
  state.chatSearchQuery = '';
  state.chatSortMode = DEFAULT_CHAT_SORT_MODE;
  state.photoContexts = {};
  state.photoContextIndexes = {};
  closeLightbox();
  $('searchBox').value = '';
  $('senderFilter').value = '';
  $('chatSearch').value = '';
  updateMediaTabs();
  renderMediaOnlyButton();
  setActiveSection('vault', { render: false });
  renderConversationList();
  setLibraryLoading(text.indexingVault, {
    root: state.vaultRoot,
    chats: state.chats.length,
    messages: countMessagesFromChats(state.chats),
    errors: state.vaultErrors.length,
  });
  renderVaultWelcome({ mode: 'loading', lead: text.indexingVault });
  await preloadArchiveMessages();
  state.ownerSenderKey = detectOwnerSenderKey();
  const totalMessages = state.allMessages.length;
  renderConversationList();
  setLibraryReady(data, totalMessages);
  renderVaultWelcome();
}

async function preloadArchiveMessages() {
  const batches = await Promise.all(state.chats.map(async chat => {
    try {
      const data = await api(`/api/chat?id=${encodeURIComponent(chat.id)}&q=&sender=&media=0`);
      const messages = (data.messages || []).map((msg, index) => ({
        ...msg,
        chatId: chat.id,
        chatTitle: chat.title,
        sourceIndex: index,
      }));
      state.chatCache[chat.id] = {
        ...data,
        messages,
        searchText: buildConversationSearchText(chat, messages),
      };
      return messages;
    } catch (e) {
      state.chatCache[chat.id] = { chat, messages: [], error: e.message };
      return [];
    }
  }));
  state.allMessages = batches.flat().sort(compareMessagesAsc);
}
async function selectChat(chatId) {
  const chatChanged = state.selectedChatId !== chatId;
  if (!chatChanged) {
    renderConversationList();
    return;
  }
  state.selectedChatId = chatId;
  state.conversationMode = 'chats';
  state.selectedPersonKey = null;
  closeLightbox();
  $('senderFilter').value = '';
  state.senderFilterSignature = '';
  renderConversationList();
  await loadMessages({ resetScroll: true });
}

async function loadMessages(options = {}) {
  if (state.activeSection !== 'vault' || state.conversationMode !== 'chats') return;
  if (!state.selectedChatId) {
    renderVaultWelcome();
    return;
  }
  const search = $('searchBox').value.trim();
  const requestId = ++state.messagesRequestId;
  const cached = state.chatCache[state.selectedChatId];
  const startedAt = performance.now();
  if (cached && Array.isArray(cached.messages) && !cached.error) {
    renderSelectedChat(cached, search, {
      ...options,
      perfStartedAt: startedAt,
      perfSource: 'cache',
    });
    return;
  }
  try {
    const data = await api(`/api/chat?id=${encodeURIComponent(state.selectedChatId)}&q=&sender=&media=0`);
    if (requestId !== state.messagesRequestId) return;
    const chat = data.chat || state.chats.find(item => item.id === state.selectedChatId) || {};
    const messages = (data.messages || []).map((msg, index) => ({
      ...msg,
      chatId: state.selectedChatId,
      chatTitle: chat.title,
      sourceIndex: index,
    }));
    const cachedData = {
      ...data,
      chat,
      messages,
      searchText: buildConversationSearchText(chat, messages),
    };
    state.chatCache[state.selectedChatId] = cachedData;
    renderSelectedChat(cachedData, search, {
      ...options,
      perfStartedAt: startedAt,
      perfSource: 'api',
    });
  } catch (e) {
    if (requestId !== state.messagesRequestId) return;
    setLibraryError(e);
    if (!state.vaultLoaded) renderVaultWelcome({ mode: 'error', error: e });
  }
}

function renderVaultWelcome(options = {}) {
  const hasLoadedConversations = state.vaultLoaded && state.chats.length > 0;
  const mode = options.mode || (hasLoadedConversations ? 'ready' : state.vaultLoadError ? 'error' : 'empty');
  $('chatTitle').textContent = 'TeleVault';
  if (hasLoadedConversations) {
    $('chatMeta').textContent = `${state.chats.length} ${pluralRu(state.chats.length, 'переписка', 'переписки', 'переписок')} в хранилище`;
  } else if (mode === 'loading') {
    $('chatMeta').textContent = text.storageLoading;
  } else if (mode === 'error') {
    $('chatMeta').textContent = text.storageLoadFailed;
  } else {
    $('chatMeta').textContent = text.storageNotSelected;
  }
  $('mediaTabs').hidden = true;
  $('filters').hidden = true;
  updateChatFilterControls();
  const emptyState = $('emptyState');
  const title = emptyState.querySelector('.welcome-brand h3');
  const lead = emptyState.querySelector('.welcome-lead');
  const body = emptyState.querySelector('.welcome-lockup > p:not(.welcome-lead):not(.welcome-note)');
  const action = emptyState.querySelector('#welcomePickFolder');
  const note = emptyState.querySelector('.welcome-note');
  if (hasLoadedConversations) {
    title.textContent = text.chooseConversationTitle;
    lead.textContent = text.chooseConversationBody;
    body.hidden = true;
    action.hidden = true;
    note.hidden = true;
  } else if (mode === 'loading') {
    title.textContent = text.storageLoading;
    lead.textContent = options.lead || text.checkingStartupVault;
    body.textContent = 'Если последнее хранилище доступно, TeleVault откроет его автоматически.';
    note.textContent = 'Сложный прогресс не показываем: дождись завершения загрузки.';
    body.hidden = false;
    action.hidden = true;
    note.hidden = false;
  } else if (mode === 'error') {
    const friendly = formatLibraryError(options.error || state.vaultLoadError || text.storageLoadFailed);
    title.textContent = friendly.title;
    lead.textContent = friendly.body;
    body.textContent = friendly.detail || text.storageLoadFailedBody;
    note.textContent = text.storageTryAnotherFolder;
    body.hidden = false;
    action.hidden = false;
    note.hidden = false;
  } else {
    title.textContent = text.storageNotSelected;
    lead.textContent = text.storageNotSelectedBody;
    body.textContent = 'Экспорт останется локально: чаты, сообщения и файлы будут доступны в одном рабочем окне.';
    note.textContent = 'Выбери папку, где лежит один или несколько result.json из Telegram Desktop export.';
    body.hidden = false;
    action.hidden = false;
    note.hidden = false;
  }
  $('emptyState').style.display = 'grid';
  $('messages').style.display = 'none';
  resetMessageScroll();
}

function renderSelectedChat(data, search = '', options = {}) {
  if (state.activeSection !== 'vault' || state.conversationMode !== 'chats') return;
  $('mediaTabs').hidden = false;
  $('filters').hidden = false;
  $('emptyState').style.display = 'none';
  $('messages').style.display = 'block';
  $('chatTitle').textContent = data.chat.title;
  $('chatMeta').textContent = 'сохранённая переписка в локальном хранилище';
  const senderNames = fillSenders(data.senders || []);
  updateChatFilterControls(senderNames);

  const messages = filterMessages(data.messages || [], search, $('senderFilter').value);
  if (state.mediaMode === 'all') {
    $('chatMeta').textContent = `${messages.length} из ${data.total} ${text.messages} · локальное хранилище`;
    renderMessages(messages, data.chat, data.senders || []);
    logPerformance('render chat', options.perfStartedAt, {
      source: options.perfSource || 'unknown',
      mode: state.mediaMode,
      shown: messages.length,
      total: data.total,
    });
    if (options.resetScroll) resetMessageScroll();
    return;
  }

  $('chatMeta').textContent = `${messages.length} ${text.mediaLabels[state.mediaMode]} из ${data.total} ${text.messages}`;
  renderMediaMode(messages);
  logPerformance('render chat', options.perfStartedAt, {
    source: options.perfSource || 'unknown',
    mode: state.mediaMode,
    shown: messages.length,
    total: data.total,
  });
  if (options.resetScroll) resetMessageScroll();
}

function resetMessageScroll() {
  const messages = $('messages');
  if (messages) {
    messages.scrollTop = 0;
    messages.scrollLeft = 0;
  }
  window.scrollTo(0, 0);
}

function fillSenders(senders) {
  const select = $('senderFilter');
  const current = select.value;
  const names = uniqueSenderNames(senders);
  const signature = names.join('\u0001');
  if (state.senderFilterSignature === signature) {
    select.value = names.includes(current) ? current : '';
    return names;
  }
  state.senderFilterSignature = signature;
  select.innerHTML = `<option value="">${text.allSenders}</option>`;
  names.forEach(sender => {
    const opt = document.createElement('option');
    opt.value = sender;
    opt.textContent = sender;
    select.appendChild(opt);
  });
  select.value = names.includes(current) ? current : '';
  return names;
}

function senderName(value) {
  return String(value || '').trim();
}

function senderKey(value) {
  return senderName(value).toLowerCase();
}

function messageSender(msg) {
  return senderName(msg.from || msg.sender || msg.author || msg.actor || msg.from_id || msg.actor_id || '');
}

function uniqueSenderNames(values) {
  const map = new Map();
  (values || []).forEach(value => {
    const name = senderName(value);
    const key = senderKey(name);
    if (key && !map.has(key)) map.set(key, name);
  });
  return Array.from(map.values());
}

function chatSenderNames(chatData = {}) {
  const fromApi = uniqueSenderNames(chatData.senders || []);
  if (fromApi.length) return fromApi;
  return uniqueSenderNames((chatData.messages || []).map(messageSender));
}

function updateChatFilterControls(senders = null) {
  const filters = $('filters');
  const select = $('senderFilter');
  const reset = $('resetFilters');
  const search = $('searchBox');
  if (!filters || !select || !reset || !search) return;

  const senderNames = senders ? uniqueSenderNames(senders) : uniqueSenderNames(
    Array.from(select.options || []).slice(1).map(option => option.value)
  );
  const hideSender = senderNames.length <= 2;
  if (hideSender) select.value = '';
  select.hidden = hideSender;
  select.setAttribute('aria-hidden', String(hideSender));

  const hasSearch = Boolean(search.value.trim());
  const hasSender = !hideSender && Boolean(select.value);
  reset.hidden = !(hasSearch || hasSender);
  filters.classList.toggle('filters--no-sender', hideSender);
  filters.classList.toggle('filters--has-reset', !reset.hidden);
}

function detectOwnerSenderKey() {
  const stats = new Map();
  Object.values(state.chatCache).forEach(chatData => {
    const senders = chatSenderNames(chatData);
    if (senders.length !== 2) return;
    const senderKeys = new Set(senders.map(senderKey));
    senders.forEach(sender => {
      const key = senderKey(sender);
      if (!stats.has(key)) stats.set(key, { key, name: sender, dialogs: 0, messages: 0 });
      stats.get(key).dialogs += 1;
    });
    (chatData.messages || []).forEach(msg => {
      const key = senderKey(messageSender(msg));
      if (senderKeys.has(key) && stats.has(key)) stats.get(key).messages += 1;
    });
  });

  const candidates = Array.from(stats.values()).filter(item => item.dialogs >= 2);
  candidates.sort((a, b) => b.dialogs - a.dialogs || b.messages - a.messages || a.name.localeCompare(b.name));
  return candidates[0]?.key || '';
}

function filterMessages(messages, search, sender = '') {
  const q = search.trim().toLowerCase();
  const mode = state.mediaMode;
  const selectedSender = senderKey(sender);
  const requireMedia = state.mediaOnly || mode !== 'all';
  return (messages || []).filter(msg => {
    if (selectedSender && senderKey(messageSender(msg)) !== selectedSender) return false;
    if (requireMedia && !hasMedia(msg)) return false;
    if (mode !== 'all' && !matchesMediaMode(msg, mode)) return false;
    if (!q) return true;
    return mode === 'all'
      ? messageSearchText(msg).includes(q)
      : mediaSearchText(msg).includes(q);
  });
}

function messageSearchText(msg) {
  return [
    msg.text,
    isServiceMessage(msg) ? serviceNoticeLabel(msg) : '',
    msg.from,
    msg.actor,
    msg.service_kind,
    msg.service_action,
    msg.pinned_message_preview,
    msg.pinned_message_id,
  ].map(value => String(value || '').toLowerCase()).join(' ');
}

function mediaSearchText(msg) {
  return [
    msg.text,
    msg.from,
    msg.media,
    msg.media_name,
    msg.media_kind,
    msg.media_type,
    msg.mime_type,
    msg.sticker_emoji,
  ].map(value => String(value || '').toLowerCase()).join(' ');
}

function matchesMediaMode(msg, mode) {
  if (!hasMedia(msg)) return false;
  if (mode === 'photo') return isPhoto(msg) || isStickerImage(msg);
  if (mode === 'video') return isVideo(msg) || isStickerVideo(msg);
  if (mode === 'audio') return isAudio(msg);
  if (mode === 'file') return !isPhoto(msg) && !isVideo(msg) && !isAudio(msg) && !isStickerImage(msg) && !isStickerVideo(msg);
  return true;
}

function hasMedia(msg) {
  return !isServiceMessage(msg) && Boolean(msg.media || msg.media_url);
}

function mediaExtension(msg) {
  const name = mediaName(msg).toLowerCase();
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot) : '';
}

function mediaPathHasStickerDir(msg) {
  return String(msg.media || '').replace(/\\/g, '/').toLowerCase().split('/').includes('stickers');
}

function hasStickerMetadata(msg) {
  const kind = String(msg.media_kind || '').toLowerCase();
  const mediaType = String(msg.media_type || '').toLowerCase();
  const rawType = String(msg.type || '').toLowerCase();
  return kind === 'sticker'
    || mediaType.includes('sticker')
    || rawType.includes('sticker')
    || Boolean(msg.sticker_emoji);
}

function isSticker(msg) {
  const ext = mediaExtension(msg);
  const hasSignal = hasStickerMetadata(msg) || mediaPathHasStickerDir(msg);
  return hasSignal || ext === '.tgs';
}

function isStickerImage(msg) {
  if (!isSticker(msg)) return false;
  const mime = String(msg.mime_type || '').toLowerCase();
  const ext = mediaExtension(msg);
  return mime.startsWith('image/') || ['.webp', '.gif', '.png', '.jpg', '.jpeg'].includes(ext);
}

function isStickerVideo(msg) {
  if (!isSticker(msg)) return false;
  const mime = String(msg.mime_type || '').toLowerCase();
  const ext = mediaExtension(msg);
  return ext === '.webm' || mime.startsWith('video/webm') || (mime.startsWith('video/') && canPlayVideo(msg));
}

function isTgsSticker(msg) {
  return isSticker(msg) && mediaExtension(msg) === '.tgs';
}

function isPhoto(msg) {
  const kind = String(msg.media_kind || '').toLowerCase();
  const mediaType = String(msg.media_type || '').toLowerCase();
  const mime = String(msg.mime_type || '').toLowerCase();
  return kind === 'image' || msg.media_field === 'photo' || msg.media_field === 'thumbnail' || mime.startsWith('image/') || mediaType.includes('photo') || mediaType.includes('image');
}

function isVideo(msg) {
  const kind = String(msg.media_kind || '').toLowerCase();
  const mediaType = String(msg.media_type || '').toLowerCase();
  const mime = String(msg.mime_type || '').toLowerCase();
  return kind === 'video' || mime.startsWith('video/') || mediaType.includes('video');
}

function isAudio(msg) {
  const kind = String(msg.media_kind || '').toLowerCase();
  const mediaType = String(msg.media_type || '').toLowerCase();
  const mime = String(msg.mime_type || '').toLowerCase();
  return kind === 'audio' || mime.startsWith('audio/') || mediaType.includes('audio') || mediaType.includes('voice');
}

function createMessageDirectionContext(chat = {}, senders = []) {
  return {
    chatTitle: senderKey(chat?.title),
    participants: uniqueSenderNames(senders).map(senderKey),
  };
}

function getMessageDirection(msg, context = {}) {
  const sender = senderKey(messageSender(msg));
  const chatTitle = context.chatTitle || '';
  const participants = context.participants || [];
  if (!sender || participants.length !== 2) return '';
  if (state.ownerSenderKey && participants.includes(state.ownerSenderKey)) {
    return sender === state.ownerSenderKey ? 'outgoing' : 'incoming';
  }
  if (chatTitle && participants.includes(chatTitle)) {
    return sender === chatTitle ? 'incoming' : 'outgoing';
  }
  return '';
}

function createDateSeparator(dayKey) {
  const separator = document.createElement('div');
  const label = document.createElement('span');
  separator.className = 'date-separator';
  separator.setAttribute('role', 'separator');
  label.textContent = formatDayTitle(dayKey);
  separator.appendChild(label);
  return separator;
}

function appendDateSeparatorIfNeeded(frag, msg, previousDayKey) {
  const dayKey = messageDayKey(msg);
  if (dayKey !== previousDayKey) {
    frag.appendChild(createDateSeparator(dayKey));
  }
  return dayKey;
}

function renderDateSeparator(dayKey) {
  return `
    <div class="date-separator" role="separator">
      <span>${escapeHtml(formatDayTitle(dayKey))}</span>
    </div>
  `;
}

const photoUpdateServiceActions = new Set([
  'edit_channel_photo',
  'edit_chat_photo',
  'edit_group_photo',
  'update_photo',
]);

function isServiceMessage(msg) {
  return msg?.message_kind === 'service' || msg?.type === 'service';
}

function serviceAction(msg) {
  return String(msg?.service_kind || msg?.service_action || msg?.action || '').toLowerCase();
}

function isPinnedServiceMessage(msg) {
  return isServiceMessage(msg) && serviceAction(msg) === 'pin_message';
}

function isPhotoUpdateServiceMessage(msg) {
  return isServiceMessage(msg) && photoUpdateServiceActions.has(serviceAction(msg));
}

function serviceActor(msg) {
  return senderName(msg?.actor || msg?.from || msg?.sender || msg?.author || '');
}

function shortServicePreview(value) {
  const clean = String(value || '').replace(/\s+/g, ' ').replace(/\.{3,}$/, '').trim();
  const sectionBreak = clean.match(/^(.{8,52}?)(?:\s+[❕❗‼⚠•]|[.!?]\s+)/u);
  if (sectionBreak?.[1]) return sectionBreak[1].trim();
  if (clean.length <= 48) return clean;
  const slice = clean.slice(0, 49);
  const boundary = Math.max(slice.lastIndexOf(' '), slice.lastIndexOf(','), slice.lastIndexOf(';'), slice.lastIndexOf(':'));
  const clipped = boundary >= 28 ? slice.slice(0, boundary) : clean.slice(0, 48);
  return `${clipped.trim().replace(/[.,;:!?-]+$/, '')}…`;
}

function pinnedServiceLabel(msg) {
  const actor = serviceActor(msg);
  const preview = shortServicePreview(msg?.pinned_message_preview || '');
  if (actor && preview) return `${actor} закрепил(а) «${preview}»`;
  if (actor) return `${actor} закрепил(а) ${text.pinnedMessageFallback}`;
  if (preview) return `закреплено «${preview}»`;
  return text.pinnedMessage;
}

function serviceNoticeLabel(msg) {
  if (isPinnedServiceMessage(msg)) return pinnedServiceLabel(msg);

  const explicit = senderName(msg?.service_text || '');
  if (explicit) return explicit;

  const actor = serviceActor(msg);
  const action = serviceAction(msg);
  if (action === 'create_channel') return actor ? `${actor} создал(а) канал` : 'канал создан';
  if (action === 'create_chat' || action === 'create_group') return actor ? `${actor} создал(а) чат` : 'чат создан';
  if (isPhotoUpdateServiceMessage(msg)) {
    const actorId = String(msg?.actor_id || '').toLowerCase();
    if (action === 'edit_channel_photo' || actorId.startsWith('channel')) return 'Фотография канала обновлена';
    if (action === 'edit_chat_photo' || action === 'edit_group_photo') return 'Фотография чата обновлена';
    return 'Фотография обновлена';
  }

  const body = senderName(msg?.text || '');
  return body || text.genericService;
}

function renderPinnedServiceMessage(msg) {
  const time = messageTime(msg);
  return `
    <article class="message message--service" aria-label="${escapeAttr(text.pinnedMessage)}">
      <div class="service-notice service-notice--pin">
        <span class="service-notice__text">${escapeHtml(pinnedServiceLabel(msg))}</span>
        ${time ? `<span class="service-notice__time">${escapeHtml(time)}</span>` : ''}
      </div>
    </article>
  `;
}

function renderServiceMessage(msg) {
  const time = messageTime(msg);
  const label = serviceNoticeLabel(msg);
  const photoUpdate = isPhotoUpdateServiceMessage(msg);
  const noticeClasses = ['service-notice', photoUpdate ? 'service-notice--photo' : ''].filter(Boolean).join(' ');
  const photoPreview = photoUpdate ? renderServicePhotoPreview(msg, label) : '';
  return `
    <article class="message message--service" aria-label="${escapeAttr(label)}">
      <div class="${noticeClasses}">
        <span class="service-notice__text">${escapeHtml(label)}</span>
        ${photoPreview}
        ${time ? `<span class="service-notice__time">${escapeHtml(time)}</span>` : ''}
      </div>
    </article>
  `;
}

function renderServicePhotoPreview(msg, label) {
  const previewUrl = getPhotoPreviewUrl(msg);
  if (!previewUrl) return '';
  return `
    <span class="service-photo-preview" data-media-container>
      <img class="service-photo-image" src="${escapeAttr(previewUrl)}" alt="${escapeAttr(label)}" loading="lazy" data-media-element />
    </span>
  `;
}

function renderMessages(messages, chat = {}, senders = []) {
  const box = $('messages');
  const photoContext = 'vault-current';
  setPhotoContext(photoContext, messages);
  resetAudioMetadataObserver();
  resetVideoMetadataObserver();
  box.className = 'messages';
  box.style.display = 'flex';
  box.innerHTML = '';
  if (!messages.length) {
    box.innerHTML = renderEmpty();
    return;
  }
  const directionContext = createMessageDirectionContext(chat, senders);
  const html = [];
  let previousDayKey = '';
  messages.forEach(msg => {
    const dayKey = messageDayKey(msg);
    if (dayKey !== previousDayKey) {
      html.push(renderDateSeparator(dayKey));
      previousDayKey = dayKey;
    }
    if (isPinnedServiceMessage(msg)) {
      html.push(renderPinnedServiceMessage(msg));
      return;
    }
    if (isServiceMessage(msg)) {
      html.push(renderServiceMessage(msg));
      return;
    }
    const stickerMessage = isSticker(msg);
    const direction = getMessageDirection(msg, directionContext);
    const messageClasses = [
      'message',
      direction ? `message--${direction}` : 'message--neutral',
      stickerMessage ? 'message--sticker' : '',
      hasMedia(msg) ? 'message--media' : '',
      msg.text ? 'message--text' : 'message--no-text',
    ].filter(Boolean).join(' ');
    const bubbleClasses = [
      'message-bubble',
      'conversation-message-card',
      stickerMessage ? 'bubble--sticker' : '',
    ].filter(Boolean).join(' ');
    html.push(`
      <article class="${messageClasses}">
      <div class="${bubbleClasses}">
        <div class="meta"><span class="sender">${escapeHtml(messageSender(msg) || text.system)}</span><span>${escapeHtml(messageTime(msg))}</span></div>
        ${msg.text ? `<div class="text">${escapeHtml(msg.text)}</div>` : ''}
        ${renderInlineMedia(msg, photoContext)}
      </div>
      </article>
    `);
  });
  box.innerHTML = html.join('');
  bindMediaErrorHandlers(box);
  bindLazyAudioMetadata(box);
  bindLazyVideoMetadata(box);
  bindPhotoTriggers(box);
}

function renderMediaMode(messages) {
  const box = $('messages');
  const photoContext = 'vault-current';
  state.lightboxPhotos = setPhotoContext(photoContext, messages);
  resetAudioMetadataObserver();
  resetVideoMetadataObserver();
  box.className = `messages media-mode media-mode-${state.mediaMode}`;
  box.style.display = 'grid';
  box.innerHTML = '';
  if (state.mediaMode !== 'photo') closeLightbox();
  if (!messages.length) {
    box.innerHTML = renderEmpty();
    return;
  }
  const html = [];
  let previousDayKey = '';
  messages.forEach((msg, index) => {
    const dayKey = messageDayKey(msg);
    if (dayKey !== previousDayKey) {
      html.push(renderDateSeparator(dayKey));
      previousDayKey = dayKey;
    }
    html.push(`
      <article class="media-card media-card-${state.mediaMode}" data-media-card="true">
        ${renderMediaCard(msg, index, photoContext)}
      </article>
    `);
  });
  box.innerHTML = html.join('');
  bindMediaErrorHandlers(box);
  bindLazyAudioMetadata(box);
  bindLazyVideoMetadata(box);
  bindPhotoTriggers(box);
}

function collectPhotoItems(messages) {
  return (messages || []).filter(msg => hasMedia(msg) && (isPhoto(msg) || isStickerImage(msg)));
}

function setPhotoContext(key, messages) {
  const items = collectPhotoItems(messages);
  state.photoContexts[key] = items;
  state.photoContextIndexes[key] = new Map(items.map((item, index) => [item, index]));
  return items;
}

function photoIndexFor(msg, contextKey = 'vault-current') {
  const index = state.photoContextIndexes[contextKey]?.get(msg);
  if (Number.isInteger(index)) return index;
  const items = state.photoContexts[contextKey] || state.lightboxPhotos || [];
  return items.indexOf(msg);
}

function renderPhotoPreview(msg, index = -1, options = {}) {
  const context = options.context || 'vault-current';
  const actualIndex = index >= 0 ? index : photoIndexFor(msg, context);
  if (actualIndex < 0) return '';
  const className = options.className || 'photo-preview';
  const label = options.label || 'открыть фото';
  const caption = options.caption ? `<span class="photo-preview-caption">${escapeHtml(options.caption)}</span>` : '';
  const previewUrl = getPhotoPreviewUrl(msg);
  if (!previewUrl) {
    return `
      <button class="${escapeAttr(className)} photo-preview-button is-missing-photo" type="button" data-photo-context="${escapeAttr(context)}" data-photo-index="${actualIndex}" aria-label="${escapeAttr(label)}">
        ${renderMediaFallback('image', msg, { className: 'photo-preview-missing' })}
        ${caption}
      </button>
    `;
  }
  return `
    <button class="${escapeAttr(className)} photo-preview-button" type="button" data-photo-context="${escapeAttr(context)}" data-photo-index="${actualIndex}" aria-label="${escapeAttr(label)}" data-media-container>
      <img src="${escapeAttr(previewUrl)}" alt="${escapeAttr(mediaName(msg))}" loading="lazy" data-media-element />
      ${renderMediaFallback('image', msg, { hidden: true, className: 'photo-preview-missing' })}
      ${caption}
    </button>
  `;
}

function mediaFallbackTitle(kind) {
  return {
    image: text.imageUnavailable,
    video: text.videoUnavailable,
    audio: text.audioUnavailable,
    file: text.fileUnavailable,
    sticker: text.stickerUnavailable,
    animatedSticker: text.animatedStickerUnavailable,
  }[kind] || text.fileUnavailable;
}

function mediaFallbackKind(msg) {
  if (isStickerVideo(msg)) return 'animatedSticker';
  if (isSticker(msg)) return 'sticker';
  if (isPhoto(msg)) return 'image';
  if (isVideo(msg)) return 'video';
  if (isAudio(msg)) return 'audio';
  return 'file';
}

function mediaFallbackOriginalUrl(kind, msg) {
  if (!msg) return '';
  if (kind === 'image') return getPhotoOriginalUrl(msg);
  if (kind === 'sticker' || kind === 'animatedSticker') return getStickerOriginalUrl(msg);
  return existingMediaUrl(msg.media_url, msg.media_exists);
}

function renderMediaFallback(kind, msg, options = {}) {
  const title = options.title || mediaFallbackTitle(kind);
  const name = mediaName(msg);
  const originalUrl = options.originalUrl === undefined ? mediaFallbackOriginalUrl(kind, msg) : options.originalUrl;
  const hidden = options.hidden ? ' hidden' : '';
  const className = options.className ? ` ${options.className}` : '';
  return `
    <div class="media-fallback media-fallback-${escapeAttr(kind)}${escapeAttr(className)}"${hidden} data-media-fallback>
      ${icons.file}
      <div class="media-fallback-info">
        <strong>${escapeHtml(title)}</strong>
        ${name ? `<span>${escapeHtml(name)}</span>` : ''}
        ${originalUrl ? `<a class="media-fallback-link" href="${escapeAttr(originalUrl)}" target="_blank" rel="noreferrer">${text.openOriginal}</a>` : ''}
      </div>
    </div>
  `;
}

function renderStickerEmoji(msg) {
  return msg.sticker_emoji ? `<span class="sticker-emoji" aria-hidden="true">${escapeHtml(msg.sticker_emoji)}</span>` : '';
}

function getStickerOriginalUrl(msg) {
  return existingMediaUrl(msg.media_url, msg.media_exists)
    || existingMediaUrl(msg.photo_url, msg.photo_exists);
}

function getStickerPreviewUrl(msg) {
  if (isStickerImage(msg)) {
    return getStickerOriginalUrl(msg)
      || existingMediaUrl(msg.thumbnail_url, msg.thumbnail_exists);
  }
  return existingMediaUrl(msg.thumbnail_url, msg.thumbnail_exists)
    || existingMediaUrl(msg.photo_url, msg.photo_exists);
}

function renderStickerImage(msg, photoContext = 'vault-current', className = 'sticker-preview') {
  const imageUrl = getStickerPreviewUrl(msg);
  if (!imageUrl) return renderStickerFallback(msg);
  const index = photoIndexFor(msg, photoContext);
  const label = `${text.open}: ${mediaName(msg)}`;
  const content = `
    <img src="${escapeAttr(imageUrl)}" alt="${escapeAttr(mediaName(msg))}" loading="lazy" data-media-element />
    ${renderMissingNotice(mediaFallbackKind(msg), msg, { originalUrl: getStickerOriginalUrl(msg), className: 'sticker-error-fallback' })}
    ${renderStickerEmoji(msg)}
  `;
  if (index >= 0) {
    return `
      <button class="sticker-preview-button ${escapeAttr(className)}" type="button" data-photo-context="${escapeAttr(photoContext)}" data-photo-index="${index}" aria-label="${escapeAttr(label)}" data-media-container>
        ${content}
      </button>
    `;
  }
  return `<div class="sticker-preview-static ${escapeAttr(className)}" data-media-container>${content}</div>`;
}

function renderStickerVideo(msg, className = 'sticker-preview') {
  const videoUrl = getStickerOriginalUrl(msg);
  if (!videoUrl || !canPlayVideo(msg)) return renderStickerFallback(msg);
  return `
    <div class="sticker-video-preview ${escapeAttr(className)}" data-media-container>
      <video autoplay loop muted playsinline preload="metadata" src="${escapeAttr(videoUrl)}" data-media-kind="sticker" data-media-element></video>
      ${renderMissingNotice('animatedSticker', msg, { originalUrl: videoUrl, className: 'sticker-error-fallback' })}
      ${renderStickerEmoji(msg)}
      <a class="sticker-open-link" href="${escapeAttr(videoUrl)}" target="_blank" rel="noreferrer">${text.openOriginal}</a>
    </div>
  `;
}

function renderStickerFallback(msg, className = 'sticker-preview') {
  const previewUrl = getStickerPreviewUrl(msg);
  const originalUrl = getStickerOriginalUrl(msg);
  if (!previewUrl && isMediaMissing(msg)) {
    return renderMediaFallback(mediaFallbackKind(msg), msg, { className: `sticker-fallback ${className}`, originalUrl });
  }
  const title = isMediaMissing(msg)
    ? mediaFallbackTitle(mediaFallbackKind(msg))
    : (isTgsSticker(msg) ? text.animatedTelegramSticker : text.telegramSticker);
  const preview = previewUrl
    ? `<img src="${escapeAttr(previewUrl)}" alt="${escapeAttr(mediaName(msg))}" loading="lazy" data-media-element />`
    : `<span class="sticker-fallback-icon">${icons.file}</span>`;
  const missing = isMediaMissing(msg) ? `<span class="sticker-fallback-note">${text.fileMissing}</span>` : '';
  return `
    <div class="sticker-fallback ${escapeAttr(className)}" data-media-container>
      ${preview}
      ${previewUrl ? renderMissingNotice(mediaFallbackKind(msg), msg, { originalUrl, className: 'sticker-error-fallback' }) : ''}
      <div class="sticker-fallback-info">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(mediaName(msg))}</span>
        ${missing}
        ${originalUrl ? `<a class="sticker-open-link" href="${escapeAttr(originalUrl)}" target="_blank" rel="noreferrer">${text.openOriginal}</a>` : ''}
      </div>
    </div>
  `;
}

function renderStickerMedia(msg, photoContext = 'vault-current', className = 'sticker-preview') {
  if (isStickerImage(msg)) return renderStickerImage(msg, photoContext, className);
  if (isStickerVideo(msg)) return renderStickerVideo(msg, className);
  return renderStickerFallback(msg, className);
}

function renderMediaCard(msg, index = -1, photoContext = 'vault-current') {
  if (isSticker(msg)) return renderStickerCard(msg, photoContext);
  if (state.mediaMode === 'photo') {
    return isPhotoUnavailable(msg) ? renderMissingPhotoCard(msg, index, photoContext) : renderPhotoCard(msg, index, photoContext);
  }
  if (isMediaMissing(msg)) return renderMissingCard(msg);
  if (state.mediaMode === 'video') return renderVideoCard(msg);
  if (state.mediaMode === 'audio') return renderAudioCard(msg);
  return renderFileCard(msg);
}

function renderPhotoCard(msg, index, photoContext = 'vault-current') {
  return `
    ${renderPhotoPreview(msg, index, { context: photoContext, className: 'media-preview photo-trigger', label: 'открыть фото' })}
    ${renderCardMeta(msg)}
    ${msg.text ? `<div class="media-caption">${escapeHtml(shortText(msg.text))}</div>` : ''}
  `;
}

function renderStickerCard(msg, photoContext = 'vault-current') {
  return `
    ${renderStickerMedia(msg, photoContext, 'sticker-preview-card')}
    ${renderCardMeta(msg)}
    ${msg.text ? `<div class="media-caption">${escapeHtml(shortText(msg.text))}</div>` : ''}
  `;
}

function videoPosterAttribute(msg) {
  const posterUrl = getVideoPosterUrl(msg);
  return posterUrl ? ` poster="${escapeAttr(posterUrl)}"` : '';
}

function renderVideoCard(msg) {
  const videoUrl = getVideoSourceUrl(msg);
  if (!videoUrl) return renderMissingCard(msg);
  if (!canPlayVideo(msg)) return renderFileCard(msg, 'video');
  const poster = videoPosterAttribute(msg);
  return `
    <div class="media-preview media-preview-video" data-media-container>
      <video controls preload="none"${poster} src="${escapeAttr(videoUrl)}" data-video-preload="lazy" data-media-element></video>
      ${renderMissingNotice('video', msg)}
    </div>
    ${renderCardMeta(msg)}
    ${msg.text ? `<div class="media-caption">${escapeHtml(shortText(msg.text))}</div>` : ''}
  `;
}

function renderAudioCard(msg) {
  return `
    ${renderAudioPlayer(msg, { showLabel: true })}
    ${renderCardMeta(msg)}
    ${msg.text ? `<div class="media-caption">${escapeHtml(shortText(msg.text))}</div>` : ''}
  `;
}

function renderAudioLabel(msg) {
  if (!msg.media_name && !msg.media) return '';
  const name = mediaName(msg);
  const url = existingMediaUrl(msg.media_url, msg.media_exists);
  const label = escapeHtml(name);
  return `
    <div class="audio-card-label" title="${escapeAttr(`${text.openOriginal}: ${name}`)}">
      ${url ? `<a href="${escapeAttr(url)}" target="_blank" rel="noreferrer">${label}</a>` : `<span>${label}</span>`}
    </div>
  `;
}

function renderAudioPlayer(msg, options = {}) {
  return `
    <div class="audio-card-body" data-media-container>
      ${options.showLabel ? renderAudioLabel(msg) : ''}
      <audio controls preload="none" src="${escapeAttr(msg.media_url)}" data-audio-preload="lazy" data-media-element></audio>
      ${renderMissingNotice('audio', msg)}
    </div>
  `;
}

function renderFileCard(msg, kindLabel = '') {
  const details = [kindLabel || fileType(msg), formatFileSize(msg.file_size)].filter(Boolean).join(' · ');
  return `
    <div class="file-card-body">
      ${icons.file}
      <div class="file-card-info">
        <a href="${escapeAttr(msg.media_url)}" target="_blank" rel="noreferrer">${escapeHtml(mediaName(msg))}</a>
        <span>${escapeHtml(details || text.unknownType)}</span>
      </div>
      ${msg.media_url ? `<a class="open-link" href="${escapeAttr(msg.media_url)}" target="_blank" rel="noreferrer">${text.open}</a>` : ''}
    </div>
    ${renderCardMeta(msg)}
    ${msg.text ? `<div class="media-caption">${escapeHtml(shortText(msg.text))}</div>` : ''}
  `;
}

function renderMissingPhotoCard(msg, index, photoContext = 'vault-current') {
  return `
    <button class="media-missing-card media-missing-trigger" type="button" data-photo-context="${escapeAttr(photoContext)}" data-photo-index="${index}" aria-label="${text.open}: ${escapeAttr(mediaName(msg))}">
      ${renderMediaFallback('image', msg)}
    </button>
    ${renderCardMeta(msg)}
    ${msg.text ? `<div class="media-caption">${escapeHtml(shortText(msg.text))}</div>` : ''}
  `;
}

function renderMissingCard(msg) {
  const kind = mediaFallbackKind(msg);
  return `
    ${renderMediaFallback(kind, msg, { className: 'media-missing-card' })}
    ${renderCardMeta(msg)}
    ${msg.text ? `<div class="media-caption">${escapeHtml(shortText(msg.text))}</div>` : ''}
  `;
}

function renderCardMeta(msg) {
  return `
    <div class="media-card-meta">
      <span class="sender">${escapeHtml(msg.from || text.system)}</span>
      <span>${escapeHtml(msg.date || '')}</span>
    </div>
  `;
}

function renderMissingNotice(kind = 'file', msg = null, options = {}) {
  return renderMediaFallback(kind, msg, { ...options, hidden: true, className: ['media-error-fallback', options.className].filter(Boolean).join(' ') });
}

function renderInlineMedia(msg, photoContext = 'vault-current') {
  if (!msg.media_url && !msg.media) return '';
  if (isSticker(msg)) {
    return `<div class="media media-sticker">${renderStickerMedia(msg, photoContext, 'sticker-preview-inline')}</div>`;
  }
  if (isPhoto(msg)) {
    const index = photoIndexFor(msg, photoContext);
    if (index >= 0) {
      return `<div class="media">${renderPhotoPreview(msg, index, { context: photoContext, className: 'photo-preview-inline', label: 'открыть фото' })}</div>`;
    }
  }
  if (isMediaMissing(msg)) return `<div class="media">${renderMediaFallback(mediaFallbackKind(msg), msg, { className: 'inline-media-fallback' })}</div>`;
  const videoUrl = getVideoSourceUrl(msg);
  if (isVideo(msg) && videoUrl && canPlayVideo(msg)) return `<div class="media" data-media-container><video controls preload="none"${videoPosterAttribute(msg)} src="${escapeAttr(videoUrl)}" data-video-preload="lazy" data-media-element></video>${renderMissingNotice('video', msg)}</div>`;
  if (isAudio(msg)) return `<div class="media media-audio">${renderAudioPlayer(msg)}</div>`;
  return `<div class="media">${renderFileCard(msg)}</div>`;
}

function renderSmallMediaPreview(msg, photoContext = 'vault-current') {
  if (!hasMedia(msg)) return '';
  if (isSticker(msg)) {
    if (isStickerImage(msg)) {
      return `<div class="mini-media mini-sticker-preview">${renderStickerImage(msg, photoContext, 'sticker-preview-mini')}</div>`;
    }
    return `<div class="mini-media mini-file">${icons.file}<span>${escapeHtml(mediaName(msg))}</span></div>`;
  }
  if (isPhoto(msg)) {
    const index = photoIndexFor(msg, photoContext);
    if (index >= 0) {
      const caption = [msg.date, msg.from || msg.chatTitle].filter(Boolean).join(' · ');
      return `<div class="mini-media">${renderPhotoPreview(msg, index, { context: photoContext, className: 'mini-photo-preview', label: 'открыть фото', caption })}</div>`;
    }
  }
  if (isMediaMissing(msg)) {
    return `<div class="mini-media mini-missing">${escapeHtml(mediaFallbackTitle(mediaFallbackKind(msg)))}: ${escapeHtml(mediaName(msg))}</div>`;
  }
  return `<div class="mini-media mini-file">${icons.file}<span>${escapeHtml(mediaName(msg))}</span></div>`;
}

function bindMediaErrorHandlers(root) {
  root.querySelectorAll('[data-media-element]').forEach(element => {
    element.addEventListener('error', () => handleMediaElementError(element), { once: true });
  });
}

function resetAudioMetadataObserver() {
  if (!audioMetadataObserver) return;
  audioMetadataObserver.disconnect();
  audioMetadataObserver = null;
}

function resetVideoMetadataObserver() {
  if (!videoMetadataObserver) return;
  videoMetadataObserver.disconnect();
  videoMetadataObserver = null;
}

function bindLazyAudioMetadata(root) {
  resetAudioMetadataObserver();
  const audioElements = Array.from(root.querySelectorAll('audio[data-audio-preload="lazy"]'));
  if (!audioElements.length) return;

  const requestMetadata = (audio) => {
    if (!audio || audio.dataset.audioMetadataLoaded === '1') return;
    audio.dataset.audioMetadataLoaded = '1';
    audio.preload = 'metadata';
    if (audioMetadataObserver) audioMetadataObserver.unobserve(audio);
    if (audio.readyState === 0 && audio.paused) {
      try {
        audio.load();
      } catch {}
    }
  };

  audioElements.forEach(audio => {
    audio.addEventListener('pointerenter', () => requestMetadata(audio), { once: true });
    audio.addEventListener('focus', () => requestMetadata(audio), { once: true });
    audio.addEventListener('play', () => requestMetadata(audio), { once: true });
  });

  if (!('IntersectionObserver' in window)) return;

  audioMetadataObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) requestMetadata(entry.target);
    });
  }, {
    root: root.id === 'messages' ? root : null,
    rootMargin: '220px 0px',
    threshold: 0.01,
  });

  audioElements.forEach(audio => audioMetadataObserver.observe(audio));
}

function requestVideoMetadata(video) {
  if (!video || video.dataset.videoMetadataLoaded === '1') return;
  if (!isRegularPlayableMedia(video)) return;
  video.dataset.videoMetadataLoaded = '1';
  video.preload = 'metadata';
  if (videoMetadataObserver) videoMetadataObserver.unobserve(video);
  if (video.readyState === 0 && video.paused) {
    try {
      video.load();
    } catch {}
  }
}

function bindLazyVideoMetadata(root) {
  resetVideoMetadataObserver();
  const videoElements = Array.from(root.querySelectorAll('video[data-video-preload="lazy"]'))
    .filter(isRegularPlayableMedia);
  if (!videoElements.length) return;

  videoElements.forEach(video => {
    video.addEventListener('pointerenter', () => requestVideoMetadata(video), { once: true });
    video.addEventListener('focus', () => requestVideoMetadata(video), { once: true });
    video.addEventListener('play', () => requestVideoMetadata(video), { once: true });
  });

  if (!('IntersectionObserver' in window)) return;

  videoMetadataObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) requestVideoMetadata(entry.target);
    });
  }, {
    root: root.id === 'messages' ? root : null,
    rootMargin: '220px 0px',
    threshold: 0.01,
  });

  videoElements.forEach(video => videoMetadataObserver.observe(video));
}

function isMediaElement(element) {
  if (!element) return false;
  if (typeof HTMLMediaElement !== 'undefined' && element instanceof HTMLMediaElement) return true;
  const tagName = String(element.tagName || '').toLowerCase();
  return tagName === 'video' || tagName === 'audio';
}

function isRegularPlayableMedia(element) {
  if (!isMediaElement(element)) return false;
  const tagName = String(element.tagName || '').toLowerCase();
  if (tagName !== 'video' && tagName !== 'audio') return false;
  if (element.closest('.sticker-video-preview')) return false;
  if (element.dataset.mediaKind === 'sticker') return false;
  if (tagName === 'video' && element.muted && element.loop && !element.controls) return false;
  return true;
}

function pauseOtherRegularMedia(activeElement) {
  document.querySelectorAll('video, audio').forEach(element => {
    if (element === activeElement) return;
    if (!isRegularPlayableMedia(element)) return;
    if (element.paused) return;
    try {
      element.pause();
    } catch {}
  });
}

function handleRegularMediaPlay(event) {
  const element = event.target;
  if (!isRegularPlayableMedia(element)) return;
  if (String(element.tagName || '').toLowerCase() === 'video') requestVideoMetadata(element);
  pauseOtherRegularMedia(element);
}

async function handleMediaElementError(element) {
  if (isRegularPlayableMedia(element) && await isSameOriginMediaAvailable(element.currentSrc || element.src)) {
    return;
  }
  markMediaMissing(element);
}

async function isSameOriginMediaAvailable(src) {
  const path = sameOriginMediaPath(src);
  if (!path) return false;
  try {
    const res = await fetch(path, { headers: { Range: 'bytes=0-0' }, cache: 'no-store' });
    return res.status === 200 || res.status === 206;
  } catch {
    return false;
  }
}

function sameOriginMediaPath(src) {
  if (!src) return '';
  try {
    const url = new URL(src, window.location.href);
    if (url.origin !== window.location.origin) return '';
    if (url.pathname !== '/media' && !url.pathname.startsWith('/media/')) return '';
    return `${url.pathname}${url.search}`;
  } catch {
    return '';
  }
}

function markMediaMissing(element) {
  const container = element.closest('[data-media-container]') || element.closest('[data-media-card]') || element.parentElement;
  if (!container) return;
  container.classList.add('is-missing');
  element.hidden = true;
  const fallback = container.querySelector('[data-media-fallback]');
  if (fallback) fallback.hidden = false;
}

function isMediaMissing(msg) {
  if (isVideo(msg) && !isSticker(msg)) return !getVideoSourceUrl(msg);
  return Boolean(msg.media) && msg.media_exists === false;
}

function existingMediaUrl(url, exists) {
  return url && exists !== false ? url : '';
}

function getVideoSourceUrl(msg) {
  return existingMediaUrl(msg.media_url, msg.media_exists);
}

function getVideoPosterUrl(msg) {
  return existingMediaUrl(msg.thumbnail_url, msg.thumbnail_exists)
    || existingMediaUrl(msg.photo_url, msg.photo_exists);
}

function getPhotoOriginalUrl(msg) {
  return existingMediaUrl(msg.photo_url, msg.photo_exists)
    || (msg.media_field !== 'thumbnail' ? existingMediaUrl(msg.media_url, msg.media_exists) : '');
}

function getPhotoPreviewUrl(msg) {
  return existingMediaUrl(msg.thumbnail_url, msg.thumbnail_exists)
    || getPhotoOriginalUrl(msg)
    || existingMediaUrl(msg.media_url, msg.media_exists);
}

function getPhotoViewerUrl(msg) {
  return getPhotoOriginalUrl(msg) || getPhotoPreviewUrl(msg);
}

function isPhotoUnavailable(msg) {
  return !getPhotoViewerUrl(msg);
}

function canPlayVideo(msg) {
  const mime = String(msg.mime_type || '').toLowerCase();
  const name = mediaName(msg).toLowerCase();
  return ['video/mp4', 'video/webm', 'video/ogg'].some(type => mime.startsWith(type))
    || ['.mp4', '.webm', '.ogv', '.ogg'].some(ext => name.endsWith(ext));
}

function mediaName(msg) {
  return msg.media_name || (msg.media ? String(msg.media).split(/[\\/]/).pop() : '') || 'file';
}

function fileType(msg) {
  const mime = String(msg.mime_type || '').trim();
  if (mime) return mime;
  const name = mediaName(msg);
  const dot = name.lastIndexOf('.');
  return dot > -1 ? name.slice(dot + 1).toUpperCase() : '';
}

function formatFileSize(value) {
  const size = Number(value);
  if (!Number.isFinite(size) || size <= 0) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function shortText(value) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  return clean.length > 120 ? `${clean.slice(0, 117)}...` : clean;
}

function renderEmptyState(title, body, options = {}) {
  const classes = ['empty-state', options.className].filter(Boolean).join(' ');
  return `
    <div class="${classes}">
      <span class="empty-state__mark" aria-hidden="true"></span>
      <div class="empty-state__copy">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(body)}</p>
      </div>
    </div>
  `;
}

function renderEmpty() {
  const hasSearch = Boolean($('searchBox')?.value.trim());
  const hasSender = Boolean($('senderFilter')?.value);
  if (state.mediaMode !== 'all') {
    if (hasSearch || hasSender) {
      return `<div class="empty in-messages">${renderEmptyState(text.nothingFound, text.mediaFilterNothingFoundBody, { className: 'empty-state--messages' })}</div>`;
    }
    const mediaEmpty = text.mediaEmptyStates[state.mediaMode] || {
      title: text.nothingFound,
      body: text.changeFilters,
    };
    return `<div class="empty in-messages">${renderEmptyState(mediaEmpty.title, mediaEmpty.body, { className: 'empty-state--messages' })}</div>`;
  }
  if (hasSearch) {
    return `<div class="empty in-messages">${renderEmptyState(text.chatMessagesNotFound, text.chatMessagesNotFoundBody, { className: 'empty-state--messages' })}</div>`;
  }
  if (hasSender) {
    return `<div class="empty in-messages">${renderEmptyState(text.chatMessagesNotFound, text.chatFilterNothingFoundBody, { className: 'empty-state--messages' })}</div>`;
  }
  return `<div class="empty in-messages">${renderEmptyState(text.noChatMessages, text.noChatMessagesBody, { className: 'empty-state--messages' })}</div>`;
}

function renderSectionEmpty(title = text.addFirstExport, body = 'Выбери папку с экспортами Telegram, чтобы наполнить локальное хранилище.') {
  return `
    <div class="section-empty">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(body)}</p>
      <button class="primary section-empty-action" type="button" data-pick-folder>${icons.folder}<span>Добавить в хранилище</span></button>
    </div>
  `;
}

function renderTimelineSection() {
  $('chatTitle').textContent = 'Timeline';
  $('chatMeta').textContent = 'дни активности во всём локальном хранилище';
  const box = $('timelineContent');
  if (!state.allMessages.length) {
    box.innerHTML = renderSectionEmpty('Timeline появится после добавления экспорта', 'TeleVault соберёт дни активности из сохранённых сообщений.');
    return;
  }
  if (state.selectedDay) {
    renderTimelineDay(box, state.selectedDay);
    return;
  }
  const days = buildTimelineDays();
  box.innerHTML = `
    <div class="section-heading">
      <h3>Timeline</h3>
      <p>Хранилище сгруппировано по дням из всех найденных чатов.</p>
    </div>
    <div class="timeline-list">
      ${days.map(day => renderTimelineDayCard(day)).join('')}
    </div>
  `;
  box.querySelectorAll('[data-day]').forEach(button => {
    button.addEventListener('click', () => {
      state.selectedDay = button.dataset.day;
      renderTimelineSection();
    });
  });
  bindMediaErrorHandlers(box);
  bindPhotoTriggers(box);
}

function renderTimelineDayCard(day) {
  const chats = Array.from(day.chats).slice(0, 3).map(escapeHtml).join(', ');
  const contextKey = `timeline-day-${day.key}`;
  const photos = setPhotoContext(contextKey, day.messages);
  const thumbs = photos.slice(0, 3).map((msg, index) => renderPhotoPreview(msg, index, {
    context: contextKey,
    className: 'timeline-thumb',
    label: 'открыть фото дня',
    caption: [msg.chatTitle, msg.from].filter(Boolean).join(' · '),
  })).join('');
  return `
    <article class="vault-card timeline-day-card">
      <button type="button" class="card-main" data-day="${escapeAttr(day.key)}">
        <span class="card-title">${escapeHtml(formatDayTitle(day.key))}</span>
        <span class="card-meta">${day.messages.length} ${text.messages} · ${day.chats.size} ${pluralRu(day.chats.size, 'чат', 'чата', 'чатов')} · ${day.mediaCount} ${text.media}</span>
        <span class="card-subtitle">${chats || text.systemSender}</span>
      </button>
      ${thumbs ? `<span class="timeline-thumbs">${thumbs}</span>` : ''}
    </article>
  `;
}

function renderTimelineDay(box, dayKey) {
  const day = buildTimelineDays().find(item => item.key === dayKey);
  if (!day) {
    state.selectedDay = null;
    renderTimelineSection();
    return;
  }
  const messages = [...day.messages].sort(compareMessagesAsc);
  const photoContext = `timeline-detail-${day.key}`;
  setPhotoContext(photoContext, messages);
  box.innerHTML = `
    <div class="section-heading section-heading-row">
      <div>
        <h3>${escapeHtml(formatDayTitle(day.key))}</h3>
        <p>${day.messages.length} ${text.messages} · ${day.chats.size} ${pluralRu(day.chats.size, 'чат', 'чата', 'чатов')} · ${day.mediaCount} ${text.media}</p>
      </div>
      <button type="button" class="back-button" data-timeline-back>${text.backToTimeline}</button>
    </div>
    <div class="archive-message-list">
      ${messages.map(msg => renderArchiveMessage(msg, photoContext)).join('')}
    </div>
  `;
  box.querySelector('[data-timeline-back]').addEventListener('click', () => {
    state.selectedDay = null;
    renderTimelineSection();
  });
  bindMediaErrorHandlers(box);
  bindPhotoTriggers(box);
}

function renderPeopleSection() {
  if (state.activeSection !== 'vault') return;
  $('mediaTabs').hidden = true;
  $('filters').hidden = true;
  $('emptyState').style.display = 'none';
  const box = $('messages');
  box.style.display = 'block';
  box.className = 'messages people-vault';
  const people = buildPeople();
  state.peopleList = people;
  if (!people.length) {
    $('chatTitle').textContent = 'Переписки';
    $('chatMeta').textContent = 'люди появятся после добавления экспорта';
    box.innerHTML = renderSectionEmpty('Люди появятся после добавления экспорта', 'TeleVault соберёт отправителей из сообщений в локальном хранилище.');
    return;
  }
  if (state.selectedPersonKey) {
    renderPersonDetail(box, state.selectedPersonKey);
    return;
  }
  $('chatTitle').textContent = 'Переписки';
  $('chatMeta').textContent = 'люди из сохранённых переписок в локальном хранилище';
  box.innerHTML = `
    <div class="section-heading">
      <h3>Люди в переписках</h3>
      <p>Отправители собраны из сохранённых переписок в твоём локальном хранилище.</p>
    </div>
    <div class="people-grid">
      ${people.map(renderPersonCard).join('')}
    </div>
  `;
  box.querySelectorAll('[data-person-key]').forEach(button => {
    button.addEventListener('click', () => {
      state.selectedPersonKey = button.dataset.personKey;
      renderConversationList();
      renderPeopleSection();
    });
  });
  bindMediaErrorHandlers(box);
  bindPhotoTriggers(box);
}
function renderPersonCard(person) {
  const chats = Array.from(person.chats).slice(0, 3).map(escapeHtml).join(', ');
  const contextKey = `person-card-${person.key}`;
  const photos = setPhotoContext(contextKey, person.messages);
  const thumbs = photos.slice(0, 3).map((msg, index) => renderPhotoPreview(msg, index, {
    context: contextKey,
    className: 'timeline-thumb',
    label: 'открыть фото человека',
    caption: [msg.chatTitle, msg.date].filter(Boolean).join(' · '),
  })).join('');
  return `
    <article class="vault-card person-card">
      <button type="button" class="card-main" data-person-key="${escapeAttr(person.key)}">
        <span class="card-title">${escapeHtml(person.name)}</span>
        <span class="card-meta">${person.messages.length} ${text.messages} · ${person.mediaCount} ${text.media}</span>
        <span class="card-subtitle">${escapeHtml(person.firstDate || text.noDate)} → ${escapeHtml(person.lastDate || text.noDate)}</span>
        <span class="card-subtitle">${chats || 'чат не указан'}</span>
      </button>
      ${thumbs ? `<span class="person-thumbs">${thumbs}</span>` : ''}
    </article>
  `;
}
function renderPersonDetail(box, key) {
  const person = state.peopleList.find(item => item.key === key) || buildPeople().find(item => item.key === key);
  if (!person) {
    state.selectedPersonKey = null;
    renderConversationList();
    renderPeopleSection();
    return;
  }
  $('chatTitle').textContent = person.name;
  $('chatMeta').textContent = 'человек в сохранённых переписках локального хранилища';
  const messages = [...person.messages].sort(compareMessagesAsc);
  const photoContext = `person-detail-${person.key}`;
  setPhotoContext(photoContext, messages);
  box.innerHTML = `
    <div class="section-heading section-heading-row">
      <div>
        <h3>${escapeHtml(person.name)}</h3>
        <p>${person.messages.length} ${text.messages} · ${person.mediaCount} ${text.media} · ${person.chats.size} ${pluralRu(person.chats.size, 'чат', 'чата', 'чатов')}</p>
      </div>
      <button type="button" class="back-button" data-people-back>${text.backToPeople}</button>
    </div>
    <div class="archive-message-list">
      ${messages.map(msg => renderArchiveMessage(msg, photoContext)).join('')}
    </div>
  `;
  box.querySelector('[data-people-back]').addEventListener('click', () => {
    state.selectedPersonKey = null;
    renderConversationList();
    renderPeopleSection();
  });
  bindMediaErrorHandlers(box);
  bindPhotoTriggers(box);
}

function renderInsightsSection() {
  $('chatTitle').textContent = 'Insights';
  $('chatMeta').textContent = 'простая сводка по локальному хранилищу';
  const box = $('insightsContent');
  if (!state.chats.length) {
    box.innerHTML = renderSectionEmpty('Insights появятся после добавления экспорта', 'TeleVault покажет простую сводку по сохранённым чатам, людям и дням.');
    return;
  }
  const insights = buildInsights();
  box.innerHTML = `
    <div class="section-heading">
      <h3>Insights</h3>
      <p>Без графиков и внешних библиотек: только базовая сводка по хранилищу.</p>
    </div>
    <div class="insights-grid">
      ${renderInsightCard('Всего чатов', insights.totalChats)}
      ${renderInsightCard('Всего сообщений', insights.totalMessages)}
      ${renderInsightCard('Всего медиа', insights.totalMedia)}
      ${renderInsightCard('Первое сообщение', insights.firstMessage)}
      ${renderInsightCard('Последнее сообщение', insights.lastMessage)}
      ${renderInsightCard('Самый активный чат', insights.activeChat)}
      ${renderInsightCard('Самый активный отправитель', insights.activeSender)}
      ${renderInsightCard('Самый активный день', insights.activeDay)}
    </div>
  `;
}

function renderInsightCard(label, value) {
  return `
    <article class="insight-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value || 'нет данных'))}</strong>
    </article>
  `;
}

function renderArchiveMessage(msg, photoContext = 'vault-current') {
  return `
    <article class="archive-message conversation-message-card">
      <div class="archive-message-meta">
        <span class="archive-chat">${escapeHtml(msg.chatTitle || 'чат')}</span>
        <span>${escapeHtml(msg.from || text.systemSender)}</span>
        <span>${escapeHtml(messageTime(msg))}</span>
      </div>
      ${msg.text ? `<div class="archive-message-text">${escapeHtml(msg.text)}</div>` : ''}
      ${renderSmallMediaPreview(msg, photoContext)}
    </article>
  `;
}

function buildTimelineDays() {
  const map = new Map();
  state.allMessages.forEach(msg => {
    const key = messageDayKey(msg);
    if (!map.has(key)) {
      map.set(key, { key, messages: [], chats: new Set(), mediaCount: 0, photos: [] });
    }
    const day = map.get(key);
    day.messages.push(msg);
    if (msg.chatTitle) day.chats.add(msg.chatTitle);
    if (hasMedia(msg)) day.mediaCount += 1;
    if (isPhoto(msg) && msg.media_url && !isMediaMissing(msg)) day.photos.push(msg);
  });
  return Array.from(map.values()).sort((a, b) => dateSortValue(b.key) - dateSortValue(a.key));
}

function buildPeople() {
  const map = new Map();
  state.allMessages.forEach(msg => {
    const rawName = String(msg.from || '').trim();
    const name = rawName || text.systemSender;
    const key = rawName ? rawName.toLowerCase() : '__system__';
    if (!map.has(key)) {
      map.set(key, { key, name, messages: [], chats: new Set(), mediaCount: 0, firstDate: '', lastDate: '' });
    }
    const person = map.get(key);
    person.messages.push(msg);
    if (msg.chatTitle) person.chats.add(msg.chatTitle);
    if (hasMedia(msg)) person.mediaCount += 1;
  });
  const people = Array.from(map.values());
  people.forEach(person => {
    const sorted = [...person.messages].sort(compareMessagesAsc);
    person.firstDate = sorted[0]?.date || '';
    person.lastDate = sorted[sorted.length - 1]?.date || '';
  });
  return people.sort((a, b) => b.messages.length - a.messages.length || a.name.localeCompare(b.name));
}

function buildInsights() {
  const people = buildPeople();
  const days = buildTimelineDays();
  const first = state.allMessages[0];
  const last = state.allMessages[state.allMessages.length - 1];
  const activeChat = [...state.chats].sort((a, b) => Number(b.message_count || 0) - Number(a.message_count || 0))[0];
  const activeSender = people[0];
  const activeDay = [...days].sort((a, b) => b.messages.length - a.messages.length)[0];
  return {
    totalChats: state.chats.length,
    totalMessages: state.allMessages.length,
    totalMedia: state.allMessages.filter(hasMedia).length,
    firstMessage: first ? `${first.date} · ${first.chatTitle}` : '',
    lastMessage: last ? `${last.date} · ${last.chatTitle}` : '',
    activeChat: activeChat ? `${activeChat.title} · ${activeChat.message_count} ${text.messages}` : '',
    activeSender: activeSender ? `${activeSender.name} · ${activeSender.messages.length} ${text.messages}` : '',
    activeDay: activeDay ? `${formatDayTitle(activeDay.key)} · ${activeDay.messages.length} ${text.messages}` : '',
  };
}

function messageDateValue(msg) {
  return [msg.date, msg.date_unixtime, msg.timestamp]
    .find(value => value !== undefined && value !== null && String(value).trim()) || '';
}

function dateFromUnixValue(value) {
  const raw = String(value || '').trim();
  if (!/^\d{10,13}$/.test(raw)) return null;
  const number = Number(raw);
  const date = new Date(raw.length === 13 ? number : number * 1000);
  return Number.isNaN(date.getTime()) ? null : date;
}

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function messageDayKey(msg) {
  const value = String(messageDateValue(msg)).trim();
  const unixDate = dateFromUnixValue(value);
  if (unixDate) return localDateKey(unixDate);
  return value ? value.slice(0, 10) : 'no-date';
}

function messageTime(msg) {
  const value = String(messageDateValue(msg)).trim();
  const unixDate = dateFromUnixValue(value);
  if (unixDate) {
    return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(unixDate);
  }
  return value.length > 10 ? value.slice(11) : value || text.noDate;
}

function formatDayTitle(key) {
  if (key === 'no-date') return text.noDate;
  const date = new Date(`${key}T00:00:00`);
  if (Number.isNaN(date.getTime())) return key;
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function dateSortValue(value) {
  if (!value || value === 'no-date') return 0;
  const unixDate = dateFromUnixValue(value);
  if (unixDate) return unixDate.getTime();
  const normalized = String(value).replace(' ', 'T');
  const time = new Date(normalized).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function compareMessagesAsc(a, b) {
  return dateSortValue(messageDateValue(a)) - dateSortValue(messageDateValue(b));
}

function pluralRu(count, one, few, many) {
  const abs = Math.abs(count) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (last > 1 && last < 5) return few;
  if (last === 1) return one;
  return many;
}

function bindPhotoTriggers(root) {
  root.querySelectorAll('[data-photo-index]').forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      const context = button.dataset.photoContext || 'vault-current';
      const items = state.photoContexts[context] || state.lightboxPhotos || [];
      openPhotoLightbox(items, Number(button.dataset.photoIndex));
    });
  });
}

function ensureLightbox() {
  if ($('photoLightbox')) return;
  const lightbox = document.createElement('div');
  lightbox.id = 'photoLightbox';
  lightbox.className = 'lightbox';
  lightbox.hidden = true;
  lightbox.innerHTML = `
    <div class="lightbox-backdrop" data-lightbox-close></div>
    <div class="lightbox-dialog" role="dialog" aria-modal="true" aria-label="photo lightbox">
      <button type="button" class="lightbox-close" data-lightbox-close-button aria-label="${text.close}">${icons.close}</button>
      <button type="button" class="lightbox-nav lightbox-prev" data-lightbox-prev aria-label="${text.previous}">${icons.chevronLeft}</button>
      <figure class="lightbox-figure">
        <div class="lightbox-stage">
          <div class="lightbox-media"></div>
        </div>
        <figcaption class="lightbox-caption">
          <div class="lightbox-meta"><span class="sender"></span><span class="date"></span></div>
          <p class="lightbox-text"></p>
          <a class="lightbox-original" href="#" target="_blank" rel="noreferrer">${text.openOriginal}</a>
        </figcaption>
      </figure>
      <button type="button" class="lightbox-nav lightbox-next" data-lightbox-next aria-label="${text.next}">${icons.chevronRight}</button>
    </div>
  `;
  document.body.appendChild(lightbox);
  lightbox.querySelector('.lightbox-backdrop').addEventListener('click', closeLightbox);
  lightbox.querySelector('[data-lightbox-close-button]').addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    closeLightbox();
  });
  lightbox.querySelector('[data-lightbox-prev]').addEventListener('click', event => {
    event.stopPropagation();
    moveLightbox(-1);
  });
  lightbox.querySelector('[data-lightbox-next]').addEventListener('click', event => {
    event.stopPropagation();
    moveLightbox(1);
  });
  const stage = lightbox.querySelector('.lightbox-stage');
  const media = lightbox.querySelector('.lightbox-media');
  stage.addEventListener('click', event => {
    if (event.target === stage || event.target === media) closeLightbox();
  });
  lightbox.querySelector('.lightbox-dialog').addEventListener('click', event => event.stopPropagation());
}

function openPhotoLightbox(itemsOrIndex, indexMaybe) {
  ensureLightbox();
  const items = Array.isArray(itemsOrIndex) ? itemsOrIndex : state.lightboxPhotos;
  const index = Array.isArray(itemsOrIndex) ? Number(indexMaybe) : Number(itemsOrIndex);
  state.lightboxPhotos = items || [];
  if (!state.lightboxPhotos.length || index < 0 || index >= state.lightboxPhotos.length) return;
  state.lightboxIndex = index;
  renderLightboxPhoto();
  const lightbox = $('photoLightbox');
  lightbox.hidden = false;
  requestAnimationFrame(() => {
    if (state.lightboxIndex === index && !lightbox.hidden) lightbox.classList.add('open');
  });
}

function closeLightbox() {
  const lightbox = $('photoLightbox');
  state.lightboxIndex = -1;
  if (!lightbox || lightbox.hidden) return;
  lightbox.classList.remove('open');
  setTimeout(() => {
    if (!lightbox.classList.contains('open')) lightbox.hidden = true;
  }, 160);
}

function moveLightbox(delta) {
  if (!state.lightboxPhotos.length) return;
  const next = state.lightboxIndex + delta;
  if (next < 0 || next >= state.lightboxPhotos.length) return;
  state.lightboxIndex = next;
  renderLightboxPhoto();
}

function fitLightboxImage(img) {
  const naturalWidth = img.naturalWidth || 0;
  const naturalHeight = img.naturalHeight || 0;
  if (!naturalWidth || !naturalHeight) return;
  img.classList.toggle('small-photo', naturalWidth < 360 || naturalHeight < 360);
}

function renderLightboxPhoto() {
  const lightbox = $('photoLightbox');
  const msg = state.lightboxPhotos[state.lightboxIndex];
  if (!lightbox || !msg) return;
  const media = lightbox.querySelector('.lightbox-media');
  const original = lightbox.querySelector('.lightbox-original');
  const captionText = lightbox.querySelector('.lightbox-text');
  const senderLabel = [msg.chatTitle, msg.from || text.system].filter(Boolean).join(' · ');
  lightbox.querySelector('.sender').textContent = senderLabel;
  lightbox.querySelector('.date').textContent = msg.date || '';
  captionText.textContent = shortText(msg.text || '');
  captionText.hidden = !msg.text;
  const viewerUrl = getPhotoViewerUrl(msg);
  const originalUrl = getPhotoOriginalUrl(msg) || viewerUrl;
  original.href = originalUrl || '#';
  original.hidden = !originalUrl;
  if (!viewerUrl) {
    media.innerHTML = `<div class="lightbox-missing"><strong>${text.fileMissing}</strong><span>${escapeHtml(mediaName(msg))}</span></div>`;
  } else {
    const img = document.createElement('img');
    img.className = 'lightbox-image';
    img.src = viewerUrl;
    img.alt = mediaName(msg);
    img.addEventListener('load', () => fitLightboxImage(img), { once: true });
    img.addEventListener('error', () => {
      media.innerHTML = renderMediaFallback('image', msg, {
        className: 'lightbox-missing media-fallback-lightbox',
        originalUrl,
      });
    }, { once: true });
    media.replaceChildren(img);
    if (img.complete) fitLightboxImage(img);
  }
  const hasMany = state.lightboxPhotos.length > 1;
  const prev = lightbox.querySelector('[data-lightbox-prev]');
  const next = lightbox.querySelector('[data-lightbox-next]');
  prev.hidden = !hasMany;
  next.hidden = !hasMany;
  prev.disabled = state.lightboxIndex <= 0;
  next.disabled = state.lightboxIndex >= state.lightboxPhotos.length - 1;
}

function handleLightboxKeydown(event) {
  const lightbox = $('photoLightbox');
  if (!lightbox || lightbox.hidden) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeLightbox();
  }
  if (event.key === 'ArrowRight') {
    event.preventDefault();
    moveLightbox(1);
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    moveLightbox(-1);
  }
}

function renderMediaOnlyButton() {
  const button = $('mediaOnly');
  button.classList.toggle('is-on', state.mediaOnly);
  button.innerHTML = `${icons.media}<span>${text.mediaOnly}: ${state.mediaOnly ? text.on : text.off}</span>`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[ch]));
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function debounce(fn, delay = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

function logPerformance(label, startedAt, details = {}) {
  if (!Number.isFinite(startedAt)) return;
  try {
    if (localStorage.getItem('televault:perf') !== '1') return;
    const elapsed = Math.round((performance.now() - startedAt) * 10) / 10;
    console.debug(`[TeleVault perf] ${label}: ${elapsed}ms`, details);
  } catch {}
}

function bindControls() {
  document.addEventListener('keydown', handleLightboxKeydown);
  document.addEventListener('play', handleRegularMediaPlay, true);
  document.addEventListener('click', event => {
    const pickTrigger = event.target.closest('[data-pick-folder]');
    if (pickTrigger) {
      event.preventDefault();
      pickFolder();
    }
  });
  const loadPathButton = $('loadPath');
  const folderPathField = $('folderPath');
  if (loadPathButton) loadPathButton.addEventListener('click', loadFolderPath);
  if (folderPathField) {
    folderPathField.addEventListener('keydown', event => {
      if (event.key === 'Enter') loadFolderPath();
    });
  }
  $('chatSearch').addEventListener('input', event => {
    state.chatSearchQuery = event.target.value;
    renderChats();
  });
  const debouncedLoadMessages = debounce(loadMessages);
  $('searchBox').addEventListener('input', () => {
    updateChatFilterControls();
    debouncedLoadMessages();
  });
  $('senderFilter').addEventListener('change', () => {
    updateChatFilterControls();
    loadMessages();
  });
  $('mediaOnly').addEventListener('click', () => {
    state.mediaOnly = !state.mediaOnly;
    renderMediaOnlyButton();
    loadMessages();
  });
  $('resetFilters').addEventListener('click', () => {
    $('searchBox').value = '';
    $('senderFilter').value = '';
    state.mediaOnly = false;
    state.mediaMode = 'all';
    updateChatFilterControls();
    updateMediaTabs();
    renderMediaOnlyButton();
    loadMessages();
  });
  document.querySelectorAll('[data-media-mode]').forEach(button => {
    button.addEventListener('click', () => {
      state.mediaMode = button.dataset.mediaMode || 'all';
      closeLightbox();
      updateMediaTabs();
      loadMessages();
    });
  });
}

async function init() {
  ensureLightbox();
  setFolderButtonLoading(false);
  renderMediaOnlyButton();
  updateMediaTabs();
  updateSectionNav();
  bindControls();
  setLibraryEmpty();
  renderVaultWelcome({ mode: 'loading', lead: text.checkingStartupVault });
  try {
    const status = await api('/api/status');
    $('version').textContent = `v${status.version}`;
  } catch {}
  try {
    const savedVault = await api('/api/startup-vault');
    if (savedVault.loaded) {
      await afterLibraryLoaded(savedVault);
    } else if (savedVault.missing) {
      setLibraryError(savedVault.error || text.savedVaultMissing, savedVault);
      renderVaultWelcome({ mode: 'error', error: savedVault.error || text.savedVaultMissing });
    } else if (savedVault.error) {
      setLibraryError(savedVault.error, savedVault);
      renderVaultWelcome({ mode: 'error', error: savedVault.error });
    } else {
      setLibraryEmpty();
      renderVaultWelcome();
    }
  } catch (e) {
    setLibraryError(e);
    renderVaultWelcome({ mode: 'error', error: e });
  }
}

init();
