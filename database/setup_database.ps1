# ==============================================================================
# BTL HỆ QUẢN TRỊ CSDL (DBMS) - HỆ THỐNG TMĐT BKPEE
# File: setup_database.ps1
# Script PowerShell tự động khởi tạo và nạp dữ liệu cho SQL Server
# ==============================================================================

param (
    [string]$Server = "localhost",
    [ValidateSet("schema", "small", "large", "mongo_small", "mongo_large", "menu")]
    [string]$Mode = "menu"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Run-SqlFile ([string]$fileName, [string]$description) {
    $filePath = Join-Path $scriptDir $fileName
    if (-not (Test-Path $filePath)) {
        Write-Error "Khong tim thay file: $filePath"
        return $false
    }
    Write-Host "[*] $description ($fileName)..." -ForegroundColor Cyan
    $output = sqlcmd -S $Server -E -f 65001 -i $filePath
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Loi khi chay $fileName!"
        Write-Host $output
        return $false
    }
    Write-Host "[+] Hoan tat $fileName!" -ForegroundColor Green
    return $true
}

Clear-Host
Write-Host "=====================================================================" -ForegroundColor Yellow
Write-Host "   BKPEE E-COMMERCE - KHOI TAO CSDL (SQL SERVER & MONGODB)          " -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Yellow
Write-Host "SQL Server: $Server" -ForegroundColor Gray
Write-Host ""

if ($Mode -eq "menu") {
    Write-Host "Chon che do khoi tao:"
    Write-Host "  1. SQL Server: Tao cau truc 28 bang (01_schema.sql)"
    Write-Host "  2. SQL Server: Tao Schema + Nap du lieu mau co ban (02_seed_small.sql)"
    Write-Host "  3. SQL Server: Tao Schema + Nap du lieu lon ~110.000 dong (03_seed_large.sql)"
    Write-Host "  4. MongoDB   : Nap du lieu mau co ban (Small Seed)"
    Write-Host "  5. MongoDB   : Sinh du lieu lon ~24.300+ docs (Large Seed)"
    Write-Host "  6. Thoat"
    Write-Host ""
    $choice = Read-Host "Nhap lua chon (1-6)"
    switch ($choice) {
        "1" { $Mode = "schema" }
        "2" { $Mode = "small" }
        "3" { $Mode = "large" }
        "4" { $Mode = "mongo_small" }
        "5" { $Mode = "mongo_large" }
        default { 
            Write-Host "Thoat chuong trinh." -ForegroundColor Yellow
            return 
        }
    }
}

$startTime = Get-Date

if ($Mode -eq "schema") {
    Run-SqlFile "01_schema.sql" "Dang tao cau truc Database va 28 bang"
}
elseif ($Mode -eq "small") {
    if (Run-SqlFile "01_schema.sql" "Buoc 1/2: Tao cau truc 28 bang") {
        Run-SqlFile "02_seed_small.sql" "Buoc 2/2: Nap du lieu mau co ban"
    }
}
elseif ($Mode -eq "large") {
    if (Run-SqlFile "01_schema.sql" "Buoc 1/2: Tao cau truc 28 bang") {
        Run-SqlFile "03_seed_large.sql" "Buoc 2/2: Sinh du lieu lon (~110.000+ dong de demo)"
    }
}
elseif ($Mode -eq "mongo_small") {
    Write-Host "[*] Dang khoi tao va nap du lieu mau co ban vao MongoDB..." -ForegroundColor Cyan
    python (Join-Path $scriptDir "setup_mongodb.py") --mode small
}
elseif ($Mode -eq "mongo_large") {
    Write-Host "[*] Dang sinh du lieu lon vao MongoDB (~24.300+ documents)..." -ForegroundColor Cyan
    python (Join-Path $scriptDir "setup_mongodb.py") --mode large
}

$elapsed = (Get-Date) - $startTime
Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host ("   DA HOAN TAT XU LY TRONG {0:N2} GIAY!" -f $elapsed.TotalSeconds) -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Green
