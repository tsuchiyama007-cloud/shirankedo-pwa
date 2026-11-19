import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { usePopup } from '../ui/components/Popup';
import { createNewPlayer } from '../player/playerData';
import { logger } from './logger';
import type { RewardSummary } from './rewards';
import { SaveManager, type LoadResult } from './saveManager';
import type { PlayerData } from './types';

/**
 * ゲーム全体の状態（GameManager）。
 * - プレイヤーデータを持つ
 * - 変更（commit）するたびに自動セーブする
 * - 保存に失敗したら「データを保存できませんでした」を出す（ゲームは止めない）
 * - 重要な処理を1つずつ実行する（runExclusive：連打による二重実行を防ぐ）
 * - アプリがバックグラウンドに回ったら保存する
 */

export const SAVE_FAILED_MESSAGE = 'データを保存できませんでした。\nもう一度試してください。';

type GameApi = {
  ready: boolean;
  player: PlayerData | null;
  /** 起動時の読み込み結果 */
  loadResult: LoadResult | null;
  hasSaveData: boolean;
  /** 実行中の重要な処理があるか（ボタンの無効化に使う） */
  busy: boolean;
  startNewGame(name: string): Promise<boolean>;
  /** つづきから：読み込み済みのデータで再開 */
  continueGame(): boolean;
  /** 起動時の読み込みをやり直す */
  reload(): Promise<void>;
  /** プレイヤーデータを更新して保存する。summary にレベルアップがあれば保存後に知らせる */
  commit(next: PlayerData, summary?: RewardSummary): Promise<boolean>;
  /** レベルアップのお知らせ（結果の表示のあとに出したいときに使う） */
  announceLevelUp(summary: RewardSummary): Promise<void>;
  /** 重要な処理を1つずつ実行する。実行中に呼ばれたら何もしない（undefined を返す） */
  runExclusive<T>(task: () => Promise<T> | T): Promise<T | undefined>;
};

const GameContext = createContext<GameApi | null>(null);

const saveManager = new SaveManager(AsyncStorage);

export function GameProvider({ children }: { children: ReactNode }) {
  const popup = usePopup();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loadResult, setLoadResult] = useState<LoadResult | null>(null);
  const [hasSaveData, setHasSaveData] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const playerRef = useRef<PlayerData | null>(null);

  const setCurrent = useCallback((p: PlayerData | null) => {
    playerRef.current = p;
    setPlayer(p);
  }, []);

  const reload = useCallback(async () => {
    const result = await saveManager.load();
    setLoadResult(result);
    setHasSaveData(result.status === 'ok' || result.status === 'recovered' ? true : await saveManager.hasAnySave());
    logger.info('GameManager', `起動時の読み込み: ${result.status}`);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  /** 保存。失敗したら「もう一度試す」を出し、成功するかプレイヤーが閉じるまで繰り返す */
  const saveWithRetry = useCallback(
    async (p: PlayerData): Promise<boolean> => {
      for (;;) {
        const result = await saveManager.save(p);
        if (result.ok) return true;
        const choice = await popup.showPopup<'retry' | 'close'>({
          icon: '💾',
          message: SAVE_FAILED_MESSAGE,
          buttons: [
            { label: 'もう一度試す', value: 'retry', variant: 'primary' },
            { label: 'あとで', value: 'close', variant: 'plain' },
          ],
        });
        if (choice === 'close') return false;
        // 再試行時は最新の状態を保存する
        p = playerRef.current ?? p;
      }
    },
    [popup],
  );

  const announceLevelUp = useCallback(
    async (summary: RewardSummary) => {
      const level = playerRef.current?.level;
      if (summary.levelsGained <= 0 || !level) return;
      await popup.showPopup({ icon: '🎉', title: 'レベルアップ！', message: `Lv.${level} になりました。\n\nたぶん強くなりました。知らんけど。` });
    },
    [popup],
  );

  const commit = useCallback(
    async (next: PlayerData, summary?: RewardSummary) => {
      setCurrent(next);
      const saved = await saveWithRetry(next);
      if (saved) setHasSaveData(true);
      if (summary) await announceLevelUp(summary);
      return saved;
    },
    [announceLevelUp, saveWithRetry, setCurrent],
  );

  const runExclusive = useCallback(async <T,>(task: () => Promise<T> | T) => {
    if (busyRef.current) return undefined;
    busyRef.current = true;
    setBusy(true);
    try {
      return await task();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  const startNewGame = useCallback(
    async (name: string) => {
      const p = createNewPlayer(name);
      return commit(p);
    },
    [commit],
  );

  const continueGame = useCallback(() => {
    if (loadResult && (loadResult.status === 'ok' || loadResult.status === 'recovered')) {
      setCurrent(loadResult.player);
      return true;
    }
    return false;
  }, [loadResult, setCurrent]);

  // アプリが中断（ホーム画面へ・着信・画面OFF）されたら、念のため保存する
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        const p = playerRef.current;
        if (p) saveManager.save(p);
      }
    });
    return () => sub.remove();
  }, []);

  const api = useMemo<GameApi>(
    () => ({
      ready: loadResult !== null,
      player,
      loadResult,
      hasSaveData,
      busy,
      startNewGame,
      continueGame,
      reload,
      commit,
      announceLevelUp,
      runExclusive,
    }),
    [loadResult, player, hasSaveData, busy, startNewGame, continueGame, reload, commit, announceLevelUp, runExclusive],
  );

  return <GameContext.Provider value={api}>{children}</GameContext.Provider>;
}

export function useGame(): GameApi {
  const api = useContext(GameContext);
  if (!api) throw new Error('GameProvider の外で useGame が呼ばれました');
  return api;
}

/** プレイヤーデータがある前提の画面で使う */
export function usePlayer(): PlayerData {
  const { player } = useGame();
  if (!player) throw new Error('プレイヤーデータがありません');
  return player;
}
