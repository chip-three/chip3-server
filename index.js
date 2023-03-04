const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser');
const cron = require('node-cron');
const axios = require('axios');
const mongoose = require('mongoose');
const Data = require('./models/datamodel')
const History = require('./models/history')
const Release = require('./models/releasemodel')
const ethers = require('ethers');
const abi = require('./abi.json')
require('dotenv').config()
const app = express();
app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

const contractaddress = "0xBf1cc2806d3506a6118Ca3308492a7cAA465Fdb7"

let provider = new ethers.providers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com/')
let walletWithProvider = new ethers.Wallet(process.env.PVKEY, provider);

mongoose.connect(
  process.env.MONGO_URL,
  (err) => {
    if (err) throw err;
    console.log('DB Connected');
  },
);


cron.schedule('* * * * *', () => {
  let yourDate = new Date()
  console.log(yourDate.toISOString().split('T')[0], 'schedule working')
  const options = {
    method: 'GET',
    url: `https://api-football-v1.p.rapidapi.com/v3/fixtures?date=${yourDate.toISOString().split('T')[0]}`,
    headers: {
      'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
      'X-RapidAPI-Key': process.env.APIKEY
    }
  };
  
  axios
    .request(options)
    .then(async function (response) {
      for (const newdata of response.data.response) {
        let origindata = await Data.find({ fixtureid: newdata.fixture.id })
        if( origindata.length == 0) {
          let data = new Data({fixtureid: newdata.fixture.id, data: newdata, date: yourDate.toISOString().split('T')[0]})
          await data.save()
        }else if(newdata.fixture.status.long == "Match Finished"){
          if(origindata[0].data.fixture.status.long != "Match Finished"){
            let contract = new ethers.Contract(contractaddress, abi, walletWithProvider)
            let winteamid
            if(newdata.goals.home > newdata.goals.away){
              winteamid = newdata.teams.home.id
            }else{
              winteamid = newdata.teams.away.id
            }

            let contracts = await contract.getMyContract(newdata.fixture.id)
              console.log("contracts", contracts)
            if(contracts.length != 0){
              let tx = await contract.release(newdata.fixture.id, winteamid)
              let rs = await tx.wait()
              console.log(tx, rs)
              if(!rs) {
               let failedtx =  new Release({matchID: newdata.fixture.id, released: false})
               await failedtx.save()
              } 
              else {
                let successdtx =  new Release({matchID: newdata.fixture.id, released: true})
               await successdtx.save()
              }
            } 
          }
          if(origindata[0].data.fixture.status.long != newdata.fixture.status.long)
            await Data.findOneAndUpdate({ fixtureid: newdata.fixture.id }, {fixtureid: newdata.fixture.id, data: newdata, date: yourDate.toISOString().split('T')[0]})
        }
      }
    })
    .catch(err=>{
      console.log(err)
    });
});

app.get('/get_data', async (req, res) => {
  let yourDate = new Date()
  console.log("goiod")
  Data.find({date: yourDate.toISOString().split('T')[0]}, '-_id data', (err, result) => {
  //Data.find({}, '-_id data', (err, result) => {
	// Data.find({date: "2023-01-31"}, '-_id data', (err, result) => {
    if (err) {
      res.status(500).json(err);
    } else {
      let final = [];
      for (const item of result) {
        final.push(item.data);
      }
      res.json(final)
    }
  })
})

app.post('/bet', async (req, res)=>{
  const {matchId, amount, teamId, address} = req.body
  console.log(matchId, amount, teamId, address)
  let newhistory = new History({
    matchId: matchId, 
    amount: amount,
    teamId: teamId,
    address: address.toUpperCase()
  })
  await newhistory.save()
  res.send("good")
})

app.post('/history', async (req, res)=>{
  const {address} = req.body
  console.log(address)
  let history = await History.find({address: address.toUpperCase()})
  let data = []
  for(const item of history){
    console.log(parseInt(item.matchId))
    let origindata = await Data.find({ fixtureid: parseInt(item.matchId) })
    origindata.push(item)
    data.push(origindata)
  }
  res.json(data)
})

 
app.listen(5000, () => console.log(`listening on port 5000`));