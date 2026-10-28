window.masterScopeAnimation = (() => {
    const scopeCanvas = document.getElementById('master-scope');
    const scopeCtx = scopeCanvas.getContext('2d');
    const sourceCanvas = document.createElement('canvas');

    function align() {
        const container = document.getElementById('master-scope-container');
        if (!container) return;
        container.style.width = '100%';
        container.style.left = 'auto';
        container.style.right = 'auto';
        container.style.top = 'auto';
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

    function renderSpacePrompt({ timestamp, breathingAmount }) {
        const width = scopeCanvas.width;
        const height = scopeCanvas.height;
        const sourceCtx = sourceCanvas.getContext('2d');
        const centerX = width / 2;
        const cycleDuration = 1800;
        const phase = (timestamp % cycleDuration) / cycleDuration;
        const pressProgress = phase < 0.28
            ? phase / 0.28
            : phase < 0.52
                ? 1
                : phase < 0.78
                    ? 1 - (phase - 0.52) / 0.26
                    : 0;
        const easedPress = pressProgress * pressProgress * (3 - 2 * pressProgress);
        sourceCtx.clearRect(0, 0, width, height);
        sourceCtx.fillStyle = '#FFFFFF';
        sourceCtx.lineCap = 'round';
        sourceCtx.lineJoin = 'round';

        const keyTop = height * 0.635;
        const keyHeight = height * 0.062;
        const keyGap = width * 0.023;
        const keyWidth = width * 0.073;
        const caseX = width * 0.1;
        const caseY = height * 0.61;
        const caseWidth = width * 0.8;
        const caseHeight = height * 0.34;
        const strokeWidth = Math.max(3, height * 0.025);

        const roundedRect = (x, y, rectWidth, rectHeight, radius) => {
            sourceCtx.beginPath();
            sourceCtx.moveTo(x + radius, y);
            sourceCtx.lineTo(x + rectWidth - radius, y);
            sourceCtx.quadraticCurveTo(x + rectWidth, y, x + rectWidth, y + radius);
            sourceCtx.lineTo(x + rectWidth, y + rectHeight - radius);
            sourceCtx.quadraticCurveTo(x + rectWidth, y + rectHeight, x + rectWidth - radius, y + rectHeight);
            sourceCtx.lineTo(x + radius, y + rectHeight);
            sourceCtx.quadraticCurveTo(x, y + rectHeight, x, y + rectHeight - radius);
            sourceCtx.lineTo(x, y + radius);
            sourceCtx.quadraticCurveTo(x, y, x + radius, y);
            sourceCtx.closePath();
        };

        roundedRect(caseX, caseY, caseWidth, caseHeight, height * 0.035);
        sourceCtx.lineWidth = strokeWidth;
        sourceCtx.stroke();

        const drawKey = (x, y, keyW, keyH, pressed = false) => {
            roundedRect(x, y, keyW, keyH, height * 0.012);
            sourceCtx.lineWidth = strokeWidth;
            sourceCtx.stroke();
            if (pressed) {
                sourceCtx.beginPath();
                sourceCtx.moveTo(x + keyW * 0.22, y + keyH * 0.35);
                sourceCtx.lineTo(x + keyW * 0.78, y + keyH * 0.35);
                sourceCtx.stroke();
            }
        };

        const drawKeyRow = (count, y, offset = 0) => {
            const rowWidth = count * keyWidth + (count - 1) * keyGap;
            const startX = centerX - rowWidth / 2 + offset;
            for (let index = 0; index < count; index++) {
                drawKey(startX + index * (keyWidth + keyGap), y, keyWidth, keyHeight);
            }
        };
        drawKeyRow(7, keyTop);
        drawKeyRow(7, keyTop + height * 0.085, width * 0.015);
        drawKeyRow(3, keyTop + height * 0.17, -width * 0.16);
        drawKeyRow(3, keyTop + height * 0.17, width * 0.16);

        const spaceWidth = width * 0.34;
        const spaceX = centerX - spaceWidth / 2;
        const spaceY = height * 0.86 + height * 0.018 * easedPress;
        drawKey(spaceX, spaceY, spaceWidth, height * 0.045, easedPress > 0.7);

        const tipY = height * 0.48 + (spaceY - height * 0.48) * easedPress;
        const palmTop = height * 0.29;
        const palmBottom = height * 0.47;
        const fingerHalfWidth = height * 0.04;
        sourceCtx.beginPath();
        sourceCtx.moveTo(centerX - fingerHalfWidth, palmBottom - height * 0.025);
        sourceCtx.lineTo(centerX - fingerHalfWidth, tipY - height * 0.025);
        sourceCtx.quadraticCurveTo(centerX - fingerHalfWidth, tipY, centerX, tipY);
        sourceCtx.quadraticCurveTo(centerX + fingerHalfWidth, tipY, centerX + fingerHalfWidth, tipY - height * 0.025);
        sourceCtx.lineTo(centerX + fingerHalfWidth, palmBottom - height * 0.015);
        sourceCtx.quadraticCurveTo(centerX + height * 0.1, palmTop + height * 0.07, centerX + height * 0.115, palmTop + height * 0.12);
        sourceCtx.lineTo(centerX + height * 0.12, palmTop + height * 0.19);
        sourceCtx.quadraticCurveTo(centerX + height * 0.12, palmTop + height * 0.23, centerX + height * 0.09, palmTop + height * 0.23);
        sourceCtx.quadraticCurveTo(centerX + height * 0.1, palmTop + height * 0.29, centerX + height * 0.065, palmTop + height * 0.29);
        sourceCtx.quadraticCurveTo(centerX + height * 0.055, palmBottom, centerX, palmBottom);
        sourceCtx.quadraticCurveTo(centerX - height * 0.065, palmBottom, centerX - height * 0.09, palmTop + height * 0.23);
        sourceCtx.quadraticCurveTo(centerX - height * 0.13, palmTop + height * 0.2, centerX - height * 0.13, palmTop + height * 0.16);
        sourceCtx.quadraticCurveTo(centerX - height * 0.13, palmTop + height * 0.12, centerX - height * 0.09, palmTop + height * 0.12);
        sourceCtx.lineTo(centerX - height * 0.055, palmTop + height * 0.15);
        sourceCtx.quadraticCurveTo(centerX - height * 0.06, palmTop + height * 0.08, centerX - height * 0.04, palmBottom - height * 0.025);
        sourceCtx.closePath();
        sourceCtx.fill();

        sourceCtx.save();
        sourceCtx.globalCompositeOperation = 'destination-out';
        sourceCtx.lineWidth = Math.max(3, height * 0.022);
        sourceCtx.beginPath();
        sourceCtx.moveTo(centerX - height * 0.075, palmTop + height * 0.23);
        sourceCtx.quadraticCurveTo(centerX - height * 0.02, palmTop + height * 0.26, centerX + height * 0.03, palmTop + height * 0.24);
        sourceCtx.moveTo(centerX - height * 0.055, palmTop + height * 0.3);
        sourceCtx.quadraticCurveTo(centerX, palmTop + height * 0.32, centerX + height * 0.04, palmTop + height * 0.3);
        sourceCtx.stroke();
        sourceCtx.restore();

        const clickAge = phase >= 0.28
            ? (phase - 0.28) * cycleDuration
            : (phase + 1 - 0.28) * cycleDuration;
        if (clickAge < 480) {
            const particleCount = 12;
            const fade = 1 - clickAge / 480;
            for (let particle = 0; particle < particleCount; particle++) {
                const angle = particle / particleCount * Math.PI * 2 + 0.18;
                const distance = height * (0.035 + clickAge * 0.00016);
                const x = centerX + Math.cos(angle) * distance;
                const y = keyTop + Math.sin(angle) * distance * 0.45;
                const size = height * (0.022 + (particle % 3) * 0.004) * fade;
                sourceCtx.globalAlpha = fade;
                sourceCtx.lineWidth = Math.max(2, size);
                sourceCtx.beginPath();
                sourceCtx.moveTo(x - Math.cos(angle) * size, y - Math.sin(angle) * size);
                sourceCtx.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
                sourceCtx.stroke();
            }
            sourceCtx.globalAlpha = 1;
        }

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

    function renderSubwayTunnel({ timestamp, breathingAmount }) {
        const width = scopeCanvas.width;
        const height = scopeCanvas.height;
        const sourceCtx = sourceCanvas.getContext('2d');
        sourceCtx.clearRect(0, 0, width, height);
        sourceCtx.lineCap = 'round';
        sourceCtx.lineJoin = 'round';
        sourceCtx.strokeStyle = '#FFFFFF';
        sourceCtx.lineWidth = Math.max(1.5, height * 0.009);

        const tunnelPhase = (timestamp % 1800) / 1800;
        const trainPhase = (timestamp % 4200) / 4200;
        const ceilingY = height * 0.16;
        const floorY = height * 0.84;

        // Tunnel shell and repeating support ribs slide past the train.
        sourceCtx.beginPath();
        sourceCtx.moveTo(0, floorY);
        sourceCtx.lineTo(0, height * 0.38);
        sourceCtx.quadraticCurveTo(width * 0.05, ceilingY, width * 0.2, ceilingY);
        sourceCtx.lineTo(width * 0.8, ceilingY);
        sourceCtx.quadraticCurveTo(width * 0.95, ceilingY, width, height * 0.38);
        sourceCtx.lineTo(width, floorY);
        sourceCtx.stroke();

        const ribSpacing = width / 5;
        for (let rib = -1; rib <= 6; rib++) {
            const x = rib * ribSpacing - tunnelPhase * ribSpacing;
            sourceCtx.beginPath();
            sourceCtx.moveTo(x, floorY);
            sourceCtx.lineTo(x, height * 0.39);
            sourceCtx.quadraticCurveTo(x + ribSpacing * 0.08, ceilingY, x + ribSpacing * 0.28, ceilingY);
            sourceCtx.moveTo(x + ribSpacing * 0.72, ceilingY);
            sourceCtx.quadraticCurveTo(x + ribSpacing * 0.92, ceilingY, x + ribSpacing, height * 0.39);
            sourceCtx.lineTo(x + ribSpacing, floorY);
            sourceCtx.stroke();

            const lightX = x + ribSpacing * 0.34;
            sourceCtx.fillRect(lightX, height * 0.2, ribSpacing * 0.28, Math.max(2, height * 0.012));
        }

        // Fast sleepers and rails make the forward movement legible beneath the cars.
        const sleeperSpacing = Math.max(14, width * 0.085);
        const sleeperOffset = (timestamp / 900 * sleeperSpacing) % sleeperSpacing;
        sourceCtx.lineWidth = Math.max(1.5, height * 0.012);
        sourceCtx.beginPath();
        sourceCtx.moveTo(0, height * 0.79);
        sourceCtx.lineTo(width, height * 0.79);
        sourceCtx.moveTo(0, height * 0.93);
        sourceCtx.lineTo(width, height * 0.93);
        sourceCtx.stroke();
        sourceCtx.lineWidth = Math.max(1, height * 0.008);
        for (let x = -sleeperSpacing; x < width + sleeperSpacing; x += sleeperSpacing) {
            const sleeperX = x - sleeperOffset;
            sourceCtx.beginPath();
            sourceCtx.moveTo(sleeperX, height * 0.78);
            sourceCtx.lineTo(sleeperX - width * 0.025, height * 0.94);
            sourceCtx.stroke();
        }

        // A continuous row of subway cars glides across the tunnel.
        const carWidth = width * 0.72;
        const carPitch = carWidth + Math.max(5, width * 0.018);
        const carHeight = height * 0.28;
        const carY = height * 0.48;
        for (let car = -2; car <= 3; car++) {
            const x = car * carPitch + trainPhase * carPitch;
            sourceCtx.lineWidth = Math.max(1.5, height * 0.012);
            sourceCtx.beginPath();
            sourceCtx.moveTo(x + carWidth * 0.08, carY + carHeight * 0.18);
            sourceCtx.quadraticCurveTo(x + carWidth * 0.08, carY, x + carWidth * 0.18, carY);
            sourceCtx.lineTo(x + carWidth * 0.82, carY);
            sourceCtx.quadraticCurveTo(x + carWidth * 0.94, carY, x + carWidth * 0.96, carY + carHeight * 0.2);
            sourceCtx.lineTo(x + carWidth, carY + carHeight * 0.72);
            sourceCtx.lineTo(x + carWidth * 0.96, carY + carHeight * 0.88);
            sourceCtx.lineTo(x + carWidth * 0.06, carY + carHeight * 0.88);
            sourceCtx.lineTo(x + carWidth * 0.04, carY + carHeight * 0.28);
            sourceCtx.closePath();
            sourceCtx.stroke();

            for (let windowIndex = 0; windowIndex < 4; windowIndex++) {
                const windowX = x + carWidth * (0.18 + windowIndex * 0.16);
                sourceCtx.strokeRect(windowX, carY + carHeight * 0.14, carWidth * 0.11, carHeight * 0.32);
            }
            sourceCtx.beginPath();
            sourceCtx.moveTo(x + carWidth * 0.72, carY + carHeight * 0.08);
            sourceCtx.lineTo(x + carWidth * 0.72, carY + carHeight * 0.84);
            sourceCtx.moveTo(x + carWidth * 0.04, carY + carHeight * 0.63);
            sourceCtx.lineTo(x + carWidth * 0.98, carY + carHeight * 0.63);
            sourceCtx.stroke();

            sourceCtx.beginPath();
            sourceCtx.arc(x + carWidth * 0.25, carY + carHeight * 0.9, height * 0.025, 0, Math.PI * 2);
            sourceCtx.arc(x + carWidth * 0.75, carY + carHeight * 0.9, height * 0.025, 0, Math.PI * 2);
            sourceCtx.stroke();
        }

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

    return { resize, align, renderWaveform, renderSpacePrompt, renderTearEye, renderSubwayTunnel, renderLunarWaves, clear };
})();
