

posenet.load().then((net) => {
  const video1 = document.getElementById('video1');
  const video2 = document.getElementById('video2');
  let isVideoPlaying1 = false;
  let isVideoPlaying2 = false;

  const canvas1 = document.getElementById('canvas1');
  const ctx1 = canvas1.getContext('2d');
  const canvas2 = document.getElementById('canvas2');
  const ctx2 = canvas2.getContext('2d');

  const canvas3 = document.getElementById('canvas3');
  const ctx3 = canvas3.getContext('2d');
  // グローバル変数としてJSONデータを格納するための変数
  let poseData;

  // JSONデータを読み込む関数
  async function loadPoseData() {
      // JSONファイルのURL
      const jsonFileURL = 'poseData.json'

      try {
          const response = await fetch(jsonFileURL);
          poseData = await response.json();
      } catch (error) {
          console.error('JSONデータの読み込みエラー:', error);
      }
  }


      setupCamera();


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

  video1.addEventListener('pause', () => {
      isVideoPlaying1 = false;
      isVideoPlaying2 = false; // Canvas2への描画を停止
  });


  const startButton = document.getElementById('start_button');
  startButton.addEventListener('click', () => {
      isVideoPlaying1 = true;
      isVideoPlaying2 = true;
      video1.play();
      processPoseData();
  });

  const stopButton = document.getElementById('stop_button');
  stopButton.addEventListener('click', () => {
      isVideoPlaying1 = false;
      isVideoPlaying2 = false; // Canvas2への描画を停止
      video1.pause();
  });

  let i = 0
  // requestAnimationFrame による連続的な描画とデータの取得
  async function processPoseData() {
      let i = 0;  // フレームのインデックス
      let isProcessing = false;  // 前回の処理が完了しているかを示すフラグ

      function drawFrame(timestamp) {
          if (!isVideoPlaying1 || !isVideoPlaying2 || i >= poseData.length) {
              return;
          }

          // 以前の処理が完了していない場合は待機
          if (isProcessing) {
              requestAnimationFrame(drawFrame);
              return;
          }

          const elapsed = timestamp - previousTimestamp;

          if (elapsed >= 50) {
              isProcessing = true;  // 処理中フラグを立てる

              const pose1 = poseData[i];
              i++;

              const pose2 = net.estimateSinglePose(video2, {
                  imageScaleFactor: 1.0,
                  flipHorizontal: true,
                  outputStride: 32
              });

              Promise.all([
                  new Promise(resolve => drawPose(pose1, ctx1, video1, false, resolve)),
                  new Promise(resolve => drawPose(pose2, ctx2, video2, true, resolve))
              ]).then(() => {
                  const error = calcAngleError(pose1, pose2);
                  console.log(`Angle Error: ${error}`);

                  isProcessing = false;  // 処理中フラグを解除
                  previousTimestamp = timestamp;  // タイムスタンプを更新
                  requestAnimationFrame(drawFrame);  // 次の描画フレームをリクエスト
              });
          } else {
              // 50ミリ秒経過していない場合は次の描画フレームをリクエスト
              requestAnimationFrame(drawFrame);
          }
      }

      requestAnimationFrame(drawFrame);
  }




  function drawPose(pose, ctx, video, fliper = false, resolve) {
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

      if (resolve) {
          resolve(); // Promiseを解決して同期を完了
      }
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