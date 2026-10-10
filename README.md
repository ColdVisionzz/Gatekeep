# Gatekeep

A daily music journal for iOS and Android. Take a photo, pick four albums that sum up your day, and share the result as one image.

## Features

- Camera viewfinder in a 9:16 frame, with your albums and the date shown on top while you shoot.
- Album search using the public Deezer API.
- Export to a 1080×1920 PNG and share it through the system share sheet.
- Local history of past days, with your most picked albums and artists.

## Privacy

Gatekeep has no accounts and no backend. History is saved in a JSON file on the device. The app only makes network requests to search Deezer and load album covers.

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
| `AlbumPage.tsx` | One album: picked-days calendar, dates and most common pairings |
| `DateStamp.tsx` | LED-style date display |
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
