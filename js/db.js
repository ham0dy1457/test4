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

	// Expose minimal API
	window.VisionDB = { initFirebase, saveVisionResult };

	// Initialize on load
	window.addEventListener('load', initFirebase);
})();


