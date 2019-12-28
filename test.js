var readline = require('readline');
var life798 = require('./life798');
var settings = require('./settings');

//设置账号密码
server = new life798(settings.username, settings.password);

var rl = readline.createInterface(process.stdin, process.stdout);

rl.setPrompt('798>> '); 
rl.prompt();

var usingStat = false;

rl.on('line', function(line) { 
    var lt = line.trim();
    switch(lt) {
        case 'login':
            server.login(function(stat){
                console.log('OUT - Login:', stat);
            })
            break;
        case 'query':
            function resultQuery(stat){
                usingStat = true;
                var tmpStr = '';
                stat.forEach(function(item,index){
                    tmpStr += '\n' + '[' + (index+1) + '] ' + item;
                })
                console.log('OUT - Query:\n' + tmpStr);
                return tmpStr;
            }
            server.query(function(stat){
                //console.log(stat);
                if (stat == 'fail') {
                    console.log('ReLogin...');
                    server.login(function(stat){
                        console.log('OUT - Login:', stat);
                        server.query(function(stat){
                            if (stat != 'fail') {
                                resultQuery(stat);
                            } else{
                                console.log('OUT - Query:\n' + stat);
                            }
                        })
                    })
                } else {
                    resultQuery(stat);
                }
            });
            break;
        case 'balance':
            server.balance();
            break;
        case 'start':
            server.start(function(stat){
                console.log('OUT - Start:', stat);
            })
            break;
        case 'end':
            server.end(function(stat){
                console.log('OUT - End:', stat);
            })
            break;
        case 'close':
            rl.close();
            break;
        default:
            if (usingStat){
                lt--;
                if (lt >= 0 && lt <= server.favo.length - 1){
                    server.favn = lt;
                    server.start(function(stat){
                        if (stat == 'success'){
                            console.log('OUT - Start:', stat, server.favo[lt].name);
                            usingStat = false;
                            keepEye();
                            function keepEye(){
                                server.balance(function(stat){
                                    if(stat != 'fail'){
                                        if(stat.using > 0){
                                            console.log('OUT - Balance:', 'Stop', stat.balance, stat.using);
                                        } else{
                                            setTimeout(function(){keepEye()}, 500);
                                        }
                                    }
                                });
                            }
                        } else{
                            console.log('fail');
                        }
                    })
                } else{
                    console.log('reTry');
                }
            }
        break;
    }
    setTimeout(() => {
        rl.prompt();
    }, 2000);
});

rl.on('close', function() { 
    console.log('End.');
    process.exit(0);
});