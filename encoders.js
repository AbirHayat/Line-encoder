/**
 * Line Coding Encoders
 * Each encoder takes an array of bits (0s and 1s) and returns an array of signal segments.
 * Each segment: { y: number, duration: number }  where y ∈ {-1, -0.5, 0, 0.5, 1} (or fractional for multi-level)
 * A "step" in the returned array represents half-bit or full-bit depending on the encoding.
 * 
 * For rendering, each encoder returns:
 * { levels: number[], transitions: 'step'|'smooth', yRange: [min, max] }
 *   - levels: signal level at each half-bit interval
 *   - transitions: how to draw between levels
 *   - yRange: min and max values for y-axis scaling
 */

const LineEncoders = (() => {

    /**
     * Unipolar NRZ: 1→+V, 0→0
     */
    function unipolarNRZ(bits) {
        const levels = [];
        for (const b of bits) {
            levels.push(b === 1 ? 1 : 0);
            levels.push(b === 1 ? 1 : 0);
        }
        return { levels, transitions: 'step', yRange: [-0.2, 1.2] };
    }

    /**
     * Polar NRZ-L (Non-Return-to-Zero Level): 1→+V, 0→−V
     */
    function polarNRZL(bits) {
        const levels = [];
        for (const b of bits) {
            const v = b === 1 ? 1 : -1;
            levels.push(v);
            levels.push(v);
        }
        return { levels, transitions: 'step', yRange: [-1.3, 1.3] };
    }

    /**
     * Polar NRZ-I (Non-Return-to-Zero Inverted): 1→transition, 0→no change
     */
    function polarNRZI(bits) {
        const levels = [];
        let current = 1; // start positive
        for (const b of bits) {
            if (b === 1) current = -current; // invert on 1
            levels.push(current);
            levels.push(current);
        }
        return { levels, transitions: 'step', yRange: [-1.3, 1.3] };
    }

    /**
     * Polar RZ (Return-to-Zero): 1→+V first half, 0 second half; 0→−V first half, 0 second half
     */
    function polarRZ(bits) {
        const levels = [];
        for (const b of bits) {
            levels.push(b === 1 ? 1 : -1);
            levels.push(0); // return to zero
        }
        return { levels, transitions: 'step', yRange: [-1.3, 1.3] };
    }

    /**
     * Unipolar RZ: 1→+V first half, 0 second half; 0→0 entire bit
     */
    function unipolarRZ(bits) {
        const levels = [];
        for (const b of bits) {
            levels.push(b === 1 ? 1 : 0);
            levels.push(0);
        }
        return { levels, transitions: 'step', yRange: [-0.2, 1.2] };
    }

    /**
     * Bipolar AMI (Alternate Mark Inversion): 0→0, 1→alternating +V/−V
     */
    function bipolarAMI(bits) {
        const levels = [];
        let lastPolarity = -1; // first 1 will be +1
        for (const b of bits) {
            if (b === 1) {
                lastPolarity = -lastPolarity;
                levels.push(lastPolarity);
                levels.push(lastPolarity);
            } else {
                levels.push(0);
                levels.push(0);
            }
        }
        return { levels, transitions: 'step', yRange: [-1.3, 1.3] };
    }

    /**
     * Pseudoternary: 1→0, 0→alternating +V/−V
     */
    function pseudoternary(bits) {
        const levels = [];
        let lastPolarity = -1;
        for (const b of bits) {
            if (b === 0) {
                lastPolarity = -lastPolarity;
                levels.push(lastPolarity);
                levels.push(lastPolarity);
            } else {
                levels.push(0);
                levels.push(0);
            }
        }
        return { levels, transitions: 'step', yRange: [-1.3, 1.3] };
    }

    /**
     * Bipolar AMI-RZ: Like AMI but returns to zero mid-bit
     */
    function bipolarAMIRZ(bits) {
        const levels = [];
        let lastPolarity = -1;
        for (const b of bits) {
            if (b === 1) {
                lastPolarity = -lastPolarity;
                levels.push(lastPolarity);
                levels.push(0);
            } else {
                levels.push(0);
                levels.push(0);
            }
        }
        return { levels, transitions: 'step', yRange: [-1.3, 1.3] };
    }

    /**
     * Manchester (IEEE 802.3): 1→High-to-Low mid-bit, 0→Low-to-High mid-bit
     */
    function manchester(bits) {
        const levels = [];
        for (const b of bits) {
            if (b === 1) {
                levels.push(1);   // first half high
                levels.push(-1);  // second half low
            } else {
                levels.push(-1);  // first half low
                levels.push(1);   // second half high
            }
        }
        return { levels, transitions: 'step', yRange: [-1.3, 1.3] };
    }

    /**
     * Differential Manchester (IEEE 802.5):
     * Always a transition at mid-bit.
     * 0 → transition at the START of the bit period (inversion)
     * 1 → NO transition at the start (same level continues)
     */
    function differentialManchester(bits) {
        const levels = [];
        let current = 1; // start with positive
        for (const b of bits) {
            if (b === 0) {
                // Transition at start
                current = -current;
            }
            // No transition at start for 1
            // First half = current
            levels.push(current);
            // Mid-bit transition always
            current = -current;
            levels.push(current);
        }
        return { levels, transitions: 'step', yRange: [-1.3, 1.3] };
    }

    /**
     * MLT-3 (Multi-Level Transmit 3):
     * On 1: cycle through 0 → +1 → 0 → −1 → 0 → +1 ...
     * On 0: no change
     */
    function mlt3(bits) {
        const levels = [];
        const sequence = [0, 1, 0, -1]; // cycle
        let idx = 0;
        let current = 0;
        for (const b of bits) {
            if (b === 1) {
                idx = (idx + 1) % 4;
                current = sequence[idx];
            }
            levels.push(current);
            levels.push(current);
        }
        return { levels, transitions: 'step', yRange: [-1.3, 1.3] };
    }

    /**
     * 2B1Q: Maps pairs of bits to 4 voltage levels
     * 00 → -3, 01 → -1, 11 → +1, 10 → +3
     */
    function twoBoneQ(bits) {
        const levels = [];
        const mapping = { '00': -3, '01': -1, '11': 1, '10': 3 };
        // Pad to even length
        const padded = [...bits];
        if (padded.length % 2 !== 0) padded.push(0);
        
        for (let i = 0; i < padded.length; i += 2) {
            const pair = `${padded[i]}${padded[i + 1]}`;
            const v = mapping[pair];
            levels.push(v);
            levels.push(v);
            levels.push(v);
            levels.push(v);
        }
        return { levels, transitions: 'step', yRange: [-4, 4], is2B1Q: true };
    }

    // Registry of all encoders
    const ENCODERS = [
        {
            id: 'unipolar-nrz',
            name: 'Unipolar NRZ',
            category: 'Unipolar',
            color: '#34d399',
            description: 'Binary 1 is represented by a high voltage (+V) and binary 0 by zero voltage for the entire bit duration.',
            encode: unipolarNRZ
        },
        {
            id: 'unipolar-rz',
            name: 'Unipolar RZ',
            category: 'Unipolar',
            color: '#6ee7b7',
            description: 'Binary 1 is +V for the first half and returns to zero; binary 0 remains at zero voltage.',
            encode: unipolarRZ
        },
        {
            id: 'polar-nrz-l',
            name: 'Polar NRZ-L',
            category: 'Polar',
            color: '#818cf8',
            description: 'Binary 1 is represented by positive voltage (+V) and binary 0 by negative voltage (−V) for the full bit period.',
            encode: polarNRZL
        },
        {
            id: 'polar-nrz-i',
            name: 'Polar NRZ-I',
            category: 'Polar',
            color: '#a78bfa',
            description: 'A transition (inversion) at the start of the bit represents binary 1; no transition represents binary 0.',
            encode: polarNRZI
        },
        {
            id: 'polar-rz',
            name: 'Polar RZ',
            category: 'Polar',
            color: '#c084fc',
            description: 'Binary 1 → +V first half then zero; Binary 0 → −V first half then zero. Always returns to zero mid-bit.',
            encode: polarRZ
        },
        {
            id: 'bipolar-ami',
            name: 'Bipolar AMI',
            category: 'Bipolar',
            color: '#f472b6',
            description: 'Binary 0 → zero voltage. Binary 1 → alternating between +V and −V (Alternate Mark Inversion).',
            encode: bipolarAMI
        },
        {
            id: 'bipolar-ami-rz',
            name: 'Bipolar AMI-RZ',
            category: 'Bipolar',
            color: '#fb7185',
            description: 'Like AMI, but each mark pulse returns to zero at mid-bit. Combines AMI with return-to-zero.',
            encode: bipolarAMIRZ
        },
        {
            id: 'pseudoternary',
            name: 'Pseudoternary',
            category: 'Bipolar',
            color: '#fb923c',
            description: 'Inverse of AMI: binary 1 → zero voltage, binary 0 → alternating +V/−V.',
            encode: pseudoternary
        },
        {
            id: 'manchester',
            name: 'Manchester',
            category: 'Biphase',
            color: '#38bdf8',
            description: 'IEEE 802.3: Binary 1 → high-to-low transition at mid-bit. Binary 0 → low-to-high transition at mid-bit.',
            encode: manchester
        },
        {
            id: 'diff-manchester',
            name: 'Diff. Manchester',
            category: 'Biphase',
            color: '#22d3ee',
            description: 'IEEE 802.5: Always a mid-bit transition. Binary 0 → transition at bit start; Binary 1 → no transition at start.',
            encode: differentialManchester
        },
        {
            id: 'mlt3',
            name: 'MLT-3',
            category: 'Multi-level',
            color: '#fbbf24',
            description: 'Cycles through levels 0→+1→0→−1 on each binary 1. No change on binary 0. Used in 100BASE-TX.',
            encode: mlt3
        },
        {
            id: '2b1q',
            name: '2B1Q',
            category: 'Multi-level',
            color: '#f59e0b',
            description: 'Maps 2-bit pairs to 4 voltage levels: 00→−3, 01→−1, 11→+1, 10→+3. Used in ISDN and DSL.',
            encode: twoBoneQ
        }
    ];

    return { ENCODERS };
})();
