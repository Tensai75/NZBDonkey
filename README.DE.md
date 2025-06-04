[![English](https://img.shields.io/badge/English-blue?style=plastic&logo=readme&logoColor=white)](README.md)

[![Chrome users](https://img.shields.io/chrome-web-store/users/edkhpdceeinkcacjdgebjehipmnbomce?style=plastic&label=Chrome%20users)](https://chrome.google.com/webstore/detail/nzbdonkey/edkhpdceeinkcacjdgebjehipmnbomce)
[![Firefox users](https://img.shields.io/amo/users/nzbdonkey?style=plastic&label=Firefox%20users)](https://addons.mozilla.org/de/firefox/addon/nzbdonkey/)
[![Latest release](https://img.shields.io/github/v/release/Tensai75/NZBDonkey?include_prereleases&display_name=tag&logo=github&label=latest%20release&style=plastic)](https://github.com/Tensai75/NZBDonkey/releases/latest)
[![Latest stable release](https://img.shields.io/github/v/release/Tensai75/NZBDonkey?display_name=tag&logo=github&label=latest%20stable%20release&style=plastic)](https://github.com/Tensai75/NZBDonkey/releases/latest)
[![Workflow status](https://img.shields.io/github/actions/workflow/status/Tensai75/NZBDonkey/semantic_release.yaml?style=plastic)](https://github.com/Tensai75/NZBDonkey/actions/workflows/semantic_release.yaml)

![NZBDonkey logo](https://raw.githubusercontent.com/Tensai75/NZBDonkey/master/icons/NZBDonkey_128.png 'NZBDonkey Logo')

# NZBDonkey

### Die ultimative NZB-Datei-Downloader-Erweiterung für Chrome und Firefox

## Download

[![Chrome Webstore](https://img.shields.io/chrome-web-store/v/edkhpdceeinkcacjdgebjehipmnbomce?style=for-the-badge&logo=googlechrome&label=Chrome%20Webstore)](https://chrome.google.com/webstore/detail/nzbdonkey/edkhpdceeinkcacjdgebjehipmnbomce)

[![Firefox Webstore](https://img.shields.io/amo/v/nzbdonkey?style=for-the-badge&logo=firefox&label=Mozilla%20Webstore)](https://addons.mozilla.org/de/firefox/addon/nzbdonkey/)

## Unterstützte Zielanwendungen

<a href="#" title="local download"><img src="https://raw.githubusercontent.com/Tensai75/NZBDonkey/refs/heads/master/src/public/img/download.png" title="local download" alt="Download" width="48"/></a>
<a href="https://sabnzbd.org/" title="Sabnzbd"><img src="https://raw.githubusercontent.com/Tensai75/NZBDonkey/refs/heads/master/src/public/img/sabnzbd.png" alt="Sabnzbd" width="48"/></a>
<a href="https://nzbget.com/" title="NZBGet"><img src="https://raw.githubusercontent.com/Tensai75/NZBDonkey/refs/heads/master/src/public/img/nzbget.png" alt="NZBGet" width="48"/></a>
<a href="https://www.synology.com/en-global/dsm/packages/DownloadStation" title="Synology Download Station"><img src="https://raw.githubusercontent.com/Tensai75/NZBDonkey/refs/heads/master/src/public/img/synology.png" alt="Synology Downloadstation" width="48"/></a>
<a href="https://jdownloader.org/" title="JDownloader"><img src="https://raw.githubusercontent.com/Tensai75/NZBDonkey/refs/heads/master/src/public/img/jdownloader.png" alt="JDownloader 2" width="48"/></a>
<a href="https://premiumize.me" title="Premiumize.me"><img src="https://raw.githubusercontent.com/Tensai75/NZBDonkey/refs/heads/master/src/public/img/premiumize.png" alt="Premiumize.me" width="48"/></a>
<a href="https://torbox.app" title="Torbox.app"><img src="https://raw.githubusercontent.com/Tensai75/NZBDonkey/refs/heads/master/src/public/img/torbox.png" alt="Torbox.app" width="48"/></a>

## Beschreibung

Add-on, um NZB-Dateien automatisch herunterzuladen oder sie an NZBGet, SABnzbd, Synology DownloadStation, JDwonloader, Premiumize.me oder Torbox.app zu senden.

- Funktioniert entweder mit NZBLNK-Links oder mit Header-, Passwort- und Titelinformationen, die als reiner Text bereitgestellt werden.
- Sucht sequentiell oder gleichzeitig in verschiedenen NZB-Suchmaschinen
- Bietet die Möglichkeit, NZB-Dateidownloads von beliebigen Websites abzufangen und zu verarbeiten
- Hochgradig konfigurierbar
  - Es können mehrere Zielanwendungen für die NZB-Datei konfiguriert werden:
    - Download in den Download-Ordner des Browsers
    - Direktes Senden an SABnzbd, NZBGet, Synology DownloadStation, JDownloader, Premiumize.me oder Torbox.app
  - Unterstützung von Kategorien (sofern von der Zielanwendung unterstützt)
    - Die Kategorien können für jede Zielanwendung mit verschiedenen Optionen frei konfiguriert werden:
      - Automatisches Setzen einer Kategorie auf Basis des Titels oder Dateinamens der NZB-Datei (mit Fallback-Option)
      - Festlegen einer Standardkategorie für alle NZB-Dateien
      - Manuelle Auswahl der Kategorie aus den Kategorien der Zielanwendung
  - Aktivieren/Deaktivieren der NZB-Dateivollständigkeitsprüfung mit separaten Schwellenwerten für Datei- und Segmentvollständigkeit
  - NZB-Suchmaschinen können aus bestehenden Vorlagen oder völlig frei eingerichtet werden
  - und mehr...
