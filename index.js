var SerialPort = require('serialport'); //아두이노와 시리얼 통신할 수 있는 모듈
var parsers = SerialPort.parsers;
var parser = new parsers.Readline({
  delimiter: '\r\n'
});

//ubidots 연결
var ubidots = require('ubidots');
var client = ubidots.createClient('BBFF-42c1d32ee052243010a1dd861d2d91b75bb');

//라즈베리파이와 연결된 디바이스 주소
var port = new SerialPort('/dev/ttyACM0', {
  baudRate: 9600
});

var onoff = require('onoff');
var Gpio = onoff.Gpio;
var power = new Gpio(22, 'out');

//포트 열기
port.pipe(parser);
port.on('open', function() {
  console.log('port open');
});

// open errors will be emitted as an error event
port.on('error', function(err) {
  console.log('Error: ', err.message);
});

client.auth(function() {
  var send_out_air = this.getVariable('5afab9b9642ab64592357ed1');
  var send_out_temp = this.getVariable('5afc0d18642ab659c69e72ec');
  var send_out_humi = this.getVariable('5affb45b642ab67cdfa37987');
  var send_out_illumination = this.getVariable('5afc0cf0642ab659c69e72e7');

  var get_in_air = this.getVariable('5afab9c3642ab6461f5eca53');
  var send_out_switch = this.getVariable('5afab9d1642ab64677b501eb');

  parser.on('data', function(data) {
    console.log(data);
    var str = data.toString();
    var strArray = str.split('-');
    var sensorObj;

    if (strArray[0] == '1') {
      sensorObj = strArray[1];
      send_out_air.saveValue(sensorObj)
      var out_air = sensorObj;

      get_in_air.getValues(function(err, data) {
        var in_air = data.results[0].value.toString();
        console.log("in_air : " + in_air);
        if (in_air > out_air) {
          // sets pin to high
          power.writeSync(0);
          console.log("power.writeSync(0);");
          send_out_switch.saveValue('0');
        } else if (out_air > 80) {
          power.writeSync(1);
          console.log("power.writeSync(1);");
          send_out_switch.saveValue('1');
        }else{
          power.writeSync(0);
          console.log("power.writeSync(0);");
          send_out_switch.saveValue('0');
        }
        if (in_air < 80 && out_air < 80) {
          // sets pin to high
          power.writeSync(0);
          console.log("power.writeSync(0);");
          send_out_switch.saveValue('0');
        }
      });
    } else if (strArray[0] == '2') {
      sensorObj = strArray[1];
      send_out_temp.saveValue(sensorObj);
    } else if (strArray[0] == '3') {
      sensorObj = strArray[1];
      send_out_humi.saveValue(sensorObj);
    } else if (strArray[0] == '4') {
      sensorObj = strArray[1];
      send_out_illumination.saveValue(sensorObj);
    }
  });
});
