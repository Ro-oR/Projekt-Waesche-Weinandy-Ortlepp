const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const apiToken = "3d67bf9773fba69970a84b25e1ae9b3d";
const xml2js = require('xml2js');
const fs = require("fs");

function umlautCheck(str){
    str = str.replace(/ä/g, "%C3%A4"); // /suchmuster/g = erste alle treffer
    str = str.replace(/ö/g, "%C3%B6"); // und nicht nur den ersten wie bei "suchmuster"
    str = str.replace(/ü/g, "%C3%BC");
    str = str.replace(/Ä/g, "%C3%84");
    str = str.replace(/Ö/g, "%C3%96");
    str = str.replace(/Ü/g, "%C3%9C");
    str = str.replace(/ß/g, "%C3%9F");
    return str
}
function HTML_UmlautConverter(str){
    str = str.replace(/&#196;/g, "Ä");
    str = str.replace(/&#228;/g, "ä");
    str = str.replace(/&#214;/g, "Ö");
    str = str.replace(/&#246;/g, "ö");
    str = str.replace(/&#220;/g, "Ü");
    str = str.replace(/&#252;/g, "ü");
    str = str.replace(/&#223;/g, "ß");
    return str;
}

function bahnhofIDSuche(str){
    let suche = umlautCheck(str);
    let request = new XMLHttpRequest();
    request.open("GET", "https://api.deutschebahn.com/stada/v2/stations?searchstring="+suche, false);
    request.setRequestHeader("Authorization", "Bearer " + apiToken);
    request.send();

    if(request.status !== 200){
        if(request.status === 400) console.log("Syntax Fehler");
        if(request.status === 401) console.log("Ungültiges Token");
        if(request.status === 404) console.log("Nichts gefunden");
        if(request.status === 500) console.log("Serverfehler");
        else console.log(request.status);
        return "Fehler "+request.status
    }

    let string = request.responseText;
    string = string.split("evaNumbers\":[{\"number\":");
    let id = string[1].split(",");

    return id[0]
}

function datumHeute(){
    let options = { year: '2-digit', month: '2-digit', day: '2-digit'};//, hour: '2-digit'};
    let dat = new Date();
    return dat.toLocaleDateString("de-DE", options).replace(/-/g, "");
}

function allUserData(){
    let allUsers = JSON.parse(fs.readFileSync('./userData.json', 'utf8', (err) => {
            if (err) {
                console.log("Lesefehler", err);

            }
        })
    );
    return allUsers
}

function addUserData(user){
    if (user === undefined) {
        console.log("user undefined");
        return
    }
    let allUsers = allUserData();
    allUsers.push(user);
    fs.writeFileSync('./userData.json', JSON.stringify(allUsers, null, 4), err => {
        if (err) { console.log("Schreibfehler", err) }
    });
}


exports.addUserData = addUserData();

module.exports = {
    Datum: function(){
        let options = { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: "2-digit", second: "2-digit"};
        let dat = new Date();
        return dat.toLocaleDateString("de-DE", options);
    },
    newUser: function(userName, userContact){
        const User = require("./user.js");
        let u = new User(userName, userContact);
        addUserData(u);
        return "ID: " +u.userID + " " + u.username +  "  " + u.contact
    },
    getUserByID: function(id){
        const User = require("./user.js");
        let users = allUserData();
        let u = new User("", "");
        let alteID = u.userID;
        for(let i = 0; i<users.length; i++){
            if(users[i].userID === id){
                u.userID = users[i].userID;
                u.username = users[i].username;
                u.contact = users[i].contact;
                u.tickets = users[i].tickets;
                u.angebote = users[i].angebote;
                u.suchen = users[i].suchen;
            }
        }
        if(u.userID === alteID) return "User nicht gefunden";
        return u
    },
    readUserData: function(){
        return allUserData()
    },
    fahrplanAbfrage: function(startBahnhof, ziel, datum, stunde){
        try {
            let dat = datumHeute();
            if (dat > datum) {
                console.log("Datum in der Vergangenheit!\nAktuelles Datum wird verwendet (" + dat + ")");
                datum = dat
            }
            let bahnhofsID = bahnhofIDSuche(startBahnhof);
            let request = new XMLHttpRequest();
            request.open("GET", "https://api.deutschebahn.com/timetables/v1/plan/" + bahnhofsID + "/" + datum + "/" + stunde, false);
            request.setRequestHeader("Authorization", "Bearer " + apiToken);
            request.send();

            if (request.status !== 200) {
                if (request.status === 400) console.log("Syntax Fehler");
                if (request.status === 401) console.log("Ungültiges Token");
                if (request.status === 404) console.log("Nichts gefunden");
                if (request.status === 410) console.log("Resource nicht verfügbar");
                else console.log(request.status);
                return "Fehler " + request.status
            }

            let response;

            const parser = new xml2js.Parser({attrkey: "ATTR"});
            let xml_string = request.responseText;

            parser.parseString(xml_string, function (error, result) {
                if (error === null) {
                    response = result
                } else {
                    console.log(error)
                }
            });

            let strecke;

            for (let i = 0; i < response.timetable.s.length; i++) {
                let string;
                try {
                    string = JSON.stringify(response.timetable.s[i].ar[0]).split("ppth\":\"")[1];
                    if (string.toLocaleLowerCase().includes(ziel)) {
                        strecke = JSON.stringify(response.timetable.s[i].ar[0]).split("ppth\":\"")[1].split("\"}}")[0];
                        return [(strecke + "|" + startBahnhof).toLocaleLowerCase(), datum]
                    }
                } catch (e) {
                }
            }
        }
        catch (e) {
            console.log(e);
            return "Fehler 500"
        }
    },
    checkSuchen: function(strecke, datum){
        try{
            let suchen = JSON.parse(fs.readFileSync('./suchen.json', 'utf8', (err) => {
                    if (err) {
                        console.log("Lesefehler", err);

                    }
                })
            );
            for(let i = 0; i < suchen.length; i++){
                if(strecke.includes(suchen[i].strecke) && suchen[i].datum === datum) return suchen[i].suchender
            }
            return 0
        }
        catch (e) {
            return "Fehler 500"
        }
    },
    checkAngebote: function(strecke, datum){
        try {
            let angebote = JSON.parse(fs.readFileSync('./angebote.json', 'utf8', (err) => {
                    if (err) {
                        console.log("Lesefehler", err);

                    }
                })
            );
            for (let i = 0; i < angebote.length; i++) {
                if (angebote[i].strecke.includes(strecke) && angebote[i].datum === datum) return angebote[i].anbieter
            }
            return 0
        }
        catch (e) {
            return "Fehler 500"
        }
    },
    alteDatenLoeschen: function () {
        let options = { year: '2-digit', month: '2-digit', day: '2-digit'};//, hour: '2-digit'};
        let dat = new Date();
        dat.setDate(dat.getDate()-3);
        dat = dat.toLocaleDateString("de-DE", options).replace(/-/g, "");

        let angebote = JSON.parse(fs.readFileSync('./angebote.json', 'utf8', (err) => {
                if (err) {
                    console.log("Lesefehler", err);

                }
            })
        );
        let angeboteNeu = [];
        for (let i = 1; i < angebote.length -1; i++){
            console.log(i + ": " + dat + " " + angebote[i].datum);
            if(dat < angebote[i].datum){
                console.log(dat + " " + angebote[i].datum);
                angeboteNeu.push(angebote[i])
            }
        }
        fs.writeFileSync('./angebote.json', JSON.stringify(angeboteNeu, null, 4), err => {
            if (err) { console.log("Schreibfehler", err) }
        });
    }
};