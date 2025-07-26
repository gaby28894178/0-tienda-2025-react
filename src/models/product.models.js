import {db} from '../config/firebaseConfig';

import {collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where} from 'firebase/firestore';

const productsCollection = collection(db, 'products');

export const getAllProducts = async () => {
    try {
        const productsSnapshot = await getDocs(productsCollection);
        const products = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return products;
    } catch (error) {
        console.error('Error al obtener productos:', error);
        return [];
    }
};

export const getProductById = async (id) => {
    try {
        const docRef = doc(productsCollection, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data()
            };
        } else {
            console.error('Producto no encontrado:', id);
            return null;
        }
    } catch (error) {
        console.error('Error al obtener producto por ID:', error);
        return null;
    }
};

export const createProduct = async (productData) => {
    try {
        const docRef = await addDoc(productsCollection, productData);
        return {
            id: docRef.id,
            ...productData
        };
    } catch (error) {
        console.error('Error al crear producto:', error);
        return null;
    }
};

export const updateProduct = async (id, productData) => {
    try {
        const docRef = doc(productsCollection, id);
        await updateDoc(docRef, productData);
        return {
            id,
            ...productData
        };
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        return null;
    }
};

export const deleteProduct = async (id) => {
    try {
        const docRef = doc(productsCollection, id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        return false;
    }
};
