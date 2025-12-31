import os
import platform
import subprocess
from pathlib import Path

def print_pdf(file_path: str):
    """
    Envia PDF para a impressora padrão do sistema.
    Funciona no Windows, Linux e MacOS.
    """
    file_path = Path(file_path)
    if not file_path.exists():
        raise FileNotFoundError(f"Arquivo PDF não encontrado: {file_path}")

    system = platform.system()
    try:
        if system == "Windows":
            # Windows
            os.startfile(file_path, "print")
        elif system == "Linux":
            subprocess.run(["lp", str(file_path)], check=True)
        elif system == "Darwin":
            subprocess.run(["lp", str(file_path)], check=True)
        else:
            raise OSError("Sistema operacional não suportado para impressão direta.")
    except Exception as e:
        print(f"Erro ao imprimir PDF: {e}")