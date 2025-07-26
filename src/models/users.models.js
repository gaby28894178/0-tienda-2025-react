import {db} from '../config/firebaseConfig';
import  {collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where} from 'firebase/firestore';



const users = collection(db,'users');

export const getAllUsers = async () => {
    try {
        const usersSnapshot = await getDocs(users);
        const users = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return users;
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        return [];
    }
};

export const getUserById = async (id) => {
    try {
        const docRef = doc(users, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data()
            };
        } else {
            console.error('Usuario no encontrado:', id);
            return null;
        }
    } catch (error) {
        console.error('Error al obtener usuario por ID:', error);
        return null;
    }
};

export const createUser = async (userData) => {
    try {
        const docRef = await addDoc(users, userData);
        return {
            id: docRef.id,
            ...userData
        };
    } catch (error) {
        console.error('Error al crear usuario:', error);
        return null;
    }
};

export const updateUser = async (id, userData) => {
    try {
        const docRef = doc(users, id);
        await updateDoc(docRef, userData);
        return {
            id,
            ...userData
        };
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        return null;
    }
};

export const deleteUser = async (id) => {
    try {
        const docRef = doc(users, id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        return false;
    }
};
