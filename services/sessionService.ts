import { Session, UserRole } from '../types';
import { db } from './firebaseConfig';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

const SESSIONS_COLLECTION = 'sessions';

// Simple random ID generator
const generateSessionId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const createSession = async (role: UserRole, userId: string, docId: string): Promise<Session> => {
    try {
        const sessionId = generateSessionId();
        const session: Session = {
            id: sessionId,
            role,
            userId,
            docId, // Store the document ID
            createdAt: new Date().toISOString()
        };
        const sessionDocRef = doc(db, SESSIONS_COLLECTION, sessionId);
        await setDoc(sessionDocRef, session);
        return session;
    } catch (error) {
        console.error("Error creating session:", error);
        throw new Error("Failed to save sessions to the backend.");
    }
};

export const validateSession = async (sessionId: string): Promise<Session | null> => {
    try {
        const sessionDocRef = doc(db, SESSIONS_COLLECTION, sessionId);
        const docSnap = await getDoc(sessionDocRef);
        return docSnap.exists() ? docSnap.data() as Session : null;
    } catch (error) {
        console.error("Error validating session:", error);
        return null;
    }
};

export const deleteSession = async (sessionId: string): Promise<void> => {
     try {
        const sessionDocRef = doc(db, SESSIONS_COLLECTION, sessionId);
        await deleteDoc(sessionDocRef);
    // Fix: Added missing opening brace for the catch block.
    } catch (error) {
        console.error("Error deleting session:", error);
    }
};