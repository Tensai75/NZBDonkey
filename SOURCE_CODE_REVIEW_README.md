# Build instruction

## Operating systems

- Windows 10 22H2 or higher
- Ubuntu latest version

## Requirements

- Node.js v22.x LTS (latest)
- npm (latest version)

## Installation of dependencies

### Install command

```
npm ci
```

## Build steps

### Chrome

#### Build command

```
npm run zip
```

#### Resulting files

```
./dist/chrome-mv3  [contains unpacked extension]
./dist/nzbdonky-v{{version}}-chrome.zip
```

### FireFox

#### Build command

```
npm run zip:firefox
```

#### Resulting files

```
./dist/firefox-mv3  [contains unpacked extension]
./dist/nzbdonky-v{{version}}-firefox.zip
./dist/nzbdonky-v{{version}}-sources.zip
```
