from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path
import logging






















































































# Set up basic logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('download_errors.log')
    ]
)

# İndirilecek GitHub projeleri
REPOSITORIES: dict[str, str] = {
    "n8n": "https://github.com/n8n-io/n8n.git",
    "huginn": "https://github.com/huginn/huginn.git",
    "rsshub": "https://github.com/DIYgod/RSSHub.git",
    "folo": "https://github.com/RSSNext/Folo.git",
    "changedetection": "https://github.com/dgtlmoon/changedetection.io.git",
    "freshrss": "https://github.com/FreshRSS/FreshRSS.git",
    "internet-radar-reference": (
        "https://github.com/puneetdixit200/my-bloomburg.git"
    ),
}









def command_exists(command: str) -> bool:
    """Bir terminal komutunun bilgisayarda kurulu olup olmadığını kontrol eder."""
    return shutil.which(command) is not None

def run_command(command: list[str], cwd: Path | None = None) -> bool:
    """Terminal komutunu çalıştırır ve başarılı olup olmadığını döndürür."""
    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            check=True,
            text=True,
            capture_output=True,
        )

















        if result.stdout:
            logging.info(f"Command output: {result.stdout}")
        return True

    except subprocess.CalledProcessError as error:
        logging.error(f"Command failed: {' '.join(command)}")
        logging.error(f"Error code: {error.returncode}")
        if error.stdout:
            logging.error(f"Stdout: {error.stdout}")
        if error.stderr:
            logging.error(f"Stderr: {error.stderr}")
        return False

    except OSError as error:
        logging.error(f"Command could not be executed: {error}")
        return False

    except KeyboardInterrupt:
        logging.warning("Operation cancelled by user")
        return False

    except Exception as error:
        logging.error(f"Unexpected error: {error}")
        return False

def clone_repository(
    name: str,
    url: str,
    destination_root: Path,
) -> bool:
    """Repository yoksa indirir, varsa güncellemeyi dener."""
    destination = destination_root / name

    logging.info("\n" + "=" * 65)
    logging.info(f"Proje: {name}")
    logging.info(f"Kaynak: {url}")
    logging.info(f"Hedef : {destination}")

    try:
        if destination.exists():
            git_folder = destination / ".git"

            if not git_folder.exists():
                logging.error(
                    "Bu isimde bir klasör zaten var ancak Git repository değil. "
                    "Güvenlik için üzerine yazılmadı."
                )
                return False







            logging.info("Proje daha önce indirilmiş. Güncelleniyor...")

            # First fetch to get latest changes
            if not run_command(["git", "fetch"], cwd=destination):
                return False

            # Try fast-forward merge
            if not run_command(["git", "merge", "--ff-only"], cwd=destination):
                logging.warning(
                    "Fast-forward merge failed. The local branch has diverged. "
                    "You may need to manually resolve conflicts."
                )
                return False
            return True

        logging.info("Proje indiriliyor...")

        # Create parent directory if it doesn't exist
        destination.parent.mkdir(parents=True, exist_ok=True)

        # --depth 1 yalnızca en güncel sürümü indirir.
        # Böylece indirme daha hızlı olur ve daha az disk kullanır.
        return run_command(
            [
                "git",
                "clone",
                "--depth",
                "1",
                url,
                str(destination),
            ]
        )

    except Exception as error:
        logging.error(f"Unexpected error while processing {name}: {error}")
        return False

def main() -> None:
    logging.info("COPT açık kaynak proje indiricisi")
    logging.info("-" * 65)

    if not command_exists("git"):
        logging.error(
            "Git bulunamadı.\n"
            "Önce Git'i kurup terminali yeniden açmalısın."
        )
        sys.exit(1)

    # Scriptin çalıştırıldığı klasörün içinde bu klasörü oluşturur.
    destination_root = Path.cwd() / "copt-open-source-projects"
    try:
        destination_root.mkdir(parents=True, exist_ok=True)
        # Test write permissions
        (destination_root / ".write_test").touch()
        (destination_root / ".write_test").unlink()
    except Exception as error:
        logging.error(f"Cannot create or write to directory: {error}")
        sys.exit(1)

    logging.info(f"Projeler şu klasöre indirilecek:\n{destination_root}")

    successful: list[str] = []
    failed: list[str] = []

    for name, url in REPOSITORIES.items():
        try:
            result = clone_repository(
                name=name,
                url=url,
                destination_root=destination_root,
            )

            if result:
                successful.append(name)
                logging.info(f"Başarılı: {name}")
            else:
                failed.append(name)
                logging.error(f"Başarısız: {name}")
        except Exception as error:
            logging.error(f"Unexpected error processing {name}: {error}")
            failed.append(name)



    logging.info("\n" + "=" * 65)
    logging.info("İndirme işlemi tamamlandı.")


    logging.info(f"\nBaşarılı projeler: {len(successful)}")
    for name in successful:

        logging.info(f"  ✓ {name}")

    if failed:

        logging.error(f"\nBaşarısız projeler: {len(failed)}")
        for name in failed:

            logging.error(f"  ✗ {name}")


    logging.info(f"\nProje klasörü:\n{destination_root}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logging.warning("\nProgram kullanıcı tarafından iptal edildi.")
        sys.exit(1)
    except Exception as error:
        logging.error(f"Beklenmeyen hata: {error}")
        sys.exit(1)
