import { CQApp, CQMsg } from 'cq-robot'
var life798 = require('./life798');
var settings = require('./settings');

var serverList = {};
/* function group2account(groupNumber){
    settings.groupList.forEach(function(item, index){
        if(groupNumber == item.groupNumber) return item.account;
    })
    return '';
} */

function group2item(groupNumber, cb){
    var flag = true;
    settings.groupList.every(function(item, index){
        //console.log(groupNumber, item.groupNumber)
        if(groupNumber == item.groupNumber){
            //console.log(groupNumber, '==' , item.groupNumber)
            cb(item);
            flag = false;
            return false;
        }
    })
    if(flag) cb(null);
}

function keepEye(server, p){
    var fromGroup = server.group;
    server.balance(function(stat){
        if(stat != 'fail'){
            if(stat.using > 0){
                console.log(' SHELL - Balance:', 'Stop', stat.balance, stat.using);
                p.CQ.sendGroupMsg(fromGroup, `用时 ${stat.using.toFixed(2)} 秒，用钱 ¥ ${(server.balanceBefore - stat.balance).toFixed(2)}, 当前余额 ¥ ${stat.balance}`)
                server.user = '';
                server.group = '';
                server.water = false;
                p.CQ.sendGroupMsg(fromGroup, `bye bye~`);
            } else{
                setTimeout(function(){keepEye(server, p)}, 500);
            }
        }
    });
}

class App extends CQApp {
    constructor() {
        super('life798-node-moudle-coolq-plugin', __dirname)
        this.CQ.setDebug(false)
        this.isEnable = true
        this.user = ''
    }
    startup() {
        return 0
    }
    exit() {
        return 0
    }
    enable() {
        this.isEnable = true

        var p = this;
        //初始化账户列表
        settings.groupList.forEach(function(item2, index){
            p.CQ.sendGroupMsg(item2.groupNumber, `大佬们我来了~`)
        });

        settings.accountList.forEach(function(item, index){
            var server = new life798(item.username, item.password);
            server.login(function(stat){
                console.log('OUT - Login:', stat);
                if (stat == 'fail'){
                    if(!serverList[item.username]){
                        serverList[item.username] = server;
                        settings.groupList.forEach(function(item2, index){
                            if(item2.account == server.username){
                                p.CQ.sendGroupMsg(item2.groupNumber, `ERROR! 卡账户登录失败!（${item2.account}）`)
                                p.CQ.sendGroupMsg(item2.groupNumber, `请检查账户密码后输入“热水”重新激活`)
                            }
                        });
                    }
                } else{
                    serverList[item.username] = server;
                    settings.groupList.forEach(function(item2, index){
                        if(item2.account == server.username){
                            p.CQ.sendGroupMsg(item2.groupNumber, `你们群的卡账户登录成功~（${item2.account}）`)
                        }
                    });
                }
            })
        })

        setTimeout(function(){
            console.log('serverList:');
            console.log(serverList);
        },5000);
        return 0
    }

    disable() {
        this.isEnable = false
        return 0
    }
    async  privateMsg(subType, msgId, fromQQ, msg, font) {
        if (msg == "热水"){
            this.CQ.sendPrivateMsg(fromQQ, '暂不线下放水')
            return CQMsg.MSG_INTERCEPT
        }
        return CQMsg.MSG_INTERCEPT;
    }
    async   groupMsg(subType, msgId, fromGroup, fromQQ, fromAnonymous, msg, font) {
        var p = this;
        var server = null;

        group2item(fromGroup, function(groupItem){
            //console.log(fromGroup, groupItem, null);
            var tmpAccount = (groupItem) ? groupItem.account : '';
            if(tmpAccount != ''){
                if (serverList[tmpAccount]){
                    server = serverList[tmpAccount];
                } else {
                    server = 'noAccount';
                }
            } else{
                return CQMsg.MSG_IGNORE;
            }
    
            if (msg == "冷水"){
                if (server == 'noAccount'){
                    p.CQ.sendGroupMsg(fromGroup, `你们的群没有设置可用账户`);
                    return CQMsg.MSG_INTERCEPT;
                }
                if (server.group == fromGroup && (server.user == fromQQ || fromQQ == groupItem.master)){
                    p.CQ.sendGroupMsg(fromGroup, `正在全局初始化，尽可能结束可能开着的机器`);
                    server.login(function(stat){
                        console.log('OUT - Login:', stat);
                        server.query(function(stat){
                            console.log('OUT - Query:\n' + stat);
                            server.favn = 0;
                            server.end(function(stat){
                                console.log('OUT - End:', stat);
                                p.CQ.sendGroupMsg(fromGroup, `bye bye~`);

                                server.user = '';
                                server.group = '';
                            })
                        })
                    })
                    return CQMsg.MSG_INTERCEPT;
                }
            }
    
            if (msg == "热水"){
                if (server == 'noAccount'){
                    p.CQ.sendGroupMsg(fromGroup, `你们的群没有设置可用账户`);
                    return CQMsg.MSG_INTERCEPT;
                }
                if(server.group == '' && server.user == ''){
                    p.CQ.sendGroupMsg(fromGroup, `我在`);
                } else if(!(server.group == fromGroup && server.user == fromQQ)){
                    p.CQ.sendGroupMsg(fromGroup, `正在被占用`);
                    return CQMsg.MSG_INTERCEPT;
                };
    
                function resultQuery(stat){
                    var tmpStr = '';
                    stat.forEach(function(item,index){
                        tmpStr += '\n' + '[' + (index+1) + '] ' + item;
                    })
                    console.log('OUT - Query:\n' + tmpStr);
                    return tmpStr;
                }
    
                server.query(function(stat){
                    if (stat == 'fail') {
                        console.log('ReLogin...');
                        server.login(function(stat){
                            console.log('OUT - Login:', stat);
                            server.query(function(stat){
                                if (stat != 'fail'){
                                    p.CQ.sendGroupMsg(fromGroup, `登陆成功，请回复机器编号：${resultQuery(stat)}`)
                                    server.group = fromGroup;
                                    server.user = fromQQ;
                                } else p.CQ.sendGroupMsg(fromGroup, `登陆异常`)
                            })
                        })
                    } else {
                        console.log('OUT - Query:\n' + stat);
                        p.CQ.sendGroupMsg(fromGroup, `请回复机器编号：${resultQuery(stat)}`)
                        server.group = fromGroup;
                        server.user = fromQQ;
                    }
                });
                return CQMsg.MSG_INTERCEPT;
            }
    
            if (server == 'noAccount') return CQMsg.MSG_IGNORE;
            if (!(server.group == fromGroup && server.user == fromQQ)){
                console.log("...")
                return CQMsg.MSG_IGNORE;
            }
            
            if(server.water){
                //停止
                if (settings.stopWords.indexOf(msg) > 0){
                    server.end(function(stat){
                        console.log('OUT - End:', stat);
                        p.CQ.sendGroupMsg(fromGroup, `正在结束`);
                    })
                } 
            } else{
                var lt = msg - 1;
                if (lt >= 0 && lt <= server.favo.length - 1){
                    p.CQ.sendGroupMsg(fromGroup, `正在开启`);
                    server.favn = lt;
                    server.start(function(stat){
                        if (stat == 'success'){
                            console.log('OUT - Start:', stat, server.favo[lt].name);
                            server.balance(function(stat){
                                if(stat != 'fail'){
                                    server.balanceBefore = stat.balance;
                                };
                            })
                            p.CQ.sendGroupMsg(fromGroup, `开启成功：[${server.favo[lt].index+1}] ${server.favo[lt].name}`)
                            keepEye(server, p);
                            server.water = true;
                            p.CQ.sendGroupMsg(fromGroup, '随时喊停');
                        } else{
                            console.log('fail');
                        }
                    })
                } else{
                    console.log('reTry');
                    p.CQ.sendGroupMsg(fromGroup, `抱歉，我没看懂，您可以输“冷水”`)
                }
            }
            return CQMsg.MSG_INTERCEPT;
        });
    }
}
const app = new App()
export { app }

if (app.CQ.getDebug()) {
    app.debug()
}
