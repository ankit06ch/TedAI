import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, updateDoc, where } from 'firebase/firestore'
import { auth, db, nowTs } from './config'

// Transcript types
export type TranscriptSegment = {
  id: number
  text: string
  timestamp: string
  sentiment: string
  insight: string
}

export type TranscriptRecord = {
  id?: string
  userId: string
  title: string
  segments: TranscriptSegment[]
  createdAt: unknown
  updatedAt: unknown
}

export type TranscriptMeta = {
  id: string
  title: string
  segmentCount: number
  createdAt: Date | null
  updatedAt: Date | null
}

// Collections
function transcriptsCol() {
  return collection(db, 'transcripts')
}

function transcriptDoc(transcriptId: string) {
  return doc(db, 'transcripts', transcriptId)
}

// Title helpers
export function generateTranscriptTitle(segments: TranscriptSegment[]): string {
  if (segments.length === 0) {
    const d = new Date()
    const day = d.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })
    const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    return `Transcript — ${day} ${time}`
  }

  // Use first few words from the first segment
  const firstText = segments[0]?.text || ''
  const words = firstText.split(' ').slice(0, 5).join(' ')
  const title = words.length > 0 ? words : 'Untitled Transcript'
  return title.charAt(0).toUpperCase() + title.slice(1)
}

// CRUD operations
export async function saveTranscript(
  userId: string, 
  segments: TranscriptSegment[], 
  title?: string
): Promise<string> {
  const transcriptTitle = title || generateTranscriptTitle(segments)
  
  const transcriptData: Omit<TranscriptRecord, 'id'> = {
    userId,
    title: transcriptTitle,
    segments,
    createdAt: nowTs(),
    updatedAt: nowTs(),
  }

  const ref = await addDoc(transcriptsCol(), transcriptData as any)
  return ref.id
}

export async function updateTranscript(
  transcriptId: string, 
  segments: TranscriptSegment[], 
  title?: string
): Promise<void> {
  const transcriptTitle = title || generateTranscriptTitle(segments)
  
  const updateData = {
    segments,
    title: transcriptTitle,
    updatedAt: nowTs(),
  }

  await updateDoc(transcriptDoc(transcriptId), updateData as any)
}

export async function deleteTranscript(transcriptId: string): Promise<void> {
  await deleteDoc(transcriptDoc(transcriptId))
}

export async function getUserTranscripts(userId: string, max: number = 50): Promise<TranscriptMeta[]> {
  const q = query(
    transcriptsCol(), 
    where('userId', '==', userId), 
    limit(max)
  )
  
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data() as any
    const createdAt = data.createdAt && typeof data.createdAt.toDate === 'function' 
      ? data.createdAt.toDate() 
      : null
    const updatedAt = data.updatedAt && typeof data.updatedAt.toDate === 'function' 
      ? data.updatedAt.toDate() 
      : null
    
    return { 
      id: d.id, 
      title: data.title || 'Untitled Transcript', 
      segmentCount: data.segments?.length || 0,
      createdAt,
      updatedAt
    }
  })
}


export async function getTranscript(transcriptId: string): Promise<TranscriptRecord | null> {
  const docRef = transcriptDoc(transcriptId)
  const docSnap = await getDoc(docRef)
  
  if (!docSnap.exists()) {
    return null
  }
  
  const data = docSnap.data() as any
  
  return {
    id: docSnap.id,
    userId: data.userId,
    title: data.title,
    segments: data.segments || [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}
