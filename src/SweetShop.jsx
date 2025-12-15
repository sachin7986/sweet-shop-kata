import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut, onAuthStateChanged 
} from 'firebase/auth';
import { 
  getDatabase, ref, set, push, onValue, remove, update, get, child 
} from 'firebase/database';

// --- CONFIGURATION ---
// ⬇️ PASTE YOUR FIREBASE KEYS HERE ⬇️
const firebaseConfig = {
    
  apiKey: "your_api",
  authDomain: "your_domaian",
  projectId: "sweet-shop-kata",
  storageBucket: "sweet-shop-kata.firebasestorage.app",
  messagingSenderId: "sendeer_id",
  appId: "api_id",
  measurementId: "measurement_id"

};
// ------------------------------------

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const SweetShop = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('guest');
  const [sweets, setSweets] = useState([]);
  const [view, setView] = useState('shop');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Admin Form State
  const [newSweet, setNewSweet] = useState({ name: '', category: 'Candy', price: '', quantity: '' });
  const [editingId, setEditingId] = useState(null);

  // --- AUTHENTICATION ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check Role
        const roleRef = ref(db, `users/${currentUser.uid}/role`);
        onValue(roleRef, (snapshot) => {
          const role = snapshot.val();
          if (role) {
            setUserRole(role);
          } else {
            // If no role exists, check if they are the FIRST user ever
            get(ref(db, 'users')).then((usersSnap) => {
               const isFirstUser = !usersSnap.exists() || Object.keys(usersSnap.val()).length <= 1;
               const newRole = isFirstUser ? 'admin' : 'user';
               set(ref(db, `users/${currentUser.uid}`), { role: newRole, email: currentUser.email });
               setUserRole(newRole);
            });
          }
        });
      } else {
        setUserRole('guest');
      }
    });
    return () => unsubscribe();
  }, []);

  // --- REALTIME DATA LISTENER ---
  useEffect(() => {
    const sweetsRef = ref(db, 'sweets');
    onValue(sweetsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedSweets = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      setSweets(loadedSweets);
    });
  }, []);

  // --- ACTIONS ---

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setMessage("Account created! Redirecting...");
      setView('shop');
    } catch (err) { setError(err.message); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setView('shop');
    } catch (err) { setError(err.message); }
  };

  const handleLogout = () => signOut(auth).then(() => setView('shop'));

  // ADMIN: Add Sweet
  const addSweet = (e) => {
    e.preventDefault();
    if (userRole !== 'admin') return;
    const newRef = push(ref(db, 'sweets'));
    set(newRef, {
      name: newSweet.name,
      category: newSweet.category,
      price: parseFloat(newSweet.price),
      quantity: parseInt(newSweet.quantity)
    });
    setNewSweet({ name: '', category: 'Candy', price: '', quantity: '' });
    setMessage("Sweet added!");
  };

  // ADMIN: Delete Sweet
  const deleteSweet = (id) => {
    if (confirm("Delete this sweet?")) remove(ref(db, `sweets/${id}`));
  };

  // ADMIN: Update Sweet
  const updateSweet = (e) => {
    e.preventDefault();
    if (!editingId) return;
    update(ref(db, `sweets/${editingId}`), {
      name: newSweet.name,
      category: newSweet.category,
      price: parseFloat(newSweet.price),
      quantity: parseInt(newSweet.quantity)
    });
    setEditingId(null);
    setNewSweet({ name: '', category: 'Candy', price: '', quantity: '' });
    setMessage("Sweet updated!");
  };

  // ADMIN: Seed Database (Bulk Add)
  const seedDatabase = () => {
    const items = [
      { name: 'Rainbow Lollipop', category: 'Lollipop', price: 1.5, quantity: 50 },
      { name: 'Sour Worms', category: 'Gummy', price: 2.99, quantity: 30 },
      { name: 'Dark Chocolate', category: 'Chocolate', price: 4.5, quantity: 20 },
      { name: 'Gumballs', category: 'Candy', price: 0.25, quantity: 200 }
    ];
    items.forEach(item => push(ref(db, 'sweets'), item));
    setMessage("Demo data added!");
  };

  // USER: Purchase
  const purchase = (id, currentQty) => {
    if (currentQty > 0) {
      update(ref(db, `sweets/${id}`), { quantity: currentQty - 1 });
      setMessage("Purchased!");
    }
  };

  // --- RENDER HELPERS ---
  const SweetCard = ({ s }) => (
    <div className="bg-white p-4 rounded shadow border border-pink-100 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg text-pink-700">{s.name}</h3>
          <span className="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full">{s.category}</span>
        </div>
        <p className="text-2xl font-bold text-gray-800 my-2">${s.price}</p>
        <p className={s.quantity === 0 ? "text-red-500 font-bold" : "text-gray-600"}>
          Stock: {s.quantity}
        </p>
      </div>
      
      <div className="mt-4 space-y-2">
        {userRole === 'admin' ? (
          <div className="flex gap-2">
            <button onClick={() => { setEditingId(s.id); setNewSweet(s); setView('admin'); }} className="flex-1 bg-blue-100 text-blue-700 py-1 rounded text-sm font-bold">Edit</button>
            <button onClick={() => deleteSweet(s.id)} className="flex-1 bg-red-100 text-red-700 py-1 rounded text-sm font-bold">Delete</button>
          </div>
        ) : (
          <button 
            onClick={() => purchase(s.id, s.quantity)} 
            disabled={s.quantity === 0 || userRole === 'guest'}
            className={`w-full py-2 rounded text-white font-bold ${s.quantity === 0 || userRole === 'guest' ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'}`}
          >
            {userRole === 'guest' ? 'Login to Buy' : s.quantity === 0 ? 'Sold Out' : 'Buy Now'}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-pink-50 font-sans text-gray-800 p-4">
      {/* Header */}
      <header className="max-w-5xl mx-auto flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow">
        <h1 className="text-2xl font-black text-pink-600 cursor-pointer" onClick={() => setView('shop')}>🍬 SweetShop</h1>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded uppercase tracking-wider">Role: {userRole}</span>
          {userRole === 'admin' && <button onClick={() => setView('admin')} className="text-sm font-bold text-pink-600 hover:underline">Admin Panel</button>}
          {user ? (
            <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded text-sm font-bold">Logout</button>
          ) : (
            <button onClick={() => setView('login')} className="bg-pink-500 text-white px-3 py-1 rounded text-sm font-bold">Login</button>
          )}
        </div>
      </header>

      {/* Messages */}
      {message && <div className="max-w-5xl mx-auto mb-4 bg-green-100 text-green-700 p-3 rounded text-center font-bold">{message}</div>}
      {error && <div className="max-w-5xl mx-auto mb-4 bg-red-100 text-red-700 p-3 rounded text-center font-bold">{error}</div>}

      {/* Main Content */}
      <main className="max-w-5xl mx-auto">
        {view === 'shop' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sweets.length === 0 ? (
               <div className="col-span-full text-center py-10">
                 <p className="text-gray-500 text-lg">Shop is empty.</p>
                 {userRole === 'admin' && <button onClick={seedDatabase} className="mt-4 text-purple-600 font-bold hover:underline">Click here to load Demo Data</button>}
               </div>
            ) : sweets.map(s => <SweetCard key={s.id} s={s} />)}
          </div>
        )}

        {(view === 'login' || view === 'register') && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow text-center">
            <h2 className="text-2xl font-bold mb-6 text-pink-600">{view === 'login' ? 'Welcome Back' : 'Join the Club'}</h2>
            <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="space-y-4">
              <input type="email" placeholder="Email" className="w-full p-2 border rounded" value={email} onChange={e => setEmail(e.target.value)} required />
              <input type="password" placeholder="Password" className="w-full p-2 border rounded" value={password} onChange={e => setPassword(e.target.value)} required />
              <button className="w-full bg-pink-500 text-white py-2 rounded font-bold hover:bg-pink-600">{view === 'login' ? 'Login' : 'Register'}</button>
            </form>
            <p className="mt-4 text-sm text-gray-500 cursor-pointer hover:text-pink-600" onClick={() => setView(view === 'login' ? 'register' : 'login')}>
              {view === 'login' ? 'Need an account? Register' : 'Have an account? Login'}
            </p>
          </div>
        )}

        {view === 'admin' && (
          <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Sweet' : 'Add New Sweet'}</h2>
            <form onSubmit={editingId ? updateSweet : addSweet} className="space-y-3">
              <input type="text" placeholder="Name" className="w-full p-2 border rounded" value={newSweet.name} onChange={e => setNewSweet({...newSweet, name: e.target.value})} required />
              <select className="w-full p-2 border rounded" value={newSweet.category} onChange={e => setNewSweet({...newSweet, category: e.target.value})}>
                {['Candy', 'Chocolate', 'Gummy', 'Lollipop', 'Taffy'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="flex gap-2">
                <input type="number" step="0.01" placeholder="Price" className="w-full p-2 border rounded" value={newSweet.price} onChange={e => setNewSweet({...newSweet, price: e.target.value})} required />
                <input type="number" placeholder="Qty" className="w-full p-2 border rounded" value={newSweet.quantity} onChange={e => setNewSweet({...newSweet, quantity: e.target.value})} required />
              </div>
              <button className="w-full bg-green-500 text-white py-2 rounded font-bold hover:bg-green-600">{editingId ? 'Update' : 'Add Sweet'}</button>
              {editingId && <button type="button" onClick={() => { setEditingId(null); setView('shop'); }} className="w-full bg-gray-300 text-gray-700 py-2 rounded font-bold mt-2">Cancel</button>}
            </form>
            <div className="mt-8 pt-8 border-t text-center">
               <button onClick={seedDatabase} className="text-purple-600 text-sm font-bold hover:underline">Add Demo Data (4 Items)</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SweetShop;
