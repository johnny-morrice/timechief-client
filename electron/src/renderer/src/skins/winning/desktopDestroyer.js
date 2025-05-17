export function cleanupBulletHoles() {
    const bulletHoles = document.querySelectorAll('.bullet-hole');
    bulletHoles.forEach((hole) => {
        hole.remove();
    });
}

export function addBulletHole() {
    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 100;
    const x = Math.floor(Math.random() * maxX);
    const y = Math.floor(Math.random() * maxY);
    const bulletHole = document.createElement('div');
    bulletHole.className = 'bullet-hole';

    bulletHole.style.position = 'absolute';
    bulletHole.style.left = `${x}px`;
    bulletHole.style.top = `${y}px`;

    document.body.appendChild(bulletHole);
}