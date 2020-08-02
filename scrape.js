// Define Needed Resources
const request = require("request"), 
    fs = require("fs"), 
    _cliProgress = require("cli-progress");
var https = require("follow-redirects").https;

console.log("==========================================================");
console.log("          Welcome to Clarity's Wistia Scraper!")
console.log("==========================================================");

// Get User Input For URL
const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });
  getInput();
  function getInput(){
  readline.question("What video should I fetch today? URL: ", UserURL => {
    let WistiaURL = UserURL;
    readline.close();
    var setSearch = ".wistia.com/medias/";
    if (UserURL.includes(setSearch)) {
        getUniqueURL(WistiaURL);
    } else {
        console.log("Sorry, that link is not valid. Please come back with a Wistia Medias link. Example: [*.wistia.com/medias/*]");
    }
  });
}

// Get UniqueURL Identifier
function getUniqueURL(WistiaURL) {
    var domain = WistiaURL.split("/");
    let URLReturn = (domain[domain.length - 1]);
    parseJSON(URLReturn);
}

// Turn Response Into JSON
function parseJSON(URLReturn) {
    var options = {
    "method": "GET",
    "hostname": "fast.wistia.com",
    "path": "/embed/medias/"+URLReturn+".json",
    "headers": {
    },
    "maxRedirects": 20
    };

    var req = https.request(options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
        chunks.push(chunk);
    });

    res.on("end", function (chunk) {
        var body = Buffer.concat(chunks);
        var JSONPulling = body;
        checkIfOnline(JSONPulling)
    });

    res.on("error", function (error) {
        console.error(error);
    });
    });

    req.end();

}

// Check If The File Exists
function checkIfOnline(JSONPulling){
    const obj = JSON.parse(JSONPulling);
    var OnlineCheck = obj.media;
    if (OnlineCheck != undefined){
        checkRegex(obj);
} else {
    console.log("Unfortunately, this video either doesn't exist or has been removed by the author.");
    }
}

// Since The File Exists, Regex For Bad Names
function checkRegex(obj){
    var OriginalName = obj.media.name;
    var ChannelName = obj.media.channelTitle;
    FinalName = OriginalName.replace(/[/\\?%*:|"<>]/g, '-');
    checkFolder(FinalName, obj);
    console.log("=====================================================================");
    console.log("Now Fetching /// Title: " + FinalName + " /// Author: " + ChannelName);
    console.log("=====================================================================");
}

// Check If Project Downloads Folder Exists, If Not, Create One
function checkFolder(FinalName, obj){
    var Directory = "./Downloads";

    if (!fs.existsSync(Directory)){
        fs.mkdirSync(Directory);
        downloadVideo(FinalName, obj);
    } else if (fs.existsSync(Directory)){
        downloadVideo(FinalName, obj);
    }
}

// Download The Final Video To Project Downloads Folder
function downloadVideo(FinalName, obj){
    const download = (url, filename, callback) => {

        const progressBar = new _cliProgress.SingleBar({
            format: "{bar} {percentage}% | ETA: {eta}s"
        }, _cliProgress.Presets.shades_classic);
    
        const file = fs.createWriteStream(filename);
        let receivedBytes = 0;

        request.get(url)
        .on("response", (response) => {
            if (response.statusCode !== 200) {
                return callback("Response status was " + response.statusCode);
            }
    
            const totalBytes = response.headers["content-length"];
            progressBar.start(totalBytes, 0);
        })
        .on("data", (chunk) => {
            receivedBytes += chunk.length;
            progressBar.update(receivedBytes);
        })
        .pipe(file)
        .on("error", (err) => {
            fs.unlink(filename);
            progressBar.stop();
            return callback(err.message);
        });
        
        file.on("finish", () => {
            progressBar.stop();
            file.close(callback);
            console.log("Finished!");
        });

        file.on("error", (err) => {
            fs.unlink(filename); 
            progressBar.stop();
            return callback(err.message);
        });
    }

    const fileURL = obj.media.assets[0].url;
    download(fileURL, "./Downloads/" + FinalName + ".mp4", () => {});
}