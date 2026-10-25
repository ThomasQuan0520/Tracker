window.masterScopeAnimation = (() => {
    const scopeCanvas = document.getElementById('master-scope');
    const scopeCtx = scopeCanvas.getContext('2d');
    const sourceCanvas = document.createElement('canvas');

    function align() {
        const container = document.getElementById('master-scope-container');
        const header = document.getElementById('glitch-header');
        const workspace = document.getElementById('workspace');
        if (!container || !header || !workspace) return;
        const availableHeight = header.clientHeight;
        if (availableHeight <= 0) return;

        const maxWidth = Math.min(window.innerWidth * 0.3, 300);
        const width = Math.min(maxWidth, availableHeight * (4 / 3));
        const rightOffset = header.getBoundingClientRect().right - workspace.getBoundingClientRect().right;
        container.style.width = `${width}px`;
        container.style.left = 'auto';
        container.style.right = `${rightOffset}px`;
        container.style.top = '0';
        container.style.transform = 'none';
    }

    function resize(state) {
        align(state);
        scopeCanvas.width = scopeCanvas.clientWidth;
        scopeCanvas.height = scopeCanvas.clientHeight;
        sourceCanvas.width = scopeCanvas.width;
        sourceCanvas.height = scopeCanvas.height;
    }

    function renderWaveform({ analyser, scopeDataArray, breathingAmount }) {
        const width = scopeCanvas.width;
        const height = scopeCanvas.height;
        const sourceCtx = sourceCanvas.getContext('2d');
        sourceCtx.clearRect(0, 0, width, height);
        analyser.getByteTimeDomainData(scopeDataArray);
        sourceCtx.strokeStyle = '#FFFFFF';
        sourceCtx.lineWidth = 2;
        sourceCtx.lineCap = 'round';
        sourceCtx.beginPath();
        const sliceWidth = width / analyser.frequencyBinCount;
        for (let index = 0; index < analyser.frequencyBinCount; index += 2) {
            const normalized = Math.max(-1, Math.min(1, ((scopeDataArray[index] - 128) / 128) * 2));
            const x = Math.floor(index * sliceWidth);
            const y = Math.floor((normalized + 1) * height / 2);
            if (index === 0) sourceCtx.moveTo(x, y);
            else sourceCtx.lineTo(x, y);
            sourceCtx.moveTo(x, height / 2);
            sourceCtx.lineTo(x, y);
            sourceCtx.moveTo(x, y);
        }
        sourceCtx.stroke();
        drawDotMatrix(scopeCanvas, sourceCanvas, breathingAmount);
    }

    function renderTearEye({ timestamp, breathingAmount }) {
        const width = scopeCanvas.width;
        const height = scopeCanvas.height;
        const sourceCtx = sourceCanvas.getContext('2d');
        sourceCtx.clearRect(0, 0, width, height);
        const centerX = width / 2;
        const centerY = height / 2;
        const eyeWidth = height * 0.55;
        const eyeHeight = height * 0.22;
        const path = () => {
            sourceCtx.beginPath();
            sourceCtx.moveTo(centerX - eyeWidth, centerY - eyeHeight * 0.3);
            sourceCtx.bezierCurveTo(centerX - eyeWidth * 0.3, centerY - eyeHeight * 1.6, centerX + eyeWidth * 0.5, centerY - eyeHeight * 1.2, centerX + eyeWidth, centerY + eyeHeight * 0.4);
            sourceCtx.bezierCurveTo(centerX + eyeWidth * 0.3, centerY + eyeHeight * 1.2, centerX - eyeWidth * 0.4, centerY + eyeHeight * 0.9, centerX - eyeWidth, centerY - eyeHeight * 0.3);
        };

        sourceCtx.strokeStyle = '#FFFFFF';
        sourceCtx.fillStyle = '#FFFFFF';
        sourceCtx.lineCap = 'round';
        sourceCtx.lineJoin = 'round';
        sourceCtx.lineWidth = 1;
        for (let x = -width; x < width * 2; x += 15) {
            sourceCtx.beginPath();
            sourceCtx.moveTo(x, 0);
            sourceCtx.lineTo(x - height, height);
            sourceCtx.stroke();
        }
        sourceCtx.globalCompositeOperation = 'destination-out';
        path();
        sourceCtx.fill();
        sourceCtx.globalCompositeOperation = 'source-over';
        sourceCtx.save();
        path();
        sourceCtx.clip();
        const irisX = centerX - eyeWidth * 0.05;
        const irisY = centerY - eyeHeight * 0.2;
        const irisRadius = eyeHeight * 0.75;
        sourceCtx.lineWidth = 2;
        sourceCtx.beginPath();
        sourceCtx.arc(irisX, irisY, irisRadius, 0, Math.PI * 2);
        sourceCtx.stroke();
        sourceCtx.beginPath();
        sourceCtx.arc(irisX, irisY, irisRadius * 0.4, 0, Math.PI * 2);
        sourceCtx.fill();
        sourceCtx.restore();
        sourceCtx.lineWidth = 3.5;
        path();
        sourceCtx.stroke();

        const phase = (timestamp % 1400) / 1400;
        const tearX = centerX + eyeWidth * 0.42;
        const tearStartY = centerY + eyeHeight * 0.7;
        const tearEndY = tearStartY + height * 0.5;
        if (phase < 0.25) {
            sourceCtx.beginPath();
            sourceCtx.arc(tearX, tearStartY, phase / 0.25 * 5, 0, Math.PI);
            sourceCtx.fill();
        } else if (phase < 0.8) {
            const tearY = tearStartY + Math.pow(phase, 1.8) * height * 0.5;
            sourceCtx.beginPath();
            sourceCtx.arc(tearX, tearY, 4.5, 0, Math.PI * 2);
            sourceCtx.fill();
        } else {
            const splash = (phase - 0.8) / 0.2;
            sourceCtx.beginPath();
            sourceCtx.arc(tearX - 7 * splash, tearEndY, 2 * (1 - splash), 0, Math.PI * 2);
            sourceCtx.arc(tearX + 7 * splash, tearEndY - 4 * splash, 1.5 * (1 - splash), 0, Math.PI * 2);
            sourceCtx.fill();
        }
        drawDotMatrix(scopeCanvas, sourceCanvas, breathingAmount);
    }

    function renderPedestrianCrossing({ timestamp, breathingAmount }) {
        const width = scopeCanvas.width;
        const height = scopeCanvas.height;
        const sourceCtx = sourceCanvas.getContext('2d');
        sourceCtx.clearRect(0, 0, width, height);
        sourceCtx.lineCap = 'round';
        sourceCtx.lineJoin = 'round';

        const signalX = width * 0.18;
        const signalY = height * 0.16;
        const signalWidth = Math.max(24, height * 0.2);
        const signalHeight = height * 0.6;
        const lightRadius = Math.max(4, signalWidth * 0.2);
        const phase = (timestamp % 2400) / 2400;
        const walkPhase = (timestamp % 900) / 900;
        const signalState = phase < 0.4
            ? 'red'
            : phase < 0.5
                ? 'red-amber'
                : phase < 0.85
                    ? 'green'
                    : 'amber';

        sourceCtx.strokeStyle = '#FFFFFF';
        sourceCtx.lineWidth = 2;
        sourceCtx.strokeRect(signalX, signalY, signalWidth, signalHeight);
        const lightY = [signalY + signalHeight * 0.22, signalY + signalHeight * 0.5, signalY + signalHeight * 0.78];
        lightY.forEach((y, index) => {
            const active = (index === 0 && (signalState === 'red' || signalState === 'red-amber')) ||
                (index === 1 && (signalState === 'red-amber' || signalState === 'amber')) ||
                (index === 2 && signalState === 'green');
            if (!active) return;
            sourceCtx.fillStyle = '#FFFFFF';
            sourceCtx.beginPath();
            sourceCtx.arc(signalX + signalWidth / 2, y, lightRadius, 0, Math.PI * 2);
            sourceCtx.fill();
        });

        const crossingLeft = width * 0.42;
        const crossingRight = width * 0.92;
        const stripeY = height * 0.78;
        sourceCtx.fillStyle = '#FFFFFF';
        for (let x = crossingLeft; x < crossingRight; x += 18) {
            sourceCtx.fillRect(x, stripeY, 10, Math.max(3, height * 0.07));
        }

        const walkerProgress = signalState === 'green'
            ? 0.18 + (phase - 0.5) / 0.35 * 0.72
            : 0.18;
        const walkerX = crossingLeft + (crossingRight - crossingLeft) * walkerProgress;
        const walkerY = height * 0.55;
        const stride = Math.sin(walkPhase * Math.PI * 2) * height * 0.06;
        sourceCtx.strokeStyle = '#FFFFFF';
        sourceCtx.lineWidth = Math.max(2, height * 0.025);
        sourceCtx.beginPath();
        sourceCtx.arc(walkerX, walkerY - height * 0.18, height * 0.045, 0, Math.PI * 2);
        sourceCtx.stroke();
        sourceCtx.beginPath();
        sourceCtx.moveTo(walkerX, walkerY - height * 0.13);
        sourceCtx.lineTo(walkerX, walkerY);
        sourceCtx.moveTo(walkerX, walkerY - height * 0.09);
        sourceCtx.lineTo(walkerX - height * 0.09, walkerY - height * 0.02 + stride);
        sourceCtx.moveTo(walkerX, walkerY - height * 0.09);
        sourceCtx.lineTo(walkerX + height * 0.09, walkerY - height * 0.02 - stride);
        sourceCtx.moveTo(walkerX, walkerY);
        sourceCtx.lineTo(walkerX - height * 0.09, walkerY + height * 0.13 - stride);
        sourceCtx.moveTo(walkerX, walkerY);
        sourceCtx.lineTo(walkerX + height * 0.09, walkerY + height * 0.13 + stride);
        sourceCtx.stroke();
        drawDotMatrix(scopeCanvas, sourceCanvas, breathingAmount);
    }

    function renderLunarWaves({ timestamp, breathingAmount }) {
        const width = scopeCanvas.width;
        const height = scopeCanvas.height;
        const sourceCtx = sourceCanvas.getContext('2d');
        sourceCtx.clearRect(0, 0, width, height);
        sourceCtx.strokeStyle = '#FFFFFF';
        sourceCtx.lineCap = 'round';
        sourceCtx.lineJoin = 'round';
        sourceCtx.lineWidth = Math.max(1, height * 0.012);

        const waveCount = 13;
        const moonX = width * 0.58;
        const moonY = height * 0.42;
        const moonRadius = height * 0.2;
        const drift = timestamp / 1800;
        for (let row = 0; row < waveCount; row++) {
            const baseline = height * 0.17 + row * height * 0.057;
            const rowAmplitude = height * (0.014 + row * 0.003);
            sourceCtx.beginPath();
            for (let x = 0; x <= width; x += 3) {
                const moonDistance = Math.abs(x - moonX) / moonRadius;
                const moonLift = moonDistance < 1
                    ? Math.cos(moonDistance * Math.PI / 2) * moonRadius * (0.2 + row / waveCount * 0.75)
                    : 0;
                const ripple = Math.sin(x * 0.055 + row * 0.8 + drift) * rowAmplitude +
                    Math.sin(x * 0.12 - row * 0.45 - drift * 0.6) * rowAmplitude * 0.45;
                const y = baseline - moonLift + ripple;
                if (x === 0) sourceCtx.moveTo(x, y);
                else sourceCtx.lineTo(x, y);
            }
            sourceCtx.stroke();
        }
        drawDotMatrix(scopeCanvas, sourceCanvas, breathingAmount);
    }

    function clear() {
        scopeCtx.clearRect(0, 0, scopeCanvas.width, scopeCanvas.height);
    }

    return { resize, align, renderWaveform, renderTearEye, renderPedestrianCrossing, renderLunarWaves, clear };
})();
