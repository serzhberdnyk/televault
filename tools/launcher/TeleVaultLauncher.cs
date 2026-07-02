using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Windows.Forms;

internal static class TeleVaultLauncher
{
    private const string AppName = "TeleVault";
    private const int AppPort = 8766;
    private const int ServerStartupTimeoutMs = 30000;
    private const int ServerPollIntervalMs = 400;
    private const string NoAutoBrowserEnv = "TELEVAULT_NO_AUTO_BROWSER";

    private static readonly string AppUrl = "http://127.0.0.1:" + AppPort + "/";
    private static readonly string StatusUrl = AppUrl + "api/status";
    private static string logPath = string.Empty;

    [STAThread]
    private static int Main(string[] args)
    {
        Process process = null;

        try
        {
            string appRoot = GetAppRoot();
            InitializeLogging(appRoot);
            Log("launcher start");
            Log("app root: " + appRoot);

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
                string message = BuildMissingFilesMessage(appRoot, missing);
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
            Log("starting python process");
            process = Process.Start(startInfo);
            if (process == null)
            {
                Log("python process start returned null");
                ShowError("TeleVault could not start the bundled Python process.");
                return 1;
            }

            Log("python process started");
            if (!WaitForServerReady(process))
            {
                StopStartedProcess(process);
                ShowError("TeleVault started Python, but the local server did not become ready at " + StatusUrl + ".\n\n" + LogLocationText());
                return 1;
            }

            OpenBrowserWindow(AppUrl);

            using (process)
            {
                process.WaitForExit();
                Log("python process exited with code " + process.ExitCode);
                return process.ExitCode;
            }
        }
        catch (Exception ex)
        {
            Log("launcher failed: " + ex.GetType().Name + ": " + ex.Message);
            StopStartedProcess(process);
            ShowError("TeleVault launcher failed.\n\n" + ex.Message + "\n\n" + LogLocationText());
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

    private static string BuildMissingFilesMessage(string appRoot, List<string> missing)
    {
        StringBuilder builder = new StringBuilder();
        builder.AppendLine("TeleVault cannot start because required files are missing.");
        builder.AppendLine();
        builder.AppendLine("Application root:");
        builder.AppendLine(appRoot);
        builder.AppendLine();
        builder.AppendLine("Missing:");
        foreach (string item in missing)
        {
            builder.AppendLine("- " + item);
        }
        builder.AppendLine();
        builder.AppendLine("Keep TeleVault.exe next to app.py, backend, frontend and runtime\\python.");
        builder.AppendLine();
        builder.Append(LogLocationText());
        return builder.ToString();
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
                Log("server ready: " + StatusUrl);
                return true;
            }

            Thread.Sleep(ServerPollIntervalMs);
        }

        Log("server ready timeout: " + StatusUrl);
        return false;
    }

    private static bool IsServerReady()
    {
        try
        {
            HttpWebRequest request = (HttpWebRequest)WebRequest.Create(StatusUrl);
            request.Method = "GET";
            request.Timeout = 1000;
            request.ReadWriteTimeout = 1000;

            using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
            using (StreamReader reader = new StreamReader(response.GetResponseStream(), Encoding.UTF8))
            {
                if (response.StatusCode != HttpStatusCode.OK)
                {
                    return false;
                }

                string body = reader.ReadToEnd();
                return body.IndexOf("\"TeleVault\"", StringComparison.OrdinalIgnoreCase) >= 0
                    && (body.IndexOf("\"ready\": true", StringComparison.OrdinalIgnoreCase) >= 0
                        || body.IndexOf("\"ready\":true", StringComparison.OrdinalIgnoreCase) >= 0);
            }
        }
        catch
        {
            return false;
        }
    }

    private static void OpenBrowserWindow(string url)
    {
        string edge = FindBrowser(
            "msedge.exe",
            new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Microsoft", "Edge", "Application", "msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Microsoft", "Edge", "Application", "msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Microsoft", "Edge", "Application", "msedge.exe"),
            });

        if (!string.IsNullOrEmpty(edge) && StartAppModeBrowser(edge, url, "Edge"))
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

        if (!string.IsNullOrEmpty(chrome) && StartAppModeBrowser(chrome, url, "Chrome"))
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

    private static bool StartAppModeBrowser(string browserPath, string url, string browserName)
    {
        try
        {
            ProcessStartInfo startInfo = new ProcessStartInfo();
            startInfo.FileName = browserPath;
            startInfo.Arguments = "--app=" + QuoteArgument(url);
            startInfo.WorkingDirectory = Path.GetDirectoryName(browserPath);
            startInfo.UseShellExecute = false;
            startInfo.CreateNoWindow = true;
            Process browserProcess = Process.Start(startInfo);
            if (browserProcess == null)
            {
                Log(browserName + " app-mode launch returned null");
                return false;
            }

            browserProcess.Dispose();
            Log("app-mode browser launched: " + browserName);
            return true;
        }
        catch (Exception ex)
        {
            Log(browserName + " app-mode launch failed: " + ex.Message);
            return false;
        }
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

    private static void ShowError(string message)
    {
        MessageBox.Show(message, AppName, MessageBoxButtons.OK, MessageBoxIcon.Error);
    }
}
