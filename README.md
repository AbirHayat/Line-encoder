# Line Code Lab — Digital Signal Visualizer

An interactive web application that converts binary sequences into digital line coding waveforms. Visualize and compare all major encoding schemes used in data communications.

## 🔗 Live Demo

**[https://abirhayat.github.io/Line-encoder/](https://abirhayat.github.io/Line-encoder/)**

## Features

- **12 encoding schemes** covering all major line coding categories
- **Real-time visualization** — waveforms update instantly as you type
- **Interactive controls** — select/deselect individual schemes, generate random sequences
- **Export to PNG** — download individual or all waveforms
- **Dark / Light theme** toggle
- **Responsive** — works on desktop and mobile

## Supported Line Coding Schemes

All encoding implementations follow the conventions described in **"Data Communications and Networking" by Behrouz A. Forouzan** (5th Edition, Chapter 4: Digital Transmission).

---

### 1. Unipolar NRZ (Non-Return-to-Zero)

The simplest encoding scheme. A positive voltage represents binary **1** and zero voltage represents binary **0**. The signal level remains constant throughout the entire bit interval — it does not return to zero.

| Bit | Signal Level |
|-----|-------------|
| 1   | +V (positive voltage) |
| 0   | 0 (zero voltage) |

**Disadvantage:** Contains a DC component and lacks synchronization capability.

---

### 2. Unipolar RZ (Return-to-Zero)

Similar to Unipolar NRZ, but the signal returns to zero at the midpoint of each bit interval for binary **1**. Binary **0** remains at zero for the entire bit period.

| Bit | First Half | Second Half |
|-----|-----------|-------------|
| 1   | +V | 0 |
| 0   | 0  | 0 |

**Advantage:** The return-to-zero provides some self-clocking capability.

---

### 3. Polar NRZ-L (Non-Return-to-Zero Level)

Uses two voltage levels to represent binary data. The level of the voltage determines the bit value. Binary **1** is represented by positive voltage and binary **0** by negative voltage.

| Bit | Signal Level |
|-----|-------------|
| 1   | +V (positive voltage) |
| 0   | −V (negative voltage) |

**Advantage:** Simple implementation, no DC component for balanced data.

---

### 4. Polar NRZ-I (Non-Return-to-Zero Inverted)

The signal is encoded based on transitions rather than levels. A **transition** (inversion) at the beginning of a bit interval represents binary **1**. **No transition** means binary **0**.

| Bit | Behavior |
|-----|---------|
| 1   | Transition (invert the signal) at the start of the bit |
| 0   | No transition (signal remains at previous level) |

**Advantage:** More reliable than NRZ-L because errors in polarity do not affect decoding. Used in USB.

---

### 5. Polar RZ (Return-to-Zero)

Combines the concepts of polar encoding and return-to-zero. The signal uses three voltage levels: positive, negative, and zero. The signal always returns to zero at the midpoint of each bit.

| Bit | First Half | Second Half |
|-----|-----------|-------------|
| 1   | +V | 0 |
| 0   | −V | 0 |

**Advantage:** Self-clocking due to guaranteed transition at mid-bit.  
**Disadvantage:** Requires more bandwidth (three levels, two transitions per bit).

---

### 6. Bipolar AMI (Alternate Mark Inversion)

A bipolar scheme that uses three voltage levels. Binary **0** is always represented by zero voltage. Binary **1** is represented by alternating positive and negative voltages — each successive **1** alternates polarity.

| Bit | Signal Level |
|-----|-------------|
| 0   | 0 (zero voltage) |
| 1   | Alternating +V and −V |

**Example:** For `1 0 1 1 0 1`, the 1s produce: +V, −V, +V, −V

**Advantage:** No DC component; error detection capability (two consecutive same-polarity pulses indicate an error).

---

### 7. Bipolar AMI-RZ (AMI with Return-to-Zero)

A variation of Bipolar AMI where each pulse (for binary **1**) returns to zero at the midpoint of the bit interval. Binary **0** remains at zero.

| Bit | First Half | Second Half |
|-----|-----------|-------------|
| 0   | 0 | 0 |
| 1   | Alternating ±V | 0 |

**Advantage:** Combines AMI's DC balance with RZ's self-clocking.

---

### 8. Pseudoternary

The inverse of Bipolar AMI. Binary **1** is encoded as zero voltage, while binary **0** alternates between positive and negative voltages.

| Bit | Signal Level |
|-----|-------------|
| 1   | 0 (zero voltage) |
| 0   | Alternating +V and −V |

**Note:** Same performance characteristics as AMI, just with inverted bit-to-signal mapping.

---

### 9. Manchester (IEEE 802.3)

A biphase encoding where every bit has a guaranteed transition at the **midpoint** of the bit interval. As defined in Forouzan's textbook:

| Bit | First Half | Second Half | Mid-bit Transition |
|-----|-----------|-------------|-------------------|
| 1   | −V (Low) | +V (High) | Low → High |
| 0   | +V (High) | −V (Low) | High → Low |

**Advantage:** Self-synchronizing — the mid-bit transition serves as both data and clock.  
**Used in:** IEEE 802.3 Ethernet (10BASE-T).

---

### 10. Differential Manchester (IEEE 802.5)

A biphase encoding that always has a **mandatory transition at the midpoint** of every bit. The encoding is determined by whether or not there is a transition at the **start** of the bit interval:

| Bit | Start of Bit | Mid-Bit |
|-----|-------------|---------|
| 0   | **Transition** (invert) | Transition (always) |
| 1   | **No transition** (same level) | Transition (always) |

**Advantage:** More reliable than standard Manchester because it is differential — the decoding depends on transitions, not absolute polarity. Immune to polarity inversion.  
**Used in:** IEEE 802.5 Token Ring.

---

### 11. MLT-3 (Multi-Level Transmit 3)

Uses three voltage levels (−V, 0, +V) and cycles through them on each binary **1**. On binary **0**, the signal remains at its current level.

The cycling pattern for consecutive 1s: **0 → +V → 0 → −V → 0 → +V → ...**

| Bit | Behavior |
|-----|---------|
| 1   | Move to next level in the cycle |
| 0   | Stay at current level |

**Advantage:** Reduces the bandwidth requirement by lowering the signal frequency.  
**Used in:** 100BASE-TX Fast Ethernet.

---

### 12. 2B1Q (2 Binary, 1 Quaternary)

A multi-level encoding that maps every **2 bits** into one of **4 voltage levels**. This doubles the data rate compared to binary schemes for the same baud rate.

| Bit Pair | Voltage Level |
|----------|--------------|
| 00       | −3 |
| 01       | −1 |
| 11       | +1 |
| 10       | +3 |

**Advantage:** Doubles data rate — sends 2 bits per signal element.  
**Used in:** ISDN Basic Rate Interface (BRI) and early DSL.

---

## Reference

> **Forouzan, B. A. (2013). *Data Communications and Networking* (5th Edition). McGraw-Hill Education.**  
> Chapter 4: Digital Transmission — Line Coding Schemes.

## Author

**Mohammad Abir Hayat**  
GitHub: [github.com/AbirHayat](https://github.com/AbirHayat)

## License

This project is open source and available under the [MIT License](LICENSE).
