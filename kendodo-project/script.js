posenet.load().then((net) => {
    const video1 = document.getElementById('video1');
    const video2 = document.getElementById('video2');
    const poseData1 = [];
    const poseData2 = [];
    let isVideoPlaying1 = false;
    let isVideoPlaying2 = false;

    const canvas1 = document.getElementById('canvas1');
    const ctx1 = canvas1.getContext('2d');
    const canvas2 = document.getElementById('canvas2');
    const ctx2 = canvas2.getContext('2d');

    async function setupCamera() {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video2.srcObject = stream;
        return new Promise((resolve) => {
            video2.onloadedmetadata = () => {
                isVideoPlaying2 = true;
                resolve();
            };
        });
    }

    setupCamera()
        .then(() => collectPoseData2());

    video1.addEventListener('play', () => {
        isVideoPlaying1 = true;
        isVideoPlaying2 = true;
        collectPoseData1();
        collectPoseData2();
    });


    video1.addEventListener('pause', () => {
        isVideoPlaying1 = false;
        isVideoPlaying2 = false; // Canvas2への描画を停止
    });


    async function collectPoseData1() {
        while (isVideoPlaying1) {
            const pose = await net.estimateSinglePose(video1, {
                imageScaleFactor: 1.0,
                flipHorizontal: false,
                outputStride: 32
            });
            poseData1.push(pose);
            drawPose(pose, ctx1, video1, fliper = false);
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }
    async function collectPoseData2() {
        while (isVideoPlaying2) {
            const pose = await net.estimateSinglePose(video2, {
                imageScaleFactor: 1.0,
                flipHorizontal: true,
                outputStride: 32
            });
            fliper = true;
            poseData2.push(pose);
            drawPose(pose, ctx2, video2, fliper);
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    function drawPose(pose, ctx, video, fliper = false) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        if (fliper) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.translate(-ctx.canvas.width, 0);
            ctx.drawImage(video, 0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();
        } else {
            ctx.drawImage(video, 0, 0, ctx.canvas.width, ctx.canvas.height);
        }
        drawKeypoints(pose.keypoints, 0.1, ctx);
        drawSkeleton(pose.keypoints, 0.1, ctx);
    }


    function toTuple({ y, x }) {
        return [y, x];
    }

    function drawKeypoints(keypoints, minConfidence, ctx, color = 'aqua') {
        for (let i = 0; i < keypoints.length; i++) {
            const keypoint = keypoints[i];
            if (keypoint.score < minConfidence) {
                continue;
            }
            const [y, x] = toTuple(keypoint.position);
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
        }
    }

    function drawSkeleton(keypoints, minConfidence, ctx, color = 'aqua') {
        const adjacentKeyPoints = posenet.getAdjacentKeyPoints(keypoints, minConfidence);

        adjacentKeyPoints.forEach((keypoints) => {
            drawSegment(toTuple(keypoints[0].position), toTuple(keypoints[1].position), ctx, color);
        });
    }

    function drawSegment([ay, ax], [by, bx], ctx, color) {
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.stroke();
    }

});
