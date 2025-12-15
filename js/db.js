(() => {
	let app = null;
	let db = null;

	function initFirebase() {
		try {
			if (!window.firebase) return;
			if (app && db) return;
			const cfg = window.FIREBASE_CONFIG || null;
			if (!cfg || !cfg.apiKey || !cfg.projectId) {
				console.warn('Firebase config missing. Results will be stored locally.');
				return;
			}
			app = window.firebase.initializeApp(cfg);
			db = window.firebase.firestore();
		} catch (e) {
			console.warn('Firebase init failed:', e);
		}
	}

	async function saveVisionResult(payload) {
		try {
			if (!db) {
				// Fallback to local storage history
				const history = JSON.parse(localStorage.getItem('visionHistory') || '[]');
				history.push(payload);
				localStorage.setItem('visionHistory', JSON.stringify(history));
				return { ok: true, local: true };
			}
			const col = db.collection('visionTests');
			const docRef = await col.add(payload);
			return { ok: true, id: docRef.id };
		} catch (e) {
			console.warn('Saving to Firestore failed, falling back to local:', e);
			const history = JSON.parse(localStorage.getItem('visionHistory') || '[]');
			history.push(payload);
			localStorage.setItem('visionHistory', JSON.stringify(history));
			return { ok: true, local: true };
		}
	}

	async function getLatestVisionResult() {
		// Try Firestore first
		try {
			if (db) {
				const col = db.collection('visionTests');
				const snap = await col.orderBy('when', 'desc').limit(1).get();
				if (!snap.empty) {
					const doc = snap.docs[0];
					return { id: doc.id, ...doc.data() };
				}
			}
		} catch (e) {
			console.warn('Reading from Firestore failed, falling back to local:', e);
		}

		// Fallback to local storage history
		try {
			const history = JSON.parse(localStorage.getItem('visionHistory') || '[]');
			if (Array.isArray(history) && history.length > 0) {
				return history[history.length - 1];
			}
		} catch (e) {
			console.warn('Reading local visionHistory failed:', e);
		}
		return null;
	}

	// Expose minimal API
	window.VisionDB = { initFirebase, saveVisionResult, getLatestVisionResult };

	// Initialize on load
	window.addEventListener('load', initFirebase);
})();


