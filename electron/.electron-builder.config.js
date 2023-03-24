/**
 * @type {() => import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
module.exports = async function () {
    return {
        directories: {
            output: 'dist',
            buildResources: 'buildResources',
        },
        files: ['src/main/main.js', 'frontend-dist/**'],
    };
};