import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

export interface UsageData {
    transcriptionSeconds: number;
    lastUpdated: number;
}

const TRIAL_LIMIT_SECONDS = 15 * 60; // 15 minutes in seconds

export const getUsageData = async (): Promise<UsageData> => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        return { transcriptionSeconds: 0, lastUpdated: Date.now() };
    }

    try {
        const usageDocRef = doc(db, 'usage', user.uid);
        const usageDoc = await getDoc(usageDocRef);

        if (!usageDoc.exists()) {
            // Initialize usage for new users
            const initialUsage: UsageData = {
                transcriptionSeconds: 0,
                lastUpdated: Date.now()
            };
            await setDoc(usageDocRef, initialUsage);
            return initialUsage;
        }

        return usageDoc.data() as UsageData;
    } catch (error) {
        console.error('Error fetching usage data:', error);
        return { transcriptionSeconds: 0, lastUpdated: Date.now() };
    }
};

export const addTranscriptionUsage = async (seconds: number): Promise<void> => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        console.warn('No user logged in, cannot track usage');
        return;
    }

    try {
        const usageDocRef = doc(db, 'usage', user.uid);
        await updateDoc(usageDocRef, {
            transcriptionSeconds: increment(seconds),
            lastUpdated: Date.now()
        });
    } catch (error) {
        // If document doesn't exist, create it
        try {
            const usageDocRef = doc(db, 'usage', user.uid);
            await setDoc(usageDocRef, {
                transcriptionSeconds: seconds,
                lastUpdated: Date.now()
            });
        } catch (createError) {
            console.error('Error creating usage document:', createError);
        }
    }
};

export const hasTranscriptionQuota = async (): Promise<boolean> => {
    const usage = await getUsageData();
    return usage.transcriptionSeconds < TRIAL_LIMIT_SECONDS;
};

export const getRemainingSeconds = async (): Promise<number> => {
    const usage = await getUsageData();
    return Math.max(0, TRIAL_LIMIT_SECONDS - usage.transcriptionSeconds);
};

export const getUsagePercentage = async (): Promise<number> => {
    const usage = await getUsageData();
    return Math.min(100, (usage.transcriptionSeconds / TRIAL_LIMIT_SECONDS) * 100);
};

export const formatSecondsToMinutes = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};
