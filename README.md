[![Chrome users](https://img.shields.io/chrome-web-store/users/edkhpdceeinkcacjdgebjehipmnbomce?style=plastic&label=Chrome%20users)](https://chrome.google.com/webstore/detail/nzbdonkey/edkhpdceeinkcacjdgebjehipmnbomce)
[![Firefox users](https://img.shields.io/amo/users/nzbdonkey?style=plastic&label=Firefox%20users)](https://addons.mozilla.org/de/firefox/addon/nzbdonkey/)
[![Latest release](https://img.shields.io/github/v/release/Tensai75/NZBDonkey?include_prereleases&display_name=tag&logo=github&label=latest%20release&style=plastic)](https://github.com/Tensai75/NZBDonkey/releases/latest)
[![Latest stable release](https://img.shields.io/github/v/release/Tensai75/NZBDonkey?display_name=tag&logo=github&label=latest%20stable%20release&style=plastic)](https://github.com/Tensai75/NZBDonkey/releases/latest)
[![Workflow status](https://img.shields.io/github/actions/workflow/status/Tensai75/NZBDonkey/semantic_release.yaml?style=plastic)](https://github.com/Tensai75/NZBDonkey/actions/workflows/semantic_release.yaml)


![NZBDonkey logo](https://raw.githubusercontent.com/Tensai75/NZBDonkey/master/icons/NZBDonkey_128.png 'NZBDonkey Logo')

# NZBDonkey

### The ultimate NZB file downloader extension for Chrome and Firefox

## Download

[![Chrome Webstore](https://img.shields.io/chrome-web-store/v/edkhpdceeinkcacjdgebjehipmnbomce?style=for-the-badge&logo=googlechrome&label=Chrome%20Webstore)](https://chrome.google.com/webstore/detail/nzbdonkey/edkhpdceeinkcacjdgebjehipmnbomce)

[![Firefox Webstore](https://img.shields.io/amo/v/nzbdonkey?style=for-the-badge&logo=firefox&label=Mozilla%20Webstore)](https://addons.mozilla.org/de/firefox/addon/nzbdonkey/)

## Supported target applications

<a href="#" title="local download"><img src="https://raw.githubusercontent.com/Tensai75/NZBDonkey/refs/heads/master/src/public/img/download.png" title="local download" alt="Download" width="48"/></a>
<a href="https://sabnzbd.org/" title="Sabnzbd"><img src="https://raw.githubusercontent.com/Tensai75/NZBDonkey/refs/heads/master/src/public/img/sabnzbd.png" alt="Sabnzbd" width="48"/></a>
<a href="https://nzbget.com/" title="NZBGet"><img src="https://raw.githubusercontent.com/Tensai75/NZBDonkey/refs/heads/master/src/public/img/nzbget.png" alt="NZBGet" width="48"/></a>
<a href="https://www.synology.com/en-global/dsm/packages/DownloadStation" title="Synology Download Station"><img src="https://raw.githubusercontent.com/Tensai75/NZBDonkey/refs/heads/master/src/public/img/synology.png" alt="Synology Downloadstation" width="48"/></a>
<a href="https://jdownloader.org/" title="JDownloader"><img src="https://raw.githubusercontent.com/Tensai75/NZBDonkey/refs/heads/master/src/public/img/jdownloader.png" alt="JDownloader 2" width="48"/></a>
<a href="https://premiumize.me" title="Premiumize.me"><img src="https://raw.githubusercontent.com/Tensai75/NZBDonkey/refs/heads/master/src/public/img/premiumize.png" alt="Premiumize.me" width="48"/></a>
<a href="https://torbox.app" title="Torbox.app"><img src="https://raw.githubusercontent.com/Tensai75/NZBDonkey/refs/heads/master/src/public/img/torbox.png" alt="Torbox.app" width="48"/></a>


## Description

Add-on to automatically download NZB files or send them to NZBGet, SABnzbd, Synology Download Station, JDwonloader, Premiumize.me or Torbox.app.

- Works either with NZBLNK links or with header, password and title information provided as plain text.
- Searches sequentially or simultaneously in different NZB search engines
- Provides the ability to intercept and process NZB file downloads from any website
- Highly configurable
  - Multiple target applications can be configured for the NZB file:
    - Download to the download folder of the browser
    - Send directly to SABnzbd, NZBGet, Synology Download Station, JDownloader, Premiumize.me or Torbox.app
  - Support for categories (if supported by the target application)
    - The categories can be freely configured for each target application with various options:
      - Automatic setting of a category based on the title or file name of the NZB file (with fallback option)
      - Set a default category for all NZB files
      - Manual selection of the category from the categories of the target application
  - Enable/disable the NZB file completeness check with separate thresholds for file and segment completeness
  - NZB search engines can be set up from existing templates or completely freely
  - and more...
