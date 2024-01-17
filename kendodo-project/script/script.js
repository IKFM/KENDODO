const video1 = document.getElementById('video1');
const video2 = document.getElementById('video2');
let isVideoPlaying1 = false;
let isVideoPlaying2 = false;
let clear_score = false;

const canvas1 = document.getElementById('canvas1');
const ctx1 = canvas1.getContext('2d');
const canvas2 = document.getElementById('canvas2');
const ctx2 = canvas2.getContext('2d');
let score = 0;
let score_counter = 0;
let isProcessing = false;

const great_score_element = document.getElementById('great');
const good_score_element = document.getElementById('good');
const better_score_element = document.getElementById('better');



posenet.load().then((net) => {
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

    function flipVideo() {
        const video = document.getElementById('video2');
        video.style.transform = 'scaleX(-1)';
    }

    // カメラのセットアップ
    setupCamera().then(() => {
        // カメラがセットアップされた後に映像を反転させる
        flipVideo();
    });


    //動画一時停止時の処理
    video1.addEventListener('pause', () => {
        isVideoPlaying1 = false;
    });

    // 動画再生終了時の処理
    video1.addEventListener('ended', () => {
        isProcessing = false;
        video1.currentTime = 0;// 動画の再生位置を一番最初に戻す
        clear_score = true;
    });
    function resetCounters() {
        // 各IDに対応する要素を取得して、そのテキストコンテンツを0に設定
        great_score_element.textContent = '0';
        good_score_element.textContent = '0';
        better_score_element.textContent = '0';
        // 他にもある場合は同様に追加
    }

    

    //スタートボタンの処理
    const startButton = document.getElementById('start_button');
    startButton.addEventListener('click', function () {
        if (videoSelect.value === '0') {
            alert('お手本動画を選択してください。');
            return;
        }
        setTimeout(() => {
        if (clear_score) {
            resetCounters();
            clear_score = false;
        }
        if (!isProcessing) {
            console.log('isProcessing_start')
            isVideoPlaying1 = true;
            isVideoPlaying2 = true;
            isProcessing = true;
            processPoseData();
            video1.play();
            console.log('start!')
        }
    }, 2000);
        
    });

    //停止ボタンの処理
    const stopButton = document.getElementById('stop_button');
    stopButton.addEventListener('click', () => {
        if (videoSelect.value === '0') { // お手本動画選択処理
            alert('お手本動画を選択してください。');
        }
        else {
            isVideoPlaying1 = false;
            isVideoPlaying2 = false; // Canvas2への描画を停止
            video1.pause();
            isProcessing = false;
        }
    });

    async function processPoseData() {
        if (!isVideoPlaying1 || !isVideoPlaying2) return;
    
        while (isVideoPlaying1 && isVideoPlaying2) {
    
            if (!isProcessing) break;
    
            const pose1 = await net.estimateSinglePose(video1, {
                imageScaleFactor: 1.0,
                flipHorizontal: false,
                outputStride: 32
            });
    
            const pose2 = await net.estimateSinglePose(video2, {
                imageScaleFactor: 1.0,
                flipHorizontal: true,
                outputStride: 32
            });
    
            await Promise.all([
                new Promise(resolve => drawPose(pose1, ctx1, video1, false, resolve, 'fuchsia')),
                new Promise(resolve => drawPose(pose2, ctx2, video2, true, resolve, 'yellow'))
            ]);
    
            const error = calcAngleError(pose1, pose2);
            console.log(`Angle Error: ${error}`);
    
            if (!isProcessing) {
                clearCanvas(ctx1);
                clearCanvas(ctx2);
                score = 0;
                break;
            }
    
            score += error;
            score_counter += 1;
    
            if (score_counter === 10) { // 修正: 比較演算子を修正
                scorecalculate(score);
                score_counter = 0;
                score = 0;
            }
    
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }
    
    function scorecalculate(score) {
        const averageScore = Math.ceil(score / 10);
        console.log(`Average Score: ${averageScore}`);
    
        if (averageScore >= 0 && averageScore <= 30) {
            console.log('優');
            incrementCounter('great');
        } else if (averageScore <= 45) {
            console.log('良');
            incrementCounter('good');
        } else if (averageScore <= 50) {
            console.log('可');
            incrementCounter('better');
        } else {
            console.log('不可');
            incrementCounter('great');
        }
    }
    
    function incrementCounter(counterId) {
        const counterElement = document.getElementById(counterId);
        if (counterElement) {
            const currentCount = parseInt(counterElement.innerText, 10) || 0;
            counterElement.innerText = currentCount + 1;
        }
    }
    
    
    function incrementCounter(counterId) {
        const counterElement = document.getElementById(counterId);
        if (counterElement) {
            // 対応するカウンタの値を+1
            const currentCount = parseInt(counterElement.innerText, 10) || 0;
            counterElement.innerText = currentCount + 1;
        }
    }
    
    function drawPose(pose, ctx, video, fliper = false, resolve, color) {
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
        drawKeypoints(pose.keypoints, 0.1, ctx, color);
        drawSkeleton(pose.keypoints, 0.1, ctx, color);

        if (resolve) {
            resolve(); // Promiseを解決して同期を完了
        }
    }


    function toTuple({ y, x }) {
        return [y, x];
    }

    function drawKeypoints(keypoints, minConfidence, ctx, color) {
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
        ctx.lineWidth = 4;
        ctx.strokeStyle = color;
        ctx.stroke();
    }

    //誤差計算ロジック
    function calcAngleError(correct_pose, user_pose) {
        let error = 0;

        // Shoulder - Elbow
        error += calcKeypointAngleError(correct_pose, user_pose, 5, 7);
        error += calcKeypointAngleError(correct_pose, user_pose, 6, 8);

        // Elbow - Wrist
        error += calcKeypointAngleError(correct_pose, user_pose, 7, 9);
        error += calcKeypointAngleError(correct_pose, user_pose, 8, 10);

        // // Hip - Knee
        error += calcKeypointAngleError(correct_pose, user_pose, 11, 13);
        error += calcKeypointAngleError(correct_pose, user_pose, 12, 14);

        // // Knee - Ankle
        error += calcKeypointAngleError(correct_pose, user_pose, 13, 15);
        error += calcKeypointAngleError(correct_pose, user_pose, 14, 16);

        error /= 8;

        return error;
    }

    function calcKeypointAngleError(correct_pose, user_pose, num1, num2) {
        let error = Math.abs(calcKeypointsAngle(correct_pose.keypoints, num1, num2) - calcKeypointsAngle(user_pose.keypoints, num1, num2))
        if (error <= 180) {
            return error;
        } else {
            return 360 - error;
        }
    }

    function calcKeypointsAngle(keypoints, num1, num2) {
        return calcPositionAngle(keypoints[num1].position, keypoints[num2].position);
    }

    function calcPositionAngle(position1, position2) {
        return calcAngleDegrees(position1.x, position1.y, position2.x, position2.y);
    }

    function calcAngleDegrees(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    }

});


function clearCanvas(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); 
}

// お手本動画選択処理
document.addEventListener('DOMContentLoaded', async () => {
    // セレクトボックスとビデオ要素の取得
    const videoSelect = document.getElementById('videoSelect');
    const img0 = document.getElementById('img0')

    // セレクトボックスの変更を検出するイベントリスナーを追加
    videoSelect.addEventListener('change', function () {

        if (isProcessing = true) {
            isVideoPlaying1 = false;
            isVideoPlaying2 = false;
            isProcessing = false;
            clearCanvas(ctx1)
            clearCanvas(ctx2)
        }
        changeVideoSource(this.value);
    });

    function resetCounters() {
        // 各IDに対応する要素を取得して、そのテキストコンテンツを0に設定
        great_score_element.textContent = '0';
        good_score_element.textContent = '0';
        better_score_element.textContent = '0';
        // 他にもある場合は同様に追加
    }



    function changeVideoSource(value) {
        if (value === '0') {
            video1.style.display = 'none';
            img0.style.display = 'block'; // 画像を表示
            return
        }
        video1.style.display = 'block';
        img0.style.display = 'none'; // 画像を非表示
        video1.src = `./video/video${value}.mp4`; // 選択された動画を表示
        video1.load(); // 新しいソースでビデオを再読み込み
        resetCounters()
    }

    // ビデオのロードが完了したことを確認
    await new Promise((resolve) => {
        video1.onloadeddata = () => {
            resolve();
        };
    });
});



// カウントダウン
document.addEventListener("DOMContentLoaded", function () {
    // カウントダウンの秒数
    var countdownSeconds = 3;
    
    // 動画の再生状態
    var isCountdown = false;

    // カウントダウン表示用の要素
    var countdownContainer = document.getElementById("countdown-container");

    // カウントダウン関数
    function startCountdown() {
        var secondsRemaining = countdownSeconds;

        function updateCountdown() {
            countdownContainer.textContent = secondsRemaining;
            secondsRemaining--;

            if (secondsRemaining < 0) {
                // カウントダウン終了時の処理
                countdownContainer.style.display = "none";
                isCountdown = true;
            } else {
                setTimeout(updateCountdown, 1000); // 1秒ごとに更新
            }
        }

        updateCountdown();
    }

    // カウントダウン開始ボタン
    var startButton = document.getElementById("start_button");
    startButton.addEventListener("click", function () {
        // 動画が再生中でない場合のみ実行
        if (!isProcessing && videoSelect.value !== '0') {
            // カウントダウン表示用の要素を表示
            console.log(videoSelect.value);
            countdownContainer.style.display = "block";

            // カウントダウン開始
            startCountdown();
        }
    });
});