const request = require("request"), 
    fs = require("fs"), 
    _cliProgress = require("cli-progress");
var https = require("follow-redirects").https;

const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });
  CheckLine();
  function CheckLine(){
  readline.question("What video can I fetch today? URL: ", UserURL => {
    //console.log(`You input the URL ${URL}`);
    let WistiaURL = UserURL
    readline.close();
    var setSearch = ".wistia.com/medias/";
    if (UserURL.includes(setSearch)) {
        URLPassthrough(WistiaURL);
    } else {
        console.log("Please come back with a Wistia Medias link. Example: [*.wistia.com/medias/*]")
    }
  });
}

function URLPassthrough(WistiaURL) {
    var domain = WistiaURL.split("/");
    let URLReturn = (domain[domain.length - 1]);
    TestFlight(URLReturn);
}

function TestFlight (URLReturn) {
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
        testCall(JSONPulling)
    });

    res.on("error", function (error) {
        console.error(error);
    });
    });

    req.end();

}
function testCall(JSONPulling){
    const obj = JSON.parse(JSONPulling);
    const download = (url, filename, callback) => {

        const progressBar = new _cliProgress.SingleBar({
            format: "{bar} {percentage}% | ETA: {eta}s"
        }, _cliProgress.Presets.shades_classic);
    
        const file = fs.createWriteStream(filename);
        let receivedBytes = 0
        
    
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
        });
    
        file.on("error", (err) => {
            fs.unlink(filename); 
            progressBar.stop();
            return callback(err.message);
        });
    }
    
    
    const fileUrl = obj.media.assets[0].url;
    download(fileUrl, obj.media.channelTitle + "_" + obj.media.projectId + ".mp4", () => {});
}