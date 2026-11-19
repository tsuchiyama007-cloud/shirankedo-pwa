# SPEC_NOTES（仕様との差異・仮決めの記録）

`docs/MASTER_PROMPT.md`（開発の基本指示書）から変えた点と、指示書に書かれていないため仮に決めた点を記録します。
MASTER_PROMPT 4.1 に従い、仮決めの項目は承認をいただくまで「要確認」としています。

> `GAME_SPEC.md`（ゲーム仕様の詳細）はまだ受け取っていません。受け取りしだい、この実装と照らし合わせます。

---

## 承認済みの変更

### CHG-001 ゲームエンジン：Unity → Expo（React Native / TypeScript）（2026-11-19 承認）
- **理由**：これまでのアプリと同じ構成で、Google Play 用（AAB/APK）と PWA（ブラウザ版）の両方を、同じゲームのコードから GitHub Actions で作るため。
- **影響**：MASTER_PROMPT 3章（Unity / C#）、6〜7章（Assets フォルダ・C# スクリプト構成）、72章（README の Unity バージョン）。
- **対応表**（MASTER_PROMPT 7章のクラス → このプロジェクトのファイル）

| 指示書のクラス | このプロジェクト |
|---|---|
| GameManager / GameState | `src/core/GameManager.tsx`（状態・自動セーブ・連打防止）、`src/core/types.ts` |
| SaveManager | `src/core/saveManager.ts` |
| SceneManager | `src/ui/navigation.tsx`（画面の切り替え） |
| PlayerData / PlayerManager | `src/player/playerData.ts` |
| PlayerLevelSystem | `src/player/playerLevelSystem.ts` |
| CurrencyManager | `src/currency/currencyManager.ts`（`addMoney` / `spendMoney` / `canAfford`） |
| EventManager / RandomEvent / EventResult | `src/events/eventManager.ts`、データは `src/data/events.ts` |
| ItemData / ItemManager / InventoryManager | `src/core/types.ts`、`src/items/itemManager.ts`、`src/items/inventoryManager.ts`、`src/items/itemActions.ts`、データは `src/data/items.ts` |
| EventCollectionManager / ItemCollectionManager | `src/collection/collectionManager.ts` |
| MinigameBase / LuckGameManager | `src/minigames/minigameBase.ts`、`src/minigames/minigameRegistry.ts`、`src/minigames/luckGame.ts` |
| UIManager / HomeUI / ResultUI / PopupUI | `src/ui/screens/*`、`src/ui/components/*`（`Popup.tsx` など） |
| SettingsManager | `src/settings/settingsManager.ts` |
| AdManager | `src/ads/adManager.ts` |

### CHG-002 Google Play 用と PWA 用を別リポジトリに分ける（2026-11-19 承認）
- ゲームの中身（`src/`・`__tests__/`・`assets/`）は両方のリポジトリで同じです。片方を直したら、もう片方にも同じ変更を入れてください。
- 違うのはビルドの設定だけです（Google Play 用：`plugins/`・`build-android.yml`／PWA 用：`public/`・`scripts/build-pwa.js`・`deploy-pwa.yml`）。
- セーブデータは、スマホアプリ版とブラウザ版で共有されません。

---

## 仮決め（要確認）

| No | 項目 | 仮に決めた内容 | 変更する場所 |
|---|---|---|---|
| Q-01 | ランダムイベントの入口 | v1.0 では「探索」が準備中のため、「遊ぶ」に「ぶらぶらする」を追加し、そこから発生させる。運試しの「特殊イベント」からも発生する | `src/minigames/minigameRegistry.ts` |
| Q-02 | ランダムイベントの回数 | 1日10回まで（何度でも引き直せると「100円を拾った」で無限に稼げるため） | `GAME_CONFIG.randomEventDailyLimit`（0で無制限） |
| Q-03 | 経験値の獲得量 | 運試し 10、イベント 20、図鑑の初登録 +30、アイテムごとの使用効果 | `GAME_CONFIG.experience`、`src/data/items.ts` |
| Q-04 | レベル表の読み方 | 「Level 1 → 100 XP」を「レベル1から2に上がるのに100」と解釈。余りは次のレベルに繰り越し。表より上は最後の増え幅で伸ばす。上限 Lv.99 | `LEVEL_UP_EXPERIENCE`、`MAX_LEVEL` |
| Q-05 | 運試しの確率 | 何も起きない35%、10円20%、50円15%、100円12%、500円3%、1,000円1.5%、1万円0.2%、10万円0.02%、100万円0.002%、アイテム11%、特殊イベント約2.3%（1回あたりの平均は約112円＋アイテム） | `src/data/luckTable.ts` |
| Q-06 | 運試しの保存タイミング | 支払い・抽選・報酬・図鑑登録をまとめて決め、**演出の前に保存**する（演出中にアプリを閉じても、二重取り・支払いだけ・結果の引き直しが起きない）。画面上の順番（確認→消費→演出→結果→報酬→NEW!）は指示書どおり。演出中は抽選前の所持金を表示する | `src/minigames/luckGame.ts`、`LuckGameScreen.tsx` |
| Q-07 | リワード広告 | 「広告を見る → 運試しを追加で1回」を「無料チケットを1枚もらう」とした。広告SDKは未導入（開発中は仮の広告、リリース版ではボタンを出さない）。AdMob などは `RewardedAdProvider` を作って差し替える | `src/ads/adManager.ts` |
| Q-08 | BGM・効果音・通知 | 設定の ON/OFF は保存するが、音源と通知機能はまだない（音源はライセンスを確認したものを用意してから追加） | `src/settings/feedback.ts` |
| Q-09 | 「はじめから」でデータがあるとき | 上書きしてよいか確認する。上書き前のデータは、バックアップに1つ前の分が残る | `TitleScreen.tsx` |
| Q-10 | プレイヤー名 | 12文字は見た目の文字数（絵文字も1文字）。前後の空白・改行・見えない文字は取り除く | `validatePlayerName` |
| Q-11 | ホームの「設定」ボタン | 6つのボタンの下に横長で配置 | `HomeScreen.tsx` |
| Q-12 | イベント・アイテムの内容 | イベント22種類（うち特殊イベント3種類）、アイテム11種類を仮に作成。GAME_SPEC.md を受け取ったら差し替え | `src/data/events.ts`、`src/data/items.ts` |

---

## 実装メモ

### セーブ（MASTER_PROMPT 30〜33）
- 保存先：スマホアプリ版は端末内（AsyncStorage）、ブラウザ版はそのブラウザ内（localStorage）。
- 保存の手順：一時データに書く → 読み戻して確認 → 今のデータをバックアップへ → 本体を書き換え → 一時データを消す。
- データには検査値（チェックサム）を付け、壊れていたら使わない。
- 読み込み：本体 → バックアップ → 一時データの順に確認。復旧できたら通知。どれも読めないときは通知するだけで、データは消さない（壊れた本体も別名で残す）。
- 保存に失敗したら「データを保存できませんでした。もう一度試してください。」を出し、「もう一度試す」で再保存できる。
- アプリがバックグラウンドに回ったときも保存する。

### 連打・中断対策（MASTER_PROMPT 40〜42）
- 重要な処理は `runExclusive` で1つずつ実行し、実行中はボタンを無効にする。
- 画面遷移は短時間の連打を無視する。イベントの選択中と運試しの演出中は「戻る」を無効にする。
- ゲームの計算はすべて「元のデータを書き換えず、新しいデータを返す」形にしている（途中で失敗しても半端な状態にならない）。

### ブラウザ版（PWA）の注意
- データはそのブラウザの中にだけ保存されます。ブラウザの「サイトデータの削除」をすると消えます。
- iPhone の Safari では、ホーム画面に追加せずに7日以上開かないと、データが消されることがあります。ホーム画面に追加して遊ぶことをおすすめします。
