// ページ読み込み時にアニメーションを開始
window.addEventListener('load', function() {
    const background = document.querySelector('.background-image');
    const background2 = document.querySelector('.background-image2');
    background.style.animationPlayState = 'running';
    background2.style.animationPlayState = 'running';
});

// ページを更新するたびにアニメーションを再開
window.addEventListener('beforeunload', function() {
    const background = document.querySelector('.background-image');
    background.style.animationPlayState = 'running';
    background2.style.animationPlayState = 'running';
});

