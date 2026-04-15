// creates the executable for dev mode in frontend

async function main(){
    console.log('build started...');
    const { spawn } = require('child_process');
    const cmd = await spawn('dotnet publish BMIS.backend -c Release -o ./dev.backend', { shell:true, stdio: 'inherit' });

    await new Promise((resolve) => {
        cmd.on('close', resolve);
    });
    
    console.log('build done...');
}

main();
