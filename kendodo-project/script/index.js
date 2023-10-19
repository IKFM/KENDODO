// index.html
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


