# 知らんけど（PWA 用）

「何をするゲームなのか分からないゲーム」。
お金を稼いでも、図鑑を埋めても、何もしなくてもいい。たまに何か起きる。知らんけど。

このリポジトリは **PWA（ブラウザで遊べて、ホーム画面に追加できる版）** です。GitHub Actions で **GitHub Pages に自動で公開**します。

- 開発の基本指示書：[`docs/MASTER_PROMPT.md`](docs/MASTER_PROMPT.md)
- 仕様との差異・仮決め（要確認）：[`SPEC_NOTES.md`](SPEC_NOTES.md)

## v1.0 でできること

| 画面 | 内容 |
|---|---|
| タイトル | はじめから／つづきから（セーブがあるときだけ）／設定。データがあるときの「はじめから」は上書き確認 |
| プレイヤー作成 | 名前（12文字まで・空欄不可・見えない文字は除去） |
| ホーム | 名前・所持金・レベル・経験値・今日の知らんけど（1日1回変わる）。人生・探索・ショップは「準備中」 |
| 遊ぶ → 運試し | 100円で1回。結果は先に決まり、演出のあとに表示。確率表あり。広告で無料チケット（開発中のみ仮の広告） |
| 遊ぶ → ぶらぶらする | ランダムイベント（選択肢あり／なし、条件付き、1日10回まで） |
| 持ち物 | アイコン・名前・所持数・説明。使う／売る |
| 図鑑 | イベント図鑑・アイテム図鑑。未発見は「？？？？？」、初発見は NEW! |
| 設定 | BGM・SE・バイブレーション・通知の ON/OFF（保存される）。開発中はデバッグ機能も表示 |

セーブは自動（一時データ＋バックアップ＋破損チェック付き）。くわしくは `SPEC_NOTES.md` の「実装メモ」。

## 開発環境

| 項目 | 内容 |
|---|---|
| 作り方 | Expo SDK 58（React Native 0.88）／TypeScript |
| 必要なもの（パソコン） | Node.js 22 以上 |
| 公開（GitHub Actions） | Ubuntu／Node.js 22 → GitHub Pages |

## パソコンで動かしてみる

```bash
npm install            # 初回だけ
npx expo start         # 起動
```

- **スマホで試す**：スマホに「Expo Go」アプリを入れ、表示された QR コードを読み取ります（パソコンとスマホは同じ Wi-Fi に）。
- **ブラウザで試す**：起動後に `w` キーを押します。
- **テスト**：`npm test`（ゲームの計算・セーブなど 52 件）、`npm run typecheck`（型チェック）

## GitHub Pages で公開する（PWA）

1. GitHub のリポジトリ画面で **Settings → Pages → Source** を **GitHub Actions** にします（初回だけ）。
2. 以降は `main` に push するたびに、型チェック → テスト → ビルド → 公開 が自動で行われます（約3〜5分）。
3. 公開先：`https://<ユーザー名>.github.io/<リポジトリ名>/`
   - 公開先のパスはワークフローが自動で設定します（`app.config.js` の `EXPO_BASE_URL`）。

**スマホのホーム画面に追加する**
- Android（Chrome）：メニュー（︙）→「ホーム画面に追加」または「アプリをインストール」
- iPhone（Safari）：共有ボタン →「ホーム画面に追加」

一度開けば、電波がなくても起動できます（Service Worker：`public/sw.js`）。

**手元で PWA をビルドして確認する**
```bash
npm run build:pwa                  # dist/ に書き出し
npx serve dist                     # http://localhost:3000 で確認（serve は初回に自動で入ります）
```

**データの保存について**
- セーブデータはそのブラウザの中に保存されます。ブラウザの「サイトデータを削除」をすると消えます。
- iPhone の Safari では、ホーム画面に追加せずに7日以上開かないと、データが消されることがあります。
- スマホアプリ版（Google Play）とはデータを共有しません。

## ディレクトリ構成

```
src/
  App.tsx                 画面の一覧とアプリの土台
  config/gameConfig.ts    バランス調整用の設定値（初期所持金・料金・必要経験値など）
  data/                   イベント・アイテム・運試しの確率・今日のメッセージ（データだけ）
  core/                   GameManager（状態・自動セーブ・連打防止）、SaveManager、乱数、ログ、報酬処理
  player/                 プレイヤーデータ・名前チェック・レベル
  currency/               お金の増減（必ずここを通す）
  events/                 ランダムイベント（選択・条件・結果・図鑑登録）
  items/                  アイテム・持ち物・使う／売る
  collection/             図鑑
  minigames/              ミニゲーム（運試し）と「遊ぶ」の一覧
  ads/                    広告（AdManager）
  settings/               設定・振動
  ui/                     画面（screens）と部品（components）、画面切り替え、色
public/                   PWA 用のファイル（manifest・Service Worker・アイコン・HTML のひな形）
scripts/build-pwa.js      PWA の書き出し
.github/workflows/        GitHub Pages への自動公開
__tests__/                 自動テスト（Jest）
assets/                   アイコン・起動画面
docs/MASTER_PROMPT.md     開発の基本指示書
SPEC_NOTES.md             仕様との差異・仮決め
```

**よくある追加のしかた**
- イベントを増やす：`src/data/events.ts` に1件足す（条件・選択肢・結果もデータで書ける）
- アイテムを増やす：`src/data/items.ts` に1件足す
- 確率を変える：`src/data/luckTable.ts` の `weight` を変える（確率表の画面も自動で変わる）
- ミニゲームを増やす：画面を作り、`src/minigames/minigameRegistry.ts` に登録

## 開発ルール

- `docs/MASTER_PROMPT.md` に従います。仕様を変えるときは、理由と案を出して承認をもらってから（`SPEC_NOTES.md` に記録）。
- 小さな単位で作り、コミットを分けます（例：`feat: add shop`、`fix: prevent duplicate reward`）。
- お金は `currencyManager` を通す。ゲームの計算は画面から分けて、テストを書く。
- 作業の最後に `npm run typecheck` と `npm test` を通す。

## 対になるリポジトリ

このゲームには **Google Play 用** と **PWA 用** の2つのリポジトリがあります。
`src/`・`__tests__/`・`assets/`・`docs/`・`SPEC_NOTES.md` は両方で同じです。ゲームの中身を直したら、もう一方にも同じ変更を入れてください（フォルダごと上書きコピーで構いません）。

| | Google Play 用 | PWA 用 |
|---|---|---|
| ビルド | `.github/workflows/build-android.yml`（AAB / APK） | `.github/workflows/deploy-pwa.yml`（GitHub Pages） |
| 専用のファイル | `plugins/withAndroidReleaseSigning.js` | `public/`（manifest・Service Worker・アイコン）、`scripts/build-pwa.js` |

## まだ確認できていないこと

- GitHub Pages 上での公開はまだ行っていません（ブラウザで、サブパス配信・インストール可能・オフライン起動までは確認済み）。
- 実機（Android / iPhone）での動作確認はまだです。
