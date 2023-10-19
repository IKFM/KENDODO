// main.html
// お手本動画の選択
// ドロップダウンリストの変更時に呼び出される関数
function changeVideoSource() {
    const videoSelect = document.getElementById("videoSelect");
    const video1 = document.getElementById("video1");
    const image1 = document.getElementById("image1");

    if (video1 && image1) {
        const selectedSource = videoSelect.value;
        if (selectedSource === "./style/images/kendo1.jpg") {
            video1.style.display = "none";
            image1.style.display = "block";
        } else {
            video1.style.display = "block";
            image1.style.display = "none";
            video1.src = selectedSource;
            video1.load();
        }
    }
}


// ドロップダウンリストの変更イベントを監視し、関数を呼び出す
const videoSelect = document.getElementById("videoSelect");
videoSelect.addEventListener("change", changeVideoSource);

// ページ読み込み時に初期値を確認して画像または動画を表示
if (videoSelect.value === "./style/images/kendo1.jpg") {
    const video1 = document.getElementById("video1");
    const image1 = document.getElementById("image1");
    video1.style.display = "none";
    image1.style.display = "block";
}
