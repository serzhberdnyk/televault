using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Forms;

internal static class TeleVaultLauncher
{
    private const string AppName = "TeleVault";
    private const string AppVersion = "2.8.9";
    private const int AppPort = 8766;
    private const int ServerStartupTimeoutMs = 30000;
    private const int ServerPollIntervalMs = 400;
    private const int WindowMonitorIntervalMs = 500;
    private const int WindowOpenWaitTimeoutMs = 8000;
    private const int WindowMissingCloseGraceMs = 1500;
    private const int WindowStateSaveThrottleMs = 1000;
    private const string NoAutoBrowserEnv = "TELEVAULT_NO_AUTO_BROWSER";
    private const string WindowStateDirectoryName = "user_data";
    private const string WindowStateFileName = "launcher_window.json";
    private const int MinWindowWidth = 900;
    private const int MinWindowHeight = 600;
    private const int ShowWindowMaximized = 3;
    private const int ShowWindowMinimized = 2;
    private const int ShowWindowShow = 5;
    private const int ShowWindowRestore = 9;
    private const int SystemMetricXVirtualScreen = 76;
    private const int SystemMetricYVirtualScreen = 77;
    private const int SystemMetricCxVirtualScreen = 78;
    private const int SystemMetricCyVirtualScreen = 79;

    private static readonly string AppUrl = "http://127.0.0.1:" + AppPort + "/";
    private static readonly string StatusUrl = AppUrl + "api/status";
    private static string logPath = string.Empty;
    private static string windowStatePath = string.Empty;

    private enum ExistingInstanceState
    {
        NotRunning,
        CurrentVersionTeleVaultRunning,
        DifferentVersionTeleVaultRunning,
        PortOccupiedByOther,
    }

    private sealed class ExistingInstanceResult
    {
        public ExistingInstanceResult(ExistingInstanceState state, string name, string version)
        {
            State = state;
            Name = name ?? string.Empty;
            Version = version ?? string.Empty;
        }

        public ExistingInstanceState State { get; private set; }
        public string Name { get; private set; }
        public string Version { get; private set; }
    }

    private sealed class StatusInfo
    {
        public string Name = string.Empty;
        public string Version = string.Empty;

        public bool IsTeleVault
        {
            get { return string.Equals(Name, AppName, StringComparison.OrdinalIgnoreCase); }
        }
    }

    private sealed class LauncherWindowState
    {
        public int X;
        public int Y;
        public int Width;
        public int Height;
        public bool Maximized;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct POINT
    {
        public int X;
        public int Y;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct RECT
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct WINDOWPLACEMENT
    {
        public int Length;
        public int Flags;
        public int ShowCmd;
        public POINT MinPosition;
        public POINT MaxPosition;
        public RECT NormalPosition;
    }

    private delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    private static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern int GetWindowTextLength(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    private static extern bool IsIconic(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool GetWindowPlacement(IntPtr hWnd, ref WINDOWPLACEMENT lpwndpl);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool MoveWindow(IntPtr hWnd, int x, int y, int width, int height, bool repaint);

    [DllImport("user32.dll")]
    private static extern int GetSystemMetrics(int nIndex);

    [STAThread]
    private static int Main(string[] args)
    {
        Process process = null;

        try
        {
            string appRoot = GetAppRoot();
            InitializeLogging(appRoot);
            InitializeWindowState(appRoot);
            Log("launcher start");
            Log("launcher version: " + AppVersion);
            Log("app root: " + appRoot);

            ExistingInstanceResult existingInstance = CheckExistingInstance();
            if (existingInstance.State == ExistingInstanceState.CurrentVersionTeleVaultRunning)
            {
                Log("existing instance check: current TeleVault version already running");
                if (TryFocusExistingWindow())
                {
                    Log("launcher finished: existing window focused");
                    return 0;
                }

                Log("existing backend found but window missing -> opening browser");
                OpenBrowserWindow(AppUrl, LoadWindowState());
                return MonitorExternalWindow();
            }

            if (existingInstance.State == ExistingInstanceState.DifferentVersionTeleVaultRunning)
            {
                Log("version mismatch: running=" + SafeLogValue(existingInstance.Version) + ", launcher=" + AppVersion);
                ShowError(BuildVersionMismatchMessage(existingInstance.Version));
                return 1;
            }

            if (existingInstance.State == ExistingInstanceState.PortOccupiedByOther)
            {
                Log("launcher stopped because the TeleVault port is occupied by a non-TeleVault process");
                ShowError(BuildPortOccupiedMessage());
                return 1;
            }

            string pythonExe = Path.Combine(appRoot, "runtime", "python", "python.exe");
            string appScript = Path.Combine(appRoot, "app.py");
            string backendDir = Path.Combine(appRoot, "backend");
            string frontendDir = Path.Combine(appRoot, "frontend");

            List<string> missing = new List<string>();
            AddMissingFile(missing, "runtime\\python\\python.exe", pythonExe);
            AddMissingFile(missing, "app.py", appScript);
            AddMissingDirectory(missing, "backend\\", backendDir);
            AddMissingDirectory(missing, "frontend\\", frontendDir);

            if (missing.Count > 0)
            {
                string message = BuildMissingFilesMessage(missing);
                Log("preflight failed: " + string.Join(", ", missing.ToArray()));
                ShowError(message);
                return 1;
            }

            ProcessStartInfo startInfo = new ProcessStartInfo();
            startInfo.FileName = pythonExe;
            startInfo.Arguments = QuoteArgument("app.py");
            startInfo.WorkingDirectory = appRoot;
            startInfo.UseShellExecute = false;
            startInfo.CreateNoWindow = true;
            startInfo.EnvironmentVariables[NoAutoBrowserEnv] = "1";

            Log("runtime python.exe: found");
            Log("new backend start");
            Log("starting python process");
            process = Process.Start(startInfo);
            if (process == null)
            {
                Log("python process start returned null");
                ShowError(BuildPythonStartFailedMessage());
                return 1;
            }

            Log("python process started");
            if (!WaitForServerReady(process))
            {
                StopStartedProcess(process);
                ShowError(BuildServerTimeoutMessage());
                return 1;
            }

            OpenBrowserWindow(AppUrl, LoadWindowState());

            using (process)
            {
                return MonitorStartedProcess(process);
            }
        }
        catch (Exception ex)
        {
            Log("launcher failed: " + ex.GetType().Name + ": " + ex.Message);
            StopStartedProcess(process);
            ShowError(BuildUnexpectedErrorMessage());
            return 1;
        }
    }

    private static string GetAppRoot()
    {
        string location = Assembly.GetExecutingAssembly().Location;
        string directory = string.IsNullOrEmpty(location)
            ? AppDomain.CurrentDomain.BaseDirectory
            : Path.GetDirectoryName(location);

        if (string.IsNullOrEmpty(directory))
        {
            directory = AppDomain.CurrentDomain.BaseDirectory;
        }

        return Path.GetFullPath(directory);
    }

    private static void AddMissingFile(List<string> missing, string label, string path)
    {
        if (!File.Exists(path))
        {
            missing.Add(label);
        }
    }

    private static void AddMissingDirectory(List<string> missing, string label, string path)
    {
        if (!Directory.Exists(path))
        {
            missing.Add(label);
        }
    }

    private static string BuildMissingFilesMessage(List<string> missing)
    {
        StringBuilder builder = new StringBuilder();
        builder.AppendLine("TeleVault cannot start because this folder is missing required application files.");
        builder.AppendLine();
        builder.AppendLine("Missing:");
        foreach (string item in missing)
        {
            builder.AppendLine("- " + FriendlyMissingItemName(item));
        }
        builder.AppendLine();
        builder.AppendLine("Extract the TeleVault zip again and start TeleVault.exe from the extracted TeleVault folder.");
        builder.AppendLine();
        builder.Append(LogLocationText());
        return builder.ToString();
    }

    private static string FriendlyMissingItemName(string item)
    {
        if (string.Equals(item, "runtime\\python\\python.exe", StringComparison.OrdinalIgnoreCase))
        {
            return "bundled Python runtime (runtime\\python\\python.exe)";
        }

        if (string.Equals(item, "app.py", StringComparison.OrdinalIgnoreCase))
        {
            return "application file (app.py)";
        }

        if (string.Equals(item, "backend\\", StringComparison.OrdinalIgnoreCase))
        {
            return "backend folder (backend\\)";
        }

        if (string.Equals(item, "frontend\\", StringComparison.OrdinalIgnoreCase))
        {
            return "frontend folder (frontend\\)";
        }

        return item;
    }

    private static ExistingInstanceResult CheckExistingInstance()
    {
        Log("checking existing instance: " + StatusUrl);

        try
        {
            HttpWebRequest request = CreateStatusRequest(1000);

            using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
            {
                string body = ReadResponseBody(response);
                if (response.StatusCode == HttpStatusCode.OK)
                {
                    StatusInfo status = ParseStatusBody(body);
                    Log("existing instance check: status name=" + SafeLogValue(status.Name) + ", version=" + SafeLogValue(status.Version));

                    if (status.IsTeleVault)
                    {
                        if (string.Equals(status.Version, AppVersion, StringComparison.OrdinalIgnoreCase))
                        {
                            Log("existing TeleVault detected with current version");
                            return new ExistingInstanceResult(ExistingInstanceState.CurrentVersionTeleVaultRunning, status.Name, status.Version);
                        }

                        Log("existing TeleVault detected with different version");
                        return new ExistingInstanceResult(ExistingInstanceState.DifferentVersionTeleVaultRunning, status.Name, status.Version);
                    }
                }

                Log("existing instance check: port occupied by non-TeleVault status endpoint, HTTP " + (int)response.StatusCode);
                return new ExistingInstanceResult(ExistingInstanceState.PortOccupiedByOther, string.Empty, string.Empty);
            }
        }
        catch (WebException ex)
        {
            HttpWebResponse response = ex.Response as HttpWebResponse;
            if (response != null)
            {
                using (response)
                {
                    Log("existing instance check: status endpoint returned HTTP " + (int)response.StatusCode + "; treating port as occupied");
                    return new ExistingInstanceResult(ExistingInstanceState.PortOccupiedByOther, string.Empty, string.Empty);
                }
            }

            Log("existing instance check: status endpoint not available, " + ex.Status);
        }
        catch (Exception ex)
        {
            Log("existing instance check failed: " + ex.GetType().Name + ": " + ex.Message);
        }

        if (IsLocalPortOccupied())
        {
            Log("existing instance check: port occupied by another program");
            return new ExistingInstanceResult(ExistingInstanceState.PortOccupiedByOther, string.Empty, string.Empty);
        }

        Log("existing instance check: no TeleVault detected");
        return new ExistingInstanceResult(ExistingInstanceState.NotRunning, string.Empty, string.Empty);
    }

    private static bool WaitForServerReady(Process process)
    {
        DateTime deadline = DateTime.UtcNow.AddMilliseconds(ServerStartupTimeoutMs);
        while (DateTime.UtcNow < deadline)
        {
            if (process.HasExited)
            {
                Log("python process exited before server ready with code " + process.ExitCode);
                return false;
            }

            if (IsServerReady())
            {
                Log("server ready: status endpoint confirmed");
                return true;
            }

            Thread.Sleep(ServerPollIntervalMs);
        }

        Log("server timeout: status endpoint did not become ready");
        return false;
    }

    private static bool IsServerReady()
    {
        try
        {
            HttpWebRequest request = CreateStatusRequest(1000);

            using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
            {
                if (response.StatusCode != HttpStatusCode.OK)
                {
                    return false;
                }

                string body = ReadResponseBody(response);
                return IsTeleVaultReadyStatusBody(body);
            }
        }
        catch
        {
            return false;
        }
    }

    private static HttpWebRequest CreateStatusRequest(int timeoutMs)
    {
        HttpWebRequest request = (HttpWebRequest)WebRequest.Create(StatusUrl);
        request.Method = "GET";
        request.Timeout = timeoutMs;
        request.ReadWriteTimeout = timeoutMs;
        return request;
    }

    private static string ReadResponseBody(WebResponse response)
    {
        Stream stream = response.GetResponseStream();
        if (stream == null)
        {
            return string.Empty;
        }

        using (stream)
        using (StreamReader reader = new StreamReader(stream, Encoding.UTF8))
        {
            return reader.ReadToEnd();
        }
    }

    private static bool IsTeleVaultStatusBody(string body)
    {
        return ParseStatusBody(body).IsTeleVault;
    }

    private static bool IsTeleVaultReadyStatusBody(string body)
    {
        StatusInfo status = ParseStatusBody(body);
        return status.IsTeleVault
            && string.Equals(status.Version, AppVersion, StringComparison.OrdinalIgnoreCase)
            && (body.IndexOf("\"ready\": true", StringComparison.OrdinalIgnoreCase) >= 0
                || body.IndexOf("\"ready\":true", StringComparison.OrdinalIgnoreCase) >= 0);
    }

    private static StatusInfo ParseStatusBody(string body)
    {
        StatusInfo status = new StatusInfo();
        if (string.IsNullOrEmpty(body))
        {
            return status;
        }

        status.Name = ExtractJsonStringField(body, "name");
        status.Version = ExtractJsonStringField(body, "version");
        return status;
    }

    private static string ExtractJsonStringField(string body, string fieldName)
    {
        string pattern = "\\\"" + Regex.Escape(fieldName) + "\\\"\\s*:\\s*\\\"([^\\\"]*)\\\"";
        Match match = Regex.Match(body, pattern, RegexOptions.IgnoreCase);
        return match.Success ? match.Groups[1].Value : string.Empty;
    }

    private static int ExtractJsonIntField(string body, string fieldName, int fallback)
    {
        string pattern = "\\\"" + Regex.Escape(fieldName) + "\\\"\\s*:\\s*(-?\\d+)";
        Match match = Regex.Match(body, pattern, RegexOptions.IgnoreCase);
        if (!match.Success)
        {
            return fallback;
        }

        int value;
        return int.TryParse(match.Groups[1].Value, out value) ? value : fallback;
    }

    private static bool ExtractJsonBoolField(string body, string fieldName, bool fallback)
    {
        string pattern = "\\\"" + Regex.Escape(fieldName) + "\\\"\\s*:\\s*(true|false)";
        Match match = Regex.Match(body, pattern, RegexOptions.IgnoreCase);
        if (!match.Success)
        {
            return fallback;
        }

        return string.Equals(match.Groups[1].Value, "true", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsLocalPortOccupied()
    {
        TcpClient client = null;
        IAsyncResult result = null;

        try
        {
            client = new TcpClient();
            result = client.BeginConnect(IPAddress.Loopback, AppPort, null, null);
            if (!result.AsyncWaitHandle.WaitOne(500))
            {
                Log("TCP port check timed out");
                return false;
            }

            client.EndConnect(result);
            Log("TCP port check connected to " + AppPort);
            return true;
        }
        catch (SocketException ex)
        {
            Log("TCP port check did not connect: " + ex.SocketErrorCode);
            return false;
        }
        catch (Exception ex)
        {
            Log("TCP port check failed: " + ex.GetType().Name + ": " + ex.Message);
            return false;
        }
        finally
        {
            if (result != null)
            {
                try
                {
                    result.AsyncWaitHandle.Close();
                }
                catch
                {
                }
            }

            if (client != null)
            {
                client.Close();
            }
        }
    }

    private static int MonitorStartedProcess(Process process)
    {
        Log("launcher monitor started for owned backend");
        LauncherWindowState lastWindowState = null;
        LauncherWindowState lastSavedState = null;
        bool sawWindow = false;
        bool loggedMissingWindowTimeout = false;
        DateTime firstWindowDeadline = DateTime.UtcNow.AddMilliseconds(WindowOpenWaitTimeoutMs);
        DateTime missingWindowSince = DateTime.MinValue;
        DateTime lastSaveUtc = DateTime.MinValue;

        while (!process.WaitForExit(WindowMonitorIntervalMs))
        {
            LauncherWindowState currentState;
            IntPtr window = FindExistingTeleVaultWindow(!sawWindow);
            if (window != IntPtr.Zero)
            {
                if (!sawWindow)
                {
                    Log("launcher monitor attached to app window");
                }

                sawWindow = true;
                missingWindowSince = DateTime.MinValue;
                if (TryCaptureWindowState(window, out currentState))
                {
                    lastWindowState = currentState;
                    SaveWindowStateIfNeeded(currentState, ref lastSavedState, ref lastSaveUtc, false);
                }

                continue;
            }

            if (!sawWindow)
            {
                if (!loggedMissingWindowTimeout && DateTime.UtcNow >= firstWindowDeadline)
                {
                    Log("launcher monitor did not find an app window before timeout; continuing backend monitor");
                    loggedMissingWindowTimeout = true;
                }

                continue;
            }

            if (missingWindowSince == DateTime.MinValue)
            {
                missingWindowSince = DateTime.UtcNow;
            }

            if ((DateTime.UtcNow - missingWindowSince).TotalMilliseconds >= WindowMissingCloseGraceMs)
            {
                if (lastWindowState != null)
                {
                    SaveWindowStateIfNeeded(lastWindowState, ref lastSavedState, ref lastSaveUtc, true);
                }

                Log("app window closed; stopping owned backend");
                StopStartedProcessAfterWindowClosed(process);
                Log("launcher finished after app window closed");
                return 0;
            }
        }

        LauncherWindowState finalState;
        IntPtr finalWindow = FindExistingTeleVaultWindow(false);
        if (finalWindow != IntPtr.Zero && TryCaptureWindowState(finalWindow, out finalState))
        {
            SaveWindowStateIfNeeded(finalState, ref lastSavedState, ref lastSaveUtc, true);
        }
        else if (lastWindowState != null)
        {
            SaveWindowStateIfNeeded(lastWindowState, ref lastSavedState, ref lastSaveUtc, true);
        }

        Log("python process exited with code " + process.ExitCode);
        return process.ExitCode;
    }

    private static int MonitorExternalWindow()
    {
        Log("launcher monitor started for existing backend window");
        LauncherWindowState lastWindowState = null;
        LauncherWindowState lastSavedState = null;
        bool sawWindow = false;
        bool loggedMissingWindowTimeout = false;
        DateTime firstWindowDeadline = DateTime.UtcNow.AddMilliseconds(WindowOpenWaitTimeoutMs);
        DateTime missingWindowSince = DateTime.MinValue;
        DateTime lastSaveUtc = DateTime.MinValue;

        while (true)
        {
            LauncherWindowState currentState;
            IntPtr window = FindExistingTeleVaultWindow(!sawWindow);
            if (window != IntPtr.Zero)
            {
                if (!sawWindow)
                {
                    Log("launcher monitor attached to existing-backend app window");
                }

                sawWindow = true;
                missingWindowSince = DateTime.MinValue;
                if (TryCaptureWindowState(window, out currentState))
                {
                    lastWindowState = currentState;
                    SaveWindowStateIfNeeded(currentState, ref lastSavedState, ref lastSaveUtc, false);
                }
            }
            else if (!sawWindow)
            {
                if (!loggedMissingWindowTimeout && DateTime.UtcNow >= firstWindowDeadline)
                {
                    Log("launcher monitor did not find an app window before timeout; exiting existing-backend monitor");
                    return 0;
                }
            }
            else
            {
                if (missingWindowSince == DateTime.MinValue)
                {
                    missingWindowSince = DateTime.UtcNow;
                }

                if ((DateTime.UtcNow - missingWindowSince).TotalMilliseconds >= WindowMissingCloseGraceMs)
                {
                    if (lastWindowState != null)
                    {
                        SaveWindowStateIfNeeded(lastWindowState, ref lastSavedState, ref lastSaveUtc, true);
                    }

                    Log("existing-backend app window closed; launcher monitor exiting without stopping backend");
                    return 0;
                }
            }

            Thread.Sleep(WindowMonitorIntervalMs);
        }
    }

    private static void SaveWindowStateIfNeeded(
        LauncherWindowState state,
        ref LauncherWindowState lastSavedState,
        ref DateTime lastSaveUtc,
        bool force)
    {
        if (state == null)
        {
            return;
        }

        if (!force
            && lastSavedState != null
            && AreWindowStatesEqual(state, lastSavedState))
        {
            return;
        }

        if (!force
            && lastSavedState != null
            && (DateTime.UtcNow - lastSaveUtc).TotalMilliseconds < WindowStateSaveThrottleMs)
        {
            return;
        }

        SaveWindowState(state);
        lastSavedState = CopyWindowState(state);
        lastSaveUtc = DateTime.UtcNow;
    }

    private static LauncherWindowState CopyWindowState(LauncherWindowState state)
    {
        if (state == null)
        {
            return null;
        }

        LauncherWindowState copy = new LauncherWindowState();
        copy.X = state.X;
        copy.Y = state.Y;
        copy.Width = state.Width;
        copy.Height = state.Height;
        copy.Maximized = state.Maximized;
        return copy;
    }

    private static bool AreWindowStatesEqual(LauncherWindowState left, LauncherWindowState right)
    {
        if (left == null || right == null)
        {
            return false;
        }

        return left.X == right.X
            && left.Y == right.Y
            && left.Width == right.Width
            && left.Height == right.Height
            && left.Maximized == right.Maximized;
    }

    private static LauncherWindowState LoadWindowState()
    {
        Log("window state path: " + SafeLogValue(windowStatePath));
        if (string.IsNullOrEmpty(windowStatePath) || !File.Exists(windowStatePath))
        {
            Log("window state file missing");
            return null;
        }

        try
        {
            Log("window state file exists");
            string body = File.ReadAllText(windowStatePath, Encoding.UTF8);
            LauncherWindowState state = new LauncherWindowState();
            state.Width = ExtractJsonIntField(body, "width", 0);
            state.Height = ExtractJsonIntField(body, "height", 0);
            state.X = ExtractJsonIntField(body, "x", 0);
            state.Y = ExtractJsonIntField(body, "y", 0);
            state.Maximized = ExtractJsonBoolField(body, "maximized", false);

            string invalidReason = GetInvalidWindowStateReason(state);
            if (!string.IsNullOrEmpty(invalidReason))
            {
                Log("invalid window state fallback: " + invalidReason);
                return null;
            }

            Log("loaded window state: " + FormatWindowState(state));
            return state;
        }
        catch (Exception ex)
        {
            Log("invalid window state fallback: " + ex.GetType().Name + ": " + ex.Message);
            return null;
        }
    }

    private static void SaveWindowState(LauncherWindowState state)
    {
        if (state == null)
        {
            return;
        }

        string invalidReason = GetInvalidWindowStateReason(state);
        if (!string.IsNullOrEmpty(invalidReason))
        {
            Log("invalid current window state not saved: " + invalidReason + ", " + FormatWindowState(state));
            return;
        }

        if (string.IsNullOrEmpty(windowStatePath))
        {
            Log("window state path is not available");
            return;
        }

        try
        {
            string directory = Path.GetDirectoryName(windowStatePath);
            if (!string.IsNullOrEmpty(directory))
            {
                Directory.CreateDirectory(directory);
            }

            string tempPath = windowStatePath + ".tmp";
            File.WriteAllText(tempPath, BuildWindowStateJson(state), Encoding.UTF8);
            if (File.Exists(windowStatePath))
            {
                File.Delete(windowStatePath);
            }

            File.Move(tempPath, windowStatePath);
            Log("saved window state: " + FormatWindowState(state));
        }
        catch (Exception ex)
        {
            Log("window state save failed: " + ex.GetType().Name + ": " + ex.Message);
        }
    }

    private static bool TryCaptureWindowState(IntPtr window, out LauncherWindowState state)
    {
        state = null;
        RECT rect;
        bool maximized = false;

        if (IsIconic(window))
        {
            return false;
        }

        WINDOWPLACEMENT placement = new WINDOWPLACEMENT();
        placement.Length = Marshal.SizeOf(typeof(WINDOWPLACEMENT));
        if (GetWindowPlacement(window, ref placement))
        {
            if (placement.ShowCmd == ShowWindowMinimized)
            {
                return false;
            }

            rect = placement.NormalPosition;
            maximized = placement.ShowCmd == ShowWindowMaximized;
            if (!IsUsableRect(rect) && !GetWindowRect(window, out rect))
            {
                return false;
            }
        }
        else if (!GetWindowRect(window, out rect))
        {
            return false;
        }

        state = new LauncherWindowState();
        state.X = rect.Left;
        state.Y = rect.Top;
        state.Width = RectWidth(rect);
        state.Height = RectHeight(rect);
        state.Maximized = maximized;
        return IsValidWindowState(state);
    }

    private static bool IsUsableRect(RECT rect)
    {
        return RectWidth(rect) > 0 && RectHeight(rect) > 0;
    }

    private static int RectWidth(RECT rect)
    {
        return rect.Right - rect.Left;
    }

    private static int RectHeight(RECT rect)
    {
        return rect.Bottom - rect.Top;
    }

    private static bool IsValidWindowState(LauncherWindowState state)
    {
        return string.IsNullOrEmpty(GetInvalidWindowStateReason(state));
    }

    private static string GetInvalidWindowStateReason(LauncherWindowState state)
    {
        if (state == null || state.Width < MinWindowWidth || state.Height < MinWindowHeight)
        {
            return "bounds are smaller than " + MinWindowWidth + "x" + MinWindowHeight;
        }

        int virtualX = GetSystemMetrics(SystemMetricXVirtualScreen);
        int virtualY = GetSystemMetrics(SystemMetricYVirtualScreen);
        int virtualWidth = GetSystemMetrics(SystemMetricCxVirtualScreen);
        int virtualHeight = GetSystemMetrics(SystemMetricCyVirtualScreen);
        if (virtualWidth <= 0 || virtualHeight <= 0)
        {
            return string.Empty;
        }

        long windowRight = (long)state.X + state.Width;
        long windowBottom = (long)state.Y + state.Height;
        long virtualRight = (long)virtualX + virtualWidth;
        long virtualBottom = (long)virtualY + virtualHeight;

        bool intersectsVirtualScreen = state.X < virtualRight
            && windowRight > virtualX
            && state.Y < virtualBottom
            && windowBottom > virtualY;

        if (!intersectsVirtualScreen)
        {
            return "bounds are outside the virtual screen";
        }

        return string.Empty;
    }

    private static string BuildWindowStateJson(LauncherWindowState state)
    {
        StringBuilder builder = new StringBuilder();
        builder.AppendLine("{");
        builder.AppendLine("  \"width\": " + state.Width + ",");
        builder.AppendLine("  \"height\": " + state.Height + ",");
        builder.AppendLine("  \"x\": " + state.X + ",");
        builder.AppendLine("  \"y\": " + state.Y + ",");
        builder.AppendLine("  \"maximized\": " + (state.Maximized ? "true" : "false"));
        builder.AppendLine("}");
        return builder.ToString();
    }

    private static string FormatWindowState(LauncherWindowState state)
    {
        if (state == null)
        {
            return "(missing)";
        }

        return state.Width
            + "x"
            + state.Height
            + "+"
            + state.X
            + "+"
            + state.Y
            + ", maximized="
            + (state.Maximized ? "true" : "false");
    }

    private static void OpenBrowserWindow(string url, LauncherWindowState windowState)
    {
        Log("opening browser window: " + url);

        string edge = FindBrowser(
            "msedge.exe",
            new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Microsoft", "Edge", "Application", "msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Microsoft", "Edge", "Application", "msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Microsoft", "Edge", "Application", "msedge.exe"),
            });

        if (!string.IsNullOrEmpty(edge) && StartAppModeBrowser(edge, url, "Edge", windowState))
        {
            return;
        }

        string chrome = FindBrowser(
            "chrome.exe",
            new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Google", "Chrome", "Application", "chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Google", "Chrome", "Application", "chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Google", "Chrome", "Application", "chrome.exe"),
            });

        if (!string.IsNullOrEmpty(chrome) && StartAppModeBrowser(chrome, url, "Chrome", windowState))
        {
            return;
        }

        Log("app-mode browser not found; opening default browser fallback");
        try
        {
            ProcessStartInfo fallback = new ProcessStartInfo(url);
            fallback.UseShellExecute = true;
            Process.Start(fallback);
            MessageBox.Show(
                "TeleVault opened in your default browser because Microsoft Edge or Google Chrome app mode was not found.",
                AppName,
                MessageBoxButtons.OK,
                MessageBoxIcon.Information);
        }
        catch (Exception ex)
        {
            Log("default browser fallback failed: " + ex.Message);
            ShowError("TeleVault is running, but the launcher could not open a browser window.\n\nOpen this address manually:\n" + url + "\n\n" + LogLocationText());
        }
    }

    private static bool TryFocusExistingWindow()
    {
        IntPtr window = FindExistingTeleVaultWindow();
        if (window == IntPtr.Zero)
        {
            Log("existing TeleVault window not found");
            return false;
        }

        try
        {
            ShowWindow(window, ShowWindowRestore);
            bool foreground = SetForegroundWindow(window);
            Log("window focused: existing TeleVault app window" + (foreground ? string.Empty : " (foreground request returned false)"));
            return true;
        }
        catch (Exception ex)
        {
            Log("existing window focus failed: " + ex.GetType().Name + ": " + ex.Message);
            return true;
        }
    }

    private static IntPtr FindExistingTeleVaultWindow()
    {
        return FindExistingTeleVaultWindow(true);
    }

    private static IntPtr FindExistingTeleVaultWindow(bool logDetails)
    {
        IntPtr found = IntPtr.Zero;

        EnumWindows(delegate(IntPtr hWnd, IntPtr lParam)
        {
            if (!IsWindowVisible(hWnd))
            {
                return true;
            }

            string title = GetWindowTitle(hWnd);
            if (title.IndexOf(AppName, StringComparison.OrdinalIgnoreCase) < 0)
            {
                return true;
            }

            string processName = GetWindowProcessName(hWnd);
            if (!IsAllowedBrowserProcess(processName))
            {
                if (logDetails)
                {
                    Log("TeleVault-titled window ignored because process is not Edge/Chrome: " + SafeLogValue(processName));
                }
                return true;
            }

            found = hWnd;
            if (logDetails)
            {
                Log("existing TeleVault window found: hwnd=0x"
                    + hWnd.ToInt64().ToString("X")
                    + ", title="
                    + SafeLogValue(title)
                    + ", process="
                    + SafeLogValue(processName));
            }
            return false;
        }, IntPtr.Zero);

        return found;
    }

    private static string GetWindowTitle(IntPtr hWnd)
    {
        int length = GetWindowTextLength(hWnd);
        if (length <= 0)
        {
            return string.Empty;
        }

        StringBuilder builder = new StringBuilder(length + 1);
        GetWindowText(hWnd, builder, builder.Capacity);
        return builder.ToString();
    }

    private static string GetWindowProcessName(IntPtr hWnd)
    {
        try
        {
            uint processId;
            GetWindowThreadProcessId(hWnd, out processId);
            if (processId == 0)
            {
                return string.Empty;
            }

            using (Process process = Process.GetProcessById((int)processId))
            {
                return process.ProcessName ?? string.Empty;
            }
        }
        catch (Exception ex)
        {
            Log("could not read window process name: " + ex.GetType().Name);
            return string.Empty;
        }
    }

    private static bool IsAllowedBrowserProcess(string processName)
    {
        return string.Equals(processName, "msedge", StringComparison.OrdinalIgnoreCase)
            || string.Equals(processName, "chrome", StringComparison.OrdinalIgnoreCase);
    }

    private static bool StartAppModeBrowser(string browserPath, string url, string browserName, LauncherWindowState windowState)
    {
        try
        {
            ProcessStartInfo startInfo = new ProcessStartInfo();
            startInfo.FileName = browserPath;
            startInfo.Arguments = BuildBrowserArguments(url, windowState);
            startInfo.WorkingDirectory = Path.GetDirectoryName(browserPath);
            startInfo.UseShellExecute = false;
            startInfo.CreateNoWindow = true;
            Log(browserName + " app-mode launch args: " + startInfo.Arguments);
            Process browserProcess = Process.Start(startInfo);
            if (browserProcess == null)
            {
                Log(browserName + " app-mode launch returned null");
                return false;
            }

            browserProcess.Dispose();
            Log("browser app-mode opened: " + browserName);
            TryApplyWindowState(windowState);
            return true;
        }
        catch (Exception ex)
        {
            Log(browserName + " app-mode launch failed: " + ex.Message);
            return false;
        }
    }

    private static string BuildBrowserArguments(string url, LauncherWindowState windowState)
    {
        StringBuilder builder = new StringBuilder();
        builder.Append("--app=");
        builder.Append(url);

        if (windowState != null)
        {
            builder.Append(" --window-size=");
            builder.Append(windowState.Width);
            builder.Append(",");
            builder.Append(windowState.Height);
            builder.Append(" --window-position=");
            builder.Append(windowState.X);
            builder.Append(",");
            builder.Append(windowState.Y);
        }

        return builder.ToString();
    }

    private static void TryApplyWindowState(LauncherWindowState windowState)
    {
        if (windowState == null)
        {
            return;
        }

        IntPtr window = WaitForTeleVaultWindow(WindowOpenWaitTimeoutMs);
        if (window == IntPtr.Zero)
        {
            Log("window state not applied because the app window was not found");
            return;
        }

        try
        {
            ShowWindow(window, ShowWindowRestore);
            bool moved = MoveWindow(window, windowState.X, windowState.Y, windowState.Width, windowState.Height, true);
            Log("applied window state with MoveWindow: "
                + FormatWindowState(windowState)
                + (moved ? string.Empty : " (MoveWindow returned false)"));

            if (windowState.Maximized)
            {
                ShowWindow(window, ShowWindowMaximized);
                Log("maximized window state restored");
            }
        }
        catch (Exception ex)
        {
            Log("window state apply failed: " + ex.GetType().Name + ": " + ex.Message);
        }
    }

    private static IntPtr WaitForTeleVaultWindow(int timeoutMs)
    {
        DateTime deadline = DateTime.UtcNow.AddMilliseconds(timeoutMs);
        while (DateTime.UtcNow < deadline)
        {
            IntPtr window = FindExistingTeleVaultWindow(false);
            if (window != IntPtr.Zero)
            {
                return window;
            }

            Thread.Sleep(200);
        }

        return IntPtr.Zero;
    }

    private static string FindBrowser(string executableName, string[] candidatePaths)
    {
        foreach (string path in candidatePaths)
        {
            if (!string.IsNullOrEmpty(path) && File.Exists(path))
            {
                Log("browser found: " + executableName);
                return path;
            }
        }

        string fromPath = FindExecutableOnPath(executableName);
        if (!string.IsNullOrEmpty(fromPath))
        {
            Log("browser found on PATH: " + executableName);
            return fromPath;
        }

        Log("browser not found: " + executableName);
        return string.Empty;
    }

    private static string FindExecutableOnPath(string executableName)
    {
        string pathValue = Environment.GetEnvironmentVariable("PATH") ?? string.Empty;
        foreach (string directory in pathValue.Split(Path.PathSeparator))
        {
            if (string.IsNullOrWhiteSpace(directory))
            {
                continue;
            }

            try
            {
                string candidate = Path.Combine(directory.Trim(), executableName);
                if (File.Exists(candidate))
                {
                    return candidate;
                }
            }
            catch
            {
            }
        }

        return string.Empty;
    }

    private static void StopStartedProcess(Process process)
    {
        if (process == null)
        {
            return;
        }

        try
        {
            if (!process.HasExited)
            {
                Log("stopping python process after startup failure");
                process.Kill();
                process.WaitForExit(3000);
            }
        }
        catch
        {
        }
    }

    private static void StopStartedProcessAfterWindowClosed(Process process)
    {
        if (process == null)
        {
            return;
        }

        try
        {
            if (!process.HasExited)
            {
                Log("stopping owned python process after app window close");
                process.Kill();
                process.WaitForExit(3000);
            }

            if (process.HasExited)
            {
                Log("owned python process exited with code " + process.ExitCode);
            }
        }
        catch (Exception ex)
        {
            Log("stopping owned python process after app window close failed: " + ex.GetType().Name + ": " + ex.Message);
        }
    }

    private static string QuoteArgument(string value)
    {
        return "\"" + value.Replace("\"", "\\\"") + "\"";
    }

    private static void InitializeLogging(string appRoot)
    {
        try
        {
            string logsDir = Path.Combine(appRoot, "logs");
            Directory.CreateDirectory(logsDir);
            logPath = Path.Combine(logsDir, "launcher.log");
        }
        catch
        {
            logPath = string.Empty;
        }
    }

    private static void InitializeWindowState(string appRoot)
    {
        try
        {
            windowStatePath = Path.Combine(appRoot, WindowStateDirectoryName, WindowStateFileName);
            Log("window state initialized: " + windowStatePath);
        }
        catch
        {
            windowStatePath = string.Empty;
        }
    }

    private static void Log(string message)
    {
        if (string.IsNullOrEmpty(logPath))
        {
            return;
        }

        try
        {
            string line = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + " " + message + Environment.NewLine;
            File.AppendAllText(logPath, line, Encoding.UTF8);
        }
        catch
        {
        }
    }

    private static string LogLocationText()
    {
        if (string.IsNullOrEmpty(logPath))
        {
            return "Launcher log is not available.";
        }

        return "Launcher log: " + logPath;
    }

    private static string BuildPortOccupiedMessage()
    {
        return "TeleVault cannot start because port 8766 is already used by another program."
            + "\n\nClose the other program or restart Windows, then open TeleVault.exe again."
            + "\n\n" + LogLocationText();
    }

    private static string BuildVersionMismatchMessage(string version)
    {
        string displayVersion = string.IsNullOrWhiteSpace(version) ? "unknown" : version;
        return "Another TeleVault version is already running: "
            + displayVersion
            + "."
            + "\n\nClose the running TeleVault window before starting TeleVault "
            + AppVersion
            + "."
            + "\n\n" + LogLocationText();
    }

    private static string BuildPythonStartFailedMessage()
    {
        return "TeleVault could not start its bundled Python runtime."
            + "\n\nExtract the TeleVault zip again and start TeleVault.exe from the extracted TeleVault folder."
            + "\n\n" + LogLocationText();
    }

    private static string BuildServerTimeoutMessage()
    {
        return "TeleVault started, but the local server did not become ready in time."
            + "\n\nClose TeleVault windows and try again. If it still fails, check the launcher log."
            + "\n\n" + LogLocationText();
    }

    private static string BuildUnexpectedErrorMessage()
    {
        return "TeleVault could not start because the launcher hit an unexpected error."
            + "\n\nClose TeleVault and try again. Technical details were written to the launcher log."
            + "\n\n" + LogLocationText();
    }

    private static string SafeLogValue(string value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return "(missing)";
        }

        return value.Replace("\r", " ").Replace("\n", " ");
    }

    private static void ShowError(string message)
    {
        MessageBox.Show(message, AppName, MessageBoxButtons.OK, MessageBoxIcon.Error);
    }
}
