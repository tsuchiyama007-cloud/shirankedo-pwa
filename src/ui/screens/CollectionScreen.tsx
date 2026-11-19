import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { findDiscovery } from '../../collection/collectionManager';
import { formatDateTime } from '../../core/dateUtil';
import { usePlayer } from '../../core/GameManager';
import { RARITY_LABEL } from '../../data/items';
import { getAllEvents } from '../../events/eventManager';
import { getAllItems } from '../../items/itemManager';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { COLORS, FONT, MIN_TOUCH, SPACE, STICKER } from '../theme';

const UNKNOWN = '？？？？？';

type Tab = 'events' | 'items';

type Entry = { id: string; icon: string; name: string; description: string; sub?: string };

/** 図鑑（イベント図鑑・アイテム図鑑）。未発見は「？？？？？」 */
export function CollectionScreen() {
  const player = usePlayer();
  const [tab, setTab] = useState<Tab>('events');

  const entries: Entry[] =
    tab === 'events'
      ? getAllEvents().map((e) => ({ id: e.id, icon: e.icon, name: e.title, description: e.description.split('\n')[0], sub: e.specialOnly ? '特殊イベント' : undefined }))
      : getAllItems().map((i) => ({ id: i.id, icon: i.icon, name: i.name, description: i.description, sub: RARITY_LABEL[i.rarity] }));
  const records = tab === 'events' ? player.discoveredEvents : player.discoveredItems;
  const found = entries.filter((e) => findDiscovery(records, e.id)).length;

  return (
    <Screen title="図鑑">
      <View style={styles.tabs}>
        {(['events', 'items'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
            testID={`tab-${t}`}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'events' ? 'イベント図鑑' : 'アイテム図鑑'}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.progress} testID="collection-progress">
        発見 {found} / {entries.length}
      </Text>

      {entries.map((e, index) => {
        const record = findDiscovery(records, e.id);
        return (
          <Card key={e.id} style={[styles.row, !record && styles.locked]}>
            <Text style={styles.no}>No.{String(index + 1).padStart(3, '0')}</Text>
            <View style={styles.body}>
              <Text style={styles.icon}>{record ? e.icon : '❔'}</Text>
              <View style={styles.texts}>
                <Text style={styles.name}>{record ? e.name : UNKNOWN}</Text>
                {record ? (
                  <>
                    {e.sub ? <Text style={styles.sub}>{e.sub}</Text> : null}
                    <Text style={styles.desc}>{e.description}</Text>
                    <Text style={styles.date}>発見：{formatDateTime(record.discoveredAt)}</Text>
                  </>
                ) : null}
              </View>
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: SPACE.s },
  tab: { ...STICKER, flex: 1, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.card },
  tabActive: { backgroundColor: COLORS.ink },
  tabText: { fontSize: FONT.body, fontWeight: '800', color: COLORS.ink },
  tabTextActive: { color: COLORS.accent },
  progress: { textAlign: 'right', color: COLORS.subInk, fontWeight: '700' },
  row: { gap: 4 },
  locked: { backgroundColor: '#F4EEE5' },
  no: { fontSize: FONT.small, color: COLORS.subInk, fontWeight: '700' },
  body: { flexDirection: 'row', gap: SPACE.m, alignItems: 'center' },
  icon: { fontSize: 36, width: 48, textAlign: 'center' },
  texts: { flex: 1, gap: 2 },
  name: { fontSize: FONT.large, fontWeight: '800', color: COLORS.ink },
  sub: { fontSize: FONT.small, color: COLORS.primaryDark, fontWeight: '800' },
  desc: { fontSize: FONT.small, color: COLORS.ink },
  date: { fontSize: FONT.small, color: COLORS.subInk },
});
