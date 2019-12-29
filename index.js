import { CQApp, CQMsg } from 'cq-robot'
var life798 = require('./life798');
var settings = require('./settings');

//服务对象集合
var serverList = {};

//将群号转成对应的群对象
function group2item(groupNumber){
    var flag = null;
    settings.groupList.forEach(function(item, index){
        //console.log(groupNumber, item.groupNumber)
        if(groupNumber == item.groupNumber){
            flag = item;
        }
    })
    return flag;
}

//用于监控放水后截止状况，延时递归
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

//将机器列表数组转为字符串
function resultQuery(stat){
    var tmpStr = '';
    stat.forEach(function(item,index){
        tmpStr += '\n' + '[' + (index+1) + '] ' + item;
    })
    console.log('OUT - Query:\n' + tmpStr);
    return tmpStr;
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
                if (stat != 'success'){
                    if(!serverList[item.username]){
                        serverList[item.username] = server;
                        settings.groupList.forEach(function(item2, index){
                            if(item2.account == server.username){
                                p.CQ.sendGroupMsg(item2.groupNumber, `ERROR! 账户登录失败!（${item2.account}）\n${stat}`)
                                p.CQ.sendGroupMsg(item2.groupNumber, `请检查账户密码后输入“热水”重新激活`)
                            }
                        });
                    }
                } else{
                    serverList[item.username] = server;
                    settings.groupList.forEach(function(item2, index){
                        if(item2.account == server.username){
                            p.CQ.sendGroupMsg(item2.groupNumber, `账户登录成功~（${item2.account}）`)
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
    async privateMsg(subType, msgId, fromQQ, msg, font) {
        if (msg == "热水"){
            this.CQ.sendPrivateMsg(fromQQ, '暂不线下放水')
            return CQMsg.MSG_INTERCEPT
        }
        return CQMsg.MSG_INTERCEPT;
    }
    async groupMsg(subType, msgId, fromGroup, fromQQ, fromAnonymous, msg, font) {
        var p = this;
        var server = null;

        var groupItem = group2item(fromGroup)

        var tmpAccount = (groupItem) ? groupItem.account : '';

        //console.log(fromGroup, groupItem, tmpAccount);
        //忽略掉不在列表中的群
        if(tmpAccount != ''){
            if (serverList[tmpAccount]){
                server = serverList[tmpAccount];
            } else {
                //忽略掉在列表中但设置的账户无效的群
                server = 'badAccount';
            }
        } else{
            return CQMsg.MSG_IGNORE;
        }

        //冷水全局初始化
        if (msg == "冷水" || msg == "重置"){
            if (server == 'badAccount'){
                p.CQ.sendGroupMsg(fromGroup, `你们的群设置的账户无效`);
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

        //热水开始
        if (msg == "热水"){
            if (server == 'badAccount'){
                p.CQ.sendGroupMsg(fromGroup, `你们的群设置的账户无效`);
                return CQMsg.MSG_INTERCEPT;
            }
            if(server.group == '' && server.user == ''){
                p.CQ.sendGroupMsg(fromGroup, `我在`);
            } else if(!(server.group == fromGroup && server.user == fromQQ)){
                p.CQ.sendGroupMsg(fromGroup, `正在被占用`);
                return CQMsg.MSG_INTERCEPT;
            };

            //查询机器，支持一次重登
            server.query(function(stat){
                if (stat == 'fail') {
                    console.log('ReLogin...');
                    server.login(function(stat){
                        if(stat == 'success'){
                            console.log('OUT - Login:', stat);
                            server.query(function(stat){
                                if (stat != 'fail'){
                                    if (stat.length == 0){
                                        p.CQ.sendGroupMsg(fromGroup, `您好像没有收藏的机器`)
                                    } else{
                                        p.CQ.sendGroupMsg(fromGroup, `登陆成功，请回复机器编号：${resultQuery(stat)}`)
                                        server.group = fromGroup;
                                        server.user = fromQQ;
                                    }
                                } else p.CQ.sendGroupMsg(fromGroup, `查询异常`)
                            })
                        } else p.CQ.sendGroupMsg(fromGroup, `${stat}`)
                    })
                } else {
                    console.log('OUT - Query:\n' + stat);
                    if (stat.length == 0){
                        p.CQ.sendGroupMsg(fromGroup, `您好像没有收藏的机器`)
                    } else{
                        p.CQ.sendGroupMsg(fromGroup, `请回复机器编号：${resultQuery(stat)}`)
                        server.group = fromGroup;
                        server.user = fromQQ;
                    }
                }
            });
            return CQMsg.MSG_INTERCEPT;
        }

        //忽略掉在列表中但设置的账户无效的群
        if (server == 'badAccount') return CQMsg.MSG_IGNORE;
        //忽略掉不在控制我的人
        if (!(server.group == fromGroup && server.user == fromQQ)) return CQMsg.MSG_IGNORE;
        
        //如果是在放水状态
        if(server.water){
            //判断为停止关键词
            if (settings.stopWords.indexOf(msg) > 0){
                server.end(function(stat){
                    console.log('OUT - End:', stat);
                    if(stat == 'success'){
                        p.CQ.sendGroupMsg(fromGroup, `正在结束`);
                    } else{
                        p.CQ.sendGroupMsg(fromGroup, stat);
                    }
                })
            } 
        } else{
            var lt = msg - 1;
            if (lt >= 0 && lt <= server.favo.length - 1){
                //判断为输入机器序号
                p.CQ.sendGroupMsg(fromGroup, `正在开启`);
                server.favn = lt;
                server.start(function(stat){
                    if (stat == 'success'){
                        console.log('OUT - Start:', stat, server.favo[lt].name);
                        server.balance(function(stat){
                            if(stat != 'fail'){
                                server.balanceBefore = stat.balance;
                                console.log('balance-Before:', server.balanceBefore)
                            };
                        })
                        p.CQ.sendGroupMsg(fromGroup, `开启成功：[${server.favo[lt].index+1}] ${server.favo[lt].name}`)
                        keepEye(server, p);
                        server.water = true;
                        p.CQ.sendGroupMsg(fromGroup, '随时喊停');
                    } else{
                        //console.log('fail');
                        p.CQ.sendGroupMsg(fromGroup, stat);
                        p.CQ.sendGroupMsg(fromGroup, `您可以输“冷水”重置，也可以重新选择机器`)
                    }
                })
            } else{
                console.log('reTry');
                p.CQ.sendGroupMsg(fromGroup, `抱歉，我没看懂，您可以输“冷水”重置`)
            }
        }
        return CQMsg.MSG_INTERCEPT;
    }
}
const app = new App()
export { app }

if (app.CQ.getDebug()) {
    app.debug()
}
