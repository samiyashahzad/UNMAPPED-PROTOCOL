@echo off
:: Activate the virtual environment
call "%~dp0venv\Scripts\activate.bat"

:: Run the python script
python "%~dp0mcp_server.py"