import { Report } from '../types';
import { db } from './firebaseConfig';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy, writeBatch } from 'firebase/firestore';

const REPORTS_COLLECTION = 'reports';

/**
 * Fetches all reports from the Firestore backend, ordered by newest first.
 * @returns A promise that resolves to an array of reports.
 */
export const fetchReports = async (): Promise<Report[]> => {
    try {
        const reportsCollection = collection(db, REPORTS_COLLECTION);
        const q = query(reportsCollection, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        const reports: Report[] = [];
        querySnapshot.forEach((doc) => {
            reports.push(doc.data() as Report);
        });
        return reports;
    } catch (error) {
        console.error("Failed to fetch remote reports from Firestore.", error);
        throw new Error("Gagal memuatkan laporan dari pangkalan data.");
    }
};

/**
 * Adds or updates a single report document in Firestore.
 * @param report The report to save.
 */
export const addSingleReport = async (report: Report): Promise<void> => {
    try {
        const reportDocRef = doc(db, REPORTS_COLLECTION, report.id);
        await setDoc(reportDocRef, report);
    } catch (error) {
        console.error("Error adding report to Firestore:", error);
        throw new Error('Gagal menyimpan laporan ke pangkalan data.');
    }
};

/**
 * Deletes a single report document from Firestore by its ID.
 * @param reportId The ID of the report to delete.
 */
export const deleteSingleReport = async (reportId: string): Promise<void> => {
     try {
        const reportDocRef = doc(db, REPORTS_COLLECTION, reportId);
        await deleteDoc(reportDocRef);
    } catch (error) {
        console.error("Error deleting report from Firestore:", error);
        throw new Error('Gagal memadam laporan dari pangkalan data.');
    }
};

/**
 * Efficiently saves an array of reports to Firestore, either creating new ones or merging with existing ones.
 * @param reports The array of reports to save.
 */
export const batchSaveReports = async (reports: Report[]): Promise<void> => {
    try {
        const batch = writeBatch(db);
        reports.forEach(report => {
            const docRef = doc(db, REPORTS_COLLECTION, report.id);
            // Use merge to update existing documents or create new ones without overwriting.
            batch.set(docRef, report, { merge: true });
        });
        await batch.commit();
    } catch (error) {
        console.error("Error batch saving reports to Firestore:", error);
        throw new Error('Gagal menyimpan laporan ke pangkalan data.');
    }
};
