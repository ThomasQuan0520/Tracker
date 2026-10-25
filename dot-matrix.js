function drawDotMatrix(canvas, sourceCanvas, breathingAmount = 0) {
    const ctx = canvas.getContext('2d');
    const imgData = sourceCanvas.getContext('2d').getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    const data = imgData.data;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const matrixScale = Math.min(1, Math.max(0.4, canvas.height / 100));
    const dotSize = 6 * matrixScale;
    const baseGap = (6 + (1 - breathingAmount) * 6) * matrixScale;
    const gap = Math.max(2, Math.round(baseGap));
    const alphaThreshold = 128 - breathingAmount * 50;

    for (let y = 0; y < canvas.height; y += gap) {
        for (let x = 0; x < canvas.width; x += gap) {
            const alpha = data[((y * canvas.width) + x) * 4 + 3];
            if (alpha > alphaThreshold) {
                const radius = (dotSize / 2) * (0.6 + breathingAmount * 0.4);
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + breathingAmount * 0.4})`;
                ctx.fill();
            }
        }
    }
}

function drawDotMatrixText(canvas, text, breathingAmount = 0, fontSize = 60, align = 'center', leftPadding = 16, rightPadding = 16) {
    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = canvas.width;
    sourceCanvas.height = canvas.height;
    const sourceCtx = sourceCanvas.getContext('2d');

    sourceCtx.font = `italic ${fontSize}px 'MonaspaceXenon', monospace`;
    sourceCtx.fillStyle = '#FFFFFF';
    sourceCtx.textBaseline = 'middle';
    sourceCtx.textAlign = align;
    const textX = align === 'left'
        ? leftPadding
        : align === 'right'
            ? sourceCanvas.width - rightPadding
            : sourceCanvas.width / 2;
    sourceCtx.fillText(text, textX, sourceCanvas.height / 2);

    drawDotMatrix(canvas, sourceCanvas, breathingAmount);
}
