import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameProvider, useGame } from './core/GameManager';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import { PopupProvider } from './ui/components/Popup';
import { NavigationProvider, useNavigation, type ScreenName } from './ui/navigation';
import { CollectionScreen } from './ui/screens/CollectionScreen';
import { HomeScreen } from './ui/screens/HomeScreen';
import { InventoryScreen } from './ui/screens/InventoryScreen';
import { LuckGameScreen } from './ui/screens/LuckGameScreen';
import { LuckOddsScreen } from './ui/screens/LuckOddsScreen';
import { PlayerCreateScreen } from './ui/screens/PlayerCreateScreen';
import { PlayScreen } from './ui/screens/PlayScreen';
import { RandomEventScreen } from './ui/screens/RandomEventScreen';
import { SettingsScreen } from './ui/screens/SettingsScreen';
import { TitleScreen } from './ui/screens/TitleScreen';
import { registerServiceWorker } from './web/registerServiceWorker';

/** 画面名と画面の対応表。新しい画面はここに追加する */
const SCREENS: Record<ScreenName, () => React.JSX.Element> = {
  Title: TitleScreen,
  PlayerCreate: PlayerCreateScreen,
  Home: HomeScreen,
  Play: PlayScreen,
  LuckGame: LuckGameScreen,
  LuckOdds: LuckOddsScreen,
  RandomEvent: RandomEventScreen,
  Inventory: InventoryScreen,
  Collection: CollectionScreen,
  Settings: SettingsScreen,
};

/** プレイヤーデータが必要な画面 */
const NEEDS_PLAYER: ScreenName[] = ['Home', 'Play', 'LuckGame', 'RandomEvent', 'Inventory', 'Collection'];

if (Platform.OS === 'web') registerServiceWorker();

function CurrentScreen() {
  const nav = useNavigation();
  const game = useGame();
  const [errorKey, setErrorKey] = useState(0);
  const route = nav.current;
  // データがないのにゲーム画面が開かれた場合はタイトルへ（クラッシュさせない）
  const name: ScreenName = NEEDS_PLAYER.includes(route.name) && !game.player ? 'Title' : route.name;
  const ScreenComponent = SCREENS[name];
  return (
    <ErrorBoundary
      key={errorKey}
      onRetry={() => {
        setErrorKey((k) => k + 1);
        nav.reset(game.player ? 'Home' : 'Title');
      }}
    >
      <ScreenComponent key={route.key} />
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <PopupProvider>
        <GameProvider>
          <NavigationProvider initial="Title">
            <CurrentScreen />
          </NavigationProvider>
        </GameProvider>
      </PopupProvider>
    </SafeAreaProvider>
  );
}
