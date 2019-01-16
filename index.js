// Import the page's CSS. Webpack will know what to do with it.
import "../styles/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'
const ipfsAPI=require('ipfs-api');
const ipfs=ipfsAPI({host:'localhost', port:'5001', protocol: 'http'});

// Import our contract artifacts and turn them into usable abstractions.
import digital_artstore_artifacts from '../../build/contracts/DigitalArtStore.json'

// MetaCoin is our usable abstraction, which we'll use through the code below.
var DigitalArtStore = contract(digital_artstore_artifacts);

window.App = {
 start: function() {
  var self = this;

  // Bootstrap the MetaCoin abstraction for Use.
  DigitalArtStore.setProvider(web3.currentProvider);
  //console.log("fff1");
  renderStore();
  var reader;
  $("#product-image").change(function(event) {
    const file = event.target.files[0]
    reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
  });
  $("#add-item-to-store").submit(function(event) {
   const req = $("#add-item-to-store").serialize();
   let params = JSON.parse('{"' + req.replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
   let decodedParams = {}
   Object.keys(params).forEach(function(v) {
    decodedParams[v] = decodeURIComponent(decodeURI(params[v]));
   });
   saveProduct(reader, decodedParams);
   event.preventDefault();
});

 }
};


function saveImageOnIpfs(reader) {
 return new Promise(function(resolve, reject) {
  const buffer = Buffer.from(reader.result);
  ipfs.add(buffer)
  .then((response) => {
   console.log(response)
   resolve(response[0].hash);
  }).catch((err) => {
   console.error(err)
   reject(err);
  })
 })
}
function saveTextBlobOnIpfs(blob) {
 return new Promise(function(resolve, reject) {
  const descBuffer = Buffer.from(blob, 'utf-8');
  ipfs.add(descBuffer)
  .then((response) => {
   console.log(response)
   resolve(response[0].hash);
  }).catch((err) => {
   console.error(err)
   reject(err);
  })
 })
}

function saveProduct(reader, decodedParams) {
  let imageId, descId;
  saveImageOnIpfs(reader).then(function(id) {
    imageId = id;
    saveTextBlobOnIpfs(decodedParams["product-description"]).then(function(id) {
      descId = id;
       saveProductToBlockchain(decodedParams, imageId, descId);
    })
 })
}
function saveProductToBlockchain(params, imageId, descId) {
  console.log(params);
  //let auctionStartTime = Date.parse(params["product-auction-start"]) / 1000;
  //let auctionEndTime = auctionStartTime + parseInt(params["product-auction-end"]) * 24 * 60 * 60

  DigitalArtStore.deployed().then(function(i) {
    i.addProductToStore(params["product-name"], params["product-category"], imageId, descId,params["product-price"], {from: web3.eth.accounts[0], gas: 440000}).then(function(f) {
   console.log(f);
   $("#msg").show();
   $("#msg").html("Your product was successfully added to your store!");
  })
 });
}



function renderStore()
{
  var instance;
    //console.log("fff2");
  return DigitalArtStore.deployed().then(function(f)
{
  instance=f;
  console.log(f);
  return instance.productIndex.call();
}).then(function(count)
{
  console.log(count);
  for(var i=1;i<=count;i++)
  {
    //console.log("fff4 Inside the loop to renderProduct");
    renderProduct(instance,i );
  }
});
}


function renderProduct(instance, index)
{
  instance.getProduct.call(index).then(function(f)
{
  let node=$("<div/>");
  console.log(f);
  node.addClass("col-sm-3 text-center col-margin-bottom-1 product");
  node.append("<img src='http://localhost:8080/ipfs/"+f[3]+"'/>");
  node.append("<div class ='title'>" + f[1]+ "</div>");
  node.append("<div> Price :" + f[5]+ "</div>");
  if(f[6]==1)
  {
    $("#product-list").append(node);

  }
  else
  {
    $("#product-purchased").append(node);
  }
});
}


window.addEventListener('load', function() {
 // Checking if Web3 has been injected by the browser (Mist/MetaMask)
 if (typeof web3 !== 'undefined') {
  console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
  // Use Mist/MetaMask's provider
  window.web3 = new Web3(web3.currentProvider);
 } else {
  console.warn("No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
  // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
  window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
 }

 App.start();
});
