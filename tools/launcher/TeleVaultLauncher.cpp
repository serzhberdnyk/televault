#ifndef UNICODE
#define UNICODE
#endif
#ifndef _UNICODE
#define _UNICODE
#endif
#ifndef WINVER
#define WINVER 0x0601
#endif
#ifndef _WIN32_WINNT
#define _WIN32_WINNT 0x0601
#endif

#define WIN32_LEAN_AND_MEAN

#include <winsock2.h>
#include <ws2tcpip.h>
#include <windows.h>
#include <shellapi.h>
#include <winhttp.h>

#include <algorithm>
#include <cctype>
#include <cstdio>
#include <cwchar>
#include <cwctype>
#include <string>
#include <vector>

#pragma comment(lib, "shell32.lib")
#pragma comment(lib, "user32.lib")
#pragma comment(lib, "winhttp.lib")
#pragma comment(lib, "ws2_32.lib")

namespace {

constexpr wchar_t kAppName[] = L"TeleVault";
constexpr wchar_t kAppVersion[] = L"2.9.3";
constexpr wchar_t kNoAutoBrowserEnv[] = L"TELEVAULT_NO_AUTO_BROWSER";
constexpr wchar_t kWindowStateDirectoryName[] = L"user_data";
constexpr wchar_t kWindowStateFileName[] = L"launcher_window.json";
constexpr wchar_t kMainRuntimeRelative[] = L"runtime\\python\\pythonw.exe";
constexpr wchar_t kLegacyRuntimeRelative[] = L"runtime\\python38-win7\\pythonw.exe";
constexpr wchar_t kLegacyRuntimeMarkerRelative[] = L"runtime\\win7-legacy.txt";
constexpr int kAppPort = 8766;
constexpr int kServerStartupTimeoutMs = 30000;
constexpr int kServerPollIntervalMs = 400;
constexpr int kWindowMonitorIntervalMs = 500;
constexpr int kWindowOpenWaitTimeoutMs = 8000;
constexpr int kWindowMissingCloseGraceMs = 1500;
constexpr int kWindowStateSaveThrottleMs = 1000;
constexpr int kMinWindowWidth = 900;
constexpr int kMinWindowHeight = 600;

const std::wstring kAppUrl = L"http://127.0.0.1:8766/";
const std::wstring kStatusPath = L"/api/status";

std::wstring g_logPath;
std::wstring g_windowStatePath;

struct StatusInfo {
    std::wstring name;
    std::wstring version;
};

enum class ExistingInstanceState {
    NotRunning,
    CurrentVersionTeleVaultRunning,
    DifferentVersionTeleVaultRunning,
    PortOccupiedByOther,
};

struct ExistingInstanceResult {
    ExistingInstanceState state = ExistingInstanceState::NotRunning;
    std::wstring name;
    std::wstring version;
};

struct HttpStatusResponse {
    bool ok = false;
    DWORD httpStatus = 0;
    DWORD error = 0;
    std::string body;
};

struct LauncherWindowState {
    int x = 0;
    int y = 0;
    int width = 0;
    int height = 0;
    bool maximized = false;
};

struct RuntimeSelection {
    std::wstring relativePath;
    std::wstring absolutePath;
    bool exists = false;
    bool legacy = false;
};

struct WindowSearchContext {
    HWND found = nullptr;
    bool logDetails = false;
};

std::wstring WideToLower(std::wstring value) {
    std::transform(value.begin(), value.end(), value.begin(), [](wchar_t ch) {
        return static_cast<wchar_t>(std::towlower(ch));
    });
    return value;
}

bool EqualsNoCase(const std::wstring& left, const std::wstring& right) {
    return _wcsicmp(left.c_str(), right.c_str()) == 0;
}

bool ContainsNoCase(const std::wstring& haystack, const std::wstring& needle) {
    return WideToLower(haystack).find(WideToLower(needle)) != std::wstring::npos;
}

std::wstring DirectoryName(const std::wstring& path) {
    const size_t slash = path.find_last_of(L"\\/");
    if (slash == std::wstring::npos) {
        return L".";
    }
    if (slash == 0) {
        return path.substr(0, 1);
    }
    return path.substr(0, slash);
}

std::wstring FileName(const std::wstring& path) {
    const size_t slash = path.find_last_of(L"\\/");
    if (slash == std::wstring::npos) {
        return path;
    }
    return path.substr(slash + 1);
}

std::wstring JoinPath(const std::wstring& left, const std::wstring& right) {
    if (left.empty()) {
        return right;
    }
    if (right.empty()) {
        return left;
    }
    const wchar_t last = left[left.size() - 1];
    if (last == L'\\' || last == L'/') {
        return left + right;
    }
    return left + L"\\" + right;
}

bool FileExists(const std::wstring& path) {
    const DWORD attributes = GetFileAttributesW(path.c_str());
    return attributes != INVALID_FILE_ATTRIBUTES && (attributes & FILE_ATTRIBUTE_DIRECTORY) == 0;
}

bool DirectoryExists(const std::wstring& path) {
    const DWORD attributes = GetFileAttributesW(path.c_str());
    return attributes != INVALID_FILE_ATTRIBUTES && (attributes & FILE_ATTRIBUTE_DIRECTORY) != 0;
}

bool EnsureDirectory(const std::wstring& path) {
    if (DirectoryExists(path)) {
        return true;
    }
    if (CreateDirectoryW(path.c_str(), nullptr)) {
        return true;
    }
    return GetLastError() == ERROR_ALREADY_EXISTS;
}

bool EnsureDirectoryTree(const std::wstring& path) {
    if (path.empty() || DirectoryExists(path)) {
        return true;
    }
    const std::wstring parent = DirectoryName(path);
    if (!parent.empty() && parent != path && !DirectoryExists(parent)) {
        if (!EnsureDirectoryTree(parent)) {
            return false;
        }
    }
    return EnsureDirectory(path);
}

std::wstring ReadEnvironmentValue(const std::wstring& name) {
    const DWORD required = GetEnvironmentVariableW(name.c_str(), nullptr, 0);
    if (required == 0) {
        return L"";
    }
    std::vector<wchar_t> buffer(required);
    GetEnvironmentVariableW(name.c_str(), buffer.data(), required);
    return std::wstring(buffer.data());
}

bool CanAppendToFile(const std::wstring& path) {
    HANDLE file = CreateFileW(
        path.c_str(),
        FILE_APPEND_DATA,
        FILE_SHARE_READ,
        nullptr,
        OPEN_ALWAYS,
        FILE_ATTRIBUTE_NORMAL,
        nullptr);
    if (file == INVALID_HANDLE_VALUE) {
        return false;
    }
    CloseHandle(file);
    return true;
}

std::string WideToUtf8(const std::wstring& value) {
    if (value.empty()) {
        return std::string();
    }
    const int size = WideCharToMultiByte(CP_UTF8, 0, value.c_str(), -1, nullptr, 0, nullptr, nullptr);
    if (size <= 1) {
        return std::string();
    }
    std::string result(static_cast<size_t>(size - 1), '\0');
    WideCharToMultiByte(CP_UTF8, 0, value.c_str(), -1, &result[0], size, nullptr, nullptr);
    return result;
}

std::wstring Utf8ToWide(const std::string& value) {
    if (value.empty()) {
        return std::wstring();
    }
    const int size = MultiByteToWideChar(CP_UTF8, 0, value.c_str(), -1, nullptr, 0);
    if (size <= 1) {
        return std::wstring();
    }
    std::wstring result(static_cast<size_t>(size - 1), L'\0');
    MultiByteToWideChar(CP_UTF8, 0, value.c_str(), -1, &result[0], size);
    return result;
}

std::wstring FormatLastError(DWORD error) {
    if (error == 0) {
        return L"unknown error";
    }

    wchar_t* buffer = nullptr;
    const DWORD length = FormatMessageW(
        FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_IGNORE_INSERTS,
        nullptr,
        error,
        0,
        reinterpret_cast<LPWSTR>(&buffer),
        0,
        nullptr);

    if (length == 0 || buffer == nullptr) {
        return L"error " + std::to_wstring(error);
    }

    std::wstring message(buffer, length);
    LocalFree(buffer);
    while (!message.empty() && (message.back() == L'\r' || message.back() == L'\n' || message.back() == L' ')) {
        message.pop_back();
    }
    return message;
}

std::wstring SafeLogValue(const std::wstring& value) {
    if (value.empty()) {
        return L"(missing)";
    }
    std::wstring result = value;
    std::replace(result.begin(), result.end(), L'\r', L' ');
    std::replace(result.begin(), result.end(), L'\n', L' ');
    return result;
}

void Log(const std::wstring& message) {
    if (g_logPath.empty()) {
        return;
    }

    SYSTEMTIME now{};
    GetLocalTime(&now);
    wchar_t timestamp[32]{};
    swprintf_s(
        timestamp,
        L"%04u-%02u-%02u %02u:%02u:%02u",
        now.wYear,
        now.wMonth,
        now.wDay,
        now.wHour,
        now.wMinute,
        now.wSecond);

    const std::string line = WideToUtf8(std::wstring(timestamp) + L" " + message + L"\r\n");
    if (line.empty()) {
        return;
    }

    HANDLE file = CreateFileW(
        g_logPath.c_str(),
        FILE_APPEND_DATA,
        FILE_SHARE_READ,
        nullptr,
        OPEN_ALWAYS,
        FILE_ATTRIBUTE_NORMAL,
        nullptr);
    if (file == INVALID_HANDLE_VALUE) {
        return;
    }

    DWORD written = 0;
    WriteFile(file, line.data(), static_cast<DWORD>(line.size()), &written, nullptr);
    CloseHandle(file);
}

std::wstring LogLocationText() {
    if (g_logPath.empty()) {
        return L"Launcher log is not available.";
    }
    return L"Launcher log: " + g_logPath;
}

void ShowError(const std::wstring& message) {
    MessageBoxW(nullptr, message.c_str(), kAppName, MB_OK | MB_ICONERROR);
}

void ShowInfo(const std::wstring& message) {
    MessageBoxW(nullptr, message.c_str(), kAppName, MB_OK | MB_ICONINFORMATION);
}

std::wstring GetAppRoot() {
    std::vector<wchar_t> buffer(MAX_PATH);
    while (true) {
        const DWORD length = GetModuleFileNameW(nullptr, buffer.data(), static_cast<DWORD>(buffer.size()));
        if (length == 0) {
            return L".";
        }
        if (length < buffer.size() - 1) {
            return DirectoryName(std::wstring(buffer.data(), length));
        }
        buffer.resize(buffer.size() * 2);
    }
}

void InitializeLogging(const std::wstring& appRoot) {
    const std::wstring logsDir = JoinPath(appRoot, L"logs");
    const std::wstring localLogPath = JoinPath(logsDir, L"launcher.log");
    if (EnsureDirectory(logsDir) && CanAppendToFile(localLogPath)) {
        g_logPath = localLogPath;
        return;
    }

    const std::wstring localAppData = ReadEnvironmentValue(L"LOCALAPPDATA");
    if (!localAppData.empty()) {
        const std::wstring fallbackDir = JoinPath(JoinPath(localAppData, L"TeleVault"), L"logs");
        const std::wstring fallbackLogPath = JoinPath(fallbackDir, L"launcher.log");
        if (EnsureDirectoryTree(fallbackDir) && CanAppendToFile(fallbackLogPath)) {
            g_logPath = fallbackLogPath;
        }
    }
}

void InitializeWindowState(const std::wstring& appRoot) {
    g_windowStatePath = JoinPath(JoinPath(appRoot, kWindowStateDirectoryName), kWindowStateFileName);
    Log(L"window state initialized: " + g_windowStatePath);
}

std::wstring QuoteArgument(const std::wstring& value) {
    std::wstring result = L"\"";
    size_t backslashes = 0;

    for (wchar_t ch : value) {
        if (ch == L'\\') {
            ++backslashes;
            continue;
        }
        if (ch == L'"') {
            result.append(backslashes * 2 + 1, L'\\');
            result.push_back(ch);
            backslashes = 0;
            continue;
        }
        result.append(backslashes, L'\\');
        backslashes = 0;
        result.push_back(ch);
    }

    result.append(backslashes * 2, L'\\');
    result.push_back(L'"');
    return result;
}

bool ReadFileUtf8(const std::wstring& path, std::string* body) {
    body->clear();
    HANDLE file = CreateFileW(path.c_str(), GENERIC_READ, FILE_SHARE_READ | FILE_SHARE_WRITE, nullptr, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, nullptr);
    if (file == INVALID_HANDLE_VALUE) {
        return false;
    }

    LARGE_INTEGER size{};
    if (!GetFileSizeEx(file, &size) || size.QuadPart < 0 || size.QuadPart > 1024 * 1024) {
        CloseHandle(file);
        return false;
    }

    std::vector<char> buffer(static_cast<size_t>(size.QuadPart));
    DWORD read = 0;
    const BOOL ok = buffer.empty() || ReadFile(file, buffer.data(), static_cast<DWORD>(buffer.size()), &read, nullptr);
    CloseHandle(file);
    if (!ok) {
        return false;
    }

    body->assign(buffer.data(), buffer.data() + read);
    return true;
}

bool WriteFileUtf8(const std::wstring& path, const std::string& body) {
    HANDLE file = CreateFileW(path.c_str(), GENERIC_WRITE, 0, nullptr, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, nullptr);
    if (file == INVALID_HANDLE_VALUE) {
        return false;
    }

    DWORD written = 0;
    const BOOL ok = body.empty() || WriteFile(file, body.data(), static_cast<DWORD>(body.size()), &written, nullptr);
    CloseHandle(file);
    return ok && written == body.size();
}

std::string ExtractJsonStringField(const std::string& body, const std::string& fieldName) {
    const std::string key = "\"" + fieldName + "\"";
    size_t position = body.find(key);
    if (position == std::string::npos) {
        return std::string();
    }

    position = body.find(':', position + key.size());
    if (position == std::string::npos) {
        return std::string();
    }

    ++position;
    while (position < body.size() && std::isspace(static_cast<unsigned char>(body[position]))) {
        ++position;
    }
    if (position >= body.size() || body[position] != '"') {
        return std::string();
    }

    ++position;
    std::string value;
    bool escaping = false;
    for (; position < body.size(); ++position) {
        const char ch = body[position];
        if (escaping) {
            value.push_back(ch);
            escaping = false;
            continue;
        }
        if (ch == '\\') {
            escaping = true;
            continue;
        }
        if (ch == '"') {
            break;
        }
        value.push_back(ch);
    }
    return value;
}

int ExtractJsonIntField(const std::string& body, const std::string& fieldName, int fallback) {
    const std::string key = "\"" + fieldName + "\"";
    size_t position = body.find(key);
    if (position == std::string::npos) {
        return fallback;
    }
    position = body.find(':', position + key.size());
    if (position == std::string::npos) {
        return fallback;
    }
    ++position;
    while (position < body.size() && std::isspace(static_cast<unsigned char>(body[position]))) {
        ++position;
    }

    bool negative = false;
    if (position < body.size() && body[position] == '-') {
        negative = true;
        ++position;
    }
    int value = 0;
    bool hasDigit = false;
    while (position < body.size() && std::isdigit(static_cast<unsigned char>(body[position]))) {
        hasDigit = true;
        value = value * 10 + (body[position] - '0');
        ++position;
    }
    if (!hasDigit) {
        return fallback;
    }
    return negative ? -value : value;
}

bool ExtractJsonBoolField(const std::string& body, const std::string& fieldName, bool fallback) {
    const std::string key = "\"" + fieldName + "\"";
    size_t position = body.find(key);
    if (position == std::string::npos) {
        return fallback;
    }
    position = body.find(':', position + key.size());
    if (position == std::string::npos) {
        return fallback;
    }
    ++position;
    while (position < body.size() && std::isspace(static_cast<unsigned char>(body[position]))) {
        ++position;
    }

    if (body.compare(position, 4, "true") == 0) {
        return true;
    }
    if (body.compare(position, 5, "false") == 0) {
        return false;
    }
    return fallback;
}

StatusInfo ParseStatusBody(const std::string& body) {
    StatusInfo status;
    status.name = Utf8ToWide(ExtractJsonStringField(body, "name"));
    status.version = Utf8ToWide(ExtractJsonStringField(body, "version"));
    return status;
}

bool IsTeleVaultStatus(const StatusInfo& status) {
    return EqualsNoCase(status.name, kAppName);
}

bool IsTeleVaultReadyStatusBody(const std::string& body) {
    const StatusInfo status = ParseStatusBody(body);
    return IsTeleVaultStatus(status)
        && EqualsNoCase(status.version, kAppVersion)
        && ExtractJsonBoolField(body, "ready", false);
}

HttpStatusResponse FetchStatus(int timeoutMs) {
    HttpStatusResponse result;
    const std::wstring userAgent = L"TeleVaultLauncher/" + std::wstring(kAppVersion);

    HINTERNET session = WinHttpOpen(
        userAgent.c_str(),
        WINHTTP_ACCESS_TYPE_NO_PROXY,
        WINHTTP_NO_PROXY_NAME,
        WINHTTP_NO_PROXY_BYPASS,
        0);
    if (!session) {
        result.error = GetLastError();
        return result;
    }

    WinHttpSetTimeouts(session, timeoutMs, timeoutMs, timeoutMs, timeoutMs);
    HINTERNET connection = WinHttpConnect(session, L"127.0.0.1", kAppPort, 0);
    if (!connection) {
        result.error = GetLastError();
        WinHttpCloseHandle(session);
        return result;
    }

    HINTERNET request = WinHttpOpenRequest(
        connection,
        L"GET",
        kStatusPath.c_str(),
        nullptr,
        WINHTTP_NO_REFERER,
        WINHTTP_DEFAULT_ACCEPT_TYPES,
        0);
    if (!request) {
        result.error = GetLastError();
        WinHttpCloseHandle(connection);
        WinHttpCloseHandle(session);
        return result;
    }

    if (!WinHttpSendRequest(request, WINHTTP_NO_ADDITIONAL_HEADERS, 0, WINHTTP_NO_REQUEST_DATA, 0, 0, 0)
        || !WinHttpReceiveResponse(request, nullptr)) {
        result.error = GetLastError();
        WinHttpCloseHandle(request);
        WinHttpCloseHandle(connection);
        WinHttpCloseHandle(session);
        return result;
    }

    DWORD statusCode = 0;
    DWORD statusCodeSize = sizeof(statusCode);
    if (!WinHttpQueryHeaders(
            request,
            WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER,
            WINHTTP_HEADER_NAME_BY_INDEX,
            &statusCode,
            &statusCodeSize,
            WINHTTP_NO_HEADER_INDEX)) {
        result.error = GetLastError();
        WinHttpCloseHandle(request);
        WinHttpCloseHandle(connection);
        WinHttpCloseHandle(session);
        return result;
    }

    result.httpStatus = statusCode;
    result.ok = true;

    while (true) {
        DWORD available = 0;
        if (!WinHttpQueryDataAvailable(request, &available)) {
            break;
        }
        if (available == 0) {
            break;
        }

        std::vector<char> buffer(available);
        DWORD read = 0;
        if (!WinHttpReadData(request, buffer.data(), available, &read) || read == 0) {
            break;
        }
        result.body.append(buffer.data(), buffer.data() + read);
    }

    WinHttpCloseHandle(request);
    WinHttpCloseHandle(connection);
    WinHttpCloseHandle(session);
    return result;
}

bool IsLocalPortOccupied() {
    WSADATA data{};
    if (WSAStartup(MAKEWORD(2, 2), &data) != 0) {
        Log(L"TCP port check skipped because WSAStartup failed");
        return false;
    }

    SOCKET socketHandle = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (socketHandle == INVALID_SOCKET) {
        WSACleanup();
        return false;
    }

    u_long nonBlocking = 1;
    ioctlsocket(socketHandle, FIONBIO, &nonBlocking);

    sockaddr_in address{};
    address.sin_family = AF_INET;
    address.sin_port = htons(static_cast<u_short>(kAppPort));
    address.sin_addr.s_addr = htonl(INADDR_LOOPBACK);

    const int connectResult = connect(socketHandle, reinterpret_cast<sockaddr*>(&address), sizeof(address));
    int socketError = WSAGetLastError();
    bool occupied = false;

    if (connectResult == 0) {
        occupied = true;
    } else if (socketError == WSAEWOULDBLOCK || socketError == WSAEINPROGRESS || socketError == WSAEINVAL) {
        fd_set writeSet;
        FD_ZERO(&writeSet);
        FD_SET(socketHandle, &writeSet);
        timeval timeout{};
        timeout.tv_usec = 500000;
        const int selectResult = select(0, nullptr, &writeSet, nullptr, &timeout);
        if (selectResult > 0 && FD_ISSET(socketHandle, &writeSet)) {
            int optionError = 0;
            int optionLength = sizeof(optionError);
            getsockopt(socketHandle, SOL_SOCKET, SO_ERROR, reinterpret_cast<char*>(&optionError), &optionLength);
            occupied = optionError == 0;
        }
    }

    closesocket(socketHandle);
    WSACleanup();
    Log(occupied ? L"TCP port check connected to 8766" : L"TCP port check did not connect");
    return occupied;
}

ExistingInstanceResult CheckExistingInstance() {
    Log(L"checking existing instance: http://127.0.0.1:8766/api/status");

    const HttpStatusResponse response = FetchStatus(1000);
    if (response.ok) {
        if (response.httpStatus == 200) {
            const StatusInfo status = ParseStatusBody(response.body);
            Log(L"existing instance check: status name=" + SafeLogValue(status.name) + L", version=" + SafeLogValue(status.version));
            if (IsTeleVaultStatus(status)) {
                if (EqualsNoCase(status.version, kAppVersion)) {
                    Log(L"existing TeleVault detected with current version");
                    return {ExistingInstanceState::CurrentVersionTeleVaultRunning, status.name, status.version};
                }
                Log(L"existing TeleVault detected with different version");
                return {ExistingInstanceState::DifferentVersionTeleVaultRunning, status.name, status.version};
            }
        }

        Log(L"existing instance check: port occupied by non-TeleVault status endpoint, HTTP " + std::to_wstring(response.httpStatus));
        return {ExistingInstanceState::PortOccupiedByOther, L"", L""};
    }

    Log(L"existing instance check: status endpoint not available, error=" + std::to_wstring(response.error));
    if (IsLocalPortOccupied()) {
        Log(L"existing instance check: port occupied by another program");
        return {ExistingInstanceState::PortOccupiedByOther, L"", L""};
    }

    Log(L"existing instance check: no TeleVault detected");
    return {ExistingInstanceState::NotRunning, L"", L""};
}

std::wstring GetInvalidWindowStateReason(const LauncherWindowState& state) {
    if (state.width < kMinWindowWidth || state.height < kMinWindowHeight) {
        return L"bounds are smaller than 900x600";
    }

    const int virtualX = GetSystemMetrics(SM_XVIRTUALSCREEN);
    const int virtualY = GetSystemMetrics(SM_YVIRTUALSCREEN);
    const int virtualWidth = GetSystemMetrics(SM_CXVIRTUALSCREEN);
    const int virtualHeight = GetSystemMetrics(SM_CYVIRTUALSCREEN);
    if (virtualWidth <= 0 || virtualHeight <= 0) {
        return L"";
    }

    const long long windowRight = static_cast<long long>(state.x) + state.width;
    const long long windowBottom = static_cast<long long>(state.y) + state.height;
    const long long virtualRight = static_cast<long long>(virtualX) + virtualWidth;
    const long long virtualBottom = static_cast<long long>(virtualY) + virtualHeight;

    const bool intersectsVirtualScreen = state.x < virtualRight
        && windowRight > virtualX
        && state.y < virtualBottom
        && windowBottom > virtualY;

    if (!intersectsVirtualScreen) {
        return L"bounds are outside the virtual screen";
    }

    return L"";
}

bool IsValidWindowState(const LauncherWindowState& state) {
    return GetInvalidWindowStateReason(state).empty();
}

std::wstring FormatWindowState(const LauncherWindowState& state) {
    return std::to_wstring(state.width)
        + L"x"
        + std::to_wstring(state.height)
        + L"+"
        + std::to_wstring(state.x)
        + L"+"
        + std::to_wstring(state.y)
        + L", maximized="
        + (state.maximized ? L"true" : L"false");
}

bool LoadWindowState(LauncherWindowState* state) {
    Log(L"window state path: " + SafeLogValue(g_windowStatePath));
    if (g_windowStatePath.empty() || !FileExists(g_windowStatePath)) {
        Log(L"window state file missing");
        return false;
    }

    std::string body;
    if (!ReadFileUtf8(g_windowStatePath, &body)) {
        Log(L"invalid window state fallback: read failed");
        return false;
    }

    LauncherWindowState loaded;
    loaded.width = ExtractJsonIntField(body, "width", 0);
    loaded.height = ExtractJsonIntField(body, "height", 0);
    loaded.x = ExtractJsonIntField(body, "x", 0);
    loaded.y = ExtractJsonIntField(body, "y", 0);
    loaded.maximized = ExtractJsonBoolField(body, "maximized", false);

    const std::wstring invalidReason = GetInvalidWindowStateReason(loaded);
    if (!invalidReason.empty()) {
        Log(L"invalid window state fallback: " + invalidReason);
        return false;
    }

    *state = loaded;
    Log(L"loaded window state: " + FormatWindowState(loaded));
    return true;
}

void SaveWindowState(const LauncherWindowState& state) {
    const std::wstring invalidReason = GetInvalidWindowStateReason(state);
    if (!invalidReason.empty()) {
        Log(L"invalid current window state not saved: " + invalidReason + L", " + FormatWindowState(state));
        return;
    }

    if (g_windowStatePath.empty()) {
        Log(L"window state path is not available");
        return;
    }

    const std::wstring directory = DirectoryName(g_windowStatePath);
    EnsureDirectory(directory);

    const std::string body = "{\r\n"
        "  \"width\": " + std::to_string(state.width) + ",\r\n"
        "  \"height\": " + std::to_string(state.height) + ",\r\n"
        "  \"x\": " + std::to_string(state.x) + ",\r\n"
        "  \"y\": " + std::to_string(state.y) + ",\r\n"
        "  \"maximized\": " + std::string(state.maximized ? "true" : "false") + "\r\n"
        "}\r\n";

    const std::wstring tempPath = g_windowStatePath + L".tmp";
    if (!WriteFileUtf8(tempPath, body)) {
        Log(L"window state save failed: write failed");
        return;
    }
    DeleteFileW(g_windowStatePath.c_str());
    if (!MoveFileW(tempPath.c_str(), g_windowStatePath.c_str())) {
        Log(L"window state save failed: " + FormatLastError(GetLastError()));
        DeleteFileW(tempPath.c_str());
        return;
    }

    Log(L"saved window state: " + FormatWindowState(state));
}

bool AreWindowStatesEqual(const LauncherWindowState& left, const LauncherWindowState& right) {
    return left.x == right.x
        && left.y == right.y
        && left.width == right.width
        && left.height == right.height
        && left.maximized == right.maximized;
}

void SaveWindowStateIfNeeded(
    const LauncherWindowState& state,
    bool* hasLastSavedState,
    LauncherWindowState* lastSavedState,
    ULONGLONG* lastSaveTick,
    bool force) {
    const ULONGLONG now = GetTickCount64();
    if (!force && *hasLastSavedState && AreWindowStatesEqual(state, *lastSavedState)) {
        return;
    }
    if (!force && *hasLastSavedState && now - *lastSaveTick < kWindowStateSaveThrottleMs) {
        return;
    }

    SaveWindowState(state);
    *lastSavedState = state;
    *hasLastSavedState = true;
    *lastSaveTick = now;
}

std::wstring GetWindowTitle(HWND window) {
    const int length = GetWindowTextLengthW(window);
    if (length <= 0) {
        return L"";
    }
    std::vector<wchar_t> buffer(static_cast<size_t>(length) + 1);
    GetWindowTextW(window, buffer.data(), static_cast<int>(buffer.size()));
    return std::wstring(buffer.data());
}

std::wstring GetWindowProcessName(HWND window) {
    DWORD processId = 0;
    GetWindowThreadProcessId(window, &processId);
    if (processId == 0) {
        return L"";
    }

    HANDLE process = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, processId);
    if (!process) {
        return L"";
    }

    std::vector<wchar_t> buffer(32768);
    DWORD size = static_cast<DWORD>(buffer.size());
    std::wstring processPath;
    if (QueryFullProcessImageNameW(process, 0, buffer.data(), &size)) {
        processPath.assign(buffer.data(), size);
    }
    CloseHandle(process);
    return WideToLower(FileName(processPath));
}

bool IsAllowedBrowserProcess(const std::wstring& processName) {
    return EqualsNoCase(processName, L"msedge.exe") || EqualsNoCase(processName, L"chrome.exe");
}

BOOL CALLBACK EnumWindowsCallback(HWND window, LPARAM parameter) {
    WindowSearchContext* context = reinterpret_cast<WindowSearchContext*>(parameter);
    if (!IsWindowVisible(window)) {
        return TRUE;
    }

    const std::wstring title = GetWindowTitle(window);
    if (!ContainsNoCase(title, kAppName)) {
        return TRUE;
    }

    const std::wstring processName = GetWindowProcessName(window);
    if (!IsAllowedBrowserProcess(processName)) {
        if (context->logDetails) {
            Log(L"TeleVault-titled window ignored because process is not Edge/Chrome: " + SafeLogValue(processName));
        }
        return TRUE;
    }

    context->found = window;
    if (context->logDetails) {
        wchar_t handleText[32]{};
        swprintf_s(handleText, L"0x%p", window);
        Log(L"existing TeleVault window found: hwnd=" + std::wstring(handleText)
            + L", title=" + SafeLogValue(title)
            + L", process=" + SafeLogValue(processName));
    }
    return FALSE;
}

HWND FindExistingTeleVaultWindow(bool logDetails) {
    WindowSearchContext context;
    context.logDetails = logDetails;
    EnumWindows(EnumWindowsCallback, reinterpret_cast<LPARAM>(&context));
    return context.found;
}

bool TryFocusExistingWindow() {
    HWND window = FindExistingTeleVaultWindow(true);
    if (!window) {
        Log(L"existing TeleVault window not found");
        return false;
    }

    ShowWindow(window, SW_RESTORE);
    const BOOL foreground = SetForegroundWindow(window);
    Log(std::wstring(L"window focused: existing TeleVault app window")
        + (foreground ? L"" : L" (foreground request returned false)"));
    return true;
}

bool TryCaptureWindowState(HWND window, LauncherWindowState* state) {
    if (IsIconic(window)) {
        return false;
    }

    RECT rect{};
    bool maximized = false;
    WINDOWPLACEMENT placement{};
    placement.length = sizeof(placement);
    if (GetWindowPlacement(window, &placement)) {
        if (placement.showCmd == SW_SHOWMINIMIZED) {
            return false;
        }
        rect = placement.rcNormalPosition;
        maximized = placement.showCmd == SW_SHOWMAXIMIZED;
        if ((rect.right - rect.left <= 0 || rect.bottom - rect.top <= 0) && !GetWindowRect(window, &rect)) {
            return false;
        }
    } else if (!GetWindowRect(window, &rect)) {
        return false;
    }

    LauncherWindowState captured;
    captured.x = rect.left;
    captured.y = rect.top;
    captured.width = rect.right - rect.left;
    captured.height = rect.bottom - rect.top;
    captured.maximized = maximized;
    if (!IsValidWindowState(captured)) {
        return false;
    }

    *state = captured;
    return true;
}

HWND WaitForTeleVaultWindow(int timeoutMs) {
    const ULONGLONG deadline = GetTickCount64() + timeoutMs;
    while (GetTickCount64() < deadline) {
        HWND window = FindExistingTeleVaultWindow(false);
        if (window) {
            return window;
        }
        Sleep(200);
    }
    return nullptr;
}

void TryApplyWindowState(const LauncherWindowState* windowState) {
    if (!windowState) {
        return;
    }

    HWND window = WaitForTeleVaultWindow(kWindowOpenWaitTimeoutMs);
    if (!window) {
        Log(L"window state not applied because the app window was not found");
        return;
    }

    ShowWindow(window, SW_RESTORE);
    const BOOL moved = MoveWindow(window, windowState->x, windowState->y, windowState->width, windowState->height, TRUE);
    Log(L"applied window state with MoveWindow: " + FormatWindowState(*windowState)
        + (moved ? L"" : L" (MoveWindow returned false)"));
    if (windowState->maximized) {
        ShowWindow(window, SW_SHOWMAXIMIZED);
        Log(L"maximized window state restored");
    }
}

std::wstring GetEnvironmentValue(const std::wstring& name) {
    const DWORD required = GetEnvironmentVariableW(name.c_str(), nullptr, 0);
    if (required == 0) {
        return L"";
    }
    std::vector<wchar_t> buffer(required);
    GetEnvironmentVariableW(name.c_str(), buffer.data(), required);
    return std::wstring(buffer.data());
}

std::wstring FindExecutableOnPath(const std::wstring& executableName) {
    std::vector<wchar_t> buffer(32768);
    wchar_t* filePart = nullptr;
    const DWORD length = SearchPathW(nullptr, executableName.c_str(), nullptr, static_cast<DWORD>(buffer.size()), buffer.data(), &filePart);
    if (length == 0 || length >= buffer.size()) {
        return L"";
    }
    return std::wstring(buffer.data(), length);
}

std::wstring FindBrowser(const std::wstring& executableName, const std::vector<std::wstring>& candidatePaths) {
    for (const std::wstring& path : candidatePaths) {
        if (!path.empty() && FileExists(path)) {
            Log(L"browser found: " + executableName);
            return path;
        }
    }

    const std::wstring fromPath = FindExecutableOnPath(executableName);
    if (!fromPath.empty()) {
        Log(L"browser found on PATH: " + executableName);
        return fromPath;
    }

    Log(L"browser not found: " + executableName);
    return L"";
}

std::wstring BuildBrowserArguments(const std::wstring& url, const LauncherWindowState* windowState) {
    std::wstring arguments = L"--app=" + url;
    if (windowState) {
        arguments += L" --window-size="
            + std::to_wstring(windowState->width)
            + L","
            + std::to_wstring(windowState->height)
            + L" --window-position="
            + std::to_wstring(windowState->x)
            + L","
            + std::to_wstring(windowState->y);
    }
    return arguments;
}

bool StartAppModeBrowser(const std::wstring& browserPath, const std::wstring& url, const std::wstring& browserName, const LauncherWindowState* windowState) {
    const std::wstring arguments = BuildBrowserArguments(url, windowState);
    std::wstring commandLine = QuoteArgument(browserPath) + L" " + arguments;
    std::vector<wchar_t> mutableCommandLine(commandLine.begin(), commandLine.end());
    mutableCommandLine.push_back(L'\0');

    STARTUPINFOW startup{};
    startup.cb = sizeof(startup);
    PROCESS_INFORMATION process{};
    const std::wstring workingDirectory = DirectoryName(browserPath);

    Log(browserName + L" app-mode launch args: " + arguments);
    const BOOL created = CreateProcessW(
        browserPath.c_str(),
        mutableCommandLine.data(),
        nullptr,
        nullptr,
        FALSE,
        CREATE_NO_WINDOW,
        nullptr,
        workingDirectory.c_str(),
        &startup,
        &process);
    if (!created) {
        Log(browserName + L" app-mode launch failed: " + FormatLastError(GetLastError()));
        return false;
    }

    CloseHandle(process.hThread);
    CloseHandle(process.hProcess);
    Log(L"browser app-mode opened: " + browserName);
    TryApplyWindowState(windowState);
    return true;
}

void OpenBrowserWindow(const std::wstring& url, const LauncherWindowState* windowState) {
    Log(L"opening browser window: " + url);

    const std::wstring programFilesX86 = GetEnvironmentValue(L"ProgramFiles(x86)");
    const std::wstring programFiles = GetEnvironmentValue(L"ProgramW6432").empty()
        ? GetEnvironmentValue(L"ProgramFiles")
        : GetEnvironmentValue(L"ProgramW6432");
    const std::wstring localAppData = GetEnvironmentValue(L"LOCALAPPDATA");

    const std::wstring edge = FindBrowser(
        L"msedge.exe",
        {
            JoinPath(JoinPath(JoinPath(programFilesX86, L"Microsoft"), L"Edge"), L"Application\\msedge.exe"),
            JoinPath(JoinPath(JoinPath(programFiles, L"Microsoft"), L"Edge"), L"Application\\msedge.exe"),
            JoinPath(JoinPath(JoinPath(localAppData, L"Microsoft"), L"Edge"), L"Application\\msedge.exe"),
        });
    if (!edge.empty() && StartAppModeBrowser(edge, url, L"Edge", windowState)) {
        return;
    }

    const std::wstring chrome = FindBrowser(
        L"chrome.exe",
        {
            JoinPath(JoinPath(JoinPath(programFiles, L"Google"), L"Chrome"), L"Application\\chrome.exe"),
            JoinPath(JoinPath(JoinPath(programFilesX86, L"Google"), L"Chrome"), L"Application\\chrome.exe"),
            JoinPath(JoinPath(JoinPath(localAppData, L"Google"), L"Chrome"), L"Application\\chrome.exe"),
        });
    if (!chrome.empty() && StartAppModeBrowser(chrome, url, L"Chrome", windowState)) {
        return;
    }

    Log(L"app-mode browser not found; opening default browser fallback");
    const HINSTANCE shellResult = ShellExecuteW(nullptr, L"open", url.c_str(), nullptr, nullptr, SW_SHOWNORMAL);
    if (reinterpret_cast<INT_PTR>(shellResult) <= 32) {
        Log(L"default browser fallback failed: ShellExecuteW code " + std::to_wstring(reinterpret_cast<INT_PTR>(shellResult)));
        ShowError(L"TeleVault is running, but the launcher could not open a browser window.\n\nOpen this address manually:\n"
            + url
            + L"\n\n"
            + LogLocationText());
        return;
    }

    ShowInfo(L"TeleVault opened in your default browser because Microsoft Edge or Google Chrome app mode was not found.");
}

bool IsServerReady() {
    const HttpStatusResponse response = FetchStatus(1000);
    return response.ok && response.httpStatus == 200 && IsTeleVaultReadyStatusBody(response.body);
}

bool WaitForServerReady(HANDLE processHandle) {
    const ULONGLONG deadline = GetTickCount64() + kServerStartupTimeoutMs;
    while (GetTickCount64() < deadline) {
        const DWORD waitResult = WaitForSingleObject(processHandle, 0);
        if (waitResult == WAIT_OBJECT_0) {
            DWORD exitCode = 0;
            GetExitCodeProcess(processHandle, &exitCode);
            Log(L"python process exited before server ready with code " + std::to_wstring(exitCode));
            return false;
        }

        if (IsServerReady()) {
            Log(L"server ready: status endpoint confirmed");
            return true;
        }

        Sleep(kServerPollIntervalMs);
    }

    Log(L"server timeout: status endpoint did not become ready");
    return false;
}

void StopStartedProcess(HANDLE processHandle) {
    if (!processHandle) {
        return;
    }
    if (WaitForSingleObject(processHandle, 0) == WAIT_TIMEOUT) {
        Log(L"stopping python process after startup failure");
        TerminateProcess(processHandle, 1);
        WaitForSingleObject(processHandle, 3000);
    }
}

void StopStartedProcessAfterWindowClosed(HANDLE processHandle) {
    if (!processHandle) {
        return;
    }
    if (WaitForSingleObject(processHandle, 0) == WAIT_TIMEOUT) {
        Log(L"stopping owned python process after app window close");
        TerminateProcess(processHandle, 0);
        WaitForSingleObject(processHandle, 3000);
    }

    DWORD exitCode = 0;
    if (GetExitCodeProcess(processHandle, &exitCode)) {
        Log(L"owned python process exited with code " + std::to_wstring(exitCode));
    }
}

int MonitorStartedProcess(HANDLE processHandle) {
    Log(L"launcher monitor started for owned backend");
    LauncherWindowState lastWindowState;
    LauncherWindowState lastSavedState;
    bool hasLastWindowState = false;
    bool hasLastSavedState = false;
    bool sawWindow = false;
    bool loggedMissingWindowTimeout = false;
    const ULONGLONG firstWindowDeadline = GetTickCount64() + kWindowOpenWaitTimeoutMs;
    ULONGLONG missingWindowSince = 0;
    ULONGLONG lastSaveTick = 0;

    while (WaitForSingleObject(processHandle, kWindowMonitorIntervalMs) == WAIT_TIMEOUT) {
        HWND window = FindExistingTeleVaultWindow(!sawWindow);
        if (window) {
            if (!sawWindow) {
                Log(L"launcher monitor attached to app window");
            }
            sawWindow = true;
            missingWindowSince = 0;

            LauncherWindowState currentState;
            if (TryCaptureWindowState(window, &currentState)) {
                lastWindowState = currentState;
                hasLastWindowState = true;
                SaveWindowStateIfNeeded(currentState, &hasLastSavedState, &lastSavedState, &lastSaveTick, false);
            }
            continue;
        }

        const ULONGLONG now = GetTickCount64();
        if (!sawWindow) {
            if (!loggedMissingWindowTimeout && now >= firstWindowDeadline) {
                Log(L"launcher monitor did not find an app window before timeout; continuing backend monitor");
                loggedMissingWindowTimeout = true;
            }
            continue;
        }

        if (missingWindowSince == 0) {
            missingWindowSince = now;
        }

        if (now - missingWindowSince >= kWindowMissingCloseGraceMs) {
            if (hasLastWindowState) {
                SaveWindowStateIfNeeded(lastWindowState, &hasLastSavedState, &lastSavedState, &lastSaveTick, true);
            }
            Log(L"app window closed; stopping owned backend");
            StopStartedProcessAfterWindowClosed(processHandle);
            Log(L"launcher finished after app window closed");
            return 0;
        }
    }

    LauncherWindowState finalState;
    HWND finalWindow = FindExistingTeleVaultWindow(false);
    if (finalWindow && TryCaptureWindowState(finalWindow, &finalState)) {
        SaveWindowStateIfNeeded(finalState, &hasLastSavedState, &lastSavedState, &lastSaveTick, true);
    } else if (hasLastWindowState) {
        SaveWindowStateIfNeeded(lastWindowState, &hasLastSavedState, &lastSavedState, &lastSaveTick, true);
    }

    DWORD exitCode = 1;
    GetExitCodeProcess(processHandle, &exitCode);
    Log(L"python process exited with code " + std::to_wstring(exitCode));
    return static_cast<int>(exitCode);
}

void AddMissingFile(std::vector<std::wstring>* missing, const std::wstring& label, const std::wstring& path) {
    if (!FileExists(path)) {
        missing->push_back(label);
    }
}

void AddMissingDirectory(std::vector<std::wstring>* missing, const std::wstring& label, const std::wstring& path) {
    if (!DirectoryExists(path)) {
        missing->push_back(label);
    }
}

std::wstring GetArchitectureText() {
    SYSTEM_INFO info{};
    GetNativeSystemInfo(&info);
    switch (info.wProcessorArchitecture) {
    case PROCESSOR_ARCHITECTURE_AMD64:
        return L"x64";
    case PROCESSOR_ARCHITECTURE_INTEL:
        return L"x86";
    case PROCESSOR_ARCHITECTURE_ARM64:
        return L"arm64";
    default:
        return L"unknown";
    }
}

RuntimeSelection SelectPythonRuntime(const std::wstring& appRoot) {
    const std::wstring legacyPath = JoinPath(appRoot, kLegacyRuntimeRelative);
    const std::wstring mainPath = JoinPath(appRoot, kMainRuntimeRelative);
    const std::wstring markerPath = JoinPath(appRoot, kLegacyRuntimeMarkerRelative);
    const bool legacyMarkerExists = FileExists(markerPath);
    const bool legacyRuntimeExists = FileExists(legacyPath);
    const bool mainRuntimeExists = FileExists(mainPath);

    if (legacyMarkerExists || (!mainRuntimeExists && legacyRuntimeExists)) {
        return {kLegacyRuntimeRelative, legacyPath, legacyRuntimeExists, true};
    }
    return {kMainRuntimeRelative, mainPath, mainRuntimeExists, false};
}

std::wstring FriendlyMissingItemName(const std::wstring& item) {
    if (EqualsNoCase(item, L"runtime\\python\\pythonw.exe")) {
        return L"bundled Python runtime (runtime\\python\\pythonw.exe)";
    }
    if (EqualsNoCase(item, L"runtime\\python38-win7\\pythonw.exe")) {
        return L"Windows 7 legacy Python runtime (runtime\\python38-win7\\pythonw.exe)";
    }
    if (EqualsNoCase(item, L"app.py")) {
        return L"application file (app.py)";
    }
    if (EqualsNoCase(item, L"backend\\")) {
        return L"backend folder (backend\\)";
    }
    if (EqualsNoCase(item, L"frontend\\")) {
        return L"frontend folder (frontend\\)";
    }
    return item;
}

std::wstring BuildMissingFilesMessage(const std::vector<std::wstring>& missing) {
    std::wstring message = L"TeleVault cannot start because this folder is missing required application files.\n\nMissing:\n";
    for (const std::wstring& item : missing) {
        message += L"- " + FriendlyMissingItemName(item) + L"\n";
    }
    message += L"\nExtract the TeleVault zip again and start TeleVault.exe from the extracted TeleVault folder.\n\n";
    message += LogLocationText();
    return message;
}

std::wstring BuildLegacyRuntimeMissingMessage() {
    return L"TeleVault \u043d\u0435 \u043c\u043e\u0436\u0435\u0442 \u0437\u0430\u043f\u0443\u0441\u0442\u0438\u0442\u044c\u0441\u044f: "
        L"\u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d legacy runtime \u0434\u043b\u044f Windows 7."
        L"\n\n\u0414\u043b\u044f Windows 7 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0439\u0442\u0435 "
        L"\u0441\u043f\u0435\u0446\u0438\u0430\u043b\u044c\u043d\u0443\u044e \u0441\u0431\u043e\u0440\u043a\u0443:"
        L"\nTeleVault win7 legacy x64."
        L"\n\n\u041d\u0435 \u0441\u043a\u0430\u0447\u0438\u0432\u0430\u0439\u0442\u0435 api-ms-win-core-path-l1-1-0.dll "
        L"\u043e\u0442\u0434\u0435\u043b\u044c\u043d\u043e - \u044d\u0442\u043e \u043d\u0435\u0431\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u043e."
        L"\n\n"
        + LogLocationText();
}

std::wstring BuildPortOccupiedMessage() {
    return L"TeleVault cannot start because port 8766 is already used by another program."
        L"\n\nClose the other program or restart Windows, then open TeleVault.exe again."
        L"\n\n"
        + LogLocationText();
}

std::wstring BuildVersionMismatchMessage(const std::wstring& version) {
    const std::wstring displayVersion = version.empty() ? L"unknown" : version;
    return L"Another TeleVault version is already running: "
        + displayVersion
        + L".\n\nClose the running TeleVault window before starting TeleVault "
        + kAppVersion
        + L".\n\n"
        + LogLocationText();
}

std::wstring BuildPythonStartFailedMessage() {
    return L"TeleVault could not start its bundled Python runtime."
        L"\n\nExtract the TeleVault zip again and start TeleVault.exe from the extracted TeleVault folder."
        L"\n\n"
        + LogLocationText();
}

std::wstring BuildServerTimeoutMessage() {
    return L"TeleVault started, but the local server did not become ready in time."
        L"\n\nClose TeleVault windows and try again. If it still fails, check the launcher log."
        L"\n\n"
        + LogLocationText();
}

std::wstring BuildUnexpectedErrorMessage() {
    return L"TeleVault could not start because the launcher hit an unexpected error."
        L"\n\nClose TeleVault and try again. Technical details were written to the launcher log."
        L"\n\n"
        + LogLocationText();
}

bool StartPythonBackend(const std::wstring& appRoot, const RuntimeSelection& runtime, PROCESS_INFORMATION* process) {
    const std::wstring commandLine = QuoteArgument(runtime.absolutePath) + L" " + QuoteArgument(L"app.py");
    std::vector<wchar_t> mutableCommandLine(commandLine.begin(), commandLine.end());
    mutableCommandLine.push_back(L'\0');

    STARTUPINFOW startup{};
    startup.cb = sizeof(startup);

    SetEnvironmentVariableW(kNoAutoBrowserEnv, L"1");
    Log(L"selected runtime path: " + runtime.relativePath);
    Log(runtime.exists ? L"selected pythonw.exe: found" : L"selected pythonw.exe: missing");
    Log(L"launch command: " + runtime.relativePath + L" app.py");
    Log(L"new backend start");
    Log(L"starting pythonw process");

    const BOOL created = CreateProcessW(
        runtime.absolutePath.c_str(),
        mutableCommandLine.data(),
        nullptr,
        nullptr,
        FALSE,
        CREATE_NO_WINDOW,
        nullptr,
        appRoot.c_str(),
        &startup,
        process);
    if (!created) {
        Log(L"pythonw process start failed: " + FormatLastError(GetLastError()));
        return false;
    }

    CloseHandle(process->hThread);
    process->hThread = nullptr;
    Log(L"pythonw process started");
    return true;
}

int RunLauncher() {
    PROCESS_INFORMATION process{};
    const std::wstring appRoot = GetAppRoot();
    InitializeLogging(appRoot);
    InitializeWindowState(appRoot);

    Log(L"launcher start");
    Log(L"launcher version: " + std::wstring(kAppVersion));
    Log(L"detected architecture: " + GetArchitectureText());
    Log(L"app root: " + appRoot);

    if (!SetCurrentDirectoryW(appRoot.c_str())) {
        Log(L"SetCurrentDirectoryW failed: " + FormatLastError(GetLastError()));
        ShowError(L"TeleVault cannot start because the launcher could not switch to the application folder.\n\n" + LogLocationText());
        return 1;
    }

    const ExistingInstanceResult existingInstance = CheckExistingInstance();
    if (existingInstance.state == ExistingInstanceState::CurrentVersionTeleVaultRunning) {
        Log(L"existing instance check: current TeleVault version already running");
        if (TryFocusExistingWindow()) {
            Log(L"launcher finished: existing window focused");
            return 0;
        }

        Log(L"existing backend found but window missing -> opening browser");
        LauncherWindowState windowState;
        const bool hasWindowState = LoadWindowState(&windowState);
        OpenBrowserWindow(kAppUrl, hasWindowState ? &windowState : nullptr);
        Log(L"launcher finished: existing backend reused");
        return 0;
    }

    if (existingInstance.state == ExistingInstanceState::DifferentVersionTeleVaultRunning) {
        Log(L"version mismatch: running=" + SafeLogValue(existingInstance.version) + L", launcher=" + kAppVersion);
        ShowError(BuildVersionMismatchMessage(existingInstance.version));
        return 1;
    }

    if (existingInstance.state == ExistingInstanceState::PortOccupiedByOther) {
        Log(L"launcher stopped because the TeleVault port is occupied by a non-TeleVault process");
        ShowError(BuildPortOccupiedMessage());
        return 1;
    }

    const RuntimeSelection runtime = SelectPythonRuntime(appRoot);
    const std::wstring appScript = JoinPath(appRoot, L"app.py");
    const std::wstring backendDir = JoinPath(appRoot, L"backend");
    const std::wstring frontendDir = JoinPath(appRoot, L"frontend");

    Log(L"selected runtime path: " + runtime.relativePath);
    Log(runtime.exists ? L"selected pythonw.exe: found" : L"selected pythonw.exe: missing");

    std::vector<std::wstring> missing;
    if (!runtime.exists) {
        missing.push_back(runtime.relativePath);
    }
    AddMissingFile(&missing, L"app.py", appScript);
    AddMissingDirectory(&missing, L"backend\\", backendDir);
    AddMissingDirectory(&missing, L"frontend\\", frontendDir);
    if (!missing.empty()) {
        Log(L"preflight failed");
        if (!runtime.exists && runtime.legacy) {
            ShowError(BuildLegacyRuntimeMissingMessage());
            return 1;
        }
        ShowError(BuildMissingFilesMessage(missing));
        return 1;
    }

    if (!StartPythonBackend(appRoot, runtime, &process)) {
        ShowError(BuildPythonStartFailedMessage());
        return 1;
    }

    if (!WaitForServerReady(process.hProcess)) {
        StopStartedProcess(process.hProcess);
        CloseHandle(process.hProcess);
        ShowError(BuildServerTimeoutMessage());
        return 1;
    }

    LauncherWindowState windowState;
    const bool hasWindowState = LoadWindowState(&windowState);
    OpenBrowserWindow(kAppUrl, hasWindowState ? &windowState : nullptr);

    const int exitCode = MonitorStartedProcess(process.hProcess);
    CloseHandle(process.hProcess);
    return exitCode;
}

} // namespace

int WINAPI wWinMain(HINSTANCE, HINSTANCE, LPWSTR, int) {
    try {
        return RunLauncher();
    } catch (...) {
        Log(L"launcher failed with an unexpected native exception");
        ShowError(BuildUnexpectedErrorMessage());
        return 1;
    }
}
