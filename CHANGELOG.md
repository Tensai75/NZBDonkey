#### v0.7.3
* Bug fix: Fixed NZBKing settings due to changes in API

#### v0.7.2
* Bug fix: Fixed an error which caused any Synology Diskstation administration page to reload if it was open during a push of the NZB file to Synology Diskstation.
* Bug fix: Fixed an error which caused the NZB file to be saved with the file extensiosn ".xml" in Chrome v77.
* Other: Updated jQuery to v3.4.1.
* Other: Updated Bootstrap to v4.3.1.

#### v0.7.1
* Bug fix: NZBKing is working again
* Bug fix: Fixed error in AnalyzeURL function if parameters are undefined
* Bug fix: Improved starting routine to avoid the settings to be loaded too fast resulting in being undefined
* Improvement: Added "file" as additional keyword for the header information in the function to analyze the selected text
* Other: Added some credits on the about page (I actually figured out the NZBKing fix by myself, without spying anyone's source code and my solution is much simpler. Only because a little birdie told me, I eventually got the hidden message anyway. Next time just ask me directly...)

#### v0.7.0
* New function: Added popup window with download history and debug log
* Improvement: Complete redesign of options page
* Improvement: Changed category selection from modal popup to window popup
* Improvement: Complete redesign of the modal popup for the analysis/modification of the selected text
* Searchengines: Removed "NZBindex (Beta)" and change URL/API of NZBIndex to former beta API (Old API no longer available / beta API is now standard)
* Other: u4a is supported again (let's make peace to the world)

#### v0.6.4
* Bug fixes: Replace plus signs (+) with spaces (%20) before URIdecoding the query parameters of the nzblnk

#### v0.6.3
* NZBDonkey is no longer working on certain domains

#### v0.6.2
* Bug fixes: Bug fix for a stupid bug causing the script to stop silently if "do not use categories" is selected.

#### v0.6.1
* Bug fixes: Bug fix for automatic categories in combination with manual category selection fall-back.
* Bug fixes: created separate manifest.json for FF with persistent set to false again and also added the application ID.

#### v0.6.0
* New function: support for search engines with JSON response.
* New function: support for beta.nzbindex.com (with JSON response)
* New function: support for premiumize.me download service (thanks to jbonling).
* New option in categories: Manual Category Selection. Only works with NZBGet or SABnzbd and gives the possibility to manualy select the category based on the categories as set in NZBGet or SABnzbd (to work with SABnzbd the API-Key needs to be provided in the SABnzbd settings).
* New option in categories: Fall-back action for automatic categories. Provides alternative action if automatic category setting fails.
* New option for NZBGet, SABnzbd and Synology Download station: Added advanced settings for reverse proxy path and basic authentication.
* Improvement: analyzeURL function rewritten
* Improvement: separated default and custom settings for search engines and nzb download interception. Renamed advanced settings back to search engines settings.
* Improvement: parser script fix for vertical bar as divider
* Bug fixes: several minor bugfixes.

#### v0.5.2
* Bug fix: intercepting nzb download not working correctly when selecting several nzb files on nzbindex.com

#### v0.5.1
* Bug fix: forgot to delete debug alert

#### v0.5.0
* New feature: nzb file download interception
  * option to set domains where nzb file downloads shall be intercepted
  * intercepted nzb file will be handled and downloaded or sent to a download program according to the NZBDonkey settings
* Due to the new nzb file download interception function the background script has again been heavily rewritten
  * background page is now persistent
  * the script will be initialized and settings loaded upon the browsers start
  * changes to the settings will reinitialize the script and reload the settings
* options script and manifest file reformatted

#### v0.4.1
* Content script overlay: added an error prompt if header field is empty
* Some corrections to the options page (thanks to ChaosMarc)
* Some general improvements to the scripts

#### v0.4.0
* New feature: nzb files can now be checked for completeness. The feature is activated by default but can be deactivated in the general settings. Also the threshold value for missing files and segments can be changed.
  
  **NOTE:** the check for completeness is very basic and limited because it depends mostly on the information provided in the file's subject set by the program used to upload the files to the usenet. Unfortunately there is no official standard for the file's subject for multiple file uploads.
* New feature: a desktop notification will now show up if the script has started to search for the nzb file. Informative notifications (e.g. upon start of the script) will have the standard blue icon. Success notification will have green icon and error notification a red icon for better differentiation.
* Bug fix: context menu will now only show one menu entry if selected text contains a link.
* Bug fix: Errors will now be catched and a error notification will be shown if download of the nzb files to the download folder fails. Also fixed "invalid filename" error if title does contain a zero width space.
* Other: the script will now fall back to storage.local if storage.sync is not available/activated (might help to geth the script running on some officially unsupported browsers).
* Other: some cleanup of the code. Moved repeated code into own functions.

#### v0.3.1
* Bug fix for: "nzb.password.match is undefined" bug in processNZBfile routine.

#### v0.3.0
* Options page: added a test button on the NZBGet, SABnzbd and Synology DownloadStation settings to test the connection with the server.
* Options page: changed all alerts to modal pop-ups.
* Background Script: Almost a complete rewrite of the background script using promises as far as possible and chaining them together:
  * The stored settings are now only loaded if the script is executed.
  * If an error occurred, in almost all cases a desktop notification will show up presenting the error message.
  * Now all nzb files found will be downloaded and the first valid nzb file will be saved or pushed to the download program.
* Additional minor bug fixes

#### v0.2.1
* Bug fix for: Failed to execute 'btoa' on 'Window': The string to be encoded contains characters outside of the Latin1 range.

#### v0.2.0
* Added support for Synology DownloadStation.
* Updated Settings Page to show only the relevant tab according to the chosen action for the NZB file.
* Renamed "Search Engines" tab to "Advanced" and added a warning alert.
* Added an option to deactivate success notifications
* Switched all search and download URLs to https where possible. Stored Search Engines settings will be overwritten upon update.
* Changed default for "Catch left mouse clicks on NZBlnk links" to true
* NZB file are now downloaded and pushed to the download programs instead of only pushing the download URL
* Meta data for title, category and password is added to the NZB file before saving it or pushing it to the download programs
* Added an option to reset the settings to the default settings
* Added an option to push the NZB file to SABnzbd as paused
* Changed communication with NZBGet from XML-RPC to JSON-RPC for better handling
* Small improvements to the selection analyzing routine

#### v0.1.5
* Bug fix: wrongly named settings variable for category

#### v0.1.4
* Quick bug fix of an error introduced with v0.1.3

#### v0.1.3
* had to rename a variable to prevent Mozilla reviewers from kicking the add-on out of the store

#### v0.1.2
* Settings page redesigned
* NZBGet: password is now passed as a parameter and not as part of the NZB filename
* Bug fix: improved the capturing of left mouse clicks on NZBlnk links
