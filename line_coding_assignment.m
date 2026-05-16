% MATLAB Script to Plot Line Coding Schemes for Binary Sequence 10010110
clear; clc; close all;

bits = [1, 0, 0, 1, 0, 1, 1, 0]; 
num_bits = length(bits);
N = 100; % Number of samples per bit interval for smooth, sharp lines
total_samples = num_bits * N;
t = (0 : total_samples - 1) / N; % Normalized time axis

% Pre-allocate signal arrays with zeros
ami = zeros(1, total_samples);
rz = zeros(1, total_samples);
manchester = zeros(1, total_samples);
diff_manchester = zeros(1, total_samples);

last_ami_sign = 1;   % Tracks alternating signs for AMI (starts positive)
last_diff_level = -1; % Tracks ending voltage of previous bit for Diff Manchester

for i = 1:num_bits
    % Define array index ranges for the full bit, first half, and second half
    idx = (i-1)*N + 1 : i*N;
    first_half = (i-1)*N + 1 : (i-1)*N + N/2;
    second_half = (i-1)*N + N/2 + 1 : i*N;
    
    % 1. Bipolar AMI Encoding
    if bits(i) == 1
        ami(idx) = last_ami_sign;
        last_ami_sign = -last_ami_sign; % Alternate the sign for the next '1'
    else
        ami(idx) = 0;
    end
    
    % 2. Polar RZ (Return to Zero) Encoding
    if bits(i) == 1
        rz(first_half) = 1;
    else
        rz(first_half) = -1;
    end
    rz(second_half) = 0; % Always drops to 0 at the mid-bit point
    
    % 3. Manchester Encoding (IEEE 802.3: 0 = High->Low, 1 = Low->High)
    if bits(i) == 1
        manchester(first_half) = -1;
        manchester(second_half) = 1;
    else
        manchester(first_half) = 1;
        manchester(second_half) = -1;
    end
    
    % 4. Differential Manchester Encoding
    % Bit 0: forces a transition at the start boundary. 
    % Bit 1: forces NO transition at the start boundary.
    if bits(i) == 0
        start_level = -last_diff_level; % Invert previous level
    else
        start_level = last_diff_level;  % Keep previous level
    end
    mid_level = -start_level; % Mandatory mid-bit flip
    
    diff_manchester(first_half) = start_level;
    diff_manchester(second_half) = mid_level;
    last_diff_level = mid_level; % Store for the next bit interval
end

% --- PLOTTING SECTION ---
figure('Name', 'Data Comm Line Coding Assignment', 'Position', [200, 100, 900, 700]);

% Setup common properties for cleaner look
bit_labels = {'', '1', '0', '0', '1', '0', '1', '1', '0'};

% Subplot 1: Bipolar AMI
subplot(4,1,1); plot(t, ami, 'LineWidth', 2.5, 'Color', [0 0.4470 0.7410]); grid on;
title('i) Bipolar AMI', 'FontSize', 11); ylim([-1.5 1.5]);
xticks(0:num_bits); xticklabels(bit_labels); yticks([-1 0 1]);

% Subplot 2: Polar RZ
subplot(4,1,2); plot(t, rz, 'LineWidth', 2.5, 'Color', [0.8500 0.3250 0.0980]); grid on;
title('ii) Polar RZ', 'FontSize', 11); ylim([-1.5 1.5]);
xticks(0:num_bits); xticklabels(bit_labels); yticks([-1 0 1]);

% Subplot 3: Manchester
subplot(4,1,3); plot(t, manchester, 'LineWidth', 2.5, 'Color', [0.9290 0.6940 0.1250]); grid on;
title('iii) Manchester NRZ (IEEE 802.3 Standard)', 'FontSize', 11); ylim([-1.5 1.5]);
xticks(0:num_bits); xticklabels(bit_labels); yticks([-1 0 1]);

% Subplot 4: Differential Manchester
subplot(4,1,4); plot(t, diff_manchester, 'LineWidth', 2.5, 'Color', [0.4660 0.6740 0.1880]); grid on;
title('iv) Differential Manchester NRZ', 'FontSize', 11); ylim([-1.5 1.5]);
xticks(0:num_bits); xticklabels(bit_labels); yticks([-1 0 1]);

xlabel('Bit Intervals / Time', 'FontSize', 12, 'FontWeight', 'bold');