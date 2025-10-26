import { addDoc, collection, doc, getDocs, limit, orderBy, query, updateDoc, where } from 'firebase/firestore'
import { auth, db, nowTs, increment } from './config'

// Records
export type ConversationRecord = {
  id: string
  userId: string
  title: string
  createdAt: unknown
  updatedAt: unknown
  nodeCount: number
}

export type ConversationNodeRecord = {
  id?: string
  label: string
  branchLevel: number
  index: number
  createdAt: unknown
}

// Collections
function conversationsCol() {
  return collection(db, 'conversations')
}

function conversationDoc(conversationId: string) {
  return doc(db, 'conversations', conversationId)
}

function nodesCol(conversationId: string) {
  return collection(db, 'conversations', conversationId, 'nodes')
}

// Title helpers
export function generateConversationTitleFromFirstLabel(firstLabel: string | null): string {
  const base = firstLabel && firstLabel.trim().length >= 3 ? firstLabel.trim() : 'Untitled conversation'
  const title = base.charAt(0).toUpperCase() + base.slice(1)
  return title
}

export function generateProvisionalTitle(): string {
  const d = new Date()
  const day = d.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return `Conversation — ${day} ${time}`
}

function generateTitleFromLabels(labels: string[]): string {
  if (!labels.length) return generateProvisionalTitle()
  const stop = new Set(['the','a','an','and','or','but','of','to','in','on','for','with','at','by','from','is','are','be'])
  const counts: Record<string, number> = {}
  for (const label of labels) {
    for (const raw of label.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)) {
      if (stop.has(raw) || raw.length < 3) continue
      counts[raw] = (counts[raw] || 0) + 1
    }
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w]) => w)
  const candidate = (top.length ? top.join(' ') : labels[0]).trim()
  return candidate.charAt(0).toUpperCase() + candidate.slice(1)
}

// CRUD used by components
export async function createConversation(userId: string, firstLabel?: string): Promise<string> {
  const initialTitle = firstLabel && firstLabel.trim().length >= 3
    ? generateConversationTitleFromFirstLabel(firstLabel)
    : generateProvisionalTitle()
  const base: Omit<ConversationRecord, 'id'> = {
    userId,
    title: initialTitle,
    createdAt: nowTs(),
    updatedAt: nowTs(),
    nodeCount: 0,
  }
  const ref = await addDoc(conversationsCol(), base as any)
  return ref.id
}

export async function appendNode(conversationId: string, node: Omit<ConversationNodeRecord, 'createdAt'>): Promise<void> {
  const payload: Omit<ConversationNodeRecord, 'id'> = {
    label: node.label,
    branchLevel: node.branchLevel,
    index: node.index,
    createdAt: nowTs(),
  }
  await addDoc(nodesCol(conversationId), payload as any)
  await updateDoc(conversationDoc(conversationId), { nodeCount: increment(1), updatedAt: nowTs() } as any)
}

export async function finalizeConversation(conversationId: string, labels: string[]): Promise<void> {
  const bestTitle = generateTitleFromLabels(labels)
  await updateDoc(conversationDoc(conversationId), { title: bestTitle, updatedAt: nowTs() } as any)
}

export type ConversationMeta = {
  id: string
  title: string
  updatedAt: Date | null
  nodeCount?: number
}

export async function listConversations(userId: string, max: number = 20): Promise<ConversationMeta[]> {
  const q = query(conversationsCol(), where('userId', '==', userId), orderBy('updatedAt', 'desc'), limit(max))
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data() as any
    const updated = data.updatedAt
    const updatedAt: Date | null = updated && typeof updated.toDate === 'function' ? updated.toDate() : null
    return { id: d.id, title: data.title || 'Untitled conversation', updatedAt, nodeCount: data.nodeCount }
  })
}

export async function getConversationNodes(conversationId: string): Promise<Array<ConversationNodeRecord>> {
  const q = query(nodesCol(conversationId), orderBy('index', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as any
}


