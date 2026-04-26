// services/collections.js
import { 
  onSnapshot as firestoreOnSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc as firestoreUpdateDoc,
  addDoc as firestoreAddDoc
} from 'firebase/firestore';

export const onSnapshot = (ref, callback, options) => {
  return firestoreOnSnapshot(ref, (snapshot) => {
    let items = snapshot.docs.map((doc) => {
      const data = doc.data();
      data.id = doc.id;
      return data;
    });
    items = options && options.sort ? items.sort(options.sort) : items;
    callback(items);
  });
};

export const addDoc = (ref, {id, ...data}) => {
  if (id) {
    const docRef = doc(ref, id);
    return setDoc(docRef, data).then(() => {
      console.log("Updated item with specific ID");
    }).catch((error) => {
      console.log("Error updating document:", error);
    });
  } else {
    return firestoreAddDoc(ref, data).then(() => {
      console.log("Added new item");
    }).catch((error) => {
      console.log("Error adding document:", error);
    });
  }
};

export const removeDoc = (ref, id) => {
  const docRef = doc(ref, id);
  return deleteDoc(docRef)
    .then(() => {
      console.log(`Removed item: ${id}`);
    })
    .catch((error) => {
      console.log("Error removing document:", error);
    });
};

export const updateDoc = (ref, id, data) => {
  const docRef = doc(ref, id);
  return firestoreUpdateDoc(docRef, data)
    .then(() => {
      console.log(`Updated item: ${id}`);
    })
    .catch((error) => {
      console.log("Error updating document:", error);
    });
};