importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js','https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
firebase.initializeApp({apiKey:'AIzaSyDRQq5_vwRu0FlVLZ9z9mYRW-ZDPPkfZuY',authDomain:'sol1rti.firebaseapp.com',projectId:'sol1rti',storageBucket:'sol1rti.firebasestorage.app',messagingSenderId:'938564845096',appId:'1:938564845096:web:ad278603d789d65d903f1d'});
const m=firebase.messaging();
m.onBackgroundMessage(p=>{const n=p.notification||p.data||{};self.registration.showNotification(n.title||'Sola',{body:n.body||'',icon:'icon-192.png',tag:'sola'})});
