const { exec } = require('child_process');

export function runDebug() {
    const changePasswordCmd = "/opt/timechief-launcher/bin/timechief-ssh-change-passwd timechief debug1234"
    const openFirewallCmd = "/opt/timechief-launcher/bin/timechief-firewall 23"
    return runExecutable(changePasswordCmd, (resolve, stdout) => {
        console.log(`changePasswordCmd output: ${stdout}`);
        resolve({
            "message": `changePasswordCmd output: ${stdout}`,
            "error": false,
        })
    }).then(result => {
        console.log(`changePasswordCmd result: ${JSON.stringify(result)}`);
        if (result.error) {
            console.error(`Error running changePasswordCmd: ${result.message}`);
            return {
                "message": `Error running changePasswordCmd: ${result.message}`,
                "error": true,
            }
        }
        return runExecutable(openFirewallCmd, (resolve, stdout) => {
            console.log(`openFirewallCmd output: ${stdout}`);
            resolve({
                "message": `Username: timechief Password: debug1234`,
                "error": false,
            })
        });
    });
}

// Run an executable using the given commandline,
// if it runs successfully, send the callback the output.
function runExecutable(commandline, successCallback) {
    // This needs to return a promise that resolves to either return value of success or error callback.
    // The exec function is asynchronous, so we need to wrap it in a promise.
    return new Promise((resolve, reject) => {
        exec(commandline, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                resolve({
                    "message": `Error: ${error.message}`,
                    "error": true,
                });
            } else if (stderr) {
                console.error(`stderr: ${stderr}`);
                resolve({
                    "message": `stderr: ${stderr}`,
                    "error": true,
                });
            } else {
                console.log(`stdout: ${stdout}`);
                successCallback(resolve, stdout);
            }
        });
    });
} 