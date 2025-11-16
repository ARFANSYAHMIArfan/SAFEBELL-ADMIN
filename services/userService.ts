import { UserCredentials, UserRole } from '../types';
import { db } from './firebaseConfig';
// FIX: Updated firebase/firestore import to use the scoped package @firebase/firestore
import { collection, getDocs, doc, setDoc, deleteDoc, query, where, limit, getDoc, updateDoc } from '@firebase/firestore';

const USERS_COLLECTION = 'users';

/**
 * Validates user credentials against Firestore.
 * @param id The user's login ID.
 * @param password The user's password.
 * @returns A promise that resolves to the user object if valid, otherwise null.
 */
export const validateLogin = async (id: string, password: string): Promise<UserCredentials | null> => {
    try {
        const usersCollection = collection(db, USERS_COLLECTION);
        const q = query(usersCollection, where("id", "==", id), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log(`Login failed: User ID "${id}" not found.`);
            return null; // User ID not found
        }
        
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data() as UserCredentials;

        if (userData.isLocked) {
            console.log(`Login failed: User account "${id}" is locked.`);
            return null; // Account is locked
        }

        if (userData.password === password) {
            return {
                docId: userDoc.id,
                id: userData.id,
                role: userData.role,
                // Do not return password in the session object
            };
        }

        console.log(`Login failed: Incorrect password for User ID "${id}".`);
        return null; // Password incorrect
    } catch (error) {
        console.error("Error validating login:", error);
        // To prevent login during a DB error, return null
        return null;
    }
};

/**
 * Fetches a user by their login ID to check their status.
 * @param id The user's login ID.
 * @returns A promise that resolves to the user object or null if not found.
 */
export const getUserById = async (id: string): Promise<UserCredentials | null> => {
    try {
        const usersCollection = collection(db, USERS_COLLECTION);
        const q = query(usersCollection, where("id", "==", id), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }
        
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data() as UserCredentials;

        // Return only necessary, non-sensitive data
        return {
            docId: userDoc.id,
            id: userData.id,
            role: userData.role,
            isLocked: userData.isLocked,
        };
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        return null; // Return null on error to avoid breaking login flow
    }
};


/**
 * Fetches all users from Firestore, excluding their passwords for security.
 * @returns A promise that resolves to an array of user credentials.
 */
export const getUsers = async (): Promise<UserCredentials[]> => {
    try {
        const usersCollection = collection(db, USERS_COLLECTION);
        const querySnapshot = await getDocs(usersCollection);
        const users: UserCredentials[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            users.push({
                docId: doc.id,
                id: data.id,
                role: data.role,
            });
        });
        return users;
    } catch (error) {
        console.error("Error fetching users:", error);
        throw new Error('Gagal memuatkan senarai pengguna.');
    }
};

/**
 * Retrieves the password for a specific user. Use with caution.
 * @param docId The Firestore document ID of the user.
 * @returns A promise that resolves to the user's password or null if not found.
 */
export const getUserPassword = async (docId: string): Promise<string | null> => {
    try {
        const userDocRef = doc(db, USERS_COLLECTION, docId);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            return docSnap.data().password || null;
        }
        return null;
    } catch (error) {
        console.error("Error fetching user password:", error);
        return null;
    }
}

/**
 * Adds a new user to Firestore.
 * @param id The new user's login ID.
 * @param password The new user's password.
 * @param role The new user's role.
 */
export const addUser = async (id: string, password: string, role: UserRole): Promise<void> => {
    try {
        // Check if user ID already exists
        const usersCollection = collection(db, USERS_COLLECTION);
        const q = query(usersCollection, where("id", "==", id), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            throw new Error(`ID Pengguna "${id}" telah wujud.`);
        }
        
        const userDocRef = doc(collection(db, USERS_COLLECTION));
        await setDoc(userDocRef, { id, password, role, isLocked: false });
    } catch (error) {
        console.error("Error adding user:", error);
        throw error; // Re-throw the original error to be caught by the UI
    }
};

/**
 * Deletes a user from Firestore by their document ID.
 * @param docId The Firestore document ID of the user to delete.
 */
export const deleteUser = async (docId: string): Promise<void> => {
     try {
        const userDocRef = doc(db, USERS_COLLECTION, docId);
        await deleteDoc(userDocRef);
    } catch (error) {
        console.error("Error deleting user:", error);
        throw new Error('Gagal memadam pengguna.');
    }
};

/**
 * Sets the 'isLocked' flag to true for a user account.
 * @param docId The Firestore document ID of the user.
 */
export const lockUser = async (docId: string): Promise<void> => {
    try {
        const userDocRef = doc(db, USERS_COLLECTION, docId);
        await updateDoc(userDocRef, { isLocked: true });
    } catch (error) {
        console.error(`Error locking user ${docId}:`, error);
    }
};

/**
 * Sets the 'isLocked' flag to false for a user account.
 * @param docId The Firestore document ID of the user.
 */
export const unlockUser = async (docId: string): Promise<void> => {
    try {
        const userDocRef = doc(db, USERS_COLLECTION, docId);
        await updateDoc(userDocRef, { isLocked: false });
    } catch (error) {
        console.error(`Error unlocking user ${docId}:`, error);
    }
};
