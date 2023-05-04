const event = require('events');
const fs = require('fs');

const Mailjet = require('node-mailjet')
const mailjet = new Mailjet({
  apiKey: "4ca14c170f7ca87f0c03b84db91545ea",
  apiSecret: "be3ebbb526be2508758ba86c8f6530e7"
});

class Temp extends event {
  constructor() {
    super();
    this.temp = {};
    this.tempfilePath = 'temp.json';
    this.loadTemp();
  }

  addTemp(date, temp) {
    this.temp[date] = temp;
    this.saveTemp();
    const AveTemp = temp.reduce((acc, val) => acc + val, 0) / temp.length;
    if (AveTemp > 30) {
      this.emit('highTemp', {date, temp: AveTemp});
    }
  }

  AveTemp(date) {
    const tempforDate = this.temp[date];
    if (!tempforDate || tempforDate.length === 0) {
      console.log('----------------------------------------------------')
      console.log(`On this ${date} there're no temperature info ${String.fromCodePoint(0x1F616	)}`);
      return;
    }
    const totalTemperature = tempforDate.reduce((acc, val) => acc + val, 0);
    const AveTemp = totalTemperature / tempforDate.length;
    console.log(`Average air temp.  for ${date}: ${AveTemp}  ${String.fromCodePoint(0x1F321)} C`);
 
    const request = mailjet
        .post("send", {'version': 'v3.1'})
        .request({
            "Messages":[{
                "From": {
                    "Email": "mytemp25@gmail.com",
                    "Name": "Temperature Tracker"
                },
                "To": [{
                    "Email": "YOU-EMAIL@gmail.com",
                    "Name": "Temperature Tracker"
                }],
                "Subject": `Average air temp. for ${date}  ${String.fromCodePoint(0x1F321)}  `,
      
                "TextPart": `Average air temp. for${date}: ${AveTemp} ${String.fromCodePoint(0x1F321)} `,
                "HTMLPart": `<h3>Average air temp. for ${date}: ${AveTemp}${String.fromCodePoint(0x1F321)} °C</h3>`
            }]
        })
    request
        .catch((err) => {
            console.log(err.statusCode)
        })
  }
  
  saveTemp() {
    try {
      fs.writeFileSync(this.tempfilePath, JSON.stringify(this.temp), 'utf8');
    } catch (err) {
      console.error(err);
    }
  }
  

  loadTemp() {
    fs.readFile(this.tempfilePath, 'utf8', (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') { // якщо файл не знайдено
          console.log(`File: ${this.tempfilePath} is not found ${String.fromCodePoint(0x1F601)}. Creating a new one...`);
          this.saveTemp(); // створюємо новий файл
          setTimeout(() => {
            this.emit('tempLoaded');
          }, 1000);
          return;
        }
        console.error(err);
        return;
      }
      try {
        const loadedTemp = JSON.parse(data);
        this.temp = Object.assign({}, this.temp, loadedTemp);
        this.emit('tempLoaded');
      } catch (e) {
        console.error(e);
      }
    });
  }
}

const sensor = new Temp();

sensor.on('highTemp', ({date, temp}) => {
  console.log(`Attention Detention${String.fromCodePoint(0x2757)} Average air temp. higher than 30 C (${temp} Celsium) on ${date}`);
  console.log('----------------------------------------------------')
});

sensor.on('tempLoaded', () => {
  sensor.addTemp("27.04.2023", [5, 28]);
  sensor.addTemp("28.04.2023", [14, 45, 37, 22, 11]);
  sensor.addTemp("29.04.2023", [8]);
  sensor.addTemp("30.04.2023", [40]);

  sensor.AveTemp("27.04.2023");
  sensor.AveTemp("28.04.2023");
  sensor.AveTemp("29.04.2023");
  sensor.AveTemp("30.04.2023");


  console.log(sensor.temp);
});
