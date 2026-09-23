# Run a command inside a Windows job object with a hard CPU cap, so a headless browser run cannot
# take the machine over. Charles, 23 September 2026: "Just cap their cpu usage so as not to freeze up
# the pc as they can get up to 40 50 60 70% utilisations on one instance".
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools/qa/capped.ps1 -CpuPercent 25 -Log out.log node tools/qa/sweep.mjs
#
# Every process the command starts (headless Chrome and all its renderer and GPU children) inherits
# the job, and the cap applies to the job as a whole: 25 means a quarter of the machine's total CPU,
# whatever the core count. The command also runs at below-normal priority. At the end it prints how
# many processes ran inside the job, which is the evidence that Chrome was capped too.
param(
  [int]$CpuPercent = 25,
  [string]$Log = '',
  [Parameter(Mandatory = $true, Position = 0, ValueFromRemainingArguments = $true)][string[]]$Command
)

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class CappedJob {
  [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  static extern IntPtr CreateJobObject(IntPtr attributes, string name);
  [DllImport("kernel32.dll", SetLastError = true)]
  static extern bool SetInformationJobObject(IntPtr job, int infoClass, IntPtr info, uint length);
  [DllImport("kernel32.dll", SetLastError = true)]
  static extern bool QueryInformationJobObject(IntPtr job, int infoClass, IntPtr info, uint length, IntPtr returned);
  [DllImport("kernel32.dll", SetLastError = true)]
  public static extern bool AssignProcessToJobObject(IntPtr job, IntPtr process);

  [StructLayout(LayoutKind.Sequential)]
  struct CpuRate { public uint ControlFlags; public uint CpuRateValue; }

  // JOBOBJECT_BASIC_ACCOUNTING_INFORMATION: six 64-bit times, then four 32-bit counts
  [StructLayout(LayoutKind.Sequential)]
  struct Accounting {
    public long TotalUserTime, TotalKernelTime, ThisPeriodTotalUserTime, ThisPeriodTotalKernelTime;
    public uint TotalPageFaultCount, TotalProcesses, ActiveProcesses, TotalTerminatedProcesses;
  }

  public static IntPtr Create(int percent) {
    IntPtr job = CreateJobObject(IntPtr.Zero, null);
    if (job == IntPtr.Zero) throw new Exception("CreateJobObject failed: " + Marshal.GetLastWin32Error());
    // JOB_OBJECT_CPU_RATE_CONTROL_ENABLE | JOB_OBJECT_CPU_RATE_CONTROL_HARD_CAP; the rate is in
    // hundredths of a per cent of all processors
    var rate = new CpuRate { ControlFlags = 0x1 | 0x4, CpuRateValue = (uint)(percent * 100) };
    int size = Marshal.SizeOf(rate);
    IntPtr p = Marshal.AllocHGlobal(size);
    Marshal.StructureToPtr(rate, p, false);
    // 15 = JobObjectCpuRateControlInformation
    if (!SetInformationJobObject(job, 15, p, (uint)size)) throw new Exception("SetInformationJobObject failed: " + Marshal.GetLastWin32Error());
    Marshal.FreeHGlobal(p);
    return job;
  }

  public static string Count(IntPtr job) {
    int size = Marshal.SizeOf(typeof(Accounting));
    IntPtr p = Marshal.AllocHGlobal(size);
    // 1 = JobObjectBasicAccountingInformation
    if (!QueryInformationJobObject(job, 1, p, (uint)size, IntPtr.Zero)) return "unknown";
    var a = (Accounting)Marshal.PtrToStructure(p, typeof(Accounting));
    Marshal.FreeHGlobal(p);
    return a.TotalProcesses + " processes ran in the job, " + a.ActiveProcesses + " still active, CPU " +
      ((a.TotalUserTime + a.TotalKernelTime) / 10000000.0).ToString("0.0") + " s";
  }
}
'@

$job = [CappedJob]::Create($CpuPercent)
$exe = $Command[0]
$rest = @($Command | Select-Object -Skip 1)
$argLine = ($rest | ForEach-Object { if ($_ -match '\s') { '"' + $_ + '"' } else { $_ } }) -join ' '
$start = @{ FilePath = $exe; ArgumentList = $argLine; NoNewWindow = $true; PassThru = $true }
if ($Log) { $start.RedirectStandardOutput = $Log; $start.RedirectStandardError = "$Log.err" }
$proc = Start-Process @start
# Assigned before the command has had time to start its browser, so every child is born inside.
[void][CappedJob]::AssignProcessToJobObject($job, $proc.Handle)
try { $proc.PriorityClass = 'BelowNormal' } catch { }
"capped at $CpuPercent% of the machine, below-normal priority: $exe $argLine"
$proc.WaitForExit()
"exit $($proc.ExitCode); " + [CappedJob]::Count($job)
exit $proc.ExitCode
