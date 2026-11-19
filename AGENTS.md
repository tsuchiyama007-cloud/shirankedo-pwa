# AI 開発エージェント向けメモ

- 開発の基本指示書は `docs/MASTER_PROMPT.md`。仕様との差と仮決めは `SPEC_NOTES.md`。必ず読んでから作業する。
- Expo SDK 58（React Native 0.88 / TypeScript）。Expo の API は版ごとに変わるので、記憶に頼らず https://docs.expo.dev/versions/v58.0.0/ を確認する。
- パッケージの追加は `npx expo install <package>`。
- 画面遷移は Expo Router ではなく `src/ui/navigation.tsx` の自前のスタックを使う（PWA を GitHub Pages のサブパスで動かすため）。
- ゲームの計算（`src/currency`・`src/events`・`src/items`・`src/minigames` など）は画面から独立させ、PlayerData を書き換えずに新しい PlayerData を返す。お金は必ず `currencyManager` を通す。
- イベント・アイテム・確率はコードではなく `src/data/` のデータで追加・調整する。
- `android/` `ios/` は自動生成されるので手で作らない・編集しない（設定は `app.json` と `plugins/`）。
- 作業の最後に `npm run typecheck` と `npm test` を通す。
- このリポジトリと対になるリポジトリ（Google Play 用／PWA 用）がある。`src/`・`__tests__/`・`assets/` を直したら、もう一方にも同じ変更を入れる。
