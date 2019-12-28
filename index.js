import { CQApp, CQMsg } from 'cq-robot'
var life798 = require('./life798');
var settings = require('./settings');

//设置账号密码
var server = new life798(settings.username, settings.password);

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
        this.CQ.sendPrivateMsg(settings.master, '热水服务来了')
        return 0
    }
    disable() {
        this.isEnable = false
        this.CQ.sendPrivateMsg(settings.master, '热水服务走了')
        return 0
    }
    async  privateMsg(subType, msgId, fromQQ, msg, font) {
        if (msg == "热水"){
            this.CQ.sendPrivateMsg(fromQQ, '暂不线下放水')
            return CQMsg.MSG_INTERCEPT
        }
        return CQMsg.MSG_IGNORE;
    }
    async   groupMsg(subType, msgId, fromGroup, fromQQ, fromAnonymous, msg, font) {
        var p = this;
        //console.log(settings.groupList);
        if (settings.groupList.indexOf(fromGroup) < 0) {
            return CQMsg.MSG_IGNORE;
        }
        if (msg == "热水" && p.user == ''){
            p.CQ.sendGroupMsg(fromGroup, `我在`)
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
                                p.user = fromQQ;
                            }
                        })
                    })
                } else {
                    console.log('OUT - Query:\n' + stat);
                    p.CQ.sendGroupMsg(fromGroup, `请回复机器编号：${resultQuery(stat)}`)
                    p.user = fromQQ;
                }
            });
            return CQMsg.MSG_INTERCEPT;
        }
        if (msg == "冷水"){
            p.CQ.sendGroupMsg(fromGroup, `正在全局初始化，尽可能结束可能开着的机器`);
            p.user = '';
            server.login(function(stat){
                console.log('OUT - Login:', stat);
                server.query(function(stat){
                    console.log('OUT - Query:\n' + stat);
                    server.favn = 0;
                    server.end(function(stat){
                        console.log('OUT - End:', stat);
                        p.CQ.sendGroupMsg(fromGroup, `bye bye~`);
                    })
                })
            })
            return CQMsg.MSG_INTERCEPT;
        }

        if (p.user == fromQQ){
            if (settings.stopWords.indexOf(msg) > 0){
                server.end(function(stat){
                    console.log('OUT - End:', stat);
                    p.CQ.sendGroupMsg(fromGroup, `正在结束`);
                })
                p.user = '';
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
                                    p.balanceBefore = stat.balance;
                                };
                            })
                            p.CQ.sendGroupMsg(fromGroup, `开启成功：[${server.favo[lt].index+1}] ${server.favo[lt].name}`)
                            keepEye();
                            p.CQ.sendGroupMsg(fromGroup, '随时喊停');
                            function keepEye(){
                                server.balance(function(stat){
                                    if(stat != 'fail'){
                                        if(stat.using > 0){
                                            console.log(' SHELL - Balance:', 'Stop', stat.balance, stat.using);
                                            p.CQ.sendGroupMsg(fromGroup, `用时 ${stat.using.toFixed(2)} 秒，用钱 ¥ ${(p.balanceBefore - stat.balance).toFixed(2)}, 当前余额 ¥ ${stat.balance}`)
                                            p.user = '';
                                            p.CQ.sendGroupMsg(fromGroup, `bye bye~`);
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
                    p.CQ.sendGroupMsg(fromGroup, `抱歉，我没看懂，您可以输“冷水”`)
                }
            }
            return CQMsg.MSG_INTERCEPT;
        }
        return CQMsg.MSG_IGNORE;
    }
}
const app = new App()
export { app }

if (app.CQ.getDebug()) {
    app.debug()
}
