import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db, signInWithPopup, signOut, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isRegistered: boolean;
  isAdmin: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  completeRegistration: (data: { name: string; whatsappNumber: string; location?: string; bio?: string }) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        try {
          // Listen to changes in user profile in real-time
          unsubscribeDoc = onSnapshot(userDocRef, async (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as UserProfile;
              // Check if user is the designated admin or already has isAdmin
              const isDefaultAdmin = user.email === 'gayathriyit6@gmail.com';
              const profile: UserProfile = {
                ...data,
                id: user.uid,
                email: user.email || data.email || '',
                isAdmin: isDefaultAdmin ? true : !!data.isAdmin,
                isRegistered: !!data.isRegistered && !!data.name?.trim() && !!data.whatsappNumber?.trim()
              };
              setUserProfile(profile);
            } else {
              // Create initial unregistered profile
              const isDefaultAdmin = user.email === 'gayathriyit6@gmail.com';
              const initialProfile: UserProfile = {
                id: user.uid,
                email: user.email || '',
                name: user.displayName || '',
                whatsappNumber: '',
                photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
                isRegistered: false,
                isAdmin: isDefaultAdmin,
                bio: '',
                location: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };

              try {
                await setDoc(userDocRef, initialProfile);
                setUserProfile(initialProfile);
              } catch (err) {
                handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
              }
            }
            setLoading(false);
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
            setLoading(false);
          });
        } catch (error) {
          console.error('Error fetching user document:', error);
          setLoading(false);
        }
      } else {
        if (unsubscribeDoc) {
          unsubscribeDoc();
          unsubscribeDoc = null;
        }
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) {
        unsubscribeDoc();
      }
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Error logging in with Google:', error);
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        throw error;
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  const completeRegistration = async (data: { name: string; whatsappNumber: string; location?: string; bio?: string }) => {
    if (!currentUser) return;
    const userDocRef = doc(db, 'users', currentUser.uid);
    const updatedData: Partial<UserProfile> = {
      name: data.name.trim(),
      whatsappNumber: data.whatsappNumber.trim(),
      location: data.location?.trim() || '',
      bio: data.bio?.trim() || '',
      isRegistered: true,
      updatedAt: new Date().toISOString()
    };

    try {
      await updateDoc(userDocRef, updatedData);
      setUserProfile(prev => prev ? { ...prev, ...updatedData, isRegistered: true } : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const userDocRef = doc(db, 'users', currentUser.uid);
    const updated = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    try {
      await updateDoc(userDocRef, updated);
      setUserProfile(prev => prev ? { ...prev, ...updated } : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const isRegistered = !!userProfile?.isRegistered && !!userProfile?.name?.trim() && !!userProfile?.whatsappNumber?.trim();
  const isAdmin = !!userProfile?.isAdmin;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isRegistered,
        isAdmin,
        loginWithGoogle,
        logout,
        completeRegistration,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
