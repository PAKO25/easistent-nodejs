const email = "";
const password = "";
var token;
var session_id;
const https = require('https')
const zlib = require('zlib');
var Table = require('cli-table');
const oddatum = "2022-01-31";
const dodatum = "2022-02-06";


function auth() {

    const data = JSON.stringify({
        "username": email, "password": password, "supported_user_types": ["child"]
    })

    const options = {
        hostname: 'www.easistent.com',
        port: 443,
        path: '/m/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': data.length,
            'x-app-name': 'family',
            'x-client-version': '99999',
            'x-client-platform': 'android'
        }
    }

    const req = https.request(options, res => {
        console.log(`StatusCode: ${res.statusCode}`)

        res.on('data', d => {
            r = JSON.parse(d);
            token = r.access_token.token;
            session_id = res.rawHeaders[11].split(";")[0].split("=")[1];
            // console.log(`Got the token: \n ${token} \n Got the session_id: \n ${session_id}`);
            console.log("Authenticated.");
            getCalendar();
        })
    })

    req.on('error', error => {
        console.error(error)
    })

    req.write(data)
    req.end()
}



function getCalendar() {

    var buffer = [];

    const options = {
        hostname: "www.easistent.com",
        path: `/m/timetable/weekly?from=${oddatum}&to=${dodatum}`,
        port: '443',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'x-app-name': 'family',
            'x-client-version': '13',
            'x-client-platform': 'web',
            'Authorization': 'Bearer ' + token,
            'Referer': 'https://www.easistent.com/webapp',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'Keep-Alive',
            'Host': 'www.easistent.com',
            'Sec-Fetch-Dest': 'empty',
            'Cookie': 'easistent_cookie=zapri; easistent_session=' + session_id,
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'TE': 'trailers',
            'X-Requested-With': 'XMLHttpRequest',
            'X-Child-Id': '714309',
        }
    }

    const req = https.request(options, res => {
        console.log(`StatusCode: ${res.statusCode}`)

        res.on('data', d => {
            buffer.push(d);
        })
        res.on('close', () => {
            buffer = Buffer.concat(buffer);
            zlib.gunzip(buffer, (err, buffer) => {
                makeCalendar(JSON.parse(buffer.toString('utf-8')));
            });
        })
    })

    req.on('error', error => {
        console.error(error)
    })

    req.end()
}


function makeCalendar(data) {
    let bettercalendar = {
        time: [],
        days: [],
        ure: []
    };

    data.school_hour_events.forEach(h => {
        bettercalendar.ure.push({
            predmet: h.subject.name,
            razred: h.classroom.name,
            ucitelj: h.teachers[0].name,
            barva: h.color,
            cas: h.time,
            posebnost: h.hour_special_type
        })
    })
    let x = 0;
    data.time_table.forEach(t => {
        bettercalendar.time.push({
            id: t.id,
            ime: t.name,
            od: t.time.from,
            do: t.time.to,
            vrsta: t.type,
            stevilka: x
        })
        x++;
    })
    data.day_table.forEach(d => {
        bettercalendar.days.push({
            dan: d.name,
            datum: d.date
        })
    })

    // console.log(bettercalendar)
    makeTable(bettercalendar);
}

function makeTable(calendar) {

    var table = new Table({
        head: ["Ura", "Čas",
            `${calendar.days[0].dan.slice(0, 3).toUpperCase()} ${calendar.days[0].datum}`,
            `${calendar.days[1].dan.slice(0, 3).toUpperCase()} ${calendar.days[1].datum}`,
            `${calendar.days[2].dan.slice(0, 3).toUpperCase()} ${calendar.days[2].datum}`,
            `${calendar.days[3].dan.slice(0, 3).toUpperCase()} ${calendar.days[3].datum}`,
            `${calendar.days[4].dan.slice(0, 3).toUpperCase()} ${calendar.days[4].datum}`,
        ]
    });


    table.push(
        {'1': vrstica(0, calendar.ure, calendar.time, calendar.days)},
        {'2': vrstica(1, calendar.ure, calendar.time, calendar.days)},
        {'3': vrstica(2, calendar.ure, calendar.time, calendar.days)},
        {'4': vrstica(3, calendar.ure, calendar.time, calendar.days)},
        {'5': vrstica(4, calendar.ure, calendar.time, calendar.days)},
        {'6': vrstica(5, calendar.ure, calendar.time, calendar.days)},
        {'7': vrstica(6, calendar.ure, calendar.time, calendar.days)},
        {'8': vrstica(7, calendar.ure, calendar.time, calendar.days)},
        {'9': vrstica(8, calendar.ure, calendar.time, calendar.days)},
        {'10': vrstica(9, calendar.ure, calendar.time, calendar.days)},
    )


    console.log(table.toString());
}



function vrstica(stevilka, predmeti, ure, dnevi) {
    let arr = [];
    let ura = ure[stevilka];
    let id = ura.id;
    let predmetivuri = [[], [], [], [], []];

    for (let i = 0; i < predmetivuri.length; i++) {
        predmetivuri[i].push(dnevi[i].datum);
    }
    
    arr.push(`${ura.od} - ${ura.do}`);

    predmeti.forEach(predmet => {
        if (predmet.cas.from_id == id) {
            predmetivuri.forEach(p => {
                if (p[0] == predmet.cas.date) {
                    p.push(predmet);
                }
            })
        }
    })

    predmetivuri.forEach(predmet => {
        if (predmet[1] != null && predmet[1] != undefined) {
            arr.push(predmet[1].predmet);
        } else {
            arr.push("");
        }
    })

    return arr;
}


auth();