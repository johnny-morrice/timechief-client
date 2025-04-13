const { exec } = require('child_process');

export function RunDebug() {
    const changePasswordCmd = "/opt/timechief-launcher/bin/timechief-ssh-change-passwd timechief debug1234"
    const openFirewallCmd = "/opt/timechief-launcher/bin/timechief-firewall 23"
    return runExecutable(changePasswordCmd, (stdout) => {
        console.log(`stdout: ${stdout}`);
        runExecutable(openFirewallCmd, (stdout) => {
            console.log(`stdout: ${stdout}`);
            return true;
        }, (stderr) => {
            console.error(`stderr: ${stderr}`);
            return false;
        });
    }
    , (stderr) => {
        console.error(`stderr: ${stderr}`);
        return false;
    });
}

// Run an executable using the given commandline,
// if it runs successfully, send the callback the output.
function runExecutable(commandline, successCallback, errorCallback) {
    return exec(commandline, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return errorCallback(stderr);
        }
        return successCallback(stdout);
    });
} 