// ページ読み込み時にアニメーションを開始
window.addEventListener('load', function() {
    const background = document.queryselector('.background-image');
    const background2 = document.queryselector('.background-image2');
    background.style.animationPlayState = 'running';
    background2.style.animationPlayState = 'running';
});

// ページを更新するたびにアニメーションを再開
window.addEventListener('beforeunload', function() {
    const background = document.queryselector('.background-image');
    background.style.animationPlayState = 'running';
    background2.style.animationPlayState = 'running';
});

function imgChange(parts, id) {
    /*選択されているメニューを変数へ格納*/
    fname = parts.options[parts.selectedIndex].value;
    /*選択された画像のパスを送る*/
    if (fname == 0) id.src = "../style/images/kendo1.jpg";
    if (fname == 1) id.src = "../style/svg/silhouette_gradation.svg";
    if (fname == 2) id.src = "../style/images/overview-test.png";
    if (fname == 3) id.src = "../style/images/kendo1.jpg";
    if (fname == 4) id.src = "../style/svg/silhouette_gradation.svg";
}