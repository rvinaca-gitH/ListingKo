import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Product } from '@listingko/shared-types';
import { apiClient } from '../../lib/api-client';

const palette = {
    ink: '#13224B',
    muted: '#64708D',
    orange: '#FF671D',
    blue: '#1683F5',
    green: '#17A673',
    paper: '#F8FAFD',
    white: '#FFFFFF',
    line: '#E5EAF2',
};

const channels = [
    ['S', 'Shopee', '#FFF0EA', '#F45124'],
    ['L', 'Lazada', '#F0EEFF', '#4D3CE8'],
    ['♪', 'TikTok Shop', '#EEF7F8', '#101A2E'],
    ['f', 'Facebook', '#EAF3FF', '#1877F2'],
];

const shortcuts = [
    ['✦', 'AI Image Studio', '#FFF0E7'],
    ['⌕', 'SEO & Keywords', '#F2EEFF'],
    ['▤', 'Templates', '#EAF3FF'],
    ['↥', 'Bulk Upload', '#EAFBF3'],
    ['▥', 'Product Research', '#FFF5E6'],
    ['◎', 'Competitor Insights', '#FFF0F2'],
];

export default function HomeScreen() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        void loadProducts();
    }, []);

    async function loadProducts() {
        try {
            setLoading(true);
            const response = await apiClient.getProducts();
            setProducts(response.data?.items || []);
        } catch (error) {
            console.error('Error loading products:', error);
            Alert.alert('Unable to load products', 'Check your connection and try again.');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <View style={styles.loading}><ActivityIndicator size="large" color={palette.orange} /><Text style={styles.loadingText}>Preparing your launch desk...</Text></View>;
    }

    const readyCount = products.filter((product) => product.status === 'READY').length;
    const readiness = products.length > 0 ? 78 : 0;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={palette.paper} />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Header />
                <View style={styles.hero}>
                    <View style={styles.heroCopy}>
                        <Text style={styles.eyebrow}>GOOD MORNING</Text>
                        <Text style={styles.heroTitle}>Turn products{'\n'}into momentum.</Text>
                        <Text style={styles.heroBody}>Build ready-to-sell listings{'\n'}without starting from scratch.</Text>
                    </View>
                    <View style={styles.heroObject}><Text style={styles.heroObjectIcon}>▣</Text><Text style={styles.heroObjectText}>Your next{'\n'}launch starts here</Text></View>
                </View>

                <SectionHeader title="One product. Endless possibilities." link="See all ›" />
                <View style={styles.channels}>{channels.map(([icon, label, tint, color]) => <View key={label} style={styles.channel}><View style={[styles.channelIcon, { backgroundColor: tint }]}><Text style={[styles.channelIconText, { color }]}>{icon}</Text></View><Text style={styles.channelLabel}>{label}</Text></View>)}</View>

                <Pressable style={styles.primary} onPress={() => router.push('/screens/new-product')}><Text style={styles.primaryIcon}>✦</Text><View style={styles.primaryCopy}><Text style={styles.primaryTitle}>Create New Listing</Text><Text style={styles.primaryBody}>Upload photos, enter product info, or{'\n'}let AI do the rest.</Text></View><Text style={styles.primaryArrow}>›</Text></Pressable>

                <View style={styles.stats}>{[
                    ['▣', String(products.length), 'Total Products', '#FFF5E8', palette.orange],
                    ['✓', String(readyCount), 'Ready to Export', '#EAF4FF', palette.blue],
                    ['▤', String(products.length - readyCount), 'Drafts', '#FFF0F2', '#E94763'],
                    ['▥', '₱0', 'Est. Potential Sales', '#EAFBF3', palette.green],
                ].map(([icon, value, label, tint, color]) => <View key={label} style={styles.stat}><View style={[styles.statIcon, { backgroundColor: tint }]}><Text style={[styles.statIconText, { color }]}>{icon}</Text></View><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text><Text style={[styles.statArrow, { color }]}>›</Text></View>)}</View>

                <SectionHeader title="Recent Products" link="See all ›" />
                <View style={styles.panel}>{products.length ? products.slice(0, 5).map((product) => <ProductRow key={product.id} product={product} onPress={() => router.push(`/screens/product/${product.id}`)} />) : <EmptyProducts />}</View>

                <View style={styles.panel}><SectionHeader title="Your Progress" link="View goals ›" /><View style={styles.progress}><View style={styles.ring}><Text style={styles.ringValue}>{readiness}%</Text><Text style={styles.ringLabel}>Listing readiness</Text></View><View style={styles.checklist}><Check done={products.length > 0} label="Complete product details" /><Check done={products.length > 0} label="Add at least 5 photos" /><Check done={false} label="Include dimensions" /><Check done={products.length > 0} label="Optimize SEO keywords" /></View></View></View>

                <View style={styles.panel}><SectionHeader title="Tips for Success" link="See all ›" /><View style={styles.tip}><Text style={styles.tipIcon}>☀</Text><View style={styles.tipCopy}><Text style={styles.tipTitle}>Better photos, more sales!</Text><Text style={styles.tipBody}>Try our AI Image Studio to create professional product photos in seconds.</Text></View><Text style={styles.more}>›</Text></View></View>

                <View style={styles.shortcuts}>{shortcuts.map(([icon, label, tint]) => <View key={label} style={styles.shortcut}><View style={[styles.shortcutIcon, { backgroundColor: tint }]}><Text style={styles.shortcutGlyph}>{icon}</Text></View><Text style={styles.shortcutLabel}>{label}</Text></View>)}</View>
                <View style={styles.upgrade}><Text style={styles.crown}>♛</Text><View style={styles.upgradeCopy}><Text style={styles.upgradeTitle}>Upgrade to Pro</Text><Text style={styles.upgradeBody}>Unlock more features{'\n'}and higher limits.</Text></View><Pressable style={styles.upgradeButton}><Text style={styles.upgradeButtonText}>Upgrade Now ›</Text></Pressable></View>
            </ScrollView>
            <View style={styles.nav}>{[['⌂', 'Home'], ['□', 'Products'], ['✦', 'Create AI'], ['▧', 'Assets'], ['•••', 'More']].map(([icon, label], index) => <View key={label} style={styles.navItem}><Text style={[styles.navIcon, index === 0 && styles.active]}>{icon}</Text><Text style={[styles.navLabel, index === 0 && styles.active]}>{label}</Text></View>)}</View>
        </View>
    );
}

function Header() {
    return <View style={styles.header}><View style={styles.logo}><Text style={styles.logoText}>◆</Text></View><View style={styles.brand}><Text style={styles.brandName}>Listing<Text style={styles.brandAccent}>Ko</Text></Text><Text style={styles.tagline}>Create once. Sell everywhere.</Text></View><Text style={styles.bell}>♧</Text><View style={styles.avatar}><Text style={styles.avatarText}>RA</Text></View></View>;
}

function SectionHeader({ title, link }: { title: string; link: string }) {
    return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.link}>{link}</Text></View>;
}

function ProductRow({ product, onPress }: { product: Product; onPress: () => void }) {
    return <Pressable style={styles.productRow} onPress={onPress}><View style={styles.productThumb}><Text style={styles.productThumbText}>{product.title.slice(0, 1).toUpperCase()}</Text></View><View style={styles.productCopy}><Text style={styles.productName} numberOfLines={1}>{product.title}</Text><Text style={styles.productSku}>SKU: LK-{product.id.slice(0, 6).toUpperCase()}</Text></View><View style={styles.ready}><View style={styles.readyDot} /><Text style={styles.readyText}>{product.status === 'READY' ? 'Ready' : 'Draft'}</Text></View><Text style={styles.more}>⋮</Text></Pressable>;
}

function EmptyProducts() {
    return <View style={styles.empty}><Text style={styles.emptyIcon}>□</Text><Text style={styles.emptyTitle}>Your product shelf is waiting</Text><Text style={styles.emptyBody}>Create your first listing and turn one product into a launch package.</Text></View>;
}

function Check({ done, label }: { done: boolean; label: string }) {
    return <View style={styles.check}><View style={[styles.checkCircle, done ? styles.checkDone : styles.checkPending]}><Text style={styles.checkText}>{done ? '✓' : ''}</Text></View><Text style={styles.checkLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.paper },
    content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 104 },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.paper },
    loadingText: { color: palette.muted, marginTop: 12, fontSize: 13 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
    logo: { width: 34, height: 34, borderRadius: 10, backgroundColor: palette.orange, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-18deg' }] },
    logoText: { color: palette.white, fontSize: 20, transform: [{ rotate: '18deg' }] },
    brand: { flex: 1, marginLeft: 8 },
    brandName: { color: palette.ink, fontSize: 21, fontWeight: '800' },
    brandAccent: { color: palette.orange },
    tagline: { color: palette.muted, fontSize: 8 },
    bell: { color: palette.ink, fontSize: 25, marginRight: 12 },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: palette.ink, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: palette.white, fontWeight: '700', fontSize: 12 },
    hero: { minHeight: 160, borderRadius: 18, backgroundColor: '#EDF5FF', padding: 18, flexDirection: 'row', overflow: 'hidden', marginBottom: 20 },
    heroCopy: { flex: 1 },
    eyebrow: { color: palette.blue, fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginBottom: 6 },
    heroTitle: { color: palette.ink, fontSize: 24, lineHeight: 27, fontWeight: '800' },
    heroBody: { color: palette.muted, fontSize: 12, lineHeight: 17, marginTop: 10 },
    heroObject: { width: 112, height: 122, marginBottom: -4, alignSelf: 'flex-end', borderRadius: 14, backgroundColor: '#FFD2B5', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '4deg' }] },
    heroObjectIcon: { color: palette.orange, fontSize: 40 },
    heroObjectText: { color: palette.ink, textAlign: 'center', fontWeight: '800', fontSize: 11, lineHeight: 14 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { color: palette.ink, fontWeight: '800', fontSize: 15 },
    link: { color: palette.blue, fontSize: 12, fontWeight: '600' },
    channels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
    channel: { alignItems: 'center', width: '24%' },
    channelIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
    channelIconText: { fontSize: 27, fontWeight: '800' },
    channelLabel: { color: palette.ink, fontSize: 10, fontWeight: '600' },
    primary: { minHeight: 82, borderRadius: 16, padding: 14, backgroundColor: palette.orange, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    primaryIcon: { color: palette.white, fontSize: 33, width: 43, textAlign: 'center' },
    primaryCopy: { flex: 1, marginLeft: 12 },
    primaryTitle: { color: palette.white, fontSize: 18, fontWeight: '800' },
    primaryBody: { color: '#FFF4EC', fontSize: 11, lineHeight: 14, marginTop: 2 },
    primaryArrow: { color: palette.white, fontSize: 32 },
    stats: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
    stat: { width: '48.5%', minHeight: 104, padding: 12, borderRadius: 14, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.line, marginBottom: 9 },
    statIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
    statIconText: { fontSize: 17, fontWeight: '800' },
    statValue: { color: palette.ink, fontSize: 20, fontWeight: '800' },
    statLabel: { color: palette.muted, fontSize: 10, marginTop: 2 },
    statArrow: { position: 'absolute', right: 12, bottom: 12, fontSize: 23 },
    panel: { padding: 14, borderRadius: 16, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.line, marginBottom: 18 },
    productRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F2F6' },
    productThumb: { width: 44, height: 44, borderRadius: 11, backgroundColor: '#EFF3F8', alignItems: 'center', justifyContent: 'center' },
    productThumbText: { color: palette.blue, fontSize: 19, fontWeight: '800' },
    productCopy: { flex: 1, marginLeft: 10, marginRight: 5 },
    productName: { color: palette.ink, fontWeight: '700', fontSize: 12 },
    productSku: { color: palette.muted, fontSize: 10, marginTop: 4 },
    ready: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: '#E9F8F0' },
    readyDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.green, marginRight: 4 },
    readyText: { color: palette.green, fontSize: 10, fontWeight: '700' },
    more: { color: palette.muted, fontSize: 22, marginLeft: 8 },
    empty: { alignItems: 'center', padding: 18 },
    emptyIcon: { color: palette.orange, fontSize: 34 },
    emptyTitle: { color: palette.ink, fontWeight: '800', fontSize: 14, marginTop: 7 },
    emptyBody: { color: palette.muted, fontSize: 12, textAlign: 'center', lineHeight: 17, marginTop: 5 },
    progress: { flexDirection: 'row', alignItems: 'center' },
    ring: { width: 112, height: 112, borderRadius: 56, borderWidth: 9, borderColor: '#E3EAF2', borderTopColor: palette.orange, borderRightColor: palette.orange, alignItems: 'center', justifyContent: 'center' },
    ringValue: { color: palette.ink, fontSize: 22, fontWeight: '800' },
    ringLabel: { color: palette.muted, fontSize: 9, marginTop: 2 },
    checklist: { flex: 1, marginLeft: 18, gap: 10 },
    check: { flexDirection: 'row', alignItems: 'center' },
    checkCircle: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginRight: 7 },
    checkDone: { backgroundColor: palette.green },
    checkPending: { backgroundColor: '#E5EAF0' },
    checkText: { color: palette.white, fontSize: 11, fontWeight: '800' },
    checkLabel: { flex: 1, color: palette.ink, fontSize: 10 },
    tip: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 12, backgroundColor: '#FFF8EB' },
    tipIcon: { color: palette.orange, fontSize: 28, marginRight: 10 },
    tipCopy: { flex: 1 },
    tipTitle: { color: palette.ink, fontWeight: '800', fontSize: 12 },
    tipBody: { color: palette.muted, fontSize: 10, lineHeight: 14, marginTop: 3 },
    shortcuts: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 8 },
    shortcut: { width: '31.5%', alignItems: 'center', marginBottom: 16 },
    shortcutIcon: { width: 48, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
    shortcutGlyph: { color: palette.blue, fontSize: 24, fontWeight: '700' },
    shortcutLabel: { color: palette.ink, fontSize: 9, textAlign: 'center', lineHeight: 12 },
    upgrade: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, backgroundColor: '#FFF6E9', borderWidth: 1, borderColor: '#FFE6BE' },
    crown: { color: '#F39A13', fontSize: 29, marginHorizontal: 5 },
    upgradeCopy: { flex: 1, marginLeft: 8 },
    upgradeTitle: { color: palette.ink, fontWeight: '800', fontSize: 13 },
    upgradeBody: { color: palette.muted, fontSize: 10, lineHeight: 13, marginTop: 2 },
    upgradeButton: { paddingVertical: 10, paddingHorizontal: 11, borderRadius: 10, backgroundColor: palette.orange },
    upgradeButtonText: { color: palette.white, fontSize: 10, fontWeight: '800' },
    nav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 78, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: palette.white, borderTopWidth: 1, borderTopColor: palette.line },
    navItem: { minWidth: 52, alignItems: 'center' },
    navIcon: { height: 27, color: palette.muted, fontSize: 22 },
    navLabel: { color: palette.muted, fontSize: 9 },
    active: { color: palette.orange },
});
