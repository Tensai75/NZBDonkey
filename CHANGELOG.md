## [1.2.1-beta.2](https://github.com/Tensai75/NZBDonkey/compare/v1.2.1-beta.1...v1.2.1-beta.2) (2025-06-21)


### Bug Fixes

* allow trailing dot in host names ([fa01a58](https://github.com/Tensai75/NZBDonkey/commit/fa01a588c4811723eddf31053c2f7ae0f08a5f8e)), closes [#68](https://github.com/Tensai75/NZBDonkey/issues/68)

# [1.2.0](https://github.com/Tensai75/NZBDonkey/compare/v1.1.0...v1.2.0) (2025-05-31)


### Bug Fixes

* correctly calculate content height for popup windows ([3e8ee66](https://github.com/Tensai75/NZBDonkey/commit/3e8ee66122bad93d3d3f2906a5f734f20d4a28e4)), closes [#54](https://github.com/Tensai75/NZBDonkey/issues/54)
* request host permission if not yet granted ([835a526](https://github.com/Tensai75/NZBDonkey/commit/835a52666c31afae438d3fffb3b80f8b4c95a484))
* use the background script to make the connection test request ([14963a2](https://github.com/Tensai75/NZBDonkey/commit/14963a20f6078e13a0eb4a58ae50787f284c877f))


### Features

* addition of torbox.app as another destination for nzb files ([ec031df](https://github.com/Tensai75/NZBDonkey/commit/ec031df36df9fdbcfab244f8c06b7cb52e76280f))

# [1.1.0](https://github.com/Tensai75/NZBDonkey/compare/v1.0.0...v1.1.0) (2025-05-23)


### Bug Fixes

* always register context menus upon start of the background script ([30d91b8](https://github.com/Tensai75/NZBDonkey/commit/30d91b8c35aa4f3832b7ea7fbc2fbd3b32ddda76))
* correction of non-asynchronous error handling during settings migration ([97359fd](https://github.com/Tensai75/NZBDonkey/commit/97359fd93b091aea82ae2e46038096bdb4b84962))
* correctly parse file name in content-disposition header ([4733a43](https://github.com/Tensai75/NZBDonkey/commit/4733a43dfc3ebeb23783d08bb77cf2ed59640c95))
* **interception:** add navigate navigation event listener ([68d07ae](https://github.com/Tensai75/NZBDonkey/commit/68d07aef8c07f0aac27918ad846fd94a4db07c24))
* set focus to the title field in the nzb file dialog ([f66e42b](https://github.com/Tensai75/NZBDonkey/commit/f66e42b112d55d5a6fd8bdd5510c37baabed8ca0))
* show notification when search is started ([351717e](https://github.com/Tensai75/NZBDonkey/commit/351717ed0842f6124e46afd9086f4f259d40cdaf))
* **synology:** do not double URI encode the credentials ([154d5bb](https://github.com/Tensai75/NZBDonkey/commit/154d5bbe027cfc9d31bdadd01dc7b928a7eb37db))


### Features

* add the category to the meta data of the nzb file for targets that support categories ([304aada](https://github.com/Tensai75/NZBDonkey/commit/304aadaa9fb044e5526cc0f1e211f8fcd146eda8))
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
