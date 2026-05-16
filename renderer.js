/**
 * SignalRenderer — Draws line-coded waveforms on HTML Canvas
 */
const SignalRenderer = (() => {
    const DPR = window.devicePixelRatio || 1;

    // Get CSS variable values
    function getCSSVar(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }

    /**
     * Render a signal waveform onto a canvas element
     * @param {HTMLCanvasElement} canvas 
     * @param {number[]} bits - Array of 0/1 
     * @param {object} encoded - { levels, transitions, yRange, is2B1Q }
     * @param {string} color - CSS color for the signal line
     */
    function render(canvas, bits, encoded, color) {
        const ctx = canvas.getContext('2d');
        const wrapper = canvas.parentElement;
        const width = wrapper.clientWidth - 16; // padding
        const height = 160;

        canvas.width = width * DPR;
        canvas.height = height * DPR;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(DPR, DPR);

        const { levels, yRange, is2B1Q } = encoded;
        const [yMin, yMax] = yRange;
        const ySpan = yMax - yMin;

        // Layout constants
        const padLeft = 44;
        const padRight = 20;
        const padTop = 20;
        const padBottom = 28;
        const plotW = width - padLeft - padRight;
        const plotH = height - padTop - padBottom;

        // How many half-bit slots
        const halfBits = levels.length;
        const numBits = bits.length;
        const slotW = plotW / halfBits;

        // Helpers
        function xForSlot(i) { return padLeft + i * slotW; }
        function yForVal(v) { return padTop + plotH - ((v - yMin) / ySpan) * plotH; }

        // Clear
        const bgColor = getCSSVar('--signal-bg');
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);

        // Draw bit-period backgrounds (alternating subtle shading)
        const bitBg = getCSSVar('--signal-bit-bg');
        for (let i = 0; i < numBits; i++) {
            if (i % 2 === 0) {
                const slotsPerBit = is2B1Q ? 4 : 2;
                const bitIdx = is2B1Q ? Math.floor(i / 2) : i;
                const x = xForSlot(is2B1Q ? bitIdx * slotsPerBit : i * 2);
                const w = slotW * slotsPerBit;
                ctx.fillStyle = bitBg;
                ctx.fillRect(x, padTop, w, plotH);
            }
        }

        // Draw grid lines
        const gridColor = getCSSVar('--signal-grid');
        const axisColor = getCSSVar('--signal-axis');
        const textColor = getCSSVar('--signal-text');
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;

        // Determine which y-levels to draw
        let gridLevels;
        if (is2B1Q) {
            gridLevels = [-3, -1, 0, 1, 3];
        } else if (yMin >= -0.3) {
            gridLevels = [0, 1];
        } else {
            gridLevels = [-1, 0, 1];
        }

        // Horizontal grid lines + labels
        ctx.font = `600 10px ${getCSSVar('--font-mono') || 'monospace'}`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        for (const gv of gridLevels) {
            const gy = yForVal(gv);
            ctx.beginPath();
            ctx.strokeStyle = gv === 0 ? axisColor : gridColor;
            ctx.lineWidth = gv === 0 ? 1.2 : 0.8;
            ctx.setLineDash(gv === 0 ? [] : [4, 4]);
            ctx.moveTo(padLeft, gy);
            ctx.lineTo(padLeft + plotW, gy);
            ctx.stroke();
            ctx.setLineDash([]);

            // Y-axis labels
            ctx.fillStyle = textColor;
            let label;
            if (is2B1Q) {
                label = gv > 0 ? `+${gv}` : `${gv}`;
            } else {
                label = gv > 0 ? '+V' : gv < 0 ? '−V' : '0';
            }
            ctx.fillText(label, padLeft - 6, gy);
        }

        // Vertical bit separators
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 3]);
        const slotsPerBit = is2B1Q ? 4 : 2;
        for (let i = 0; i <= numBits; i++) {
            const bitSlotIdx = is2B1Q ? Math.floor(i / 2) * slotsPerBit : i * 2;
            if (is2B1Q && i % 2 !== 0 && i < numBits) continue;
            const sx = xForSlot(is2B1Q ? (i / 2) * slotsPerBit : i * 2);
            if (sx > padLeft + plotW + 1) continue;
            ctx.beginPath();
            ctx.moveTo(sx, padTop);
            ctx.lineTo(sx, padTop + plotH);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // Mid-bit dashed lines (for encodings with mid-bit transitions)
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.5;
        ctx.setLineDash([2, 3]);
        if (!is2B1Q) {
            for (let i = 0; i < numBits; i++) {
                const mx = xForSlot(i * 2 + 1);
                ctx.beginPath();
                ctx.moveTo(mx, padTop);
                ctx.lineTo(mx, padTop + plotH);
                ctx.stroke();
            }
        }
        ctx.setLineDash([]);

        // Draw signal waveform
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'miter';
        ctx.lineCap = 'butt';
        ctx.beginPath();

        for (let i = 0; i < halfBits; i++) {
            const x1 = xForSlot(i);
            const x2 = xForSlot(i + 1);
            const y = yForVal(levels[i]);

            if (i === 0) {
                ctx.moveTo(x1, y);
            } else {
                const prevY = yForVal(levels[i - 1]);
                if (Math.abs(prevY - y) > 0.5) {
                    // Vertical transition
                    ctx.lineTo(x1, y);
                }
            }
            ctx.lineTo(x2, y);
        }
        ctx.stroke();

        // Signal glow effect
        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.globalAlpha = 0.08;
        ctx.beginPath();
        for (let i = 0; i < halfBits; i++) {
            const x1 = xForSlot(i);
            const x2 = xForSlot(i + 1);
            const y = yForVal(levels[i]);
            if (i === 0) {
                ctx.moveTo(x1, y);
            } else {
                const prevY = yForVal(levels[i - 1]);
                if (Math.abs(prevY - y) > 0.5) {
                    ctx.lineTo(x1, y);
                }
            }
            ctx.lineTo(x2, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Bit labels at the bottom
        ctx.font = `700 11px ${getCSSVar('--font-mono') || 'monospace'}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        if (is2B1Q) {
            // Show 2-bit pairs
            const padded = [...bits];
            if (padded.length % 2 !== 0) padded.push(0);
            for (let i = 0; i < padded.length; i += 2) {
                const pairIdx = i / 2;
                const cx = xForSlot(pairIdx * 4 + 2);
                ctx.fillStyle = getCSSVar('--accent-2') || '#a78bfa';
                ctx.fillText(`${padded[i]}${padded[i+1]}`, cx, padTop + plotH + 8);
            }
        } else {
            for (let i = 0; i < numBits; i++) {
                const cx = xForSlot(i * 2 + 1);
                ctx.fillStyle = bits[i] === 1
                    ? (getCSSVar('--accent-2') || '#a78bfa')
                    : (textColor || '#666');
                ctx.fillText(bits[i].toString(), cx, padTop + plotH + 8);
            }
        }

        // Clock markers at top
        ctx.font = `500 8px ${getCSSVar('--font-mono') || 'monospace'}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = textColor;
        if (!is2B1Q) {
            for (let i = 0; i <= numBits; i++) {
                const tx = xForSlot(i * 2);
                ctx.fillText(`${i}T`, tx, padTop - 4);
            }
        }
    }

    /**
     * Export a canvas as PNG
     */
    function exportPNG(canvas, filename) {
        const link = document.createElement('a');
        link.download = filename + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    return { render, exportPNG };
})();
