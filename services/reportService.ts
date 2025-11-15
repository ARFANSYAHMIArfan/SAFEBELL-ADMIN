import { Report } from '../types';

// Using a separate key in the same kvdb.io bucket for reports.
const REPORTS_ENDPOINT = 'https://kvdb.io/z4aB7cE9fG2iL5nO8pS1rUvYxZ/app-reports';

/**
 * Fetches all reports from the remote backend.
 * @returns A promise that resolves to an array of reports.
 */
export const fetchReports = async (): Promise<Report[]> => {
    try {
        const response = await fetch(REPORTS_ENDPOINT);

        if (!response.ok) {
            // A 404 error is expected if no reports have been saved yet.
            if (response.status === 404) {
                console.log("No remote reports found, returning empty array.");
                return [];
            }
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        
        const reports: Report[] = await response.json();
        // Sort reports by timestamp in descending order (newest first)
        return reports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    } catch (error) {
        console.error("Failed to fetch remote reports.", error);
        // To prevent the app from crashing, return an empty array on failure.
        // A more robust solution might involve retries or showing an error to the user.
        return [];
    }
};

/**
 * Saves the entire list of reports to the remote backend, overwriting the previous state.
 * @param reports The full array of reports to save.
 * @returns A promise that resolves when the reports are successfully saved.
 */
export const saveReports = async (reports: Report[]): Promise<void> => {
    try {
        const response = await fetch(REPORTS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reports)
        });

        if (!response.ok) {
          console.error('Failed to save reports remotely.', await response.text());
          throw new Error('Failed to save reports to the backend.');
        }

        console.log("Reports successfully saved to the remote source.");

    } catch (error) {
        console.error("Error sending reports to the remote source:", error);
        // Re-throw the error so the calling component can handle it, e.g., by notifying the user.
        throw error;
    }
};