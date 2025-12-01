import { auth, db } from "../firebase";
import { deleteUser } from "firebase/auth";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";

/**
 * Delete all Firestore data for a user
 */
export const deleteAllUserData = async (userId: string): Promise<void> => {
    try {
        // Delete all journal entries
        const entriesRef = collection(db, "entries");
        const entriesQuery = query(entriesRef, where("userId", "==", userId));
        const entriesSnapshot = await getDocs(entriesQuery);

        const deletePromises = entriesSnapshot.docs.map((document) =>
            deleteDoc(doc(db, "entries", document.id))
        );

        await Promise.all(deletePromises);

        console.log(`Deleted ${entriesSnapshot.size} entries for user ${userId}`);
    } catch (error) {
        console.error("Error deleting user data:", error);
        throw new Error("Failed to delete user data");
    }
};

/**
 * Delete the user's Firebase Auth account and all associated data
 */
export const deleteAccount = async (): Promise<void> => {
    const user = auth.currentUser;

    if (!user) {
        throw new Error("No user is currently signed in");
    }

    try {
        // Step 1: Delete all Firestore data
        await deleteAllUserData(user.uid);

        // Step 2: Delete the Firebase Auth account
        await deleteUser(user);

        console.log("Account and all data successfully deleted");
    } catch (error: any) {
        console.error("Error deleting account:", error);

        // Check if re-authentication is required
        if (error.code === "auth/requires-recent-login") {
            throw new Error(
                "For security reasons, please log out and log back in before deleting your account."
            );
        }

        throw new Error(`Failed to delete account: ${error.message}`);
    }
};

/**
 * Get user usage stats
 */
export const getUserUsage = async (userId: string) => {
    try {
        const docRef = doc(db, "users", userId, "private", "usage");
        const docSnap = await import("firebase/firestore").then(m => m.getDoc(docRef));

        if (docSnap.exists()) {
            return docSnap.data() as { transcriptionSeconds: number; aiSummaryCount: number };
        }
        return { transcriptionSeconds: 0, aiSummaryCount: 0 };
    } catch (error) {
        console.error("Error getting usage:", error);
        return { transcriptionSeconds: 0, aiSummaryCount: 0 };
    }
};

/**
 * Update user usage stats
 */
export const updateUserUsage = async (userId: string, secondsDelta: number) => {
    try {
        const docRef = doc(db, "users", userId, "private", "usage");
        const { setDoc, increment } = await import("firebase/firestore");

        await setDoc(docRef, {
            transcriptionSeconds: increment(secondsDelta),
            lastUpdated: Date.now()
        }, { merge: true });
    } catch (error) {
        console.error("Error updating usage:", error);
    }
};
