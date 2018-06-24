![alt text](https://raw.githubusercontent.com/Tensai75/NZBDonkey/master/icons/NZBDonkey_128.png "NZBDonkey Logo")

# NZBDonkey

### The ultimate NZB file downloader extension for Chrome and Firefox

## Download
Download for Chrome: [Chrome Webstore](https://chrome.google.com/webstore/detail/nzbdonkey/edkhpdceeinkcacjdgebjehipmnbomce)

Download for Firefox: [Firefox Add-on](https://addons.mozilla.org/de/firefox/addon/nzbdonkey/)

## Description
Add-on to automatically download NZB files or send them to NZBGet, SABnzbd, Synology DownloadStation or to the premiumize.me download service.
* Works either with NZBlnk links or with header, password and title information provided as plain text.
* Searches simultaneously in different NZB search engines
* Possibility to intercept NZB file downloads from any web site
* Highly configurable
  * Target for the NZB file:
    * download to the browsers download folder
    * directly send to SABnzbd, NZBGet, Synology DownloadStation or premiumize.me Downloader
  * Category for the NZB file
    * automatically set a category based on the NZB file (with fallback option)
    * set a standard category for all NZB files
    * choose the category manually from the categories set in NZBGet or SABnzbd
  * de-/activate the completeness check of the NZB file with separate thresholds for file and segment completeness
  * set up additional NZB search engines
  * and more...

__Caution:__ this add-on is currently still in beta testing.

## How to use this add-on
### NZBlnk
Just left click on a NZBlnk link and NZBDonkey will take over and search for the NZB file. Or right click on a NZBlnk link and choose "Get NZB file".
Catching left mouse clicks on a NZBlnk link can be deactivated in the settings, e.g. if you would like to use NZBMonkey in parallel

### Header, password and title information provided as plain text
If no NZBlnk link is provided, select title, header and password, then right click on the selected text and choose "Get NZB file".
An overlay window will appear showing the extracted title, header and password. If automatic parsing of the selected text did not work correctly you can now manually enter or correct the title, header or password. For your convenience the selected text is shown as well to facilitate to copy and paste the required information.
If the title, header and password information is correct select "Get NZB file" and NZBDonkey will take over and search for the NZB file.

#### Best practice for text selection
![alt text](https://raw.githubusercontent.com/Tensai75/NZBDonkey/master/screenshots/text_selection_best_practice.jpg "Best practice for text selection")

1. Make sure the title information is in the first line of your selected text. If no other title information was found, the first line will automatically become the title information.
2. If the NZB filename information in the format “title{{password}}.nzb” is provided, make sure to include this information into your text selection. Title and password information will directly be extracted from this information.

### NZB file download interception
Just add the domain of the web site where you would like the download of NZB file to be handled with NZBDonkey to the list of custom domains in the "NZB download interception" settings page and set "Handling of Form Data" to default.
NZBDonkey will then capture any NZB file download from this web site and process it according to your settings (e.g. send it to the NZB file target). If there is always the error "this is not a valid nzb file" try to set one of the other options for "Handling of Form Data".
If no option is working for this web site please open an issue on github providing as much information about this web site as possible.
