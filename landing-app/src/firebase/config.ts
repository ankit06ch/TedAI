import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, serverTimestamp, increment } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDi-wMP38UiyP7RBLDj_iROEZgSKlySgSE',
  authDomain: 'tedai-a5973.firebaseapp.com',
  projectId: 'tedai-a5973',
  storageBucket: 'tedai-a5973.firebasestorage.app',
  messagingSenderId: '745465037469',
  appId: '1:745465037469:web:84c716ffca603757d74a74',
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// Shared types and helpers for Firestore usage across the app
export type ConversationRecord = {
  id?: string
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
  createdAt: unknown
  index: number
}

export const nowTs = serverTimestamp
export { increment }


