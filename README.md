# Gatekeep

A daily music journal for iOS and Android. Take a photo, pick four albums that sum up your day, and share the result as one image.

## Install (Android)

Download the latest `.apk` from [Releases](../../releases), open it, and allow installs from your browser or file manager when Android asks. Play Protect may warn because the APK is signed with a debug key, not a Play Store key. To update, install the newer APK over the old one.

## Features

- Camera viewfinder in a 9:16 frame, with your albums and the date shown on top while you shoot.
- Album search using the public Deezer API.
- One gatekeep per day, with a 19:00 reminder on days you have not done yet. Gatekeep asks to send it after your first recap.
- Export to a 1080×1920 PNG, saved to a "Gatekeep" album in your photos and shared through the system share sheet.
- Local history of past days: top albums and artists over a range of days, a year calendar, and a page for each album and artist with the days picked and what it is picked with.

## Privacy

Gatekeep has no accounts and no backend. History is saved in a JSON file on the device. The app asks for the camera (your daily photo), photo library access (to save each recap to its own album) and notifications (the daily reminder). The only network requests go to Deezer, to search albums and load album covers and artist pictures.

## Getting started

The app uses `react-native-view-shot`, which is not part of Expo Go. Run it in a development build.

```sh
npm install
npx expo run:android
npx expo run:ios
```

A local build needs Android Studio for Android, or Xcode on macOS for iOS. To build in the cloud instead, see [EAS Build](https://docs.expo.dev/build/introduction/).

## Checks

```sh
npx tsc --noEmit
npm run lint
npx tsx albums.test.ts
npx tsx history.test.ts
```

## Project structure

| File | Purpose |
| --- | --- |
| `App.tsx` | Main screen: camera, album slots and export |
| `AlbumSearch.tsx` | Album search modal |
| `History.tsx` | Past days and statistics |
| `TopList.tsx` | Full album or artist ranking |
| `ArtistPage.tsx` | One artist: picked days, top albums and pairings |
| `AlbumPage.tsx` | One album: picked-days calendar, dates and most common pairings |
| `DateStamp.tsx` | LED-style date display |
| `DaysSection.tsx` | Year calendar and day list |
| `RangePicker.tsx` | Date range selector for statistics |
| `StatRows.tsx` | Album and artist ranking rows |
| `notifications.ts` | Daily reminder scheduling |
| `albums.ts` | `Album` type and Deezer search |
| `history.ts` | History parsing and statistics |
| `historyStore.ts` | Reads and writes `history.json` on the device |
| `theme.ts` | Color tokens |

## Contributing

Issues and pull requests are welcome. Run the checks above before you open a pull request.

## Acknowledgements

Album data and cover art come from the [Deezer API](https://developers.deezer.com/api). Gatekeep is not affiliated with Deezer. Cover art belongs to its rights holders.

## License

Released under the [MIT License](LICENSE).
