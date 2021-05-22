import firebase from 'firebase';
require('@firebase/firestore')

const firebaseConfig = {
    apiKey: "AIzaSyAAUKD07x46oAbxQEJJWFmxJoc1y2UIJTw",
    authDomain: "wily-app-e6411.firebaseapp.com",
    projectId: "wily-app-e6411",
    storageBucket: "wily-app-e6411.appspot.com",
    messagingSenderId: "939449463091",
    appId: "1:939449463091:web:fb7001dab561512073ce46"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  export default firebase.firestore();