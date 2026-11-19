// app.json の設定に、ビルド環境ごとの値を加える。
// - EXPO_BASE_URL：GitHub Pages（https://<ユーザー名>.github.io/<リポジトリ名>/）で公開するときのパス
//   （PWA 用リポジトリの .github/workflows/deploy-pwa.yml が自動で設定）
// - ANDROID_VERSION_CODE：Android の通し番号（versionCode）。Google Play には毎回大きい番号で出す必要がある
//   （Google Play 用リポジトリの .github/workflows/build-android.yml が自動で設定）
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    ...(process.env.ANDROID_VERSION_CODE ? { versionCode: Number(process.env.ANDROID_VERSION_CODE) } : {}),
  },
  experiments: {
    ...config.experiments,
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
  },
});
