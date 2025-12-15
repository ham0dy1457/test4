document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('report-content');
    const btnVision = document.getElementById('btn-report-vision');
    const btnLazy = document.getElementById('btn-report-lazy');
    if (!container || !btnVision || !btnLazy) return;

    function setActive(button) {
        [btnVision, btnLazy].forEach(b => b.classList.remove('primary'));
        button.classList.add('primary');
    }

    async function loadVisionReport() {
        container.innerHTML = '<p>Loading your latest vision test…</p>';
        try {
            if (window.VisionDB && typeof window.VisionDB.initFirebase === 'function') {
                window.VisionDB.initFirebase();
            }

            const latest = await window.VisionDB?.getLatestVisionResult();
            if (!latest) {
                container.innerHTML =
                    '<p>No vision tests found yet. Please complete a vision test first.</p>';
                return;
            }

            const when = latest.when ? new Date(latest.when) : new Date();

            const rightLog = Number(latest.rightLogmar ?? NaN);
            const leftLog = Number(latest.leftLogmar ?? NaN);

            const rightOverall = Number.isFinite(rightLog)
                ? (rightLog <= 0.1 ? 'Normal' : rightLog <= 0.3 ? 'Mild Amblyopia' : 'Moderate Amblyopia')
                : 'N/A';
            const leftOverall = Number.isFinite(leftLog)
                ? (leftLog <= 0.1 ? 'Normal' : leftLog <= 0.3 ? 'Mild Amblyopia' : 'Moderate Amblyopia')
                : 'N/A';

            const weakerEye =
                Number.isFinite(rightLog) && Number.isFinite(leftLog)
                    ? (rightLog > leftLog ? 'Right eye' : leftLog > rightLog ? 'Left eye' : 'Both eyes similar')
                    : '—';

            const diff =
                Number.isFinite(rightLog) && Number.isFinite(leftLog)
                    ? Math.abs(rightLog - leftLog) * 100
                    : null;

            let summaryText = '';
            if (!Number.isFinite(rightLog) || !Number.isFinite(leftLog)) {
                summaryText = 'Vision test summary available, but detailed values are incomplete.';
            } else if (Math.abs(rightLog - leftLog) < 0.1) {
                summaryText =
                    'Both eyes show similar visual acuity. Continue regular eye exercises to maintain good vision.';
            } else {
                const strongerEye = rightLog > leftLog ? 'Left eye' : 'Right eye';
                summaryText = `${weakerEye} is approximately ${diff.toFixed(
                    0
                )}% weaker than the ${strongerEye}. Training games can be focused on the weaker eye to improve its strength.`;
            }

            const dateStr = when.toISOString().split('T')[0];
            const timeStr = when.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            container.innerHTML = `
                <div class="vt-result" style="margin:0;">
                    <div class="result-summary">${summaryText}</div>
                    <div class="results-table-container">
                        <h3>Latest Vision Test</h3>
                        <div class="test-info">
                            <span>Date: ${dateStr}</span>
                            <span>Time: ${timeStr}</span>
                        </div>
                        <table class="results-table">
                            <thead>
                                <tr>
                                    <th>Parameter</th>
                                    <th>Right Eye</th>
                                    <th>Left Eye</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Visual Acuity</td>
                                    <td>${latest.rightEye ?? '-'}</td>
                                    <td>${latest.leftEye ?? '-'}</td>
                                </tr>
                                <tr>
                                    <td>Visual Acuity (LogMAR)</td>
                                    <td>${Number.isFinite(rightLog) ? rightLog.toFixed(1) : '-'}</td>
                                    <td>${Number.isFinite(leftLog) ? leftLog.toFixed(1) : '-'}</td>
                                </tr>
                                <tr class="overall-result">
                                    <td><strong>Overall Result</strong></td>
                                    <td>${rightOverall}</td>
                                    <td>${leftOverall}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (e) {
            console.error('Error loading latest vision result:', e);
            container.innerHTML =
                '<p>Could not load vision test results. Please try running a new vision test.</p>';
        }
    }

    async function loadLazyReport() {
        container.innerHTML = '<p>Loading your latest lazy eye session…</p>';
        try {
            if (window.LazyDB && typeof window.LazyDB.initLazyFirebase === 'function') {
                window.LazyDB.initLazyFirebase();
            }

            const latest = await window.LazyDB?.getLatestLazySession();
            if (!latest) {
                container.innerHTML =
                    '<p>No lazy eye sessions found yet. Please finish all games at least once.</p>';
                return;
            }

            const when = latest.when ? new Date(latest.when) : new Date();
            const games = Array.isArray(latest.games) ? latest.games : [];
            const sessionTotal = typeof latest.sessionTotal === 'number'
                ? latest.sessionTotal
                : games.reduce((sum, g) => sum + (typeof g.score === 'number' ? g.score : 0), 0);

            const dateStr = when.toISOString().split('T')[0];
            const timeStr = when.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            const rows = games.map(g => `
                <tr>
                    <td>Level ${g.level ?? '-'}</td>
                    <td>${g.gameName ?? '-'}</td>
                    <td>${typeof g.score === 'number' ? g.score : '-'}</td>
                </tr>
            `).join('');

            container.innerHTML = `
                <div class="vt-result" style="margin:0;">
                    <div class="result-summary">
                        This report shows your most recent lazy eye training session.
                        Total score across all games: <strong>${sessionTotal}</strong>.
                    </div>
                    <div class="results-table-container">
                        <h3>Latest Lazy Eye Session</h3>
                        <div class="test-info">
                            <span>Date: ${dateStr}</span>
                            <span>Time: ${timeStr}</span>
                        </div>
                        <table class="results-table">
                            <thead>
                                <tr>
                                    <th>Level</th>
                                    <th>Game</th>
                                    <th>Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows || '<tr><td colspan="3">No game scores found.</td></tr>'}
                                <tr class="overall-result">
                                    <td colspan="2"><strong>Total Score</strong></td>
                                    <td><strong>${sessionTotal}</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (e) {
            console.error('Error loading latest lazy-eye session:', e);
            container.innerHTML =
                '<p>Could not load lazy eye session results. Please finish all games at least once.</p>';
        }
    }

    btnVision.addEventListener('click', () => {
        setActive(btnVision);
        loadVisionReport();
    });
    btnLazy.addEventListener('click', () => {
        setActive(btnLazy);
        loadLazyReport();
    });

    // Default view: vision test report
    setActive(btnVision);
    loadVisionReport();
});

