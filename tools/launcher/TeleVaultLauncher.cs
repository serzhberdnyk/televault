using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Reflection;

internal static class TeleVaultLauncher
{
    private static int Main(string[] args)
    {
        try
        {
            string appRoot = GetAppRoot();
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
                Console.Error.WriteLine("TeleVault launcher cannot start because required files are missing.");
                Console.Error.WriteLine("Application root: " + appRoot);
                Console.Error.WriteLine();
                foreach (string item in missing)
                {
                    Console.Error.WriteLine("- " + item);
                }
                Console.Error.WriteLine();
                Console.Error.WriteLine("Keep TeleVault.exe next to app.py, backend, frontend and runtime\\python.");
                PauseBeforeExit();
                return 1;
            }

            Console.WriteLine("Starting TeleVault...");
            Console.WriteLine("Application root: " + appRoot);
            Console.WriteLine("Runtime: runtime\\python\\python.exe");
            Console.WriteLine();

            ProcessStartInfo startInfo = new ProcessStartInfo();
            startInfo.FileName = pythonExe;
            startInfo.Arguments = QuoteArgument("app.py");
            startInfo.WorkingDirectory = appRoot;
            startInfo.UseShellExecute = false;
            startInfo.CreateNoWindow = false;

            using (Process process = Process.Start(startInfo))
            {
                if (process == null)
                {
                    Console.Error.WriteLine("TeleVault launcher could not start the Python process.");
                    PauseBeforeExit();
                    return 1;
                }

                process.WaitForExit();
                return process.ExitCode;
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine("TeleVault launcher failed.");
            Console.Error.WriteLine(ex.Message);
            PauseBeforeExit();
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

    private static string QuoteArgument(string value)
    {
        return "\"" + value.Replace("\"", "\\\"") + "\"";
    }

    private static void PauseBeforeExit()
    {
        try
        {
            if (Environment.UserInteractive)
            {
                Console.WriteLine("Press any key to close this window...");
                Console.ReadKey(true);
            }
        }
        catch
        {
        }
    }
}
