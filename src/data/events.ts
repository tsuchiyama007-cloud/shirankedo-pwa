import type { EventData } from '../core/types';

/**
 * ランダムイベントの一覧。
 * 新しいイベントは、この配列に1件足すだけで追加できる（id は重複させない）。
 *
 * - weight：発生しやすさ。大きいほど出やすい
 * - conditions：発生条件（省略可）
 * - type 'choice'：選択肢あり（choices）／'auto'：そのまま結果（outcome か outcomes）
 * - moneyDelta：お金の増減（マイナスは支払い。所持金が足りない選択肢は選べない）
 * - specialOnly：運試しの「特殊イベント」からだけ発生する
 */
export const EVENTS: readonly EventData[] = [
  {
    id: 'found_100yen',
    title: '100円を拾った',
    icon: '🪙',
    description: '道端に100円が落ちている。\n\n拾う？',
    weight: 100,
    type: 'choice',
    choices: [
      { label: 'はい', outcome: { message: '100円を手に入れた。', moneyDelta: 100 } },
      { label: 'いいえ', outcome: { message: '見なかったことにした。\nいい人ですね。知らんけど。' } },
    ],
  },
  {
    id: 'vending_machine',
    title: '自動販売機',
    icon: '🥤',
    description: '自動販売機に100円を入れました。\n\n……',
    weight: 80,
    conditions: { minimumMoney: 100 },
    type: 'auto',
    outcome: { message: '商品が出てきません。\n\n知らんけど。', moneyDelta: -100 },
  },
  {
    id: 'cat_eye_contact',
    title: '猫と目が合った',
    icon: '🐈',
    description: '塀の上の猫と目が合った。\n\n猫は何も言わずに去っていった。',
    weight: 90,
    type: 'auto',
    outcome: { message: '何かを学んだ気がする。', experience: 10 },
  },
  {
    id: 'nothing_happened',
    title: '何も起きなかった',
    icon: '🍃',
    description: 'しばらく歩いてみた。',
    weight: 90,
    type: 'auto',
    outcome: { message: '何も起きなかった。\n今日は平和です。知らんけど。' },
  },
  {
    id: 'pigeons',
    title: 'ハトに囲まれた',
    icon: '🕊️',
    description: '気づいたらハトに囲まれていた。\nエサは持っていない。',
    weight: 60,
    type: 'auto',
    outcome: { message: 'ハトたちは静かに解散した。' },
  },
  {
    id: 'found_wallet',
    title: '財布を拾った',
    icon: '👛',
    description: 'ベンチの上に財布が置いてある。',
    weight: 40,
    type: 'choice',
    choices: [
      {
        label: '交番に届ける',
        outcomes: [
          { weight: 70, outcome: { message: '持ち主が見つかり、お礼に1,000円もらった。', moneyDelta: 1000, experience: 30 } },
          { weight: 30, outcome: { message: '「ご協力ありがとうございます」と言われた。\nいい気分だ。', experience: 50 } },
        ],
      },
      { label: 'そのままにする', outcome: { message: 'きっと持ち主が戻ってくる。たぶん。' } },
    ],
  },
  {
    id: 'sudden_rain',
    title: '急な雨',
    icon: '🌧️',
    description: '急に雨が降ってきた。',
    weight: 50,
    type: 'choice',
    choices: [
      { label: '傘を買う（500円）', outcome: { message: 'コンビニで傘を買った。レシートももらった。', moneyDelta: -500, itemId: 'receipt' } },
      { label: '走って帰る', outcome: { message: 'びしょ濡れになった。\nでも少しだけ強くなった気がする。', experience: 20 } },
    ],
  },
  {
    id: 'dropped_wallet',
    title: '財布を落とした',
    icon: '💸',
    description: 'ポケットが軽い。',
    weight: 25,
    conditions: { minimumMoney: 300 },
    type: 'auto',
    outcome: { message: '300円入りの小銭入れを落としたようだ。\n今日のお告げ、当たっていたかもしれない。', moneyDelta: -300 },
  },
  {
    id: 'fortune_teller',
    title: '占い師',
    icon: '🔮',
    description: '「あなたの未来、見えますよ」\n占い師に声をかけられた。',
    weight: 35,
    type: 'choice',
    choices: [
      {
        label: '占ってもらう（500円）',
        outcomes: [
          { weight: 50, outcome: { message: '「あなたは近いうちに、何かをするでしょう」\n\n知らんけど。', moneyDelta: -500, experience: 40 } },
          { weight: 35, outcome: { message: '「これを持っていきなさい」\n四つ葉のクローバーをもらった。', moneyDelta: -500, itemId: 'four_leaf_clover' } },
          { weight: 15, outcome: { message: '「……今日は見えませんね」\nお代は返してくれた。' } },
        ],
      },
      { label: '断る', outcome: { message: '「後悔しますよ」と言われた。\nしないと思う。' } },
    ],
  },
  {
    id: 'lottery_stand',
    title: '宝くじ売り場',
    icon: '🎟️',
    description: '宝くじ売り場の前を通りかかった。\n「当たるかもしれませんよ」',
    weight: 35,
    type: 'choice',
    choices: [
      {
        label: '1枚買う（300円）',
        outcomes: [
          { weight: 90, outcome: { message: '外れた。番号が1つずつずれていた。', moneyDelta: -300, itemId: 'lost_lottery' } },
          { weight: 9, outcome: { message: '3,000円が当たった！', moneyDelta: 2700 } },
          { weight: 1, outcome: { message: '30,000円が当たった！！\n今日の運、使い切ったかもしれない。', moneyDelta: 29700 } },
        ],
      },
      { label: '買わない', outcome: { message: '買わなければ外れない。それも一つの真理。' } },
    ],
  },
  {
    id: 'lost_grandma',
    title: '道を聞かれた',
    icon: '👵',
    description: 'おばあちゃんに駅までの道を聞かれた。',
    weight: 45,
    type: 'choice',
    choices: [
      { label: '案内する', outcome: { message: '「ありがとうねえ」\nお礼に謎のドリンクをもらった。', itemId: 'mystery_drink', experience: 30 } },
      { label: '指で方向を示す', outcome: { message: '「あっちですね」\nたぶん合っている。', experience: 5 } },
    ],
  },
  {
    id: 'shrine_visit',
    title: '神社',
    icon: '⛩️',
    description: '小さな神社を見つけた。',
    weight: 40,
    type: 'choice',
    choices: [
      {
        label: 'お賽銭を入れる（100円）',
        outcomes: [
          { weight: 80, outcome: { message: '手を合わせた。心が少し軽くなった。', moneyDelta: -100, experience: 40 } },
          { weight: 20, outcome: { message: '社務所の人が、だるまをくれた。', moneyDelta: -100, itemId: 'daruma' } },
        ],
      },
      { label: '会釈だけする', outcome: { message: '神様もたぶん会釈を返してくれた。' } },
    ],
  },
  {
    id: 'shiny_thing',
    title: '光るものを見つけた',
    icon: '✨',
    description: '植え込みの中で何かが光っている。',
    weight: 12,
    type: 'auto',
    outcomes: [
      { weight: 60, outcome: { message: '金色のどんぐりだった。\nリスに見つからないうちにしまった。', itemId: 'golden_acorn' } },
      { weight: 40, outcome: { message: 'ただの石だった。光っていたのは気のせいだ。', itemId: 'mysterious_stone' } },
    ],
  },
  {
    id: 'deja_vu',
    title: 'デジャヴ',
    icon: '🌀',
    description: 'この光景、前にも見た気がする。',
    weight: 30,
    conditions: { requiredEvent: 'nothing_happened', minimumPlayCount: 5 },
    type: 'auto',
    outcome: { message: 'たぶん前にも何も起きなかった。\n今回も何も起きない。', experience: 15 },
  },
  {
    id: 'clover_friend',
    title: 'クローバー仲間',
    icon: '🍀',
    description: '「それ、四つ葉ですよね？」\n知らない人に話しかけられた。',
    weight: 30,
    conditions: { requiredItem: 'four_leaf_clover' },
    type: 'auto',
    outcome: { message: 'クローバーの話で30分盛り上がった。', experience: 40 },
  },
  {
    id: 'night_ramen',
    title: '夜のラーメン屋',
    icon: '🍜',
    description: 'いい匂いがする。夜のラーメン屋だ。',
    weight: 50,
    conditions: { timeRange: { startHour: 20, endHour: 2 } },
    type: 'choice',
    choices: [
      { label: '食べる（800円）', outcome: { message: 'うまかった。人生とはラーメンである。知らんけど。', moneyDelta: -800, experience: 60 } },
      { label: '我慢する', outcome: { message: '明日の自分が喜ぶ。たぶん。' } },
    ],
  },
  {
    id: 'morning_exercise',
    title: '朝の体操',
    icon: '🌅',
    description: '公園で朝の体操をしている人たちがいる。',
    weight: 50,
    conditions: { timeRange: { startHour: 5, endHour: 9 } },
    type: 'auto',
    outcome: { message: '途中から参加した。体が少し軽くなった。', experience: 30 },
  },
  {
    id: 'new_year_gift',
    title: 'お年玉',
    icon: '🧧',
    description: '親戚のおじさんが現れた。',
    weight: 200,
    conditions: { dates: ['01-01', '01-02', '01-03'] },
    type: 'auto',
    outcome: { message: 'お年玉をもらった。1,000円。', moneyDelta: 1000 },
  },
  {
    id: 'meteor_shower',
    title: '流れ星',
    icon: '🌠',
    description: '空を見上げたら、流れ星が見えた。',
    weight: 10,
    conditions: { minimumLevel: 3 },
    type: 'choice',
    choices: [
      { label: '願いごとをする', outcome: { message: '言い終わる前に消えた。\nでも足元に古い地図が落ちていた。', itemId: 'old_map' } },
      { label: '見とれる', outcome: { message: 'きれいだった。それで十分だ。', experience: 50 } },
    ],
  },
  // ---- ここから下は、運試しの「特殊イベント」専用 ----
  {
    id: 'mysterious_old_man',
    title: '謎のおじいさん',
    icon: '🧙',
    description: '運試しの箱の中から、おじいさんが出てきた。\n「よく来たな」',
    weight: 50,
    specialOnly: true,
    type: 'choice',
    choices: [
      {
        label: '話を聞く',
        outcomes: [
          { weight: 70, outcome: { message: '「これをやろう」\n招き猫をもらった。', itemId: 'lucky_cat' } },
          { weight: 30, outcome: { message: '「……何の話だったかのう」\n話は終わった。', experience: 80 } },
        ],
      },
      { label: '箱を閉じる', outcome: { message: 'そっと閉じた。何も見なかった。', experience: 10 } },
    ],
  },
  {
    id: 'money_rain',
    title: 'お金の雨',
    icon: '💴',
    description: '空から小銭が降ってきた。',
    weight: 30,
    specialOnly: true,
    type: 'auto',
    outcome: { message: '拾い集めたら3,000円になった。\n誰のお金かは分からない。知らんけど。', moneyDelta: 3000 },
  },
  {
    id: 'falling_star_stone',
    title: '空から何か',
    icon: '☄️',
    description: '「コツン」と頭に何かが当たった。',
    weight: 20,
    specialOnly: true,
    type: 'auto',
    outcomes: [
      { weight: 20, outcome: { message: '小さな隕石だった。\n頭は大丈夫。たぶん。', itemId: 'tiny_meteorite' } },
      { weight: 80, outcome: { message: 'どんぐりだった。上でリスが笑っていた。', experience: 20 } },
    ],
  },
];
