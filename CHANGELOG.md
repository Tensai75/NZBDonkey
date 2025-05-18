# [1.1.0-beta.2](https://github.com/Tensai75/NZBDonkey/compare/v1.1.0-beta.1...v1.1.0-beta.2) (2025-05-18)


### Features

* add the category to the meta data of the nzb file for targets that support categories ([304aada](https://github.com/Tensai75/NZBDonkey/commit/304aadaa9fb044e5526cc0f1e211f8fcd146eda8))

# [1.1.0-beta.1](https://github.com/Tensai75/NZBDonkey/compare/v1.0.0...v1.1.0-beta.1) (2025-05-17)


### Bug Fixes

* correction of non-asynchronous error handling during settings migration ([97359fd](https://github.com/Tensai75/NZBDonkey/commit/97359fd93b091aea82ae2e46038096bdb4b84962))
* **interception:** add navigate navigation event listener ([68d07ae](https://github.com/Tensai75/NZBDonkey/commit/68d07aef8c07f0aac27918ad846fd94a4db07c24))
* set focus to the title field in the nzb file dialog ([f66e42b](https://github.com/Tensai75/NZBDonkey/commit/f66e42b112d55d5a6fd8bdd5510c37baabed8ca0))
* show notification when search is started ([351717e](https://github.com/Tensai75/NZBDonkey/commit/351717ed0842f6124e46afd9086f4f259d40cdaf))
* **synology:** do not double URI encode the credentials ([154d5bb](https://github.com/Tensai75/NZBDonkey/commit/154d5bbe027cfc9d31bdadd01dc7b928a7eb37db))


### Features

* **interception:** add interception of already initiated downloads ([3c0b1c9](https://github.com/Tensai75/NZBDonkey/commit/3c0b1c9a645e697d2a479cfc71fdc2b912a906dc))
* **nzbfile:** filter to remove unwanted files from the nzb file ([8a9dbfc](https://github.com/Tensai75/NZBDonkey/commit/8a9dbfcbf0ea49380a01d80434ae143db2a5f43f))

# 1.0.0 (2025-05-07)


### Features

* Complete rewrite of the code base and compatibility with Manifest v3 ([1a3c4db](https://github.com/Tensai75/NZBDonkey/commit/1a3c4db29795ec2e72d5c1f7834173ddd7e1dfec))


### BREAKING CHANGES

* Complete rewrite of the code base and compatibility with Manifest v3

### New features:
* manifest v3 support
* configuration of several different NZB file targets
* individual category configuration for each target
* new target "JDownloader2"
* search the search engines in parallel or sequential
* new search engine "Easynews" (requires access credentials)
* archive support for NZB file download interception (rar, zip, 7z)
* light/dark mode according to system settings
* ...
