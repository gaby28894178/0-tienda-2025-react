import { db } from "../config/firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

/**
 * Verifica la conexión a Firebase y muestra información de diagnóstico
 */
export const testFirebaseConnection = async () => {
  try {
    console.log("🔍 Verificando conexión a Firebase...");

    // Intentar obtener una colección para verificar la conexión
    const testCollection = collection(db, "test_connection");
    const testDoc = doc(testCollection, "test_doc");

    // Guardar un documento de prueba
    await setDoc(testDoc, {
      timestamp: new Date().toISOString(),
      message: "Conexión exitosa a Firebase",
    });

    // Leer el documento para verificar
    const docSnap = await getDoc(testDoc);

    if (docSnap.exists()) {
      console.log("✅ Conexión a Firebase verificada correctamente");
      console.log("📄 Datos del documento:", docSnap.data());
      return true;
    } else {
      console.error("❌ Error: No se pudo leer el documento de prueba");
      return false;
    }
  } catch (error) {
    console.error("❌ Error al verificar conexión a Firebase:", error);
    return false;
  }
};

/**
 * Inicializa las colecciones necesarias en Firebase si no existen
 */
export const initializeFirebaseCollections = async () => {
  try {
    console.log("🔄 Verificando colecciones en Firebase...");

    // Lista de colecciones a verificar
    const requiredCollections = [
      "users",
      "products",
      "orders",
      "carts",
      "headerImages",
    ];

    for (const collectionName of requiredCollections) {
      // Verificar si la colección existe
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);

      console.log(
        `📊 Colección "${collectionName}": ${snapshot.docs.length} documentos`
      );
    }

    console.log("✅ Verificación de colecciones completada");
    return true;
  } catch (error) {
    console.error("❌ Error al verificar colecciones:", error);
    return false;
  }
};

export default { testFirebaseConnection, initializeFirebaseCollections };
