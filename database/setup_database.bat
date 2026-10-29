@echo off
chcp 65001 > nul
cls
echo =====================================================================
echo    BKPEE E-COMMERCE - KHOI TAO CSDL (SQL SERVER ^& MONGODB)
echo =====================================================================
echo.
echo  [1] SQL Server: Tao cau truc 28 bang (Schema DDL)
echo  [2] SQL Server: Tao Schema + Nap du lieu mau co ban (Small Seed)
echo  [3] SQL Server: Tao Schema + Nap du lieu lon (Large Seed ~ 110.000+ dong)
echo  [4] MongoDB   : Nap du lieu mau co ban vao MongoDB (Small Seed)
echo  [5] MongoDB   : Sinh du lieu lon vao MongoDB (Large Seed ~ 24.300+ docs)
echo  [6] Thoat
echo.
set /p choice="Nhap lua chon cua ban (1-6): "

if "%choice%"=="1" goto opt1
if "%choice%"=="2" goto opt2
if "%choice%"=="3" goto opt3
if "%choice%"=="4" goto opt4_mongo_small
if "%choice%"=="5" goto opt5_mongo_large
if "%choice%"=="6" goto opt6
goto invalid

:opt1
echo.
echo [*] Dang tao cau truc bang (01_schema.sql)...
sqlcmd -S localhost -E -f 65001 -i "%~dp001_schema.sql"
goto finish

:opt2
echo.
echo [*] Buoc 1/2: Tao cau truc bang (01_schema.sql)...
sqlcmd -S localhost -E -f 65001 -i "%~dp001_schema.sql"
echo.
echo [*] Buoc 2/2: Nap du lieu mau co ban (02_seed_small.sql)...
sqlcmd -S localhost -E -f 65001 -i "%~dp002_seed_small.sql"
goto finish

:opt3
echo.
echo [*] Buoc 1/2: Tao cau truc bang (01_schema.sql)...
sqlcmd -S localhost -E -f 65001 -i "%~dp001_schema.sql"
echo.
echo [*] Buoc 2/2: Nap du lieu lon ~110.000 dong (03_seed_large.sql)...
sqlcmd -S localhost -E -f 65001 -i "%~dp003_seed_large.sql"
goto finish

:opt4_mongo_small
echo.
echo [*] Dang nap du lieu nho vao MongoDB (setup_mongodb.py --mode small)...
python "%~dp0setup_mongodb.py" --mode small
goto finish

:opt5_mongo_large
echo.
echo [*] Dang sinh du lieu lon vao MongoDB (setup_mongodb.py --mode large)...
python "%~dp0setup_mongodb.py" --mode large
goto finish

:invalid
echo Lua chon khong hop le!
pause
exit /b

:finish
echo.
echo =====================================================================
echo    DA HOAN TAT XU LY THANH CONG!
echo =====================================================================
pause
exit /b

:opt6
exit /b
