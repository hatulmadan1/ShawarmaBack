const express = require("express");
const app = express();
const MongoClient = require("mongodb").MongoClient;
app.use(express.json());
const url = "mongodb://localhost:27017/";

app.get("/all", function(request, response){
    MongoClient.connect("mongodb://localhost:27017/", { useNewUrlParser: true, useUnifiedTopology: true }, function(err, client){
        const db = client.db("shawarmadb");
        const collection = db.collection("shawarmas");
        
        collection.find().toArray(function(err, results){
            let result = [];
            results.forEach(elem => {result.push(elem.name)});
            console.log(results);
            response.status(200).send(JSON.stringify(result));
            

            if(err){
                response.status(500).send("Loading from DB failed");
                return console.log(err);
            }
        });

        if(err){
            response.status(500).send("Loading from DB failed");
            return console.log(err);
        }
        //client.close();
    });
    
});

app.get("/shawarma/name", function(request, response){
    let shawarmaName = request.query.q;
    MongoClient.connect("mongodb://localhost:27017/", { useNewUrlParser: true, useUnifiedTopology: true }, function(err, client){
        const db = client.db("shawarmadb");
        let result = {};
        db.collection("shawarmas").find({'name': shawarmaName}).toArray(function(err, results){
            
            results.forEach(elem => {result['name'] = elem.name; result['raiting'] = elem.raiting, result['reviews'] = []});
            console.log(results);
            //response.status(200).send(JSON.stringify(result));
            
            if(err){
                response.status(500).send("Loading from DB failed");
                return console.log(err);
            }
        });

        db.collection("reviews").find({'name': shawarmaName}).toArray(function(err, results){
            let reviews = [];
            results.forEach(elem => {reviews.push({'raiting': elem.raiting, 'text': elem.text})});
            result['reviews'] = reviews;
            response.status(200).send(JSON.stringify(result));
            
            if(err){
                response.status(500).send("Loading from DB failed");
                return console.log(err);
            }
        });
        //response.status(200).send(JSON.stringify(result));

        if(err){
            response.status(500).send("Loading from DB failed");
            return console.log(err);
        }
        //client.close();
    });
});

app.post("/shawarma", function(request, response){
    let newShawarmaPoint = request.body.shawarma;
    MongoClient.connect("mongodb://localhost:27017/", { useNewUrlParser: true, useUnifiedTopology: true }, function(err, client){
        client.db("shawarmadb").collection("shawarmas").insertOne({'name': newShawarmaPoint, 'raiting': 0.0, 'reviewsCount': 0}, function(err, results){
            console.log(results);
        });

        if(err){
            response.status(500).send("Adding to DB failed");
            return console.log(err);
        }
    });
    response.status(200).send("Added succesfully");
});

app.post("/review", function(request, response){
    let name = request.body.name;
    let raiting = request.body.raiting;
    let text = request.body.text;
    MongoClient.connect("mongodb://localhost:27017/", { useNewUrlParser: true, useUnifiedTopology: true }, function(err, client){
        client.db("shawarmadb").collection("reviews").insertOne({'name': name, 'raiting': raiting, 'text': text}, function(err, results){
            console.log(results);
        });

        let reviewsCount = 0;
        let shawarmaRaiting = 0;
        client.db("shawarmadb").collection("shawarmas").find({'name': name}).toArray(function(err, results){
            reviewsCount = results[0].reviewsCount;
            shawarmaRaiting = results[0].raiting;

            if(err){
                response.status(500).send("Loading from DB failed");
                return console.log(err);
            }
        });

        client.db("shawarmadb").collection("shawarmas").updateOne(
            {'name': name}, 
            { $set: {'name': name, 
            'raiting': (shawarmaRaiting * reviewsCount + raiting) / (reviewsCount + 1), 
            'reviewsCount': reviewsCount + 1}},
            function(err, result){
                      
                console.log(result);
                client.close();
            }
        );

        if(err){
            response.status(500).send("Adding to DB failed");
            return console.log(err);
        }
    });
    response.status(200).send("Added succesfully");
});

app.listen(3000);