const grd = document.querySelector('.grd');
const line = document.querySelector('.line');

const grd_keyframes = {
    opacity: [0, 1],     //不透明度
    translate: ['-50px -50px', 0]   //[スタート位置, 終点]
}

const line_keyframes = {
    opacity: [0, 1],
    translate: ['50px 50px', 0]
}

const options = {
    duration: 1500,
    easing: 'ease'
}

grd.animate(grd_keyframes, options);
line.animate(line_keyframes, options);

// Live Server