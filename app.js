/**
 * App Controller — Wires together input, encoder selection, and rendering
 */
(function () {
    'use strict';

    // === State ===
    const state = {
        bits: [],
        selectedEncodings: new Set(['polar-nrz-l', 'manchester', 'bipolar-ami']),
        clockRate: 1,
        theme: localStorage.getItem('lc-theme') || 'dark'
    };

    // === DOM References ===
    const els = {
        binaryInput: document.getElementById('binary-input'),
        bitDisplay: document.getElementById('bit-display'),
        encodingGrid: document.getElementById('encoding-grid'),
        signalsContainer: document.getElementById('signals-container'),
        emptyState: document.getElementById('empty-state'),
        btnRandom: document.getElementById('btn-random'),
        btnClear: document.getElementById('btn-clear'),
        btnSelectAll: document.getElementById('btn-select-all'),
        btnDeselectAll: document.getElementById('btn-deselect-all'),
        btnExportAll: document.getElementById('btn-export-all'),
        btnThemeToggle: document.getElementById('btn-theme-toggle'),
        btnInfo: document.getElementById('btn-info'),
        infoModal: document.getElementById('info-modal'),
        modalClose: document.getElementById('modal-close'),
        clockRateDisplay: document.getElementById('clock-rate-display'),
        clockDec: document.getElementById('clock-dec'),
        clockInc: document.getElementById('clock-inc')
    };

    // === Theme ===
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        state.theme = theme;
        localStorage.setItem('lc-theme', theme);
        // Re-render signals for new theme colors
        renderSignals();
    }

    // === Build Encoding Grid ===
    function buildEncodingGrid() {
        els.encodingGrid.innerHTML = '';
        for (const enc of LineEncoders.ENCODERS) {
            const chip = document.createElement('div');
            chip.className = 'encoding-chip' + (state.selectedEncodings.has(enc.id) ? ' active' : '');
            chip.dataset.id = enc.id;
            chip.innerHTML = `
                <div class="encoding-checkbox">
                    <svg viewBox="0 0 14 14"><polyline points="2.5 7 5.5 10 11.5 4"/></svg>
                </div>
                <div>
                    <div class="encoding-label">${enc.name}</div>
                    <div class="encoding-category">${enc.category}</div>
                </div>
            `;
            chip.addEventListener('click', () => toggleEncoding(enc.id, chip));
            els.encodingGrid.appendChild(chip);
        }
    }

    function toggleEncoding(id, chip) {
        if (state.selectedEncodings.has(id)) {
            state.selectedEncodings.delete(id);
            chip.classList.remove('active');
        } else {
            state.selectedEncodings.add(id);
            chip.classList.add('active');
        }
        renderSignals();
    }

    // === Bit Display ===
    function updateBitDisplay() {
        els.bitDisplay.innerHTML = '';
        state.bits.forEach((b, i) => {
            const chip = document.createElement('span');
            chip.className = `bit-chip bit-${b}`;
            chip.textContent = b;
            chip.style.animationDelay = `${i * 30}ms`;
            els.bitDisplay.appendChild(chip);
        });
    }

    // === Parse Input ===
    function parseInput(value) {
        const cleaned = value.replace(/[^01]/g, '');
        els.binaryInput.value = cleaned;
        state.bits = cleaned.split('').map(Number);
        updateBitDisplay();
        renderSignals();
    }

    // === Render Signals ===
    function renderSignals() {
        // Remove existing signal cards (but keep empty state)
        const existingCards = els.signalsContainer.querySelectorAll('.signal-card');
        existingCards.forEach(c => c.remove());

        if (state.bits.length === 0 || state.selectedEncodings.size === 0) {
            els.emptyState.style.display = 'flex';
            return;
        }
        els.emptyState.style.display = 'none';

        const encoders = LineEncoders.ENCODERS.filter(e => state.selectedEncodings.has(e.id));

        encoders.forEach((enc, idx) => {
            const encoded = enc.encode(state.bits);
            const card = createSignalCard(enc, encoded, idx);
            els.signalsContainer.appendChild(card);
        });
    }

    function createSignalCard(enc, encoded, index) {
        const card = document.createElement('div');
        card.className = 'signal-card';
        card.style.animationDelay = `${index * 60}ms`;

        card.innerHTML = `
            <div class="signal-card-header">
                <div class="signal-title-group">
                    <div class="signal-color-dot" style="background: ${enc.color}"></div>
                    <span class="signal-title">${enc.name}</span>
                    <span class="signal-category-tag">${enc.category}</span>
                </div>
                <div class="signal-card-actions">
                    <button class="btn-sm btn-export" data-export="${enc.id}" title="Export as PNG">
                        <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                        PNG
                    </button>
                </div>
            </div>
            <div class="signal-canvas-wrapper">
                <canvas class="signal-canvas" id="canvas-${enc.id}"></canvas>
            </div>
            <div class="signal-description">${enc.description}</div>
        `;

        // Render after append
        requestAnimationFrame(() => {
            const canvas = card.querySelector('canvas');
            if (canvas) {
                SignalRenderer.render(canvas, state.bits, encoded, enc.color);
            }
        });

        // Export button
        const exportBtn = card.querySelector('[data-export]');
        exportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const canvas = card.querySelector('canvas');
            if (canvas) {
                SignalRenderer.exportPNG(canvas, `${enc.id}_${state.bits.join('')}`);
            }
        });

        return card;
    }

    // === Random Bits ===
    function generateRandom() {
        const len = 8;
        const bits = Array.from({ length: len }, () => Math.round(Math.random()));
        els.binaryInput.value = bits.join('');
        parseInput(els.binaryInput.value);
    }

    // === Window Resize Handler ===
    let resizeTimer;
    function handleResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => renderSignals(), 150);
    }

    // === Event Listeners ===
    function bindEvents() {
        // Binary input
        els.binaryInput.addEventListener('input', (e) => parseInput(e.target.value));
        els.binaryInput.addEventListener('keydown', (e) => {
            // Allow only 0, 1, backspace, delete, arrows, ctrl+a, ctrl+c, ctrl+v
            const allowed = ['0', '1', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
            if (!allowed.includes(e.key) && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
            }
        });

        // Buttons
        els.btnRandom.addEventListener('click', generateRandom);
        els.btnClear.addEventListener('click', () => {
            els.binaryInput.value = '';
            parseInput('');
        });
        els.btnSelectAll.addEventListener('click', () => {
            LineEncoders.ENCODERS.forEach(e => state.selectedEncodings.add(e.id));
            document.querySelectorAll('.encoding-chip').forEach(c => c.classList.add('active'));
            renderSignals();
        });
        els.btnDeselectAll.addEventListener('click', () => {
            state.selectedEncodings.clear();
            document.querySelectorAll('.encoding-chip').forEach(c => c.classList.remove('active'));
            renderSignals();
        });
        els.btnExportAll.addEventListener('click', () => {
            const canvases = document.querySelectorAll('.signal-canvas');
            canvases.forEach(c => {
                const id = c.id.replace('canvas-', '');
                SignalRenderer.exportPNG(c, `${id}_${state.bits.join('')}`);
            });
        });

        // Theme
        els.btnThemeToggle.addEventListener('click', () => {
            applyTheme(state.theme === 'dark' ? 'light' : 'dark');
        });

        // Modal
        els.btnInfo.addEventListener('click', () => els.infoModal.classList.add('active'));
        els.modalClose.addEventListener('click', () => els.infoModal.classList.remove('active'));
        els.infoModal.addEventListener('click', (e) => {
            if (e.target === els.infoModal) els.infoModal.classList.remove('active');
        });

        // Clock rate
        els.clockInc.addEventListener('click', () => {
            state.clockRate = Math.min(state.clockRate + 1, 10);
            els.clockRateDisplay.textContent = state.clockRate;
        });
        els.clockDec.addEventListener('click', () => {
            state.clockRate = Math.max(state.clockRate - 1, 1);
            els.clockRateDisplay.textContent = state.clockRate;
        });

        // Resize
        window.addEventListener('resize', handleResize);

        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') els.infoModal.classList.remove('active');
        });
    }

    // === Init ===
    function init() {
        applyTheme(state.theme);
        buildEncodingGrid();
        bindEvents();
        // Start with a sample
        els.binaryInput.value = '10110010';
        parseInput('10110010');
        els.binaryInput.focus();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
