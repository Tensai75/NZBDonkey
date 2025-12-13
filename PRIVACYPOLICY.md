## 1. Introduction

NZBDonkey is committed to protecting your privacy. This privacy policy outlines how your data is handled when using the NZBDonkey browser extension.

## 2. Data Collection and Tracking

NZBDonkey does not collect, store, or transmit any personal data to external servers. The extension does not track user activity, usage patterns, or interact with third-party services to collect analytics.

## 3. Local Storage of Data

Any data entered to configure NZBDonkey is stored locally on your device. The extension does not transmit this information to external servers or third parties.

## 4. Browser Syncing

If your browser has profile synchronization enabled, NZBDonkey's configuration settings may be synced across your devices via your browser’s built-in sync functionality. This process is managed by your browser and is subject to the browser's privacy policy.

## 5. Interaction with External Websites and APIs

NZBDonkey interacts with external websites and APIs to search for the required information or to send NZB files to the specified target applications. However, it only communicates with those sites and APIs that are explicitly configured in the extension's configurations settings. Stored access credentials, such as API keys, user names and passwords, are only sent to the correspondingly configured websites or APIs for authentication purposes.
The extension does not send any requests or access credentials to unauthorized third parties.

## 6. Redirecting requests to connectivity-check.ubuntu.com

When the NZB file interception feature is enabled, requests initiated by the browser for NZB file downloads are redirected to 'https://connectivity-check.ubuntu.com' to provoke a 204 'no content' response, effectively blocking the request. The cookie and referer headers are removed from the redirected requests, but the IP address is visible to connectivity-check.ubuntu.com. The connectivity-check.ubuntu.com endpoint is used by Ubuntu to check the internet connection. There is no documentation that this endpoint collects browsing habits, device identifiers or otherwise tracks user behaviour.

## 7. GitHub Repository Access

NZBDonkey may access its GitHub repository (https://github.com/Tensai75/nzbdonkey) to check for updates to the extension and to retrieve templates for specific user settings. This process is limited to retrieving publicly available information from the official NZBDonkey repository and does not involve sending any user data to GitHub.

## 8. Third-Party Services

NZBDonkey does not interact with external services, APIs, or third-party tracking mechanisms beyond the configured websites and APIs mentioned in sections 5 to 7.

## 9. Local Activity Logging

NZBDonkey logs certain activities of the extension for user convenience and to support its functionality. In particular, the extension logs information about NZB files that have been searched for or intercepted during download. This includes:

- The URL at which the extension was activated to search for an NZB file or at which an NZB file download was intercepted.
- The time at which the extension was activated to search for an NZB file or at which an NZB file download was intercepted.
- The metadata associated with the NZB file, such as header, title, password, category and the file name.
- If applicable, the NZB file search engine from which the NZB file was obtained.
- Whether or not the NZB file was successfully sent to the final target applications.

In addition, NZBDonkey creates a debug log for troubleshooting, which may contain further information such as URLs called by the extension.
All logged information is stored in the browser's local memory and is not transferred to external servers or third parties. Both the creation of the NZB file log and the debug log can be deactivated in the extension settings and the logs can be deleted by the user at any time.

## 10. Security

Since all data is stored locally or synced via browser profiles, the security of your information is managed by your browser and operating system security settings. We recommend ensuring your browser and system are kept up to date.

## 11. Changes to This Policy

This privacy policy may be updated periodically. Any changes will be reflected in the extension’s documentation or release notes.

## 12. Contact Information

If you have any questions about this privacy policy, please contact us at tensai75@protonmail.com.

## 13. Effective Date:

23 November 2025
