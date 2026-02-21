/**
 * Firebase → Supabase Migration Script
 *
 * Usage:
 *   node scripts/migrate-firebase-to-supabase.mjs
 *
 * Requirements:
 *   npm install firebase-admin @supabase/supabase-js --save-dev
 *   Place firebase-service-account.json in project root
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { randomUUID } from 'crypto'

// Map Firebase string IDs → stable UUIDs so re-runs produce same IDs
const idMap = new Map()
function toUUID(firebaseId) {
    if (!firebaseId) return randomUUID()
    // If already a valid UUID, keep it
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(firebaseId)) return firebaseId
    if (!idMap.has(firebaseId)) idMap.set(firebaseId, randomUUID())
    return idMap.get(firebaseId)
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL     = 'https://vaufsliuydntwtygavag.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY // paste service_role key here or set env var

if (!SUPABASE_SERVICE_KEY) {
    console.error('❌  Set SUPABASE_SERVICE_KEY env var to your service_role secret key')
    console.error('    (Supabase → Project Settings → API → service_role secret)')
    process.exit(1)
}

// ── Init Firebase Admin ───────────────────────────────────────────────────────
const serviceAccount = JSON.parse(
    readFileSync(join(ROOT, 'firebase-service-account.json'), 'utf8')
)
initializeApp({ credential: cert(serviceAccount) })
const firestore = getFirestore()

// ── Init Supabase (service role — bypasses RLS) ───────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ── Helpers ───────────────────────────────────────────────────────────────────
function toISO(val) {
    if (!val) return null
    if (val?.toDate) return val.toDate().toISOString()       // Firestore Timestamp
    if (val instanceof Date) return val.toISOString()
    if (typeof val === 'string') return val
    return null
}

function chunk(arr, size) {
    const chunks = []
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
    return chunks
}

async function upsert(table, rows) {
    if (!rows.length) return
    for (const batch of chunk(rows, 50)) {
        const { error } = await supabase.from(table).upsert(batch, { onConflict: 'id' })
        if (error) console.error(`  ⚠️  ${table} upsert error:`, error.message)
    }
}

// ── Migrate posts ─────────────────────────────────────────────────────────────
async function migratePosts() {
    console.log('\n📄 Migrating posts...')
    const snap = await firestore.collection('posts').get()
    console.log(`  Found ${snap.size} posts`)

    const rows = snap.docs.map(doc => {
        const d = doc.data()
        return {
            id:                   toUUID(doc.id),
            title:                d.title        ?? '',
            slug:                 d.slug         ?? doc.id,
            content:              d.content      ?? '',
            excerpt:              d.excerpt      ?? d.description ?? '',
            featured_image:       d.featuredImage ?? d.featured_image ?? null,
            category:             d.category     ?? null,
            tags:                 d.tags         ?? [],
            difficulty:           d.difficulty   ?? 'beginner',
            status:               d.status       ?? 'published',
            type:                 d.type         ?? 'article',
            source_url:           d.sourceUrl    ?? d.source_url ?? null,
            ai_generated:         d.aiGenerated  ?? false,
            project_link:         d.projectLink  ?? null,
            investment_required:  d.investmentRequired ?? false,
            author:               d.author       ?? {},
            views:                d.views        ?? 0,
            published_at:         toISO(d.publishedAt ?? d.createdAt),
            created_at:           toISO(d.createdAt)  ?? new Date().toISOString(),
            updated_at:           toISO(d.updatedAt)  ?? new Date().toISOString(),
        }
    })

    await upsert('posts', rows)
    console.log(`  ✅ ${rows.length} posts migrated`)
}

// ── Migrate users → user_profiles ─────────────────────────────────────────────
async function migrateUsers() {
    console.log('\n👤 Migrating users...')
    const snap = await firestore.collection('users').get()
    console.log(`  Found ${snap.size} users`)

    // NOTE: We cannot create auth.users rows via Supabase client.
    // This migrates profile data only — auth accounts must be recreated by users logging in.
    // We store the firebase UID as a reference but the actual Supabase UUID will be different.

    const rows = snap.docs.map(doc => {
        const d = doc.data()
        return {
            firebase_uid:    doc.id,
            email:           d.email           ?? null,
            display_name:    d.displayName     ?? d.display_name ?? null,
            first_name:      d.firstName       ?? d.first_name   ?? null,
            last_name:       d.lastName        ?? d.last_name    ?? null,
            username:        d.username        ?? null,
            photo_url:       d.photoURL        ?? d.photo_url    ?? null,
            role:            d.role            ?? 'user',
            subscription:    d.subscription   ?? d.plan ?? 'free',
            xp:              d.xp              ?? { trader: 0, web3: 0 },
            saved_posts:     d.savedPosts      ?? d.saved_posts  ?? [],
            mastered_posts:  d.masteredPosts   ?? d.mastered_posts ?? [],
            ticker_coins:    d.tickerCoins     ?? d.ticker_coins ?? [],
            privacy:         d.privacy         ?? { showPnL: true, showPortfolio: true, showSavedPosts: true, isPublic: true },
            created_at:      toISO(d.createdAt) ?? new Date().toISOString(),
            updated_at:      toISO(d.updatedAt) ?? new Date().toISOString(),
        }
    })

    // Save to a separate migration table for reference
    console.log(`  ℹ️  User profiles saved for reference (${rows.length} users)`)
    console.log(`  ℹ️  Users need to log in via Supabase to get new UUIDs`)

    // Write to a local JSON file for manual inspection
    const { writeFileSync } = await import('fs')
    writeFileSync(join(ROOT, 'scripts', 'firebase-users-export.json'), JSON.stringify(rows, null, 2))
    console.log(`  📁 Saved to scripts/firebase-users-export.json`)
}

// ── Migrate projects ───────────────────────────────────────────────────────────
async function migrateProjects() {
    console.log('\n📁 Migrating projects...')
    const snap = await firestore.collection('projects').get()
    console.log(`  Found ${snap.size} projects`)

    // Projects require user_id — skip for now since user UUIDs changed
    // Save to JSON for manual import after users log in
    const rows = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    const { writeFileSync } = await import('fs')
    writeFileSync(join(ROOT, 'scripts', 'firebase-projects-export.json'), JSON.stringify(rows, null, 2))
    console.log(`  📁 Saved to scripts/firebase-projects-export.json (import after users migrate)`)
}

// ── Migrate project_entries ────────────────────────────────────────────────────
async function migrateProjectEntries() {
    console.log('\n📝 Migrating project_entries...')
    const snap = await firestore.collection('project_entries').get()
    console.log(`  Found ${snap.size} project entries`)

    const rows = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    const { writeFileSync } = await import('fs')
    writeFileSync(join(ROOT, 'scripts', 'firebase-project-entries-export.json'), JSON.stringify(rows, null, 2))
    console.log(`  📁 Saved to scripts/firebase-project-entries-export.json`)
}

// ── Migrate sticker_packs ──────────────────────────────────────────────────────
async function migrateStickerPacks() {
    console.log('\n🎨 Migrating sticker_packs...')
    const snap = await firestore.collection('sticker_packs').get()
    console.log(`  Found ${snap.size} sticker packs`)

    const rows = snap.docs.map(doc => {
        const d = doc.data()
        return {
            id:          toUUID(doc.id),
            name:        d.name        ?? '',
            description: d.description ?? null,
            stickers:    d.stickers    ?? [],
            is_active:   d.isActive    ?? d.is_active ?? true,
            created_at:  toISO(d.createdAt) ?? new Date().toISOString(),
            updated_at:  toISO(d.updatedAt) ?? new Date().toISOString(),
        }
    })

    await upsert('sticker_packs', rows)
    console.log(`  ✅ ${rows.length} sticker packs migrated`)
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    console.log('🚀 Firebase → Supabase Migration')
    console.log('================================')

    try {
        await migratePosts()
        await migrateUsers()
        await migrateProjects()
        await migrateProjectEntries()
        await migrateStickerPacks()

        console.log('\n✅ Migration complete!')
        console.log('\n⚠️  IMPORTANT: posts and sticker_packs are fully migrated.')
        console.log('   users/projects require users to log in via Supabase first.')
        console.log('   Check scripts/firebase-*-export.json for exported data.')
    } catch (err) {
        console.error('\n❌ Migration failed:', err)
        process.exit(1)
    }
}

main()
