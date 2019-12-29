var request = require('request');

module.exports = class life798 {

    constructor(username, password) {
        this.username = username;
        this.password = password;
        this.host = '';
        this.auth = '';
        this.favo = [];
        this.favn = 0;
        this.group = '';
        this.user = '';
        this.water = false;
        this.balanceBefore = 0;
    }

    //登录
    login(cb){
        function makeRandId(length) {
            var text = "";
            var charList = "abcdef0123456789";
            for( var i = 0; i < length; i++ ) text += charList.charAt(Math.floor(Math.random() * charList.length));
            return text;
        }
        var p = this;
        var options = {
            url: 'http://sunxie.hnkzy.com:6767/acc/login?pn=' + p.username + '&pwd=' + p.password + '&model=513&eid=' + makeRandId(16),
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                'User-Agent': 'Apache-HttpClient/UNAVAILABLE (java 1.4)'
            }
        };
        function callback(error, response, body) {
            if (!error && response.statusCode == 200) {
                var info = JSON.parse(body);
                if (info.code == 0){
                    p.auth = 'Basic ' + info.data.did + info.data.security;
                    p.host = info.data.host;
                    console.log('Host:' + p.host);
                    console.log('Auth: ' + p.auth);
                    console.log('Msg: ' + info.msg);
                    cb('success');
                } else{
                    console.log('ERROR_Login:', info);
                    cb(info.msg);
                }
            }
        }
        
        request.post(options, callback);
    }

    //查询收藏的机器和卡号
    query(cb){
        var p = this;
        var options = {
            url: 'http://' + p.host + ':6767/kzy/home?types=8&types=9&types=20',
            headers: {
                'Authorization': p.auth,
                'Content-Type': 'application/json;charset=UTF-8',
                'User-Agent': 'Apache-HttpClient/UNAVAILABLE (java 1.4)'
            }
        };
        function callback(error, response, body) {
            if (!error && response.statusCode == 200) {
                var info = JSON.parse(body);
                if (info.code == 0){
                    var tmpFavo = [];
                    p.favo = [];
                    info.data.favos.forEach(function(item, index){
                        p.favo.push({index: index, name: item.name, did: item.id, eid: item.owner})
                        tmpFavo.push(item.name);
                    })
                    console.log('Favo: \n', tmpFavo);
                    cb(tmpFavo);
                } else{
                    console.log('ERROR_Query:', info);
                    cb('fail');
                }
            } else{
                cb('fail');
            }
        }

        request(options, callback);
    }

    //查询余额
    balance(cb){
        var p = this;
        var options = {
            url: 'http://' + p.host + ':6767/dev/wp/billing/balance?eid=' + p.favo[p.favn].eid,
            headers: {
                'Authorization': p.auth,
                'Content-Type': 'application/json;charset=UTF-8',
                'User-Agent': 'Apache-HttpClient/UNAVAILABLE (java 1.4)'
            }
        };
        function callback(error, response, body) {
            if (!error && response.statusCode == 200) {
                var info = JSON.parse(body);
                if (info.code == 0){
                    /* console.log(info.data.balance);
                    console.log(info.data.wp.startTime);
                    console.log(info.data.wp.endTime); */
                    cb({balance: info.data.balance, using: info.data.wp.endTime == 0 ? 0 : (info.data.wp.endTime - info.data.wp.startTime) / 1000})
                } else{
                    console.log('ERROR_Balance: ' + info);
                    cb('fail');
                }
            } else{
                cb('fail');
            }
        }

        request(options, callback);
    }

    //开始放水
    start(cb){
        var p = this;
        var options = {
            url: 'http://' + p.host + ':6767/dev/wp/billing/start?did=' + p.favo[p.favn].did + '&eid=' + p.favo[p.favn].eid,
            headers: {
                'Authorization': p.auth,
                'Content-Type': 'application/json;charset=UTF-8',
                'User-Agent': 'Apache-HttpClient/UNAVAILABLE (java 1.4)'
            }
        };

        function callback(error, response, body) {
            if (!error && response.statusCode == 200) {
                var info = JSON.parse(body);
                if (info.code == 0){
                    console.log('Start: success');
                    cb('success')
                } else{
                    console.log('ERROR_Start:', info);
                    cb(info.msg);
                }
            }
        }

        request.put(options, callback);
    }

    //结束放水
    end(cb){
        var p = this;
        var options = {
            url: 'http://' + p.host + ':6767/dev/wp/billing/end?eid=' + p.favo[p.favn].eid,
            headers: {
                'Authorization': p.auth,
                'Content-Type': 'application/json;charset=UTF-8',
                'User-Agent': 'Apache-HttpClient/UNAVAILABLE (java 1.4)'
            }
        };
        //console.log(p);
        function callback(error, response, body) {
            if (!error && response.statusCode == 200) {
                var info = JSON.parse(body);
                if (info.code == 0){
                    console.log('End: success');
                    cb('success');
                } else{
                    console.log('ERROR_End:', info);
                    cb(info.msg);
                }
            }
        }

        request.put(options, callback);
    }
};