const LARGE_CHAT_RENDER_MESSAGE_LIMIT = 500;
const CHAT_LOADING_STATE_DELAY_MS = 120;
const INLINE_PHOTO_MAX_WIDTH = 500;
const INLINE_PHOTO_MAX_HEIGHT = 460;
const INLINE_VIDEO_MAX_WIDTH = 520;
const INLINE_VIDEO_MAX_HEIGHT = 520;

const state = {
  chats: [],
  vaultLoaded: false,
  vaultRoot: '',
  vaultErrors: [],
  vaultLoadError: '',
  vaultLoadDetail: '',
  vaultMissing: false,
  missingVaultPath: '',
  selectedChatId: null,
  lightboxPhotos: [],
  lightboxIndex: -1,
  photoContexts: {},
  photoContextIndexes: {},
  mediaMode: 'all',
  isPickingFolder: false,
  chatSearchQuery: '',
  globalSearchLimit: 50,
  globalSearchQuery: '',
  globalSearchResults: [],
  globalSearchLoading: false,
  globalSearchError: '',
  globalSearchRequestId: 0,
  globalSearchResultLimit: 50,
  globalSearchLimitReached: false,
  chatCache: {},
  senderFilterSignature: '',
  messagesRequestId: 0,
  ownerSenderKey: '',
};

let jumpHighlightTimer = null;
let pendingMessagesLoad = null;
let pendingGlobalMessageSearch = null;
let activeGlobalMessageSearchController = null;

const $ = (id) => document.getElementById(id);

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

const icons = {
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
  trash: `
    <svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8 8h2v10H8V8Zm6 0h2v10h-2V8Z" />
      <path d="M5 5h14v2H5V5Zm4-3h6l1 2H8l1-2Zm-2 6h10l-.8 12H7.8L7 8Z" />
    </svg>
  `,
};

const text = {
  telegramSticker: 'стикер Telegram',
  animatedTelegramSticker: 'анимированный стикер Telegram',
  chooseFolder: 'добавить экспорт',
  chooseExportFolder: 'выбрать папку экспорта',
  choosingFolder: 'ожидание выбора...',
  openingPicker: 'открываю выбор папки...',
  checkingStartupVault: 'проверяем последний локальный архив...',
  indexingVault: 'собираю локальный архив...',
  errors: 'ошибок',
  messages: 'сообщений',
  media: 'медиа',
  noDate: 'нет даты',
  allSenders: 'все отправители',
  nothingFound: 'ничего не найдено',
  changeFilters: 'попробуй изменить поиск, фильтр или вкладку',
  system: 'system',
  forwardedFrom: 'переслано от',
  pinnedMessage: 'закреплено сообщение',
  pinnedMessageFallback: 'сообщение',
  genericService: 'системное событие Telegram',
  requestFailed: 'не удалось выполнить запрос',
  fileMissing: 'файл отсутствует в этом архиве',
  imageUnavailable: 'фото недоступно',
  videoUnavailable: 'видео недоступно',
  audioUnavailable: 'аудио недоступно',
  fileUnavailable: 'файл недоступен',
  stickerUnavailable: 'стикер недоступен',
  animatedStickerUnavailable: 'анимированный стикер недоступен',
  mediaUnavailableBody: 'файл отсутствует в этом архиве',
  open: 'открыть',
  close: 'закрыть',
  previous: 'назад',
  next: 'вперёд',
  openOriginal: 'открыть оригинал',
  unknownType: 'тип неизвестен',
  conversationsNotFound: 'переписки не найдены',
  chatSearchNothingFound: 'нет результатов поиска',
  chatSearchNothingFoundBody: 'в локальном архиве нет совпадений по этому запросу',
  globalSearchTitle: 'Найденные сообщения',
  globalSearchLoading: 'ищу...',
  globalSearchFailed: 'поиск временно недоступен',
  globalSearchFailedBody: '',
  globalSearchLimitHint: 'показаны первые {limit} результатов, уточни запрос',
  openingChat: 'открываем переписку...',
  openingChatBody: 'готовим сообщения и медиа архива.',
  chatMessagesNotFound: 'нет результатов поиска',
  chatMessagesNotFoundBody: 'в этой переписке нет совпадений',
  chatFilterNothingFoundBody: 'попробуй другой фильтр',
  mediaFilterNothingFoundBody: 'в этой переписке нет таких вложений',
  noChatMessages: 'переписка пуста',
  noChatMessagesBody: 'в архиве для этой переписки пока нет сообщений',
  savedVaultMissing: 'папка экспорта недоступна',
  savedVaultMissingBody: 'TeleVault помнит этот архив, но сейчас не может открыть его папку.',
  savedVaultMissingDetail: 'Возможно, папку перенесли или диск отключён.',
  forgetUnavailableExport: 'удалить недоступный экспорт из библиотеки',
  forgettingUnavailableExport: 'удаляем...',
  forgotUnavailableExport: 'недоступный экспорт удален из библиотеки',
  storageReady: 'архив открыт',
  storageLoading: 'открываем локальный архив...',
  storageNotSelected: 'библиотека пуста',
  storageNotSelectedBody: 'добавьте экспорт Telegram, чтобы хранить переписки локально и открывать их оффлайн.',
  storageNoChatsBody: 'В этой папке не нашлось переписок из Telegram. Выбери папку экспорта или общую папку с экспортами.',
  storageLoadFailed: 'не удалось открыть архив',
  storageLoadFailedBody: 'Проверь, что выбрана папка экспорта Telegram.',
  storageTryAnotherFolder: 'Попробуй выбрать другую папку экспорта.',
  storagePartialErrors: 'часть переписок не загрузилась',
  storageFolderFallback: 'папка архива',
  chooseConversationTitle: 'выберите переписку',
  chooseConversationBody: 'откройте чат из списка слева, чтобы начать читать архив.',
  mediaLabels: {
    all: 'все',
    photo: 'фото',
    video: 'видео',
    audio: 'аудио',
    sticker: 'стикеры',
    file: 'файлы',
  },
  mediaEmptyStates: {
    photo: {
      title: 'фото не найдены',
      body: 'в этой переписке нет сохранённых фото',
    },
    video: {
      title: 'видео не найдены',
      body: 'в этой переписке нет сохранённых видео',
    },
    audio: {
      title: 'аудио не найдено',
      body: 'в этой переписке нет сохранённого аудио',
    },
    sticker: {
      title: 'стикеры не найдены',
      body: 'в этой переписке нет сохранённых стикеров',
    },
    file: {
      title: 'файлы не найдены',
      body: 'в этой переписке нет сохранённых файлов',
    },
  },
};

let deferredMediaSourceObserver = null;
let activeRegularMediaElement = null;

const unavailableFallbackTextPattern = /^\(?\s*file\s+unavailable(?:\s*,?\s*please\s+try\s+again\s+later)?\s*\)?$/i;
const unavailableFallbackTextPatternGlobal = /\(?\s*file\s+unavailable(?:\s*,?\s*please\s+try\s+again\s+later)?\s*\)?/gi;

function visibleTextSource(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(item => cleanVisibleText(item)).join('');
  if (typeof value === 'object') {
    if ('text' in value) return visibleTextSource(value.text);
    if ('value' in value) return visibleTextSource(value.value);
    return '';
  }
  return String(value);
}

function isUnavailableFallbackText(value) {
  return unavailableFallbackTextPattern.test(visibleTextSource(value).replace(/\s+/g, ' ').trim());
}

function cleanVisibleText(value) {
  const raw = visibleTextSource(value);
  if (!raw) return '';
  return raw
    .split(/\r?\n/)
    .filter(line => !isUnavailableFallbackText(line))
    .join('\n')
    .replace(unavailableFallbackTextPatternGlobal, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

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
  state.chats = [];
  state.vaultLoaded = false;
  state.vaultRoot = '';
  state.vaultErrors = [];
  state.vaultLoadError = '';
  state.vaultLoadDetail = '';
  state.vaultMissing = false;
  state.missingVaultPath = '';
  state.selectedChatId = null;
  state.chatCache = {};
  setLibraryMessage(text.storageNotSelected, 'empty', text.storageNotSelectedBody);
}

function setLibraryMissing(details = {}) {
  const missingPath = details.lastVaultPath || details.root || state.missingVaultPath || '';
  state.chats = [];
  state.vaultLoaded = false;
  state.vaultRoot = missingPath;
  state.vaultErrors = [];
  state.vaultLoadError = text.savedVaultMissing;
  state.vaultLoadDetail = text.savedVaultMissingBody;
  state.vaultMissing = true;
  state.missingVaultPath = missingPath;
  state.selectedChatId = null;
  state.chatCache = {};
  resetGlobalMessageSearch();
  $('libraryInfo').className = 'hint library-info library-info--warning';
  $('libraryInfo').innerHTML = renderLibraryStatus({
    kind: 'warning',
    title: text.savedVaultMissing,
    body: text.savedVaultMissingBody,
    detail: text.savedVaultMissingDetail,
    path: missingPath,
  });
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

function setLibraryReady(data) {
  const root = data.root || state.vaultRoot || data.lastVaultPath || '';
  const chats = Array.isArray(data.chats) ? data.chats : state.chats;
  const errors = Array.isArray(data.errors) ? data.errors : state.vaultErrors;
  state.vaultRoot = root;
  state.vaultErrors = errors;
  state.vaultLoadError = '';
  state.vaultLoadDetail = '';
  state.vaultMissing = false;
  state.missingVaultPath = '';
  $('libraryInfo').className = `hint library-info library-info--${errors.length ? 'warning' : 'ready'}`;
  $('libraryInfo').innerHTML = renderLibraryStatus({
    kind: errors.length ? 'warning' : 'ready',
    title: errors.length ? text.storagePartialErrors : text.storageReady,
    body: '',
    path: root,
    detail: errors.length ? `${formatNumber(errors.length)} ${text.errors}` : '',
  });
}

function setLibraryError(error, details = {}) {
  const friendly = formatLibraryError(error);
  state.vaultLoadError = friendly.title;
  state.vaultLoadDetail = friendly.body;
  state.vaultRoot = details.root || details.lastVaultPath || state.vaultRoot || '';
  state.vaultMissing = false;
  state.missingVaultPath = '';
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
      body: 'Выбор папки отменён. Текущий архив не изменился.',
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
      title: 'папка экспорта не найдена',
      body: 'Выбери папку, которую создал Telegram Desktop при экспорте, или общую папку с несколькими экспортами.',
      detail: '',
    };
  }
  if (lower.includes('не удалось прочитать') || lower.includes('ни один экспорт')) {
    return {
      title: 'архив не прочитан',
      body: 'TeleVault не распознал структуру папки или часть файлов повреждена.',
      detail: '',
    };
  }
  return {
    title: text.storageLoadFailed,
    body: text.storageTryAnotherFolder,
    detail: clean,
  };
}

function isFolderPickerCancelled(data) {
  if (!data) return false;
  const status = String(data.status || '').toLowerCase();
  return data.cancelled === true || data.canceled === true || status === 'cancelled' || status === 'canceled';
}

function isFolderPickerCancelError(error) {
  return isFolderPickerCancelled(error?.data) || cleanErrorMessage(error).toLowerCase().includes('папка не выбрана');
}

function handleFolderPickerCancelled(hadOpenVault) {
  if (hadOpenVault) return;
  setLibraryEmpty();
  renderVaultWelcome({ mode: 'empty' });
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

function setForgetMissingButtonLoading(isLoading) {
  const button = $('forgetMissingExport');
  if (!button) return;
  button.disabled = isLoading;
  button.setAttribute('aria-busy', String(isLoading));
  button.innerHTML = `${icons.trash}<span>${isLoading ? text.forgettingUnavailableExport : text.forgetUnavailableExport}</span>`;
}

function updateMediaTabs() {
  document.querySelectorAll('[data-media-mode]').forEach(button => {
    const isActive = button.dataset.mediaMode === state.mediaMode;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function renderConversationList() {
  renderChats();
}

function renderChats() {
  const box = $('chatList');
  const query = state.chatSearchQuery.trim();
  const hasSearch = Boolean(query);
  const chats = getVisibleChats();
  const messageResults = getVisibleGlobalMessageResults(query);
  const messageSearchLoading = isGlobalMessageSearchLoading(query);
  const messageSearchReady = isGlobalMessageSearchReady(query);
  const messageSearchError = getGlobalMessageSearchError(query);
  $('chatListTitle').textContent = hasSearch ? 'Результаты поиска' : 'Переписки';
  box.innerHTML = '';
  if (!hasSearch && !chats.length) {
    const emptyTitle = state.vaultMissing
      ? text.savedVaultMissing
      : state.vaultLoaded ? text.conversationsNotFound : text.storageNotSelected;
    const emptyBody = state.vaultMissing
      ? text.savedVaultMissingBody
      : state.vaultLoaded ? text.storageNoChatsBody : text.storageNotSelectedBody;
    box.innerHTML = renderEmptyState(
      emptyTitle,
      emptyBody,
      { className: 'empty-state--sidebar' }
    );
    return;
  }
  chats.forEach(chat => box.appendChild(renderChatCard(chat)));

  if (hasSearch && messageSearchLoading) {
    appendSidebarSearchState(box, text.globalSearchLoading, '');
  }
  if (hasSearch && messageSearchError && !messageResults.length) {
    appendSidebarSearchState(box, messageSearchError, text.globalSearchFailedBody);
  }
  if (hasSearch && messageResults.length) {
    appendSidebarSectionTitle(box, text.globalSearchTitle);
    messageResults.forEach(result => box.appendChild(renderGlobalMessageResult(result)));
    if (state.globalSearchLimitReached) {
      appendSidebarLimitHint(box, state.globalSearchResultLimit);
    }
  }
  if (
    hasSearch
    && !chats.length
    && !messageResults.length
    && !messageSearchLoading
    && !messageSearchError
    && messageSearchReady
  ) {
    box.innerHTML = renderEmptyState(
      text.chatSearchNothingFound,
      text.chatSearchNothingFoundBody,
      { className: 'empty-state--sidebar' }
    );
  }
}

function renderChatCard(chat) {
  const div = document.createElement('button');
  div.type = 'button';
  div.className = 'chat-card' + (chat.id === state.selectedChatId ? ' active' : '');
  const range = [chat.first_date, chat.last_date].filter(Boolean).join(' → ');
  const title = cleanVisibleText(chat.title) || text.storageFolderFallback;
  div.innerHTML = `
    <span class="chat-card__title">${escapeHtml(title)}</span>
    <span class="chat-card__stats">${chat.message_count} ${text.messages} · ${chat.media_count} ${text.media}</span>
    <span class="chat-card__date">последнее: ${escapeHtml(chat.last_date || text.noDate)}</span>
    ${range ? `<span class="chat-card__range">${escapeHtml(range)}</span>` : ''}
  `;
  div.addEventListener('click', () => {
    selectChat(chat.id);
  });
  return div;
}

function appendSidebarSectionTitle(box, title) {
  const div = document.createElement('div');
  div.className = 'sidebar-results-title';
  div.textContent = title;
  box.appendChild(div);
}

function appendSidebarSearchState(box, title, body) {
  box.insertAdjacentHTML('beforeend', renderEmptyState(
    title,
    body,
    { className: 'empty-state--sidebar sidebar-search-state' }
  ));
}

function appendSidebarLimitHint(box, limit) {
  const div = document.createElement('div');
  div.className = 'sidebar-limit-hint';
  div.textContent = text.globalSearchLimitHint.replace('{limit}', formatNumber(limit || state.globalSearchLimit));
  box.appendChild(div);
}

function getVisibleGlobalMessageResults(query) {
  if (!query || state.globalSearchQuery !== query) return [];
  return state.globalSearchResults || [];
}

function isGlobalMessageSearchLoading(query) {
  return Boolean(query && state.globalSearchQuery === query && state.globalSearchLoading);
}

function isGlobalMessageSearchReady(query) {
  return !query || !state.vaultLoaded || state.globalSearchQuery === query;
}

function getGlobalMessageSearchError(query) {
  if (!query || state.globalSearchQuery !== query) return '';
  return state.globalSearchError || '';
}

function renderGlobalMessageResult(result) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'global-message-card';
  const snippet = cleanVisibleText(result.snippet) || cleanVisibleText(result.media_type) || 'сообщение';
  const meta = buildGlobalSearchResultMeta(result);
  button.innerHTML = `
    <span class="global-message-card__snippet">${renderHighlightedSearchSnippet(snippet, state.globalSearchQuery || state.chatSearchQuery)}</span>
    <span class="global-message-card__meta">${escapeHtml(meta)}</span>
  `;
  button.addEventListener('click', () => {
    openGlobalSearchResult(result);
  });
  return button;
}

function normalizeSearchMetaValue(value) {
  return cleanVisibleText(value).replace(/\s+/g, ' ').trim();
}

function sameSearchMetaValue(a, b) {
  const left = normalizeSearchMetaValue(a).toLocaleLowerCase('ru-RU');
  const right = normalizeSearchMetaValue(b).toLocaleLowerCase('ru-RU');
  return Boolean(left && right && left === right);
}

function buildGlobalSearchResultMeta(result) {
  const chatTitle = normalizeSearchMetaValue(result.chat_title || result.chatTitle);
  const sender = normalizeSearchMetaValue(result.sender);
  const date = normalizeSearchMetaValue(result.date) || text.noDate;
  const parts = [];
  if (chatTitle && sender) {
    if (sameSearchMetaValue(chatTitle, sender)) {
      parts.push(sender);
    } else {
      parts.push(`чат: ${chatTitle}`);
      parts.push(sender);
    }
  } else if (chatTitle) {
    parts.push(chatTitle);
  } else if (sender) {
    parts.push(sender);
  }
  if (date) parts.push(date);
  return parts.join(' · ');
}

function renderHighlightedSearchSnippet(value, query) {
  const source = String(value || '');
  const needle = String(query || '').trim();
  if (!source || !needle) return escapeHtml(source);

  const lowerSource = source.toLocaleLowerCase('ru-RU');
  const lowerNeedle = needle.toLocaleLowerCase('ru-RU');
  if (!lowerNeedle) return escapeHtml(source);

  let html = '';
  let index = 0;
  while (index < source.length) {
    const matchIndex = lowerSource.indexOf(lowerNeedle, index);
    if (matchIndex < 0) break;
    html += escapeHtml(source.slice(index, matchIndex));
    html += `<mark class="global-message-card__match">${escapeHtml(source.slice(matchIndex, matchIndex + needle.length))}</mark>`;
    index = matchIndex + needle.length;
  }
  html += escapeHtml(source.slice(index));
  return html || escapeHtml(source);
}

function getVisibleChats() {
  const q = state.chatSearchQuery.trim().toLowerCase();
  const chats = state.chats.filter(chat => !q || conversationSearchText(chat).includes(q));
  return chats.sort(compareChatsNewestFirst);
}

function conversationSearchText(chat) {
  const cached = state.chatCache[chat.id];
  if (cached?.searchText) return cached.searchText;
  return buildConversationSearchText(chat, cached?.messages || []);
}

function buildConversationSearchText(chat, messages = []) {
  const senders = uniqueSenderNames(messages.map(messageSender)).join(' ');
  return [chat.title, chat.path, senders].map(value => cleanVisibleText(value).toLowerCase()).join(' ');
}

function compareChatsNewestFirst(a, b) {
  return dateSortValue(b.last_date) - dateSortValue(a.last_date);
}

async function pickFolder() {
  if (state.isPickingFolder) return;
  const hadOpenVault = state.vaultLoaded;
  setFolderButtonLoading(true);
  try {
    if (!hadOpenVault) {
      setLibraryLoading(text.openingPicker);
      if (!state.selectedChatId) renderVaultWelcome({ mode: 'loading', lead: text.openingPicker });
    }
    const data = await api('/api/pick-folder', { method: 'POST' });
    if (isFolderPickerCancelled(data)) {
      handleFolderPickerCancelled(hadOpenVault);
      return;
    }
    await afterLibraryLoaded(data);
  } catch (e) {
    if (isFolderPickerCancelError(e)) {
      handleFolderPickerCancelled(hadOpenVault);
      return;
    }
    setLibraryError(e);
    if (!state.vaultLoaded) renderVaultWelcome({ mode: 'error', error: e });
  } finally {
    setFolderButtonLoading(false);
  }
}

async function forgetMissingExport() {
  if (!state.vaultMissing) return;
  setForgetMissingButtonLoading(true);
  try {
    await api('/api/forget-missing-vault', { method: 'POST' });
    setLibraryEmpty();
    setLibraryMessage(text.forgotUnavailableExport, 'empty', text.storageNotSelectedBody);
    renderConversationList();
    renderVaultWelcome({ mode: 'empty' });
  } catch (e) {
    const missingPath = state.missingVaultPath || state.vaultRoot;
    setLibraryMissing({ lastVaultPath: missingPath });
    setLibraryMessage(text.savedVaultMissing, 'warning', cleanErrorMessage(e));
    renderConversationList();
    renderVaultWelcome({ mode: 'missing' });
  } finally {
    setForgetMissingButtonLoading(false);
  }
}

async function afterLibraryLoaded(data) {
  state.chats = data.chats || [];
  state.vaultLoaded = true;
  state.vaultRoot = data.root || data.lastVaultPath || '';
  state.vaultErrors = Array.isArray(data.errors) ? data.errors : [];
  state.vaultLoadError = '';
  state.vaultLoadDetail = '';
  state.vaultMissing = false;
  state.missingVaultPath = '';
  state.selectedChatId = null;
  state.mediaMode = 'all';
  state.chatCache = {};
  state.senderFilterSignature = '';
  state.messagesRequestId += 1;
  state.ownerSenderKey = '';
  state.chatSearchQuery = '';
  resetGlobalMessageSearch();
  state.photoContexts = {};
  state.photoContextIndexes = {};
  closeLightbox();
  $('searchBox').value = '';
  $('senderFilter').value = '';
  $('chatSearch').value = '';
  updateMediaTabs();
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
  renderConversationList();
  setLibraryReady(data);
  renderVaultWelcome();
}

async function preloadArchiveMessages() {
  await Promise.all(state.chats.map(async chat => {
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
}

async function selectChat(chatId) {
  const chatChanged = state.selectedChatId !== chatId;
  if (!chatChanged) {
    renderConversationList();
    return;
  }
  state.selectedChatId = chatId;
  closeLightbox();
  $('senderFilter').value = '';
  state.senderFilterSignature = '';
  renderConversationList();
  await loadMessages({ resetScroll: true });
}

async function loadMessages(options = {}) {
  if (!state.selectedChatId) {
    renderVaultWelcome();
    return;
  }
  const selectedChatId = state.selectedChatId;
  const search = $('searchBox').value.trim();
  const requestId = ++state.messagesRequestId;
  const cached = state.chatCache[selectedChatId];
  const startedAt = performance.now();
  if (cached && Array.isArray(cached.messages) && !cached.error) {
    await renderSelectedChat(cached, search, {
      ...options,
      chatId: selectedChatId,
      perfStartedAt: startedAt,
      perfSource: 'cache',
      requestId,
    });
    return;
  }
  let loadingTimer = window.setTimeout(() => {
    if (requestId === state.messagesRequestId && state.selectedChatId === selectedChatId) {
      renderChatOpeningState();
    }
  }, CHAT_LOADING_STATE_DELAY_MS);
  const clearLoadingTimer = () => {
    if (!loadingTimer) return;
    window.clearTimeout(loadingTimer);
    loadingTimer = 0;
  };
  try {
    const data = await api(`/api/chat?id=${encodeURIComponent(selectedChatId)}&q=&sender=&media=0`);
    clearLoadingTimer();
    if (requestId !== state.messagesRequestId) return;
    const chat = data.chat || state.chats.find(item => item.id === selectedChatId) || {};
    const messages = (data.messages || []).map((msg, index) => ({
      ...msg,
      chatId: selectedChatId,
      chatTitle: chat.title,
      sourceIndex: index,
    }));
    const cachedData = {
      ...data,
      chat,
      messages,
      searchText: buildConversationSearchText(chat, messages),
    };
    state.chatCache[selectedChatId] = cachedData;
    await renderSelectedChat(cachedData, search, {
      ...options,
      chatId: selectedChatId,
      perfStartedAt: startedAt,
      perfSource: 'api',
      requestId,
    });
  } catch (e) {
    clearLoadingTimer();
    if (requestId !== state.messagesRequestId) return;
    setLibraryError(e);
    if (!state.vaultLoaded) renderVaultWelcome({ mode: 'error', error: e });
  }
}

function renderVaultWelcome(options = {}) {
  const hasLoadedConversations = state.vaultLoaded && state.chats.length > 0;
  const mode = options.mode || (hasLoadedConversations ? 'ready' : state.vaultMissing ? 'missing' : state.vaultLoadError ? 'error' : 'empty');
  $('chatTitle').textContent = 'TeleVault';
  if (hasLoadedConversations) {
    $('chatMeta').textContent = `${state.chats.length} ${pluralRu(state.chats.length, 'переписка', 'переписки', 'переписок')} в локальном архиве`;
  } else if (mode === 'loading') {
    $('chatMeta').textContent = text.storageLoading;
  } else if (mode === 'missing') {
    $('chatMeta').textContent = text.savedVaultMissing;
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
  const actionLabel = action ? action.querySelector('span') : null;
  const forgetAction = emptyState.querySelector('#forgetMissingExport');
  const note = emptyState.querySelector('.welcome-note');
  if (forgetAction) {
    forgetAction.hidden = true;
    setForgetMissingButtonLoading(false);
  }
  if (actionLabel) actionLabel.textContent = text.chooseFolder;
  if (hasLoadedConversations) {
    title.textContent = text.chooseConversationTitle;
    lead.textContent = text.chooseConversationBody;
    body.hidden = true;
    action.hidden = true;
    note.hidden = true;
    if (forgetAction) forgetAction.hidden = true;
  } else if (mode === 'loading') {
    title.textContent = text.storageLoading;
    lead.textContent = options.lead || text.checkingStartupVault;
    body.textContent = 'Если последняя папка доступна, TeleVault откроет архив автоматически.';
    note.textContent = 'Данные остаются на этом компьютере.';
    body.hidden = false;
    action.hidden = true;
    note.hidden = false;
  } else if (mode === 'missing') {
    title.textContent = text.savedVaultMissing;
    lead.textContent = text.savedVaultMissingBody;
    body.textContent = text.savedVaultMissingDetail;
    note.textContent = state.missingVaultPath || text.storageTryAnotherFolder;
    if (actionLabel) actionLabel.textContent = text.chooseExportFolder;
    body.hidden = false;
    action.hidden = false;
    note.hidden = false;
    if (forgetAction) forgetAction.hidden = false;
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
    title.textContent = 'ваша библиотека пока пуста';
    lead.textContent = text.storageNotSelectedBody;
    body.hidden = true;
    action.hidden = false;
    note.textContent = 'данные остаются на этом компьютере.';
    note.hidden = false;
  }
  $('emptyState').style.display = 'grid';
  $('messages').style.display = 'none';
  resetMessageScroll();
}

function chatRenderId(data, options = {}) {
  return options.chatId || data?.chat?.id || data?.messages?.[0]?.chatId || '';
}

function isCurrentChatRender(data, options = {}, mediaMode = state.mediaMode) {
  if (options.requestId && options.requestId !== state.messagesRequestId) return false;
  const chatId = chatRenderId(data, options);
  if (chatId && state.selectedChatId !== chatId) return false;
  return state.mediaMode === mediaMode;
}

function renderChatOpeningState() {
  const box = $('messages');
  resetDeferredMediaSourceObserver();
  $('emptyState').style.display = 'none';
  box.className = 'messages';
  box.style.display = 'flex';
  box.innerHTML = `<div class="empty in-messages">${renderEmptyState(text.openingChat, text.openingChatBody, { className: 'empty-state--messages' })}</div>`;
}

function waitForAnimationFrame() {
  return new Promise(resolve => requestAnimationFrame(resolve));
}

async function waitForChatOpeningPaint() {
  await waitForAnimationFrame();
  await waitForAnimationFrame();
}

async function renderSelectedChat(data, search = '', options = {}) {
  const mediaMode = state.mediaMode;
  if (!isCurrentChatRender(data, options, mediaMode)) return;
  const chat = data.chat || {};
  $('mediaTabs').hidden = false;
  $('filters').hidden = false;
  $('emptyState').style.display = 'none';
  $('messages').style.display = 'block';
  $('chatTitle').textContent = cleanVisibleText(chat.title) || text.storageFolderFallback;
  $('chatMeta').textContent = 'сохранённая переписка в локальном хранилище';
  const senderNames = fillSenders(data.senders || []);
  updateChatFilterControls(senderNames);

  const messages = filterMessages(data.messages || [], search, $('senderFilter').value);
  const searchActive = Boolean(search.trim());
  updateChatFilterControls(senderNames, {
    showSearchHint: mediaMode === 'all' && searchActive && messages.length > 0,
  });
  if (mediaMode === 'all') {
    $('chatMeta').textContent = `${messages.length} из ${data.total} ${text.messages} · локальное хранилище`;
    if (messages.length > LARGE_CHAT_RENDER_MESSAGE_LIMIT) {
      renderChatOpeningState();
      await waitForChatOpeningPaint();
      if (!isCurrentChatRender(data, options, mediaMode)) return;
    }
    renderMessages(messages, chat, data.senders || [], { searchActive });
    logPerformance('render chat', options.perfStartedAt, {
      source: options.perfSource || 'unknown',
      mode: mediaMode,
      shown: messages.length,
      total: data.total,
    });
    if (options.jumpToMessageId) jumpToMessage(options.jumpToMessageId);
    else if (options.resetScroll) resetMessageScroll();
    return;
  }

  $('chatMeta').textContent = `${messages.length} ${text.mediaLabels[mediaMode]} из ${data.total} ${text.messages}`;
  renderMediaMode(messages);
  logPerformance('render chat', options.perfStartedAt, {
    source: options.perfSource || 'unknown',
    mode: mediaMode,
    shown: messages.length,
    total: data.total,
  });
  if (options.jumpToMessageId) jumpToMessage(options.jumpToMessageId);
  else if (options.resetScroll) resetMessageScroll();
}

function resetMessageScroll() {
  const messages = $('messages');
  if (messages) {
    messages.scrollTop = 0;
    messages.scrollLeft = 0;
  }
  window.scrollTo(0, 0);
}

function findMessageElementById(messageId) {
  const id = String(messageId || '');
  const box = $('messages');
  if (!id || !box) return null;
  const element = Array.from(box.querySelectorAll('[data-message-id]')).find(item => item.dataset.messageId === id);
  return element?.closest('.message') || element || null;
}

function jumpToMessage(messageId) {
  const element = findMessageElementById(messageId);
  const box = $('messages');
  if (!element) return;
  element.classList.remove('message--jump-highlight');
  void element.offsetWidth;
  element.classList.add('message--jump-highlight');
  if (box && box.scrollHeight > box.clientHeight) {
    const boxRect = box.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const top = box.scrollTop + elementRect.top - boxRect.top - (box.clientHeight / 2) + (elementRect.height / 2);
    box.scrollTo({ top: Math.max(0, top) });
  } else {
    element.scrollIntoView({ block: 'center', inline: 'nearest' });
  }
  if (jumpHighlightTimer) clearTimeout(jumpHighlightTimer);
  jumpHighlightTimer = setTimeout(() => {
    element.classList.remove('message--jump-highlight');
    jumpHighlightTimer = null;
  }, 1800);
}

function searchResultClickTarget(event) {
  const target = event.target instanceof Element ? event.target : event.target?.parentElement;
  if (!target) return null;
  const result = target.closest('[data-search-result="true"]');
  return result && $('messages')?.contains(result) ? { target, result } : null;
}

function isInteractiveMessageTarget(target) {
  return Boolean(target.closest([
    'a',
    'button',
    'input',
    'select',
    'textarea',
    'label',
    'audio',
    'video',
    '[controls]',
    '[contenteditable="true"]',
    '[role="button"]',
    '[data-media-element]',
    '[data-photo-index]',
  ].join(',')));
}

function clearMessageFiltersForJump() {
  pendingMessagesLoad?.cancel?.();
  $('searchBox').value = '';
  $('senderFilter').value = '';
  state.mediaMode = 'all';
  closeLightbox();
  updateChatFilterControls();
  updateMediaTabs();
}

function resetGlobalMessageSearch() {
  pendingGlobalMessageSearch?.cancel?.();
  abortActiveGlobalMessageSearch();
  state.globalSearchResults = [];
  state.globalSearchLoading = false;
  state.globalSearchError = '';
  state.globalSearchQuery = '';
  state.globalSearchResultLimit = state.globalSearchLimit;
  state.globalSearchLimitReached = false;
  state.globalSearchRequestId += 1;
}

function abortActiveGlobalMessageSearch() {
  activeGlobalMessageSearchController?.abort?.();
  activeGlobalMessageSearchController = null;
}

function isCurrentGlobalMessageSearch(query, requestId) {
  return Boolean(
    query
    && state.vaultLoaded
    && requestId === state.globalSearchRequestId
    && state.globalSearchQuery === query
    && state.chatSearchQuery.trim() === query
  );
}

function startGlobalMessageSearchWait(query) {
  const requestId = ++state.globalSearchRequestId;
  state.globalSearchResults = [];
  state.globalSearchLoading = true;
  state.globalSearchError = '';
  state.globalSearchQuery = query;
  state.globalSearchResultLimit = state.globalSearchLimit;
  state.globalSearchLimitReached = false;
  return requestId;
}

function handleSidebarSearchInput(value) {
  state.chatSearchQuery = value;
  resetGlobalMessageSearch();
  const query = state.chatSearchQuery.trim();
  if (!query || !state.vaultLoaded) {
    renderChats();
    return;
  }
  const requestId = startGlobalMessageSearchWait(query);
  renderChats();
  pendingGlobalMessageSearch?.(query, requestId);
}

async function loadGlobalMessageSearch(query, requestId) {
  query = String(query || state.chatSearchQuery.trim()).trim();
  if (!query || !state.vaultLoaded) {
    resetGlobalMessageSearch();
    renderChats();
    return;
  }
  if (!isCurrentGlobalMessageSearch(query, requestId)) return;
  abortActiveGlobalMessageSearch();
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  activeGlobalMessageSearchController = controller;
  state.globalSearchLoading = true;
  state.globalSearchError = '';
  state.globalSearchQuery = query;
  renderChats();
  try {
    const data = await api(
      `/api/search?q=${encodeURIComponent(query)}&limit=${state.globalSearchLimit}`,
      controller ? { signal: controller.signal } : {}
    );
    if (!isCurrentGlobalMessageSearch(query, requestId) || controller?.signal?.aborted) return;
    state.globalSearchResults = Array.isArray(data.results) ? data.results : [];
    const responseLimit = Number(data.limit || state.globalSearchLimit);
    state.globalSearchResultLimit = Number.isFinite(responseLimit) && responseLimit > 0
      ? responseLimit
      : state.globalSearchLimit;
    state.globalSearchLimitReached = state.globalSearchResults.length >= state.globalSearchResultLimit;
  } catch (e) {
    if (!isCurrentGlobalMessageSearch(query, requestId) || controller?.signal?.aborted || e?.name === 'AbortError') return;
    state.globalSearchResults = [];
    state.globalSearchError = text.globalSearchFailed;
    state.globalSearchLimitReached = false;
  } finally {
    if (activeGlobalMessageSearchController === controller) {
      activeGlobalMessageSearchController = null;
    }
    if (!isCurrentGlobalMessageSearch(query, requestId) || controller?.signal?.aborted) return;
    state.globalSearchLoading = false;
    renderChats();
  }
}

function clearSidebarSearch() {
  state.chatSearchQuery = '';
  const input = $('chatSearch');
  if (input) input.value = '';
  resetGlobalMessageSearch();
}

function globalResultChatId(result) {
  return String(result?.chat_id || result?.chatId || '');
}

function globalResultMessageId(result) {
  const value = result?.message_id ?? result?.messageId ?? result?.sourceIndex ?? '';
  return value === null || value === undefined ? '' : String(value);
}

async function openGlobalSearchResult(result) {
  const chatId = globalResultChatId(result);
  const messageId = globalResultMessageId(result);
  if (!chatId || !messageId) return;
  try {
    clearSidebarSearch();
    clearMessageFiltersForJump();
    state.selectedChatId = chatId;
    state.senderFilterSignature = '';
    closeLightbox();
    renderConversationList();

    const cached = state.chatCache[chatId];
    if (cached && Array.isArray(cached.messages) && !cached.error) {
      await renderSelectedChat(cached, '', {
        chatId,
        jumpToMessageId: messageId,
        perfStartedAt: performance.now(),
        perfSource: 'cache',
      });
      return;
    }
    await loadMessages({ jumpToMessageId: messageId });
  } catch (e) {
    setLibraryError(e);
  }
}

function handleSearchResultClick(event) {
  if (event.defaultPrevented) return;
  const match = searchResultClickTarget(event);
  if (!match || isInteractiveMessageTarget(match.target)) return;
  const messageId = match.result.dataset.messageId;
  if (!messageId) return;
  event.preventDefault();
  clearMessageFiltersForJump();
  const cached = state.chatCache[state.selectedChatId];
  if (cached && Array.isArray(cached.messages) && !cached.error) {
    renderSelectedChat(cached, '', {
      chatId: state.selectedChatId,
      jumpToMessageId: messageId,
      perfStartedAt: performance.now(),
      perfSource: 'cache',
    });
    return;
  }
  loadMessages({ jumpToMessageId: messageId });
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
  return cleanVisibleText(value).replace(/\s+/g, ' ').trim();
}

function senderKey(value) {
  return senderName(value).toLowerCase();
}

const FORWARDED_SOURCE_FIELDS = [
  'forwarded_from',
  'forward_from',
  'forwarded_from_chat',
  'forward_from_chat',
  'saved_from',
  'saved_from_peer',
  'forward_author',
  'forward_signature',
  'via',
  'via_bot',
];

function forwardedSource(msg) {
  for (const key of FORWARDED_SOURCE_FIELDS) {
    const source = senderName(msg?.[key]);
    if (source) return source;
  }
  return '';
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

function updateChatFilterControls(senders = null, options = {}) {
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
  filters.classList.toggle('filters--search-hint', hasSearch && Boolean(options.showSearchHint));
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
  const requireMedia = mode !== 'all';
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
    messageVisibleText(msg),
    isServiceMessage(msg) ? serviceNoticeLabel(msg) : '',
    msg.from,
    msg.actor,
    forwardedSource(msg),
    msg.service_kind,
    msg.service_action,
    msg.pinned_message_preview,
    msg.pinned_message_id,
  ].map(value => cleanVisibleText(value).toLowerCase()).join(' ');
}

function messageDomId(msg) {
  const value = msg?.id ?? msg?.sourceIndex ?? '';
  return value === null || value === undefined ? '' : String(value);
}

function messageArticleAttributes(msg, options = {}) {
  const id = messageDomId(msg);
  if (!id) return '';
  const attrs = [`data-message-id="${escapeAttr(id)}"`];
  if (options.searchActive) attrs.push('data-search-result="true"');
  return ` ${attrs.join(' ')}`;
}

function mediaSearchText(msg) {
  return [
    messageVisibleText(msg),
    msg.from,
    mediaName(msg),
    msg.media_kind,
    msg.media_type,
    msg.mime_type,
    msg.sticker_emoji,
    forwardedSource(msg),
  ].map(value => cleanVisibleText(value).toLowerCase()).join(' ');
}

function matchesMediaMode(msg, mode) {
  if (!hasMedia(msg)) return false;
  if (mode === 'photo') return isPhoto(msg) || isStickerImage(msg);
  if (mode === 'video') return isVideo(msg) || isStickerVideo(msg);
  if (mode === 'audio') return isAudio(msg);
  if (mode === 'sticker') return isSticker(msg);
  if (mode === 'file') return !isPhoto(msg) && !isVideo(msg) && !isAudio(msg) && !isSticker(msg);
  return true;
}

function hasMedia(msg) {
  return !isServiceMessage(msg) && Boolean(msg.media || msg.media_url);
}

const PROBABLE_MEDIA_ALBUM_MIN_SIZE = 2;
const PROBABLE_MEDIA_ALBUM_MAX_SIZE = 10;

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

function isVideoNote(msg) {
  if (!isVideo(msg) || isSticker(msg)) return false;
  const flagValues = [
    msg.is_video_note,
    msg.video_note,
    msg.is_round,
    msg.round,
    msg.round_message,
  ];
  if (flagValues.some(value => value === true || String(value || '').toLowerCase() === 'true')) return true;
  const typeValues = [
    msg.media_type,
    msg.type,
  ].map(value => String(value || '').toLowerCase().replace(/[\s-]+/g, '_'));
  return typeValues.some(value => [
    'round',
    'video_note',
    'round_video',
    'round_video_message',
    'round_message',
    'video_message',
  ].includes(value));
}

function isPlayableVideoNote(msg) {
  return isVideoNote(msg) && Boolean(getVideoSourceUrl(msg)) && canPlayVideo(msg);
}

function isAudio(msg) {
  const kind = String(msg.media_kind || '').toLowerCase();
  const mediaType = String(msg.media_type || '').toLowerCase();
  const mime = String(msg.mime_type || '').toLowerCase();
  return kind === 'audio' || mime.startsWith('audio/') || mediaType.includes('audio') || mediaType.includes('voice');
}

function positiveDimension(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function inlineMediaPreviewWidth(msg) {
  if (!msg || isMediaMissing(msg) || isAudio(msg) || isSticker(msg) || isVideoNote(msg)) return 0;
  const width = positiveDimension(msg.width);
  const height = positiveDimension(msg.height);
  if (!width || !height) return 0;
  const ratio = width / height;
  if (isPhoto(msg) && getPhotoPreviewUrl(msg)) {
    const photoWidth = Math.min(width, INLINE_PHOTO_MAX_WIDTH, INLINE_PHOTO_MAX_HEIGHT * ratio);
    return Math.round(photoWidth + 2);
  }
  if (isVideo(msg) && getVideoSourceUrl(msg) && canPlayVideo(msg)) {
    const videoWidth = Math.min(width, INLINE_VIDEO_MAX_WIDTH, INLINE_VIDEO_MAX_HEIGHT * ratio);
    return Math.round(Math.max(300, videoWidth));
  }
  return 0;
}

function hasMessageText(msg) {
  return messageVisibleText(msg).trim().length > 0;
}

function isAudioOnlyMessage(msg) {
  return isAudio(msg) && hasMedia(msg) && !hasMessageText(msg);
}

function usesMediaFirstCaptionLayout(msg) {
  if (!hasMedia(msg) || !hasMessageText(msg) || isMediaMissing(msg) || isSticker(msg) || isAudio(msg) || isVideoNote(msg)) return false;
  if (isPhoto(msg)) return Boolean(getPhotoPreviewUrl(msg));
  if (isVideo(msg)) return Boolean(getVideoSourceUrl(msg)) && canPlayVideo(msg);
  return false;
}

function probableAlbumTimestampKey(msg) {
  return [
    msg?.date_unixtime ? `unix:${String(msg.date_unixtime).trim()}` : '',
    msg?.timestamp ? `timestamp:${String(msg.timestamp).trim()}` : '',
    msg?.date ? `date:${String(msg.date).trim()}` : '',
  ].filter(Boolean).join('|');
}

function isProbableAlbumMediaMessage(msg) {
  if (!hasMedia(msg) || isServiceMessage(msg) || isSticker(msg) || isAudio(msg) || isVideoNote(msg) || isMediaMissing(msg)) return false;
  if (isPhoto(msg)) return Boolean(getPhotoPreviewUrl(msg));
  if (isVideo(msg)) return Boolean(getVideoSourceUrl(msg)) && canPlayVideo(msg);
  return false;
}

function probableAlbumSignature(msg) {
  if (!isProbableAlbumMediaMessage(msg)) return null;
  const sender = senderKey(messageSender(msg));
  const timestamp = probableAlbumTimestampKey(msg);
  if (!sender || !timestamp) return null;
  return {
    sender,
    timestamp,
    forwarded: senderKey(forwardedSource(msg)),
  };
}

function matchesProbableAlbumSignature(msg, signature) {
  const current = probableAlbumSignature(msg);
  return Boolean(current
    && current.sender === signature.sender
    && current.timestamp === signature.timestamp
    && current.forwarded === signature.forwarded);
}

function detectProbableMediaAlbum(messages, startIndex) {
  const first = messages[startIndex];
  const signature = probableAlbumSignature(first);
  if (!signature) return null;
  if (startIndex > 0 && matchesProbableAlbumSignature(messages[startIndex - 1], signature)) return null;

  const album = [first];
  for (let index = startIndex + 1; index < messages.length; index += 1) {
    const candidate = messages[index];
    if (!matchesProbableAlbumSignature(candidate, signature)) break;
    if (hasMessageText(candidate)) return null;
    if (album.length >= PROBABLE_MEDIA_ALBUM_MAX_SIZE) return null;
    album.push(candidate);
  }

  return album.length >= PROBABLE_MEDIA_ALBUM_MIN_SIZE ? album : null;
}

function groupProbableMediaAlbums(messages) {
  const items = [];
  for (let index = 0; index < messages.length;) {
    const album = detectProbableMediaAlbum(messages, index);
    if (album) {
      items.push({ type: 'album', messages: album });
      index += album.length;
      continue;
    }
    items.push({ type: 'message', message: messages[index] });
    index += 1;
  }
  return items;
}

function messageVisibleText(msg) {
  for (const candidate of [msg?.text, msg?.caption]) {
    const value = cleanVisibleText(candidate);
    if (value) return value;
  }
  return '';
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
  const clean = cleanVisibleText(value).replace(/\s+/g, ' ').replace(/\.{3,}$/, '').trim();
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

function renderPinnedServiceMessage(msg, options = {}) {
  const time = messageTime(msg);
  const serviceClasses = ['message', 'message--service', options.searchActive ? 'message--search-result' : ''].filter(Boolean).join(' ');
  return `
    <article class="${serviceClasses}" aria-label="${escapeAttr(text.pinnedMessage)}"${messageArticleAttributes(msg, options)}>
      <div class="service-notice service-notice--pin">
        <span class="service-notice__text">${escapeHtml(pinnedServiceLabel(msg))}</span>
        ${time ? `<span class="service-notice__time">${escapeHtml(time)}</span>` : ''}
      </div>
    </article>
  `;
}

function renderServiceMessage(msg, options = {}) {
  const time = messageTime(msg);
  const label = serviceNoticeLabel(msg);
  const photoUpdate = isPhotoUpdateServiceMessage(msg);
  const noticeClasses = ['service-notice', photoUpdate ? 'service-notice--photo' : ''].filter(Boolean).join(' ');
  const serviceClasses = ['message', 'message--service', options.searchActive ? 'message--search-result' : ''].filter(Boolean).join(' ');
  const photoPreview = photoUpdate ? renderServicePhotoPreview(msg, label) : '';
  return `
    <article class="${serviceClasses}" aria-label="${escapeAttr(label)}"${messageArticleAttributes(msg, options)}>
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

function renderMessages(messages, chat = {}, senders = [], options = {}) {
  const box = $('messages');
  const photoContext = 'vault-current';
  const searchActive = Boolean(options.searchActive);
  setPhotoContext(photoContext, messages);
  resetDeferredMediaSourceObserver();
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
  groupProbableMediaAlbums(messages).forEach(item => {
    const msg = item.type === 'album' ? item.messages[0] : item.message;
    const dayKey = messageDayKey(msg);
    if (dayKey !== previousDayKey) {
      html.push(renderDateSeparator(dayKey));
      previousDayKey = dayKey;
    }
    if (item.type === 'album') {
      html.push(renderProbableMediaAlbum(item.messages, directionContext, photoContext, { searchActive }));
      return;
    }
    if (isPinnedServiceMessage(msg)) {
      html.push(renderPinnedServiceMessage(msg, { searchActive }));
      return;
    }
    if (isServiceMessage(msg)) {
      html.push(renderServiceMessage(msg, { searchActive }));
      return;
    }
    const stickerMessage = isSticker(msg);
    const messageText = messageVisibleText(msg);
    const messageHasText = messageText.trim().length > 0;
    const audioOnlyMessage = isAudioOnlyMessage(msg);
    const missingOnlyMessage = !stickerMessage && isMediaMissing(msg) && hasMedia(msg) && !messageHasText;
    const playableVideoNote = isPlayableVideoNote(msg);
    const mediaFirstCaptionLayout = usesMediaFirstCaptionLayout(msg);
    const mediaPreviewWidth = messageHasText && hasMedia(msg) && !stickerMessage && !audioOnlyMessage && !missingOnlyMessage && !playableVideoNote
      ? inlineMediaPreviewWidth(msg)
      : 0;
    const direction = getMessageDirection(msg, directionContext);
    const messageClasses = [
      'message',
      direction ? `message--${direction}` : 'message--neutral',
      stickerMessage ? 'message--sticker' : '',
      audioOnlyMessage ? 'message--audio-only' : '',
      missingOnlyMessage ? 'message--missing-only' : '',
      playableVideoNote ? 'message--video-note' : '',
      hasMedia(msg) ? 'message--media' : '',
      messageHasText ? 'message--text' : 'message--no-text',
      searchActive ? 'message--search-result' : '',
    ].filter(Boolean).join(' ');
    const bubbleClasses = [
      'message-bubble',
      'conversation-message-card',
      stickerMessage ? 'bubble--sticker' : '',
      audioOnlyMessage ? 'bubble--audio-only' : '',
      missingOnlyMessage ? 'bubble--missing-only' : '',
      mediaPreviewWidth ? 'bubble--media-preview-sized' : '',
    ].filter(Boolean).join(' ');
    const bubbleStyle = mediaPreviewWidth ? ` style="--media-preview-width: ${mediaPreviewWidth}px"` : '';
    const inlineMedia = renderInlineMedia(msg, photoContext);
    html.push(`
      <article class="${messageClasses}"${messageArticleAttributes(msg, { searchActive })}>
        ${renderMessageMeta(msg)}
      <div class="${bubbleClasses}"${bubbleStyle}>
        ${renderForwardedMeta(msg)}
        ${mediaFirstCaptionLayout ? inlineMedia : ''}
        ${messageHasText ? `<div class="text">${escapeHtml(messageText)}</div>` : ''}
        ${mediaFirstCaptionLayout ? '' : inlineMedia}
      </div>
      </article>
    `);
  });
  box.innerHTML = html.join('');
  bindMediaErrorHandlers(box);
  bindDeferredMediaSources(box);
  bindPhotoTriggers(box);
}

function renderMediaMode(messages) {
  const box = $('messages');
  const photoContext = 'vault-current';
  state.lightboxPhotos = setPhotoContext(photoContext, messages);
  resetDeferredMediaSourceObserver();
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
  const mediaCardClasses = [
    'media-card',
    `media-card-${state.mediaMode}`,
    state.mediaMode === 'audio' ? 'media-item--audio-compact' : '',
  ].filter(Boolean).join(' ');
  messages.forEach((msg, index) => {
    const dayKey = messageDayKey(msg);
    if (dayKey !== previousDayKey) {
      html.push(renderDateSeparator(dayKey));
      previousDayKey = dayKey;
    }
    const itemClasses = [
      mediaCardClasses,
      isSticker(msg) ? 'media-card-sticker' : '',
      isPlayableVideoNote(msg) ? 'media-card--video-note' : '',
    ].filter(Boolean).join(' ');
    html.push(`
      <article class="${itemClasses}" data-media-card="true">
        ${renderMediaCard(msg, index, photoContext)}
      </article>
    `);
  });
  box.innerHTML = html.join('');
  bindMediaErrorHandlers(box);
  bindDeferredMediaSources(box);
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
  const captionText = cleanVisibleText(options.caption);
  const caption = captionText ? `<span class="photo-preview-caption">${escapeHtml(captionText)}</span>` : '';
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
  const fallbackTitle = mediaFallbackTitle(kind);
  const title = cleanVisibleText(options.title || fallbackTitle) || fallbackTitle;
  const name = mediaName(msg);
  const originalUrl = options.originalUrl === undefined ? mediaFallbackOriginalUrl(kind, msg) : options.originalUrl;
  const hidden = options.hidden ? ' hidden' : '';
  const className = options.className ? ` ${options.className}` : '';
  return `
    <div class="media-fallback media-fallback-${escapeAttr(kind)}${escapeAttr(className)}"${hidden} data-media-fallback>
      ${icons.file}
      <div class="media-fallback-info">
        <strong>${escapeHtml(title)}</strong>
        <span class="media-fallback-body">${escapeHtml(text.mediaUnavailableBody)}</span>
        ${name ? `<span class="media-fallback-name">${escapeHtml(name)}</span>` : ''}
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
  const preview = previewUrl
    ? `<img src="${escapeAttr(previewUrl)}" alt="${escapeAttr(mediaName(msg))}" loading="lazy" data-media-element />`
    : (msg.sticker_emoji
      ? `<span class="sticker-fallback-emoji" role="img" aria-label="${escapeAttr(isTgsSticker(msg) ? text.animatedTelegramSticker : text.telegramSticker)}">${escapeHtml(msg.sticker_emoji)}</span>`
      : `<span class="sticker-fallback-mark" role="img" aria-label="${escapeAttr(isTgsSticker(msg) ? text.animatedTelegramSticker : text.telegramSticker)}"></span>`);
  const missing = isMediaMissing(msg) ? `<span class="sticker-fallback-note">${text.fileMissing}</span>` : '';
  return `
    <div class="sticker-fallback ${escapeAttr(className)}" data-media-container>
      ${preview}
      ${previewUrl ? renderMissingNotice(mediaFallbackKind(msg), msg, { originalUrl, className: 'sticker-error-fallback' }) : ''}
      ${previewUrl ? renderStickerEmoji(msg) : ''}
      ${missing}
      ${originalUrl ? `<a class="sticker-open-link sticker-open-link--secondary" href="${escapeAttr(originalUrl)}" target="_blank" rel="noreferrer">${text.openOriginal}</a>` : ''}
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
    ${renderCardMeta(msg)}
    ${renderPhotoPreview(msg, index, { context: photoContext, className: 'media-preview photo-trigger', label: 'открыть фото' })}
    ${renderMediaCaption(msg)}
  `;
}

function renderStickerCard(msg, photoContext = 'vault-current') {
  return `
    ${renderCardMeta(msg)}
    ${renderStickerMedia(msg, photoContext, 'sticker-preview-card')}
    ${renderMediaCaption(msg)}
  `;
}

function videoPosterAttribute(msg) {
  const posterUrl = getVideoPosterUrl(msg);
  return posterUrl ? ` poster="${escapeAttr(posterUrl)}"` : '';
}

function renderVideoNotePlayer(msg, className) {
  const videoUrl = getVideoSourceUrl(msg);
  const poster = videoPosterAttribute(msg);
  return `
    <div class="${className}" data-media-container data-video-note-container>
      <video class="video-note" preload="none" playsinline${poster} data-media-src="${escapeAttr(videoUrl)}" data-media-element></video>
      <button class="video-note-play-button" type="button" data-video-note-toggle aria-label="Play video note" aria-pressed="false"></button>
      ${renderMissingNotice('video', msg)}
    </div>
  `;
}

function renderVideoCard(msg) {
  const videoUrl = getVideoSourceUrl(msg);
  if (!videoUrl) return renderMissingCard(msg);
  if (!canPlayVideo(msg)) return renderFileCard(msg, 'video');
  const videoNote = isPlayableVideoNote(msg);
  if (videoNote) {
    return `
      ${renderCardMeta(msg)}
      ${renderVideoNotePlayer(msg, 'media-preview media-preview-video media-preview-video-note')}
      ${renderMediaCaption(msg)}
    `;
  }
  const poster = videoPosterAttribute(msg);
  return `
    ${renderCardMeta(msg)}
    <div class="media-preview media-preview-video" data-media-container>
      <video controls preload="none"${poster} data-media-src="${escapeAttr(videoUrl)}" data-media-element></video>
      ${renderMissingNotice('video', msg)}
    </div>
    ${renderMediaCaption(msg)}
  `;
}

function renderAudioCard(msg) {
  return `
    ${renderCardMeta(msg)}
    ${renderAudioPlayer(msg)}
    ${renderMediaCaption(msg)}
  `;
}

function renderAudioLabel(msg) {
  const name = mediaName(msg);
  if (!name) return '';
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
      <audio controls preload="none" data-media-src="${escapeAttr(msg.media_url)}" data-media-element></audio>
      ${renderMissingNotice('audio', msg)}
    </div>
  `;
}

function renderFileCard(msg, kindLabel = '', options = {}) {
  const details = [kindLabel || fileType(msg), formatFileSize(msg.file_size)].filter(Boolean).join(' · ');
  const meta = options.showMeta === false ? '' : renderCardMeta(msg);
  const name = mediaName(msg) || text.unknownType;
  return `
    ${meta}
    <div class="file-card-body">
      ${icons.file}
      <div class="file-card-info">
        <a href="${escapeAttr(msg.media_url)}" target="_blank" rel="noreferrer">${escapeHtml(name)}</a>
        <span>${escapeHtml(details || text.unknownType)}</span>
      </div>
      ${msg.media_url ? `<a class="open-link" href="${escapeAttr(msg.media_url)}" target="_blank" rel="noreferrer">${text.open}</a>` : ''}
    </div>
    ${renderMediaCaption(msg)}
  `;
}

function renderMissingPhotoCard(msg, index, photoContext = 'vault-current') {
  return `
    ${renderCardMeta(msg)}
    <button class="media-missing-card media-missing-trigger" type="button" data-photo-context="${escapeAttr(photoContext)}" data-photo-index="${index}" aria-label="${text.open}: ${escapeAttr(mediaName(msg))}">
      ${renderMediaFallback('image', msg)}
    </button>
    ${renderMediaCaption(msg)}
  `;
}

function renderMissingCard(msg) {
  const kind = mediaFallbackKind(msg);
  return `
    ${renderCardMeta(msg)}
    ${renderMediaFallback(kind, msg, { className: 'media-missing-card' })}
    ${renderMediaCaption(msg)}
  `;
}

function renderMediaCaption(msg) {
  const caption = messageVisibleText(msg);
  return caption ? `<div class="media-caption">${escapeHtml(shortText(caption))}</div>` : '';
}

function renderMessageMeta(msg) {
  return `
    <div class="message-meta">
      <span class="message-meta__sender">${escapeHtml(messageSender(msg) || text.system)}</span>
      <span class="message-meta__time">${escapeHtml(messageTime(msg))}</span>
    </div>
  `;
}

function renderForwardedMeta(msg) {
  const source = forwardedSource(msg);
  if (!source) return '';
  return `<div class="message-forwarded">${escapeHtml(text.forwardedFrom)} <span>${escapeHtml(source)}</span></div>`;
}

function renderCardMeta(msg) {
  return `${renderMessageMeta(msg)}${renderForwardedMeta(msg)}`;
}

function albumGridClass(size) {
  if (size === 2) return 'media-album--two media-album-grid--count-2';
  if (size === 3) return 'media-album--compact media-album-grid--count-3';
  if (size === 4) return 'media-album--compact media-album-grid--count-4';
  if (size === 8) return 'media-album--many media-album-grid--count-8';
  return 'media-album--many media-album-grid--count-many';
}

function messageIdAttribute(msg) {
  const id = messageDomId(msg);
  return id ? ` data-message-id="${escapeAttr(id)}"` : '';
}

function renderAlbumMediaItem(msg, photoContext = 'vault-current') {
  const kindClass = isPhoto(msg) ? 'media-album-item--photo' : 'media-album-item--video';
  const idAttribute = messageIdAttribute(msg);
  if (isPhoto(msg)) {
    const index = photoIndexFor(msg, photoContext);
    const preview = index >= 0
      ? renderPhotoPreview(msg, index, { context: photoContext, className: 'album-photo-preview', label: 'открыть фото' })
      : renderMediaFallback('image', msg);
    return `<div class="media-album-item ${kindClass}"${idAttribute}>${preview}</div>`;
  }

  const videoUrl = getVideoSourceUrl(msg);
  const content = videoUrl && canPlayVideo(msg)
    ? `<div class="album-video-preview" data-media-container><video controls preload="none"${videoPosterAttribute(msg)} data-media-src="${escapeAttr(videoUrl)}" data-media-element></video>${renderMissingNotice('video', msg)}</div>`
    : renderMediaFallback('video', msg);
  return `<div class="media-album-item ${kindClass}"${idAttribute}>${content}</div>`;
}

function renderProbableMediaAlbum(albumMessages, directionContext, photoContext = 'vault-current', options = {}) {
  const first = albumMessages[0];
  const caption = messageVisibleText(first);
  const direction = getMessageDirection(first, directionContext);
  const sizeClass = albumMessages.length < 5 ? 'bubble--media-album-compact' : 'bubble--media-album-wide';
  const messageClasses = [
    'message',
    'message--album',
    direction ? `message--${direction}` : 'message--neutral',
    'message--media',
    caption ? 'message--text' : 'message--no-text',
    options.searchActive ? 'message--search-result' : '',
  ].filter(Boolean).join(' ');
  const bubbleClasses = [
    'message-bubble',
    'conversation-message-card',
    'bubble--media-album',
    sizeClass,
  ].join(' ');
  return `
    <article class="${messageClasses}"${messageArticleAttributes(first, options)} data-media-album="true" data-album-size="${albumMessages.length}">
      ${renderMessageMeta(first)}
      <div class="${bubbleClasses}">
        ${renderForwardedMeta(first)}
        <div class="media media-album media-album-grid ${albumGridClass(albumMessages.length)}">
          ${albumMessages.map(msg => renderAlbumMediaItem(msg, photoContext)).join('')}
        </div>
        ${caption ? `<div class="text media-album-caption">${escapeHtml(caption)}</div>` : ''}
      </div>
    </article>
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
  if (isVideo(msg) && videoUrl && canPlayVideo(msg)) {
    const videoNote = isPlayableVideoNote(msg);
    if (videoNote) return renderVideoNotePlayer(msg, 'media media--video-note');
    return `<div class="media" data-media-container><video controls preload="none"${videoPosterAttribute(msg)} data-media-src="${escapeAttr(videoUrl)}" data-media-element></video>${renderMissingNotice('video', msg)}</div>`;
  }
  if (isAudio(msg)) return `<div class="media media-audio">${renderAudioPlayer(msg)}</div>`;
  return `<div class="media">${renderFileCard(msg, '', { showMeta: false })}</div>`;
}

function bindMediaErrorHandlers(root) {
  root.querySelectorAll('[data-media-element]').forEach(element => {
    element.addEventListener('error', () => handleMediaElementError(element), { once: true });
  });
}

function resetDeferredMediaSourceObserver() {
  if (!deferredMediaSourceObserver) return;
  deferredMediaSourceObserver.disconnect();
  deferredMediaSourceObserver = null;
}

function hydrateDeferredMediaSource(element) {
  if (!isRegularPlayableMedia(element)) return false;
  const source = element.dataset.mediaSrc || '';
  if (!source || element.getAttribute('src')) return false;
  element.setAttribute('src', source);
  return true;
}

function requestMediaMetadata(element) {
  if (!element || element.dataset.mediaMetadataLoaded === '1') return;
  if (!isRegularPlayableMedia(element)) return;
  if (!hydrateDeferredMediaSource(element) && !element.getAttribute('src')) return;
  element.dataset.mediaMetadataLoaded = '1';
  element.preload = 'metadata';
  if (element.readyState === 0 && element.paused) {
    try {
      element.load();
    } catch {}
  }
}

function deferredMediaElementFromEvent(event) {
  const root = event.currentTarget instanceof Element ? event.currentTarget : null;
  const target = event.target instanceof Element
    ? event.target.closest('audio[data-media-src], video[data-media-src]')
    : null;
  return root && target && root.contains(target) ? target : null;
}

function hydrateDeferredMediaFromEvent(event) {
  const element = deferredMediaElementFromEvent(event);
  if (element) requestMediaMetadata(element);
}

function handleDeferredMediaKeydown(event) {
  if (event.key !== ' ' && event.key !== 'Enter') return;
  hydrateDeferredMediaFromEvent(event);
}

function observeDeferredMediaSources(root) {
  if (!('IntersectionObserver' in window)) return;
  const mediaElements = Array.from(root.querySelectorAll('audio[data-media-src], video[data-media-src]'))
    .filter(isRegularPlayableMedia);
  if (!mediaElements.length) return;

  deferredMediaSourceObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      requestMediaMetadata(entry.target);
      if (deferredMediaSourceObserver) deferredMediaSourceObserver.unobserve(entry.target);
    });
  }, {
    root: root.id === 'messages' ? root : null,
    rootMargin: '180px 0px',
    threshold: 0.01,
  });

  mediaElements.forEach(element => deferredMediaSourceObserver.observe(element));
}

function bindDeferredMediaSources(root) {
  if (!root) return;
  if (root.dataset.deferredMediaSourcesBound !== '1') {
    root.dataset.deferredMediaSourcesBound = '1';
    root.addEventListener('pointerover', hydrateDeferredMediaFromEvent, true);
    root.addEventListener('pointerdown', hydrateDeferredMediaFromEvent, true);
    root.addEventListener('focusin', hydrateDeferredMediaFromEvent, true);
    root.addEventListener('play', hydrateDeferredMediaFromEvent, true);
    root.addEventListener('keydown', handleDeferredMediaKeydown, true);
  }
  observeDeferredMediaSources(root);
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
  const previousElement = activeRegularMediaElement;
  activeRegularMediaElement = activeElement;
  if (!previousElement || previousElement === activeElement) return;
  if (!isRegularPlayableMedia(previousElement)) return;
  if (previousElement.paused) return;
  try {
    previousElement.pause();
  } catch {}
}

function handleRegularMediaPlay(event) {
  const element = event.target;
  if (!isRegularPlayableMedia(element)) return;
  requestMediaMetadata(element);
  pauseOtherRegularMedia(element);
}

function isVideoNoteElement(element) {
  return isMediaElement(element) && element.classList.contains('video-note');
}

function videoNoteContainerFor(element) {
  return element?.closest('[data-video-note-container]') || null;
}

function updateVideoNotePlaybackState(video) {
  if (!isVideoNoteElement(video)) return;
  const container = videoNoteContainerFor(video);
  if (!container) return;
  const isPlaying = !video.paused && !video.ended;
  container.classList.toggle('is-playing', isPlaying);
  const button = container.querySelector('[data-video-note-toggle]');
  if (!button) return;
  button.setAttribute('aria-label', isPlaying ? 'Pause video note' : 'Play video note');
  button.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
}

function handleVideoNoteMediaState(event) {
  updateVideoNotePlaybackState(event.target);
}

function toggleVideoNotePlayback(container) {
  const video = container?.querySelector('video.video-note');
  if (!video || video.hidden) return;
  requestMediaMetadata(video);
  if (!video.getAttribute('src')) return;
  if (video.paused || video.ended) {
    pauseOtherRegularMedia(video);
    const playAttempt = video.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => updateVideoNotePlaybackState(video));
    }
  } else {
    video.pause();
  }
  updateVideoNotePlaybackState(video);
}

function handleVideoNoteClick(event) {
  if (event.defaultPrevented) return;
  const target = event.target instanceof Element ? event.target : event.target?.parentElement;
  const container = target?.closest('[data-video-note-container]');
  if (!container || !$('messages')?.contains(container)) return;
  if (target.closest('a, [data-media-fallback]')) return;
  event.preventDefault();
  event.stopPropagation();
  toggleVideoNotePlayback(container);
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
  const mediaPath = cleanVisibleText(msg?.media || msg?.file || '');
  const pathName = mediaPath ? mediaPath.split(/[\\/]/).pop() : '';
  const candidates = [
    msg?.media_name,
    msg?.file_name,
    pathName,
    msg?.name,
    msg?.title,
    msg?.description,
  ];
  for (const candidate of candidates) {
    const name = cleanVisibleText(candidate);
    if (name) return name;
  }
  return '';
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
  const clean = cleanVisibleText(value).replace(/\s+/g, ' ').trim();
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
  const senderLabel = [cleanVisibleText(msg.chatTitle), messageSender(msg) || text.system].filter(Boolean).join(' · ');
  const caption = messageVisibleText(msg);
  lightbox.querySelector('.sender').textContent = senderLabel;
  lightbox.querySelector('.date').textContent = msg.date || '';
  captionText.textContent = shortText(caption);
  captionText.hidden = !caption;
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
  const debounced = (...args) => {
    clearTimeout(t);
    t = setTimeout(() => {
      t = null;
      fn(...args);
    }, delay);
  };
  debounced.cancel = () => {
    clearTimeout(t);
    t = null;
  };
  return debounced;
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
  document.addEventListener('play', handleVideoNoteMediaState, true);
  document.addEventListener('pause', handleVideoNoteMediaState, true);
  document.addEventListener('ended', handleVideoNoteMediaState, true);
  document.addEventListener('click', event => {
    const forgetTrigger = event.target.closest('[data-forget-missing-export]');
    if (forgetTrigger) {
      event.preventDefault();
      forgetMissingExport();
      return;
    }
    const pickTrigger = event.target.closest('[data-pick-folder]');
    if (pickTrigger) {
      event.preventDefault();
      pickFolder();
    }
  });
  $('messages').addEventListener('click', handleVideoNoteClick);
  $('messages').addEventListener('click', handleSearchResultClick);
  const debouncedGlobalMessageSearch = debounce(loadGlobalMessageSearch, 220);
  pendingGlobalMessageSearch = debouncedGlobalMessageSearch;
  $('chatSearch').addEventListener('input', event => {
    handleSidebarSearchInput(event.target.value);
  });
  const debouncedLoadMessages = debounce(loadMessages);
  pendingMessagesLoad = debouncedLoadMessages;
  $('searchBox').addEventListener('input', () => {
    updateChatFilterControls();
    debouncedLoadMessages();
  });
  $('senderFilter').addEventListener('change', () => {
    updateChatFilterControls();
    loadMessages();
  });
  $('resetFilters').addEventListener('click', () => {
    $('searchBox').value = '';
    $('senderFilter').value = '';
    state.mediaMode = 'all';
    updateChatFilterControls();
    updateMediaTabs();
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
  updateMediaTabs();
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
    } else if (savedVault.missing || savedVault.unavailable || savedVault.reason === 'missing') {
      setLibraryMissing(savedVault);
      renderConversationList();
      renderVaultWelcome({ mode: 'missing' });
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
